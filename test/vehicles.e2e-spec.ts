import {
  api,
  adminLogin,
  uniqueName,
  uniquePlate,
  uniqueDigits,
} from './helpers';

describe('Vehicles (e2e)', () => {
  let token: string;
  let modelId: number;
  let vehicleId: number;
  const plate = uniquePlate();

  const newVehicleBody = () => ({
    licensePlate: uniquePlate(),
    chassis: uniqueDigits(17),
    renavam: uniqueDigits(11),
    year: 2024,
    modelId,
  });

  beforeAll(async () => {
    token = (await adminLogin()).accessToken;
    const brand = await api('/brands', {
      method: 'POST',
      token,
      body: { name: uniqueName('TEST_BRAND_') },
    });
    const model = await api('/models', {
      method: 'POST',
      token,
      body: { name: uniqueName('TEST_MODEL_'), brandId: brand.body.data.id },
    });
    modelId = model.body.data.id;
  });

  it('POST /vehicles creates a vehicle', async () => {
    const res = await api('/vehicles', {
      method: 'POST',
      token,
      body: {
        licensePlate: plate,
        chassis: uniqueDigits(17),
        renavam: uniqueDigits(11),
        year: 2022,
        modelId,
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.licensePlate).toBe(plate);
    vehicleId = res.body.data.id;
  });

  it('GET /vehicles lists vehicles', async () => {
    const res = await api('/vehicles', { token });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /vehicles/:id returns the created vehicle', async () => {
    const res = await api(`/vehicles/${vehicleId}`, { token });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(vehicleId);
  });

  it('GET /vehicles supports basic filters (licensePlate)', async () => {
    const res = await api(`/vehicles?licensePlate=${plate}`, { token });

    expect(res.status).toBe(200);
    expect(res.body.data.some((v: any) => v.licensePlate === plate)).toBe(true);
  });

  it('PUT /vehicles/:id updates the vehicle', async () => {
    const res = await api(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      token,
      body: { year: 2025 },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.year).toBe(2025);
  });

  it('returns 409 for a duplicated license plate', async () => {
    const body = newVehicleBody();
    const first = await api('/vehicles', { method: 'POST', token, body });
    expect(first.status).toBe(201);

    const duplicate = await api('/vehicles', {
      method: 'POST',
      token,
      body: { ...newVehicleBody(), licensePlate: body.licensePlate },
    });

    expect(duplicate.status).toBe(409);
  });

  it('DELETE /vehicles/:id soft-deletes the vehicle', async () => {
    const res = await api(`/vehicles/${vehicleId}`, { method: 'DELETE', token });

    expect(res.status).toBe(200);
  });

  it('GET /vehicles/:id returns 404 after delete', async () => {
    const res = await api(`/vehicles/${vehicleId}`, { token });

    expect(res.status).toBe(404);
  });
});
