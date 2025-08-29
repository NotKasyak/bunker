import React from 'react';

function Lobby({ gameId, players, isHost, startGame, error }) {
  return (
    <div className="lobby-container">
      <div className="card">
        <h2>Game Lobby</h2>
        <div className="game-info">
          <p>
            <strong>Game ID:</strong> {gameId}{' '}
            <button
              className="copy-button"
              onClick={() => {
                navigator.clipboard.writeText(gameId);
                alert('Game ID copied to clipboard!');
              }}
            >
              Copy
            </button>
          </p>
          <p>Share this Game ID with your friends so they can join.</p>
        </div>
      </div>
      
      <div className="card">
        <h3>Players ({players.length})</h3>
        <div className="players-list">
          {players.map((player) => (
            <div key={player.id} className="player-item">
              <span>{player.name}</span>
              {player.isHost && <span className="host-badge">Host</span>}
            </div>
          ))}
        </div>
      </div>
      
      <div className="game-controls">
        {isHost ? (
          <button
            onClick={startGame}
            disabled={players.length < 3}
            className={players.length < 3 ? 'disabled' : ''}
          >
            Start Game
          </button>
        ) : (
          <p>Waiting for the host to start the game...</p>
        )}
        
        {players.length < 3 && isHost && (
          <p className="warning">
            At least 3 players are required to start the game.
          </p>
        )}
      </div>
      
      {error && <p className="error">{error}</p>}
      
      <div className="lobby-rules card">
        <h3>How to Play:</h3>
        <ol>
          <li>Each player receives a character with random attributes</li>
          <li>Players take turns revealing one attribute at a time</li>
          <li>After everyone reveals, there's a vote to eliminate one player</li>
          <li>The process repeats until only the survivors remain</li>
          <li>Be strategic about what you reveal!</li>
        </ol>
      </div>
      
      <style jsx>{`
        .lobby-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .game-info {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin: 10px 0;
        }
        
        .copy-button {
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .players-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }
        
        .player-item {
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .host-badge {
          background: #ff9800;
          color: white;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .game-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 20px 0;
        }
        
        .disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .warning {
          color: #ff9800;
        }
        
        .error {
          color: #f44336;
          text-align: center;
          margin: 10px 0;
        }
        
        .lobby-rules {
          text-align: left;
        }
      `}</style>
    </div>
  );
}

export default Lobby;
