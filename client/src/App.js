import React, { useState, useEffect } from 'react';
import './App.css';
import Welcome from './components/Welcome';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { initializeSocket } from './socketUtils';

// Server URL - automatically adapt to development or production environment
const SOCKET_SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin
  : 'http://localhost:5000';

function App() {
  // Game state
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('welcome'); // 'welcome', 'lobby', 'game'
  const [gameId, setGameId] = useState('');
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({
    started: false,
    playerCount: 0,
    bunkerSpots: 0,
    currentTurn: 0,
    currentRound: 0,
    votingPhase: false
  });
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  // Initialize socket connection
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const newSocket = await initializeSocket();
        setSocket(newSocket);
        
        // Socket event listeners
        newSocket.on('connect', () => {
          console.log('Connected to server');
        });
      } catch (err) {
        console.error('Socket connection error:', err);
        setError('Failed to connect to server');
      }
    };
    
    setupSocket();

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    newSocket.on('joinedGame', (data) => {
      setGameId(data.gameId);
      setPlayer(data.player);
      setIsHost(data.isHost);
      setScreen('lobby');
    });

    newSocket.on('playerList', (data) => {
      setPlayers(data.players);
      if (data.gameState) {
        setGameState(data.gameState);
      }
      if (data.message) {
        // Show message somewhere in UI
      }
    });

    newSocket.on('gameStarted', (data) => {
      setPlayers(data.players);
      setGameState({
        ...gameState,
        started: true,
        currentTurn: data.currentTurn,
        currentRound: data.currentRound
      });
      setScreen('game');
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Create a new game
  const createGame = async (playerCount, bunkerSpots, playerName) => {
    try {
      // Adapt API endpoint for Vercel serverless function
      const apiUrl = process.env.NODE_ENV === 'production'
        ? '/api/create-game'
        : `${SOCKET_SERVER_URL}/api/games`;
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerCount,
          bunkerSpots,
          creatorName: playerName
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Join the game after creating it
        socket.emit('joinGame', { gameId: data.gameId, playerName });
      } else {
        setError(data.error || 'Failed to create game');
      }
    } catch (err) {
      setError('Network error: Could not create game');
    }
  };

  // Join an existing game
  const joinGame = (gameId, playerName) => {
    socket.emit('joinGame', { gameId, playerName });
  };

  // Start the game (host only)
  const startGame = () => {
    if (isHost) {
      socket.emit('startGame', { gameId });
    }
  };

  // Render different screens based on the game state
  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <Welcome 
            createGame={createGame}
            joinGame={joinGame}
            error={error}
          />
        );
      case 'lobby':
        return (
          <Lobby 
            gameId={gameId}
            players={players}
            isHost={isHost}
            startGame={startGame}
            error={error}
          />
        );
      case 'game':
        return (
          <Game 
            socket={socket}
            gameId={gameId}
            player={player}
            players={players}
            gameState={gameState}
            setGameState={setGameState}
            setPlayers={setPlayers}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bunker Game</h1>
      </header>
      <main>
        {renderScreen()}
      </main>
      <footer>
        <p>© {new Date().getFullYear()} - Bunker Survival Game</p>
      </footer>
    </div>
  );
}

export default App;
