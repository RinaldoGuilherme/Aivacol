import { DataSource } from 'typeorm';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { BrandEntity } from '../../modules/brands/entities/brand.entity';
import { ModelEntity } from '../../modules/models/entities/model.entity';
import { VehicleEntity } from '../../modules/vehicles/entities/vehicle.entity';

export const ADMIN_EMAIL = 'admin@aivacol.com';

/** Resolves the administrator user used as created_by for relational data. */
export async function getAdminUser(ds: DataSource): Promise<UserEntity> {
  const user = await ds.getRepository(UserEntity).findOne({
    where: { email: ADMIN_EMAIL },
    withDeleted: true,
  });
  if (!user) {
    throw new Error(
      `Administrator user (${ADMIN_EMAIL}) not found. Run bootstrap first.`,
    );
  }
  return user;
}

/** Idempotently creates a brand identified by its unique name. */
export async function ensureBrand(
  ds: DataSource,
  name: string,
  createdBy: number,
): Promise<BrandEntity> {
  const repo = ds.getRepository(BrandEntity);
  const existing = await repo.findOne({ where: { name }, withDeleted: true });
  if (existing) {
    return existing;
  }
  return repo.save(repo.create({ name, createdBy }));
}

/** Idempotently creates a model identified by name + brand. */
export async function ensureModel(
  ds: DataSource,
  name: string,
  brandName: string,
  createdBy: number,
): Promise<ModelEntity> {
  const brand = await ds
    .getRepository(BrandEntity)
    .findOne({ where: { name: brandName } });
  if (!brand) {
    throw new Error(`Brand "${brandName}" not found for model "${name}".`);
  }
  const repo = ds.getRepository(ModelEntity);
  const existing = await repo.findOne({
    where: { name, brandId: brand.id },
    withDeleted: true,
  });
  if (existing) {
    return existing;
  }
  return repo.save(repo.create({ name, brandId: brand.id, createdBy }));
}

export interface VehicleSeedInput {
  licensePlate: string;
  chassis: string;
  renavam: string;
  year: number;
  model: string;
}

/** Idempotently creates a vehicle identified by its unique license plate. */
export async function ensureVehicle(
  ds: DataSource,
  input: VehicleSeedInput,
  createdBy: number,
): Promise<VehicleEntity> {
  const model = await ds
    .getRepository(ModelEntity)
    .findOne({ where: { name: input.model } });
  if (!model) {
    throw new Error(
      `Model "${input.model}" not found for vehicle "${input.licensePlate}".`,
    );
  }
  const repo = ds.getRepository(VehicleEntity);
  const existing = await repo.findOne({
    where: { licensePlate: input.licensePlate },
    withDeleted: true,
  });
  if (existing) {
    return existing;
  }
  return repo.save(
    repo.create({
      licensePlate: input.licensePlate,
      chassis: input.chassis,
      renavam: input.renavam,
      year: input.year,
      modelId: model.id,
      createdBy,
    }),
  );
}
