/**
 * API Routes
 */

import express from 'express';
import { getScans, refreshScans } from '../controllers/scans.controller';
import { getSpreadHistoryController } from '../controllers/history.controller';
import { getAlertsHistory } from '../controllers/alert.controller';

const router = express.Router();

// Existing routes
router.get('/scans', getScans);
router.post('/refresh', refreshScans);

router.get('/spread-history', getSpreadHistoryController);
router.get('/alerts', getAlertsHistory);

export default router;
