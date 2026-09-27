import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { AdminUserSeeder, SystemRolesSeeder } from './system.seed.js';

// Register all system seeders in sequence
const registeredSeeders = [
  new SystemRolesSeeder(),
  new AdminUserSeeder(),
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    clean: args.includes('--clean') || args.includes('-c'),
    help: args.includes('--help') || args.includes('-h'),
  };
};

const showHelp = () => {
  console.log(`
Danza ERP Database Seeder CLI
==============================
Usage:
  node src/seeds/index.js [options]
  npm run seed [-- options]

Options:
  -d, --dry-run     Inspect records that would be seeded without modifying the database.
  -c, --clean       Clear collections before seeding (use with caution in development).
  -h, --help        Show this help message.
`);
};

export const runSeeders = async () => {
  const flags = parseArgs();

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  logger.info('🌱 Starting Danza ERP Seed Pipeline...');
  if (flags.dryRun) {
    logger.info('🔍 Running in [DRY-RUN] mode. No database records will be created or modified.');
  }

  await connectDatabase();

  try {
    for (const seeder of registeredSeeders) {
      logger.info(`👉 Executing Seeder: ${seeder.name}...`);

      if (flags.clean && !flags.dryRun) {
        logger.info(`🧹 Cleaning data for: ${seeder.name}...`);
        await seeder.clear();
      }

      const result = await seeder.run({ dryRun: flags.dryRun });
      logger.info(`✅ [${seeder.name}]: ${result.message}`);
    }

    if (!flags.dryRun) {
      const { seedAllModules } = await import('./modules.seed.js');
      await seedAllModules();
    }

    logger.info('🎉 Seed Pipeline finished successfully!');
  } catch (err) {
    logger.error('❌ Seeder execution failed:', { error: err.message, stack: err.stack });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
    process.exit(process.exitCode || 0);
  }
};

// Execute if run directly from CLI
if (process.argv[1].endsWith('index.js')) {
  runSeeders();
}
