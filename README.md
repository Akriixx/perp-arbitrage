# Perp Arbitrage Scanner 📊

Real-time arbitrage scanner for perpetual futures across multiple DEXs.

## Features

- **Multi-Exchange Support**: Paradex, Vest, Lighter
- **Real-time Prices**: Auto-refresh every 10s-5min
- **Arbitrage Detection**: Highlights profitable spreads
- **Professional UI**: React + Tailwind dashboard
- **Favorites & Filters**: Search, filter by exchange, save favorites

## Project Structure

```
perp-arbitrage/
├── backend/
│   └── src/
│       ├── config/         # Configuration constants
│       ├── services/       # Exchange API services
│       ├── controllers/    # Route handlers
│       ├── routes/         # API routes
│       ├── db/             # Database layer
│       ├── utils/          # Utility functions
│       └── index.js        # Entry point
├── frontend/
│   └── src/
│       ├── components/     # React components
│       └── App.jsx         # Main app
└── package.json            # Monorepo scripts
```

## Installation

```bash
# Clone the repo
git clone https://github.com/Akriix/perp-arbitrage.git
cd perp-arbitrage

# Install all dependencies
npm run install:all
```

## Running

```bash
# Run both backend and frontend
npm run dev

# Or separately:
npm run dev:backend   # Port 3000
npm run dev:frontend  # Port 5173
```

Open http://localhost:5173 in your browser.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/scans` | Get all pairs with prices |
| `GET /api/spread-history` | Get spread history for a pair |

## License

MIT
