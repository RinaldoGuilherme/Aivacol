import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { getAdminUser } from './seed.helpers';
import { seedBrands } from './brands.seed';
import { seedModels } from './models.seed';
import { seedVehicles } from './vehicles.seed';

/**
 * Development seed. Depends on the bootstrap (roles, users and the
 * administrator used as created_by). Idempotent: re-running it never
 * duplicates data because every record is resolved by its unique key first.
 */
async function seed(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    const admin = await getAdminUser(ds);
    await seedBrands(ds, admin.id);
    await seedModels(ds, admin.id);
    await seedVehicles(ds, admin.id);
    console.log('Seed completed successfully.');
  } finally {
    await ds.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
