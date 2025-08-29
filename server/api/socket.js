const { Server } = require('socket.io');
const { getGame, addPlayer, updateGame } = require('./gameStore');

module.exports = (req, res) => {
  // For Vercel serverless functions, we need to handle CORS first
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.status(200).end();
    return;
  }
  
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }
  
  const io = new Server(res.socket.server, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  });
  res.socket.server.io = io;

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    // Join a game
    socket.on('joinGame', ({ gameId, playerName }) => {
      const game = getGame(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (game.started) {
        socket.emit('error', { message: 'Game already started' });
        return;
      }
      
      if (game.players.length >= game.playerCount) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }
      
      // Check for duplicate name
      const duplicateName = game.players.some(p => p.name === playerName);
      if (duplicateName) {
        socket.emit('error', { message: 'Name already taken' });
        return;
      }
      
      // Add player to game
      const player = addPlayer(gameId, socket.id, playerName);
      
      // Join socket room for this game
      socket.join(gameId);
      
      // Notify player of successful join
      socket.emit('joinedGame', {
        gameId,
        player,
        isHost: player.isHost
      });
      
      // Notify all players in the game
      io.to(gameId).emit('playerList', {
        players: game.players.map(p => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isEliminated: p.isEliminated,
          revealedAttributes: p.revealedAttributes
        })),
        gameState: {
          started: game.started,
          playerCount: game.playerCount,
          bunkerSpots: game.bunkerSpots,
          currentTurn: game.currentTurn,
          currentRound: game.currentRound,
          votingPhase: game.votingPhase
        }
      });
    });

    // Start game
    socket.on('startGame', ({ gameId }) => {
      const game = getGame(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (socket.id !== game.host) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }
      
      if (game.players.length < 3) { // At least 3 players to make it interesting
        socket.emit('error', { message: 'Not enough players' });
        return;
      }
      
      game.started = true;
      game.currentTurn = 0;
      game.currentRound = 1;
      
      updateGame(gameId, game);
      
      // Notify all players that the game has started
      io.to(gameId).emit('gameStarted', {
        players: game.players.map(p => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isEliminated: p.isEliminated,
          revealedAttributes: p.revealedAttributes
        })),
        firstPlayer: game.players[0].id,
        currentTurn: game.currentTurn,
        currentRound: game.currentRound,
        roundMessage: game.roundMessages[Math.floor(Math.random() * game.roundMessages.length)]
      });
    });

    // Reveal attribute
    socket.on('revealAttribute', ({ gameId, attribute }) => {
      const game = getGame(gameId);
      
      if (!game || !game.started) {
        socket.emit('error', { message: 'Game not found or not started' });
        return;
      }
      
      // Check if it's this player's turn
      const currentPlayer = game.players[game.currentTurn];
      if (currentPlayer.id !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
      
      // Check if attribute is valid
      const validAttributes = ['profession', 'health', 'hobbies', 'phobias', 'baggage', 'facts1', 'facts2', 'gender', 'age'];
      if (!validAttributes.includes(attribute)) {
        socket.emit('error', { message: 'Invalid attribute' });
        return;
      }
      
      // Check if attribute is already revealed
      if (currentPlayer.revealedAttributes.includes(attribute)) {
        socket.emit('error', { message: 'Attribute already revealed' });
        return;
      }
      
      // Reveal attribute
      currentPlayer.revealedAttributes.push(attribute);
      
      // Broadcast the revealed attribute to all players
      io.to(gameId).emit('attributeRevealed', {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        attribute,
        value: currentPlayer.card[attribute]
      });
      
      // Move to voting phase
      game.votingPhase = true;
      game.votes = {};
      
      updateGame(gameId, game);
      
      io.to(gameId).emit('votingStarted');
    });

    // Handle vote
    socket.on('vote', ({ gameId, votedPlayerId }) => {
      const game = getGame(gameId);
      
      if (!game || !game.started || !game.votingPhase) {
        socket.emit('error', { message: 'Invalid voting state' });
        return;
      }
      
      // Check if player is eliminated
      const votingPlayer = game.players.find(p => p.id === socket.id);
      if (!votingPlayer || votingPlayer.isEliminated) {
        socket.emit('error', { message: 'Eliminated players cannot vote' });
        return;
      }
      
      // Record vote
      game.votes[socket.id] = votedPlayerId;
      
      // Check if all active players have voted
      const activePlayers = game.players.filter(p => !p.isEliminated);
      const allVoted = activePlayers.every(p => game.votes[p.id]);
      
      if (allVoted) {
        // Count votes
        const voteCounts = {};
        Object.values(game.votes).forEach(id => {
          voteCounts[id] = (voteCounts[id] || 0) + 1;
        });
        
        // Find player with most votes
        let maxVotes = 0;
        let eliminatedPlayerId = null;
        
        Object.entries(voteCounts).forEach(([id, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            eliminatedPlayerId = id;
          }
        });
        
        // Eliminate player
        if (eliminatedPlayerId) {
          const eliminatedPlayer = game.players.find(p => p.id === eliminatedPlayerId);
          if (eliminatedPlayer) {
            eliminatedPlayer.isEliminated = true;
          }
        }
        
        // Check game end condition
        const remainingPlayers = game.players.filter(p => !p.isEliminated);
        if (remainingPlayers.length <= game.bunkerSpots) {
          // Game over - survivors win
          io.to(gameId).emit('gameOver', {
            survivors: remainingPlayers.map(p => ({
              id: p.id,
              name: p.name,
              card: p.card
            }))
          });
          
          // Clean up the game
          // In a real implementation, you would remove the game after some time
          return;
        }
        
        // Move to next player's turn
        game.votingPhase = false;
        game.votes = {};
        
        // Find next active player
        let nextTurn = (game.currentTurn + 1) % game.players.length;
        while (game.players[nextTurn].isEliminated) {
          nextTurn = (nextTurn + 1) % game.players.length;
        }
        
        game.currentTurn = nextTurn;
        
        // Check if we've completed a round (all players have revealed an attribute)
        const activePlayersRevealed = activePlayers.every(p => p.revealedAttributes.length >= game.currentRound);
        if (activePlayersRevealed) {
          game.currentRound++;
        }
        
        updateGame(gameId, game);
        
        // Broadcast voting results and next player
        io.to(gameId).emit('votingResults', {
          votes: game.votes,
          eliminatedPlayerId,
          eliminatedPlayerName: eliminatedPlayer ? eliminatedPlayer.name : null,
          nextPlayerId: game.players[game.currentTurn].id,
          nextPlayerName: game.players[game.currentTurn].name,
          currentRound: game.currentRound,
          roundMessage: game.roundMessages[Math.floor(Math.random() * game.roundMessages.length)]
        });
      } else {
        // Broadcast that a player has voted
        io.to(gameId).emit('playerVoted', {
          playerId: socket.id,
          playerName: votingPlayer.name,
          votesCount: Object.keys(game.votes).length,
          totalVoters: activePlayers.length
        });
      }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`Disconnection: ${socket.id}`);
      
      // Find games where this socket is a player
      for (const [gameId, game] of Object.entries(games)) {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex >= 0) {
          // If game hasn't started, remove the player
          if (!game.started) {
            game.players.splice(playerIndex, 1);
            
            // If it was the host, assign a new host
            if (game.host === socket.id && game.players.length > 0) {
              game.host = game.players[0].id;
              game.players[0].isHost = true;
            }
            
            // If no players left, clean up the game
            if (game.players.length === 0) {
              games.delete(gameId);
            } else {
              // Notify remaining players
              io.to(gameId).emit('playerList', {
                players: game.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  isHost: p.isHost,
                  isEliminated: p.isEliminated,
                  revealedAttributes: p.revealedAttributes
                })),
                gameState: {
                  started: game.started,
                  playerCount: game.playerCount,
                  bunkerSpots: game.bunkerSpots,
                  currentTurn: game.currentTurn,
                  currentRound: game.currentRound,
                  votingPhase: game.votingPhase
                }
              });
            }
          } else {
            // If game has started, mark player as eliminated
            game.players[playerIndex].isEliminated = true;
            
            // Check if it was their turn
            if (game.currentTurn === playerIndex && !game.votingPhase) {
              // Move to next player's turn
              let nextTurn = (game.currentTurn + 1) % game.players.length;
              while (game.players[nextTurn].isEliminated) {
                nextTurn = (nextTurn + 1) % game.players.length;
              }
              
              game.currentTurn = nextTurn;
              
              // Notify players of the new turn
              io.to(gameId).emit('playerDisconnected', {
                playerId: socket.id,
                nextPlayerId: game.players[game.currentTurn].id,
                nextPlayerName: game.players[game.currentTurn].name
              });
            } else if (game.votingPhase) {
              // If in voting phase, remove their vote if any
              if (game.votes[socket.id]) {
                delete game.votes[socket.id];
              }
              
              // Check if all remaining active players have voted
              const activePlayers = game.players.filter(p => !p.isEliminated);
              const remainingVoters = activePlayers.filter(p => p.id !== socket.id);
              const allVoted = remainingVoters.every(p => game.votes[p.id]);
              
              if (allVoted && remainingVoters.length > 0) {
                // Process voting results as normal
                // This is a simplified version - in the actual game, you'd duplicate the vote counting logic from above
                io.to(gameId).emit('playerDisconnectedDuringVoting', {
                  playerId: socket.id,
                  // Additional voting logic would be here
                });
              } else {
                // Just notify about the disconnection
                io.to(gameId).emit('playerDisconnected', {
                  playerId: socket.id
                });
              }
            } else {
              // Just notify about the disconnection
              io.to(gameId).emit('playerDisconnected', {
                playerId: socket.id
              });
            }
          }
        }
      }
    });
  });

  console.log('Socket.io server started');
  res.end();
};
