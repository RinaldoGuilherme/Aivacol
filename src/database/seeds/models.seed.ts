import { DataSource } from 'typeorm';
import { ensureModel } from './seed.helpers';

/**
 * Additional models for the development environment. The brand is a
 * human-readable reference resolved to brands.id during persistence.
 */
const MODELS = [
  { name: 'Hilux', brand: 'Toyota' },
  { name: 'Gol', brand: 'Volkswagen' },
  { name: 'Saveiro', brand: 'Volkswagen' },
  { name: 'Strada', brand: 'Fiat' },
];

export async function seedModels(ds: DataSource, adminId: number): Promise<void> {
  for (const model of MODELS) {
    await ensureModel(ds, model.name, model.brand, adminId);
  }
}
