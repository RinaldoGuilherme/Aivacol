import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RoleEntity } from '../modules/roles/entities/role.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { BrandEntity } from '../modules/brands/entities/brand.entity';
import { ModelEntity } from '../modules/models/entities/model.entity';
import { VehicleEntity } from '../modules/vehicles/entities/vehicle.entity';
import { InitialSchema1717200000000 } from './migrations/1717200000000-InitialSchema';

/**
 * Standalone TypeORM DataSource used by the CLI (migrations) and by the
 * bootstrap/seed scripts. It runs outside the Nest DI container, so it reads
 * configuration directly from process.env (injected by Docker env_file).
 * Entities and migrations are referenced by class to work identically when
 * executed via ts-node (dev) or from compiled dist (prod).
 */
export const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '1433', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    RoleEntity,
    UserEntity,
    BrandEntity,
    ModelEntity,
    VehicleEntity,
  ],
  migrations: [InitialSchema1717200000000],
  synchronize: false,
  extra: {
    trustServerCertificate: true,
  },
});
