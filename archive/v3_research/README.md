# V3 Research Archive

This folder contains the V3 Ghost Mode simulation research and implementation files.

## Contents

- `RESEARCH_V3.md` - Feasibility study on automated execution
- `ExecutionSimulator.ts` - Dry-run simulation logic (TypeScript)
- `LiveSimulationEngine.js` - Live simulation engine with console dashboard

## Data Persistence

The simulation data is stored in:
- `backend/simulation_data.db` - SQLite database with all simulated trades
- `backend/src/db/SimulationRepository.js` - Database access layer (still in src/)

## To Reactivate Ghost Mode

1. Move files back to `backend/src/services/`
2. In `backend/src/config/index.js`, set `SIMULATION.ENABLED = true`
3. In `backend/src/services/aggregator.service.js`:
   - Uncomment `const liveSimulation = require('./LiveSimulationEngine');`
   - Uncomment `liveSimulation.init()` in `startScheduler()`
   - Uncomment `liveSimulation.processSpread()` calls in `updateAndRecalculate()`
4. Restart the backend

## Archive Date
January 21, 2026
