import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RoleEntity } from '../../modules/roles/entities/role.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { ensureBrand, ensureModel, ensureVehicle } from '../seeds/seed.helpers';

const SALT_ROUNDS = 10;

interface UserInput {
  nickname: string;
  name: string;
  email: string;
  password: string;
  roleValue: string;
}

/** Idempotently creates a role identified by its unique value. */
async function ensureRole(
  ds: DataSource,
  value: string,
  name: string,
): Promise<RoleEntity> {
  const repo = ds.getRepository(RoleEntity);
  const existing = await repo.findOne({ where: { value } });
  if (existing) {
    return existing;
  }
  return repo.save(repo.create({ value, name }));
}

/** Idempotently creates a user identified by its unique email (bcrypt hash). */
async function ensureUser(ds: DataSource, input: UserInput): Promise<UserEntity> {
  const repo = ds.getRepository(UserEntity);
  const existing = await repo.findOne({
    where: { email: input.email },
    withDeleted: true,
  });
  if (existing) {
    return existing;
  }
  const role = await ds
    .getRepository(RoleEntity)
    .findOne({ where: { value: input.roleValue } });
  if (!role) {
    throw new Error(`Role "${input.roleValue}" not found for user ${input.email}.`);
  }
  const password = await bcrypt.hash(input.password, SALT_ROUNDS);
  return repo.save(
    repo.create({
      nickname: input.nickname,
      name: input.name,
      email: input.email,
      password,
      roleId: role.id,
    }),
  );
}

/**
 * Minimum production-like dataset. Safe to run multiple times: every record is
 * resolved by its unique key before insertion, so duplicates are never created.
 */
async function bootstrap(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await ensureRole(ds, 'ADMIN', 'Administrador');
    await ensureRole(ds, 'OPERATOR', 'Operador');

    const admin = await ensureUser(ds, {
      nickname: 'aivacol',
      name: 'Administrador do Sistema',
      email: 'admin@aivacol.com',
      password: '123456',
      roleValue: 'ADMIN',
    });
    await ensureUser(ds, {
      nickname: 'operador',
      name: 'Operador de Frota',
      email: 'operador@aivacol.com',
      password: '123456',
      roleValue: 'OPERATOR',
    });

    await ensureBrand(ds, 'Toyota', admin.id);
    await ensureModel(ds, 'Corolla', 'Toyota', admin.id);
    await ensureVehicle(
      ds,
      {
        licensePlate: 'BRA2E19',
        chassis: '9BWZZZ377VT004251',
        renavam: '12345678901',
        year: 2022,
        model: 'Corolla',
      },
      admin.id,
    );

    console.log('Bootstrap completed successfully.');
  } finally {
    await ds.destroy();
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
