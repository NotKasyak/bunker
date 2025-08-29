const { v4: uuidv4 } = require('uuid');
const { createGame } = require('./gameStore');

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

  if (req.method === 'POST') {
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

    const gameId = uuidv4();
    const game = createGame(gameId, playerCount, bunkerSpots, creatorName);
    
    res.status(200).json({ gameId, game });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
