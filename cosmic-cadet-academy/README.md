# Cosmic Cadet Academy

A puzzle-adventure mobile game that teaches space science and logical reasoning to kids aged 10-14.

## Overview

Cosmic Cadet Academy is a cross-platform (iOS/Android) educational game built with Phaser 3 and Node.js. Players navigate through 40+ levels across 8 themed chapters, collecting stars, solving puzzles, and learning about space along the way.

## Features

- **40 Levels** across 8 unique space-themed chapters
- **6 Educational Mini-Games** teaching physics, math, and astronomy
- **Real-Time Leaderboards** via Socket.IO
- **Achievement System** with 15+ unlockable badges
- **Kid-Safe Design** with COPPA compliance and parental controls
- **Offline Mode** for play without internet connection
- **Cross-Platform** - iOS, Android, and Web

## Tech Stack

| Layer | Technology |
|-------|------------|
| Game Engine | Phaser 3 |
| Mobile Wrapper | Capacitor |
| Backend | Node.js + Express |
| Real-Time | Socket.IO |
| Database | PostgreSQL |
| Cache | Redis |
| Hosting | Vercel (frontend) + Railway (backend) |

## Project Structure

```
cosmic-cadet-academy/
├── docs/                    # Documentation
│   ├── GAME_DESIGN_DOCUMENT.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── UI_UX_DESIGN.md
│   ├── ASSET_LIST.md
│   ├── FEATURE_LIST.md
│   ├── DEVELOPMENT_ROADMAP.md
│   └── MONETIZATION_MARKETING.md
├── src/
│   ├── game/               # Phaser 3 game code
│   │   ├── scenes/         # Game scenes
│   │   ├── entities/       # Game objects
│   │   ├── utils/          # Utilities
│   │   └── config/         # Configuration
│   └── server/             # Node.js backend
│       ├── routes/         # API routes
│       ├── models/         # Database models
│       ├── socket/         # Socket.IO handlers
│       └── middleware/     # Express middleware
├── public/
│   └── assets/            # Game assets
│       ├── images/
│       ├── audio/
│       └── data/
└── wireframes/            # UI mockups
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/cosmic-cadet-academy.git
cd cosmic-cadet-academy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cosmic_academy

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## Development

### Running the Game

```bash
# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Building for Mobile

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android

# Sync web assets
npx cap sync

# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android
```

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Game Design Document](docs/GAME_DESIGN_DOCUMENT.md)** - Storyline, characters, mechanics
- **[Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)** - System design, APIs
- **[UI/UX Design](docs/UI_UX_DESIGN.md)** - Wireframes, art direction
- **[Asset List](docs/ASSET_LIST.md)** - Required assets, specifications
- **[Feature List](docs/FEATURE_LIST.md)** - All planned features with priorities
- **[Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)** - Milestones, timeline
- **[Monetization & Marketing](docs/MONETIZATION_MARKETING.md)** - Business strategy

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/guest` - Guest session

### Leaderboard
- `GET /api/leaderboard` - Get top scores
- `POST /api/leaderboard` - Submit score
- `GET /api/leaderboard/rank/:userId` - Get user rank

### Progress
- `GET /api/progress` - Get saved progress
- `PUT /api/progress` - Save progress

### Achievements
- `GET /api/achievements` - List achievements
- `POST /api/achievements/:id` - Unlock achievement

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Phaser 3 framework and community
- Space facts sourced from NASA and ESA educational materials
- Sound effects from Freesound.org contributors

---

**Cosmic Cadet Academy** - *Adventure Through Space, Learn Along the Way*
