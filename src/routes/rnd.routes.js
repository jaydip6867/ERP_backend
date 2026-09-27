import { Router } from 'express';
import * as rndController from '../controllers/rnd.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateUser);

// Dashboard
router.get('/dashboard', requirePermission('rnd', 'can_view'), rndController.getRndDashboard);

// Market Research & Competitors
router.get('/market-research', requirePermission('rnd', 'can_view'), rndController.getMarketResearch);
router.post('/market-research', requirePermission('rnd', 'can_create'), rndController.createMarketResearch);
router.patch('/market-research/:id', requirePermission('rnd', 'can_edit'), rndController.updateMarketResearch);
router.put('/market-research/:id', requirePermission('rnd', 'can_edit'), rndController.updateMarketResearch);

router.get('/competitors', requirePermission('rnd', 'can_view'), rndController.getCompetitors);
router.post('/competitors', requirePermission('rnd', 'can_create'), rndController.createCompetitor);

// Opportunities & Product Development
router.get('/opportunities', requirePermission('rnd', 'can_view'), rndController.getOpportunities);
router.post('/opportunities', requirePermission('rnd', 'can_create'), rndController.createOpportunity);

router.get('/product-development', requirePermission('rnd', 'can_view'), rndController.getProductDevelopment);
router.post('/product-development', requirePermission('rnd', 'can_create'), rndController.createProductDevelopment);

// Samples, Tests & Improvements
router.get('/samples', requirePermission('rnd', 'can_view'), rndController.getSamples);
router.post('/samples', requirePermission('rnd', 'can_create'), rndController.createSample);

router.get('/tests', requirePermission('rnd', 'can_view'), rndController.getTests);
router.post('/tests', requirePermission('rnd', 'can_create'), rndController.createTest);

router.get('/improvements', requirePermission('rnd', 'can_view'), rndController.getImprovements);
router.post('/improvements', requirePermission('rnd', 'can_create'), rndController.createImprovement);

// Customer Research, Feedback & Problem Solving
router.get('/customer-research', requirePermission('rnd', 'can_view'), rndController.getCustomerResearch);
router.post('/customer-research', requirePermission('rnd', 'can_create'), rndController.createCustomerResearch);

router.get('/feedback', requirePermission('rnd', 'can_view'), rndController.getFeedback);
router.post('/feedback', requirePermission('rnd', 'can_create'), rndController.createFeedback);

router.get('/problem-solving', requirePermission('rnd', 'can_view'), rndController.getProblemSolving);
router.post('/problem-solving', requirePermission('rnd', 'can_create'), rndController.createProblemSolving);

export default router;
