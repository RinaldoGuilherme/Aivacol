import { api, adminLogin, operatorLogin } from './helpers';

describe('Audit Logs (e2e)', () => {
  let adminToken: string;
  let operatorToken: string;

  beforeAll(async () => {
    adminToken = (await adminLogin()).accessToken;
    operatorToken = (await operatorLogin()).accessToken;
  });

  it('GET /audit-logs returns 200 for an ADMIN', async () => {
    const res = await api('/audit-logs', { token: adminToken });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /audit-logs returns 403 for an OPERATOR', async () => {
    const res = await api('/audit-logs', { token: operatorToken });

    expect(res.status).toBe(403);
  });
});
