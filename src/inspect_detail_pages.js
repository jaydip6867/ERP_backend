import fs from 'fs';

const detailPages = [
  'frontend/src/pages/sales/orders/OrderDetailPage.jsx',
  'frontend/src/pages/sales/QuotationDetailPage.jsx',
  'frontend/src/pages/purchase/PurchaseOrderDetailPage.jsx',
  'frontend/src/pages/purchase/GrnDetailPage.jsx',
  'frontend/src/pages/production/WorkOrderDetailPage.jsx',
  'frontend/src/pages/invoices/InvoiceDetailPage.jsx',
  'frontend/src/pages/invoices/InvoicePrintPage.jsx',
  'frontend/src/pages/customers/Customer360Page.jsx',
  'frontend/src/pages/hr/EmployeeDetailPage.jsx',
  'frontend/src/pages/hr/EmployeeFormPage.jsx',
  'frontend/src/pages/dispatch/DispatchDetailPage.jsx'
];

detailPages.forEach(p => {
  if (!fs.existsSync(p)) {
    console.log('NOT FOUND: ' + p);
    return;
  }
  const content = fs.readFileSync(p, 'utf8');
  console.log(`\n=================== ${p} ===================`);
  // print first 60 lines
  console.log(content.split('\n').slice(0, 50).join('\n'));
});
