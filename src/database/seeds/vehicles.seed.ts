import { DataSource } from 'typeorm';
import { ensureVehicle, VehicleSeedInput } from './seed.helpers';

/**
 * Additional vehicles for the development environment. The model is a
 * human-readable reference resolved to models.id during persistence.
 */
const VEHICLES: VehicleSeedInput[] = [
  {
    licensePlate: 'FRT5A48',
    chassis: '9BWZZZ377VT004252',
    renavam: '12345678902',
    year: 2023,
    model: 'Hilux',
  },
  {
    licensePlate: 'COM8B73',
    chassis: '9BWZZZ377VT004253',
    renavam: '12345678903',
    year: 2024,
    model: 'Strada',
  },
];

export async function seedVehicles(ds: DataSource, adminId: number): Promise<void> {
  for (const vehicle of VEHICLES) {
    await ensureVehicle(ds, vehicle, adminId);
  }
}
