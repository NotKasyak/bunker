const { getGame } = require('./gameStore');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    const game = getGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Remove sensitive data (player cards except for revealed attributes)
    const sanitizedPlayers = game.players.map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isEliminated: player.isEliminated,
      revealedAttributes: player.revealedAttributes
    }));
    
    const sanitizedGame = {
      ...game,
      players: sanitizedPlayers
    };
    
    res.status(200).json({ game: sanitizedGame });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
