# Poker Mentor

A Texas Hold'em simulator designed to help you improve your poker skills with professional-level advice and analysis.

## Features

- **Casino-themed UI**: Enjoy a visually appealing interface with flashy animations and sound effects
- **Professional Advisor**: Toggle on/off an advisor that provides insights based on Daniel Negreanu's playstyle
- **Performance Tracking**: Track your performance over time with detailed statistics
- **Keyboard Shortcuts**: Quick actions using keyboard shortcuts
- **AI Opponents**: Play against AI opponents with different playing styles
- **Persistent Balance**: Your chip stack persists between sessions

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pokermentor.git
cd pokermentor
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to start playing.

## How to Play

1. **Start a Game**: Click the "Start Game" button on the home screen
2. **Make Decisions**: Use the action buttons or keyboard shortcuts to play
3. **Get Advice**: Toggle the advisor to receive professional-level insights
4. **Review Performance**: Track your progress over time

### Keyboard Shortcuts

- **F**: Fold your hand
- **C**: Check (when no bet) or Call a bet
- **B**: Bet (when no previous bet)
- **R**: Raise a bet
- **A**: Go All-In

## Advisor Features

The advisor provides insights based on:

- Pre-flop hand strength
- Post-flop hand analysis
- Pot odds calculations
- Position-based strategy
- Board texture reading
- Opponent tendencies

Toggle the advisor on/off using the button in the bottom right corner.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Howler.js
- Vercel Postgres

## Deployment

This application is designed to be deployed on Vercel. The project uses Vercel KV (Key-Value) store for data persistence.

### Deploying on Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Deploy with the default settings
4. Set up Vercel KV by following the instructions in [SETUP_KV.md](SETUP_KV.md)

### Data Persistence

The application uses:

- Local storage for offline functionality
- Vercel KV for server-side persistence when deployed
- In-memory caching layer to improve performance and reduce KV operations

This hybrid approach ensures that your game data persists between sessions even when offline, while also syncing with the cloud when connected. The caching layer helps reduce database load and improves response times for frequently accessed data.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the playing style of poker professional Daniel Negreanu
- Card and chip designs inspired by classic casino aesthetics
