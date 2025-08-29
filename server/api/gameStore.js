// Game state store for serverless functions
const { generatePlayerCard } = require('../gameData');

// Since serverless functions are stateless, we'd typically use a database
// For this example, we're using a simple in-memory store (note: this won't work
// in production with multiple instances, you'd need a proper database)
let games = new Map();

// For a production app, you'd use:
// - A database like MongoDB, Firebase, or DynamoDB
// - Redis for caching and pub/sub
// - Or a service like PlanetScale or Supabase

module.exports = {
  games,
  createGame: (gameId, playerCount, bunkerSpots, creatorName) => {
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
    return game;
  },
  getGame: (gameId) => games.get(gameId),
  addPlayer: (gameId, playerId, playerName) => {
    const game = games.get(gameId);
    if (!game) return null;
    
    const playerCard = generatePlayerCard();
    
    const player = {
      id: playerId,
      name: playerName,
      card: playerCard,
      revealedAttributes: [],
      isHost: game.players.length === 0,
      isEliminated: false
    };
    
    game.players.push(player);
    
    if (player.isHost) {
      game.host = playerId;
    }
    
    return player;
  },
  updateGame: (gameId, updatedGame) => {
    games.set(gameId, updatedGame);
    return games.get(gameId);
  }
};
