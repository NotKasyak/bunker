# Bunker Game

A multiplayer web-based social deduction game where players try to secure limited spots in a bunker.

## Game Concept

- Players: 8-12 players
- Goal: Select the most useful players for survival in the bunker
- Available spots: 2 out of 8 players OR 6 out of 12 players

## Game Mechanics

1. Players take turns revealing one of their characteristics
2. After each round of revelations, there's a vote to exclude one player
3. The excluded player leaves the game
4. The process repeats until the required number of survivors is reached

## Character Attributes

Each player has the following attributes:
- Profession - main specialty
- Health - physical condition
- Hobbies - additional skills
- Phobias - psychological weaknesses
- Baggage - useful items
- Facts1 - important personal information
- Facts2 - additional fact
- Gender and Age (21-111 years)

## Technical Implementation

### Server (Node.js + Express + Socket.io)
- Game logic and state management
- Player connections and synchronization
- Turn order and voting system

### Client (React)
- Grid of player cards (4x2 for 8 players, 4x3 for 12 players)
- Cards showing only categories until revealed
- Clickable characteristics on own card only
- Voting interface
- Timer for each turn

## Installation & Setup

### Local Development
```bash
# Install dependencies for server
cd server
npm install

# Install dependencies for client
cd client
npm install

# Run server and client in development mode
cd server
npm run dev

# In another terminal
cd client
npm start
```

Then open your browser to http://localhost:3000 to play the game.

### Deploying to Vercel

This game is configured to be deployed on Vercel with serverless functions.

1. Fork or clone this repository
2. Connect the repository to your Vercel account
3. Deploy to Vercel - no additional configuration needed!

The deployment will:
- Build the React client and host it as a static site
- Deploy server code as serverless functions
- Set up Socket.IO for real-time communication

You can deploy directly from GitHub using the Vercel dashboard or the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel
```

## Additional Features

- Settings for player count and bunker spot availability
- Custom characteristic sets
