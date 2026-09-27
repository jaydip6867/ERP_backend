/**
 * Abstract Base Seeder class.
 * All seeders should inherit from this class and implement run() and clear().
 */
export class BaseSeeder {
  constructor(name) {
    if (!name) {
      throw new Error('Seeder must have a descriptive name.');
    }
    this.name = name;
  }

  /**
   * Run the seeder logic.
   * @param {object} options
   * @param {boolean} [options.dryRun=false]
   * @returns {Promise<{ seededCount: number, message: string }>}
   */
  async run(options = { dryRun: false }) {
    throw new Error(`Seeder '${this.name}' has not implemented the run() method.`);
  }

  /**
   * Optional cleanup / reset method for development environments.
   * @returns {Promise<void>}
   */
  async clear() {
    // Override if collection clearing is supported
  }
}
