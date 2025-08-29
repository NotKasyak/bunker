import React, { useState } from 'react';

function Welcome({ createGame, joinGame, error }) {
  const [activeTab, setActiveTab] = useState('create');
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [playerCount, setPlayerCount] = useState(8);
  
  // Calculate bunker spots based on player count
  const bunkerSpots = playerCount === 8 ? 2 : 6;
  
  const handleCreateGame = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      createGame(playerCount, bunkerSpots, playerName.trim());
    }
  };
  
  const handleJoinGame = (e) => {
    e.preventDefault();
    if (playerName.trim() && gameId.trim()) {
      joinGame(gameId.trim(), playerName.trim());
    }
  };
  
  return (
    <div className="welcome-container">
      <h2>Welcome to Bunker!</h2>
      <p>
        A social deduction game where players must secure a spot in a bunker by 
        proving their value to the group's survival.
      </p>
      
      <div className="welcome-tabs">
        <div 
          className={`welcome-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create New Game
        </div>
        <div 
          className={`welcome-tab ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
        >
          Join Existing Game
        </div>
      </div>
      
      <div className="welcome-panel">
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateGame}>
            <div className="form-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="playerCount">Number of Players:</label>
              <select
                id="playerCount"
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
              >
                <option value={8}>8 Players (2 spots in bunker)</option>
                <option value={12}>12 Players (6 spots in bunker)</option>
              </select>
            </div>
            
            <button type="submit">Create Game</button>
          </form>
        ) : (
          <form onSubmit={handleJoinGame}>
            <div className="form-group">
              <label htmlFor="joinPlayerName">Your Name:</label>
              <input
                id="joinPlayerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="gameId">Game ID:</label>
              <input
                id="gameId"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter game ID"
                required
              />
            </div>
            
            <button type="submit">Join Game</button>
          </form>
        )}
        
        {error && <p className="error">{error}</p>}
      </div>
      
      <div className="welcome-info card" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h3>Game Rules:</h3>
        <ul>
          <li>Each player gets a character with random attributes</li>
          <li>Players take turns revealing one attribute at a time</li>
          <li>After each round, players vote to eliminate one person</li>
          <li>Only {playerCount === 8 ? '2 out of 8' : '6 out of 12'} players will survive</li>
          <li>Be strategic about what you reveal and when!</li>
        </ul>
      </div>
    </div>
  );
}

export default Welcome;
