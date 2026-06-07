import { api, adminLogin, uniqueName } from './helpers';

describe('Brands (e2e)', () => {
  let token: string;
  let brandId: number;
  const name = uniqueName('TEST_BRAND_');

  beforeAll(async () => {
    token = (await adminLogin()).accessToken;
  });

  it('POST /brands creates a brand', async () => {
    const res = await api('/brands', { method: 'POST', token, body: { name } });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(Number));
    expect(res.body.data.name).toBe(name);
    brandId = res.body.data.id;
  });

  it('GET /brands lists brands', async () => {
    const res = await api('/brands', { token });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /brands/:id returns the created brand', async () => {
    const res = await api(`/brands/${brandId}`, { token });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(brandId);
  });

  it('PUT /brands/:id updates the brand', async () => {
    const updated = `${name}_UPD`;
    const res = await api(`/brands/${brandId}`, {
      method: 'PUT',
      token,
      body: { name: updated },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(updated);
  });

  it('DELETE /brands/:id soft-deletes the brand', async () => {
    const res = await api(`/brands/${brandId}`, { method: 'DELETE', token });

    expect(res.status).toBe(200);
  });

  it('GET /brands/:id returns 404 after delete', async () => {
    const res = await api(`/brands/${brandId}`, { token });

    expect(res.status).toBe(404);
  });
});
