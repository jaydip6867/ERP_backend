import { Router } from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

// GET /api/v1/health
router.get('/', checkHealth);

export default router;
