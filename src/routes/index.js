import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import roleRoutes from './role.routes.js';
import productRoutes from './product.routes.js';
import customerRoutes from './customer.routes.js';
import leadRoutes from './lead.routes.js';
import salesRoutes from './sales.routes.js';

// Operational modules
import salesOrderRoutes from './salesOrder.routes.js';
import inventoryRoutes from './inventory.routes.js';
import purchaseRoutes from './purchase.routes.js';
import productionRoutes from './production.routes.js';
import qcRoutes from './qc.routes.js';
import dispatchRoutes from './dispatch.routes.js';
import invoiceRoutes from './invoice.routes.js';
import taxRoutes from './tax.routes.js';

// Strategic & Intelligence modules
import financeRoutes from './finance.routes.js';
import expenseOwnerRoutes from './expenseOwner.routes.js';
import customerServiceRoutes from './customerService.routes.js';
import repeatUpsellRoutes from './repeatUpsell.routes.js';
import marketingRoutes from './marketing.routes.js';
import targetsPerformanceRoutes from './targetsPerformance.routes.js';
import profitabilityForecastRoutes from './profitabilityForecast.routes.js';
import executiveCockpitsRoutes from './executiveCockpits.routes.js';
import productivityRoutes from './productivity.routes.js';
import commonLayerRoutes from './commonLayer.routes.js';

// New Organization, HR, Technology, R&D, Operations & Executive Modules
import organizationRoutes from './organization.routes.js';
import hrRoutes from './hr.routes.js';
import technologyRoutes from './technology.routes.js';
import rndRoutes from './rnd.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import operationsRoutes from './operations.routes.js';

const apiRouter = Router();

// Base & Administrative
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/organization', organizationRoutes);

// Commercial & Products
apiRouter.use('/products', productRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/leads', leadRoutes);
apiRouter.use('/sales', salesRoutes);

// Operations & Supply Chain
apiRouter.use('/sales-orders', salesOrderRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/purchase', purchaseRoutes);
apiRouter.use('/production', productionRoutes);
apiRouter.use('/qc', qcRoutes);
apiRouter.use('/dispatch', dispatchRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/tax', taxRoutes);
apiRouter.use('/operations', operationsRoutes);

// Human Resources & People
apiRouter.use('/hr', hrRoutes);

// Technology & Automation
apiRouter.use('/technology', technologyRoutes);

// R&D & Product Innovation
apiRouter.use('/rnd', rndRoutes);

// Finance, Owner Capital & Intelligence
apiRouter.use('/finance', financeRoutes);
apiRouter.use('/expense-owner', expenseOwnerRoutes);
apiRouter.use('/support', customerServiceRoutes);
apiRouter.use('/commercial-intelligence', repeatUpsellRoutes);
apiRouter.use('/marketing', marketingRoutes);
apiRouter.use('/performance', targetsPerformanceRoutes);
apiRouter.use('/profitability', profitabilityForecastRoutes);
apiRouter.use('/executive', executiveCockpitsRoutes);
apiRouter.use('/dashboards', dashboardRoutes);
apiRouter.use('/productivity', productivityRoutes);
apiRouter.use('/common', commonLayerRoutes);

export default apiRouter;
