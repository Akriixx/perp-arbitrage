# Perp Arbitrage Scanner 📊

Real-time arbitrage scanner for perpetual futures across multiple DEXs.

## Features

- **Multi-Exchange Support**: Paradex, Vest, Lighter
- **Real-time Prices**: Auto-refresh every 10s-5min
- **Arbitrage Detection**: Highlights profitable spreads
- **Professional UI**: React + Tailwind dashboard
- **Favorites & Filters**: Search, filter by exchange, save favorites

## Tech Stack

- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Vite + Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/perp-arbitrage.git
cd perp-arbitrage

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

## Running

```bash
# Terminal 1: Start backend (port 3000)
npm start
# or
node server.js

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/scans` | Get all pairs with prices |
| `GET /api/spread-history` | Get spread history for a pair |

## Screenshot

![Dashboard](./screenshot.png)

## License

MIT
