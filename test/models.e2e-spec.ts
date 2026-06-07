import { api, adminLogin, uniqueName } from './helpers';

describe('Models (e2e)', () => {
  let token: string;
  let brandId: number;
  let modelId: number;
  const name = uniqueName('TEST_MODEL_');

  beforeAll(async () => {
    token = (await adminLogin()).accessToken;
    const brand = await api('/brands', {
      method: 'POST',
      token,
      body: { name: uniqueName('TEST_BRAND_') },
    });
    brandId = brand.body.data.id;
  });

  it('POST /models creates a model linked to a brand', async () => {
    const res = await api('/models', {
      method: 'POST',
      token,
      body: { name, brandId },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.brandId).toBe(brandId);
    modelId = res.body.data.id;
  });

  it('GET /models lists models', async () => {
    const res = await api('/models', { token });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /models/:id updates the model', async () => {
    const res = await api(`/models/${modelId}`, {
      method: 'PUT',
      token,
      body: { name: `${name}_UPD` },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(`${name}_UPD`);
  });

  it('DELETE /models/:id soft-deletes the model', async () => {
    const res = await api(`/models/${modelId}`, { method: 'DELETE', token });

    expect(res.status).toBe(200);
  });

  it('rejects creating a model with a non-existent brand', async () => {
    const res = await api('/models', {
      method: 'POST',
      token,
      body: { name: uniqueName('TEST_MODEL_'), brandId: 999999 },
    });

    expect(res.status).toBe(404);
  });

  it('rejects creating a model with a soft-deleted brand', async () => {
    const brand = await api('/brands', {
      method: 'POST',
      token,
      body: { name: uniqueName('TEST_BRAND_') },
    });
    await api(`/brands/${brand.body.data.id}`, { method: 'DELETE', token });

    const res = await api('/models', {
      method: 'POST',
      token,
      body: { name: uniqueName('TEST_MODEL_'), brandId: brand.body.data.id },
    });

    expect(res.status).toBe(404);
  });
});
