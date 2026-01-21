# Perp Arbitrage Scanner 📊

Advanced real-time arbitrage observation system for perpetual futures DEXs.

## Features

### 📡 Data & Coverage
- **Hybrid Data Engine**: Combined WebSocket (Real-time) and REST (Polling/Fallback) architecture.
- **Exchanges**:
  - **Paradex**: Full WebSocket integration.
  - **Lighter**: WebSocket-primary with automatic REST fallback + 5s rapid reconnect.
  - **Vest**: Optimized REST-only mode (bypasses Cloudflare 530 protections).

### 🖥️ Dashboard UI
- **Observation Mode**: Stable price monitoring environment.
- **Throttled Updates**: User-controlled refresh rates (1s, 3s, 5s, 10s) for visual comfort.
- **Clean Interface**: Minimalist dark mode design focused on readability.
- **Arbitrage Detection**: Real-time spread calculation with profit highlighting.

## Project Structure

```
perp-arbitrage/
├── backend/
│   └── src/
│       ├── services/       
│       │   └── exchanges/  # Hybrid Exchange Services (TS)
│       └── db/             # SQLite for historical data
├── frontend/
│   └── src/
│       ├── components/     # React 18 Components
│       ├── hooks/          # Custom Hooks (useMarketData with throttle)
│       └── utils/          # Performance utilities
└── archive/                # Research & Simulation archives
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
# Run both backend and frontend concurrently
npm run dev

# Or separately:
npm run dev:backend   # Port 3000 (Express/WS)
npm run dev:frontend  # Port 5173 (Vite)
```

## Status
- **Paradex**: ✅ Stable (WS)
- **Lighter**: ✅ Stable (Hybrid WS/REST)
- **Vest**: ✅ Stable (REST Polling)
- **Ghost Mode**: ⏸️ Paused (Simulation engine archived)

## License

MIT
