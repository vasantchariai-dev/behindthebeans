# Behind the Beans

A retro 2D arcade game promoting [Halfway Up Productions](https://www.halfwayup.co.uk/)' vertical drama about a film set coffee van.

## Overview

You're a runner for the AD (assistant director) department on a chaotic film set. Your jobs include:
- **Fetching coffees** from the craft van
- **Stopping crew** from wandering into shot
- **Escorting actors** to the loo

Complete enough tasks and you earn your own coffee break – but mess up and the director melts down!

## How to play

### Controls

**Desktop:**
- Click/tap to move
- Arrow keys or WASD for movement
- Click the craft van to get drinks
- Click crew members to stop them crossing the hot set

**Mobile:**
- Tap to move
- Tap the craft van to get drinks
- Tap crew members to stop them

### Mechanics

- **Coffee runs:** When the 1st AD or Director shouts an order, run to the craft van, select the correct drink, and deliver it
- **Stop crew:** Tap crew members before they walk across the hot set (filming area)
- **Actor escort:** Draw a path for actors to reach the toilet without crossing the hot set
- **Coffee break meter:** Complete tasks to fill your meter, then take a break to restore energy
- **Stress meter:** Don't let it fill up or the director will have a meltdown!
- **Energy meter:** Take breaks to stay energised – or you'll collapse

### Easter eggs

- Look out for characters from "New Shoes" and "Gravediggers" (Halfway Up short films)
- Listen for authentic film set phrases from the director

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech stack

- **Engine:** Phaser 3
- **Build:** Vite
- **Language:** JavaScript (ES modules)

### Project structure

```
behind-the-beans/
├── index.html          # Entry point
├── src/
│   ├── main.js         # Game configuration
│   └── scenes/
│       ├── boot.js     # Asset generation
│       ├── menu.js     # Title screen
│       ├── play.js     # Main gameplay
│       └── gameover.js # End screen
├── package.json
└── vite.config.js
```

## Deployment

The built game is a static site that can be hosted anywhere:

```bash
npm run build
# Deploy the 'dist' folder
```

The game can be embedded in the Halfway Up website or served standalone.

## Credits

A [Halfway Up Productions](https://www.halfwayup.co.uk/) game.

## Licence

MIT
