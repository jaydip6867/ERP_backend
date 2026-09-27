import { NumberSeries } from '../models/numberSeries.model.js';
import { logger } from '../utils/logger.js';

const DEFAULT_SERIES = [
  { module: 'LEAD', name: 'Lead Identification Number', prefix: 'LEAD', padding_digits: 4, include_year: true },
  { module: 'CUSTOMER', name: 'Customer Account Code', prefix: 'CUST', padding_digits: 4, include_year: false },
  { module: 'PRODUCT', name: 'Product Stock Keeping Unit Code', prefix: 'PRD', padding_digits: 4, include_year: false },
  { module: 'QUOTATION', name: 'Sales Quotation Reference', prefix: 'QUO', padding_digits: 4, include_year: true },
  { module: 'ORDER', name: 'Sales Order Number', prefix: 'ORD', padding_digits: 4, include_year: true },
  { module: 'INVOICE', name: 'Tax Invoice Number', prefix: 'INV', padding_digits: 4, include_year: true },
  { module: 'USER', name: 'Employee / User Code', prefix: 'USR', padding_digits: 3, include_year: false },
  { module: 'PO', name: 'Purchase Order Number', prefix: 'PO', padding_digits: 4, include_year: true },
];

/**
 * Initializes default number series if not already registered in MongoDB.
 */
export const initializeDefaultSeries = async () => {
  for (const item of DEFAULT_SERIES) {
    const existing = await NumberSeries.findOne({ module: item.module });
    if (!existing) {
      await NumberSeries.create(item);
    }
  }
};

/**
 * Atomically increments and generates the next formatted number for a module.
 *
 * @param {string} moduleKey - e.g. 'LEAD', 'CUSTOMER', 'QUOTATION', 'PRODUCT'
 * @returns {Promise<string>} Formatted document number (e.g. 'QUO-2026-0001')
 */
export const getNextNumber = async (moduleKey) => {
  const upperKey = moduleKey.toUpperCase();
  const year = new Date().getFullYear();

  let series = await NumberSeries.findOneAndUpdate(
    { module: upperKey },
    { $inc: { current_number: 1 } },
    { new: true }
  );

  if (!series) {
    const fallbackConfig = DEFAULT_SERIES.find((s) => s.module === upperKey) || {
      module: upperKey,
      name: `${upperKey} Series`,
      prefix: upperKey,
      padding_digits: 4,
      include_year: true,
    };

    series = await NumberSeries.create({
      ...fallbackConfig,
      current_number: 1,
    });
  }

  const cleanPrefix = (series.prefix || upperKey).replace(/[-_]+$/, '');
  const paddedNum = String(series.current_number).padStart(series.padding_digits || 4, '0');
  const yearPart = series.include_year ? `${year}-` : '';
  const suffixPart = series.suffix ? `-${series.suffix.replace(/^[-_]+/, '')}` : '';

  return `${cleanPrefix}-${yearPart}${paddedNum}${suffixPart}`;
};
