const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generatePlayerCard, professions, health, hobbies, phobias, baggage, facts } = require('./gameData');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React client app
const clientPath = path.join(__dirname, '../client/build');
app.use(express.static(clientPath));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Store active games
const games = new Map();

// Game creation endpoint
app.post('/api/games', (req, res) => {
  const gameId = uuidv4();
  const { playerCount, bunkerSpots, creatorName } = req.body;
  
  // Validate input
  if (!playerCount || !bunkerSpots || !creatorName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (playerCount !== 8 && playerCount !== 12) {
    return res.status(400).json({ error: 'Player count must be 8 or 12' });
  }
  
  if ((playerCount === 8 && bunkerSpots !== 2) || 
      (playerCount === 12 && bunkerSpots !== 6)) {
    return res.status(400).json({ error: 'Invalid bunker spots configuration' });
  }

  // Create new game
  const game = {
    id: gameId,
    players: [],
    playerCount,
    bunkerSpots,
    host: null,
    started: false,
    currentTurn: 0,
    currentRound: 0,
    votingPhase: false,
    votes: {},
    roundMessages: [
      "Attention! A new round is about to begin.",
      "Get ready for the next stage!",
      "An important event is coming soon...",
      "You have time to discuss your strategy.",
      "The next round could change everything!"
    ]
  };
  
  games.set(gameId, game);
  
  res.json({ gameId, game });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // Join a game
  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    
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
    
    // Generate player card with random characteristics
    const playerCard = generatePlayerCard();
    
    // Add player to game
    const player = {
      id: socket.id,
      name: playerName,
      card: playerCard,
      revealedAttributes: [],
      isHost: game.players.length === 0, // First player is host
      isEliminated: false
    };
    
    game.players.push(player);
    
    if (player.isHost) {
      game.host = socket.id;
    }
    
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
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    if (socket.id !== game.host) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    
    if (game.players.length < 3) { // At least 3 players to make the game interesting
      socket.emit('error', { message: 'Not enough players' });
      return;
    }
    
    game.started = true;
    game.currentTurn = 0;
    game.currentRound = 1;
    
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
    const game = games.get(gameId);
    
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
    const validAttributes = ['profession', 'health', 'hobby', 'phobia', 'baggage', 'fact1', 'fact2', 'gender', 'age'];
    if (!validAttributes.includes(attribute)) {
      socket.emit('error', { message: 'Invalid attribute' });
      return;
    }
    
    // Check if attribute has already been revealed
    if (currentPlayer.revealedAttributes.includes(attribute)) {
      socket.emit('error', { message: 'Attribute already revealed' });
      return;
    }
    
    // Reveal the attribute
    currentPlayer.revealedAttributes.push(attribute);
    
    // Broadcast the revealed attribute
    io.to(gameId).emit('attributeRevealed', {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      attribute,
      value: currentPlayer.card[attribute]
    });
    
    // Move to next player
    game.currentTurn = (game.currentTurn + 1) % game.players.length;
    
    // Check if round is complete (all players have revealed an attribute)
    if (game.currentTurn === 0) {
      // Start voting phase
      game.votingPhase = true;
      game.votes = {};
      
      io.to(gameId).emit('votingStarted', {
        message: 'Time to vote who gets eliminated!',
        eligiblePlayers: game.players
          .filter(p => !p.isEliminated)
          .map(p => ({
            id: p.id,
            name: p.name
          }))
      });
    } else {
      // Continue with next player
      io.to(gameId).emit('nextTurn', {
        nextPlayerId: game.players[game.currentTurn].id,
        nextPlayerName: game.players[game.currentTurn].name
      });
    }
  });

  // Submit vote
  socket.on('submitVote', ({ gameId, targetPlayerId }) => {
    const game = games.get(gameId);
    
    if (!game || !game.started || !game.votingPhase) {
      socket.emit('error', { message: 'Game not in voting phase' });
      return;
    }
    
    // Check if target player exists and is not eliminated
    const targetPlayer = game.players.find(p => p.id === targetPlayerId && !p.isEliminated);
    if (!targetPlayer) {
      socket.emit('error', { message: 'Invalid target player' });
      return;
    }
    
    // Record vote
    game.votes[socket.id] = targetPlayerId;
    
    // Notify all players of vote (without revealing who voted for whom)
    io.to(gameId).emit('voteRegistered', {
      voterId: socket.id,
      voterName: game.players.find(p => p.id === socket.id).name,
      votesCount: Object.keys(game.votes).length,
      totalEligibleVoters: game.players.filter(p => !p.isEliminated).length
    });
    
    // Check if all eligible players have voted
    const eligibleVoters = game.players.filter(p => !p.isEliminated);
    if (Object.keys(game.votes).length >= eligibleVoters.length) {
      // Count votes
      const voteCounts = {};
      Object.values(game.votes).forEach(targetId => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      });
      
      // Find player with most votes
      let maxVotes = 0;
      let eliminatedPlayerId = null;
      
      for (const [playerId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedPlayerId = playerId;
        }
      }
      
      // Eliminate player
      const eliminatedPlayer = game.players.find(p => p.id === eliminatedPlayerId);
      if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true;
      }
      
      // Check if game is over
      const remainingPlayers = game.players.filter(p => !p.isEliminated).length;
      if (remainingPlayers <= game.bunkerSpots) {
        // Game over - survivors have been chosen
        io.to(gameId).emit('gameOver', {
          message: 'The final survivors have been chosen!',
          survivors: game.players.filter(p => !p.isEliminated).map(p => ({
            id: p.id,
            name: p.name,
            card: p.card  // Reveal all attributes of survivors
          })),
          eliminatedPlayer: {
            id: eliminatedPlayer.id,
            name: eliminatedPlayer.name,
            card: eliminatedPlayer.card  // Reveal all attributes of the eliminated player
          },
          voteCounts
        });
        
        // Clean up game
        setTimeout(() => {
          games.delete(gameId);
        }, 3600000);  // Remove game after 1 hour
      } else {
        // Continue game - start new round
        game.votingPhase = false;
        game.currentTurn = 0;
        game.currentRound++;
        game.votes = {};
        
        // Find the first non-eliminated player for the next turn
        while (game.players[game.currentTurn].isEliminated) {
          game.currentTurn = (game.currentTurn + 1) % game.players.length;
        }
        
        io.to(gameId).emit('roundEnd', {
          eliminatedPlayer: {
            id: eliminatedPlayer.id,
            name: eliminatedPlayer.name,
            card: eliminatedPlayer.card  // Reveal all attributes of the eliminated player
          },
          voteCounts,
          nextRound: game.currentRound,
          nextPlayer: {
            id: game.players[game.currentTurn].id,
            name: game.players[game.currentTurn].name
          },
          roundMessage: game.roundMessages[Math.floor(Math.random() * game.roundMessages.length)]
        });
      }
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    
    // Find games where this player is
    for (const [gameId, game] of games.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        // Remove player from game
        const player = game.players[playerIndex];
        
        if (game.started) {
          // If game has started, mark player as eliminated
          player.isEliminated = true;
          
          // Notify other players
          io.to(gameId).emit('playerDisconnected', {
            playerId: player.id,
            playerName: player.name
          });
          
          // Check if game is over
          const remainingPlayers = game.players.filter(p => !p.isEliminated).length;
          if (remainingPlayers <= game.bunkerSpots) {
            io.to(gameId).emit('gameOver', {
              message: 'The final survivors have been chosen due to disconnections!',
              survivors: game.players.filter(p => !p.isEliminated).map(p => ({
                id: p.id,
                name: p.name,
                card: p.card  // Reveal all attributes of survivors
              }))
            });
            
            // Clean up game
            setTimeout(() => {
              games.delete(gameId);
            }, 3600000);  // Remove game after 1 hour
          }
          
          // If it was this player's turn, move to next player
          if (game.currentTurn === playerIndex && !game.votingPhase) {
            game.currentTurn = (game.currentTurn + 1) % game.players.length;
            
            // Find the first non-eliminated player
            while (game.players[game.currentTurn].isEliminated) {
              game.currentTurn = (game.currentTurn + 1) % game.players.length;
            }
            
            io.to(gameId).emit('nextTurn', {
              nextPlayerId: game.players[game.currentTurn].id,
              nextPlayerName: game.players[game.currentTurn].name,
              message: `${player.name} disconnected. Moving to next player.`
            });
          }
          
          // If in voting phase, check if all remaining players have voted
          if (game.votingPhase) {
            // Remove vote if player voted
            if (game.votes[socket.id]) {
              delete game.votes[socket.id];
            }
            
            const eligibleVoters = game.players.filter(p => !p.isEliminated);
            if (Object.keys(game.votes).length >= eligibleVoters.length) {
              // Process votes (reuse code from submitVote event)
              // This is simplified - in a real implementation, extract this logic to a function
            }
          }
        } else {
          // If game hasn't started, remove player completely
          game.players.splice(playerIndex, 1);
          
          // If this was the host, assign a new host
          if (player.isHost && game.players.length > 0) {
            game.players[0].isHost = true;
            game.host = game.players[0].id;
          }
          
          // If no players left, delete the game
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
              message: `${player.name} left the game.`
            });
          }
        }
        
        break;  // Player can only be in one game
      }
    }
  });
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
