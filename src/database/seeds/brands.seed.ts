import { DataSource } from 'typeorm';
import { ensureBrand } from './seed.helpers';

/** Additional brands for the development environment. */
const BRANDS = ['Volkswagen', 'Fiat'];

export async function seedBrands(ds: DataSource, adminId: number): Promise<void> {
  for (const name of BRANDS) {
    await ensureBrand(ds, name, adminId);
  }
}
