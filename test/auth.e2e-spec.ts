import { api, adminLogin, operatorLogin, login } from './helpers';

describe('Auth (e2e)', () => {
  let adminToken: string;
  let operatorToken: string;

  beforeAll(async () => {
    adminToken = (await adminLogin()).accessToken;
    operatorToken = (await operatorLogin()).accessToken;
  });

  describe('POST /auth/login', () => {
    it('authenticates a valid admin and returns a token (no password leaked)', async () => {
      const res = await login('admin@aivacol.com', '123456');

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe('admin@aivacol.com');
      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('rejects invalid credentials with 401', async () => {
      const res = await login('admin@aivacol.com', 'wrong-password');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('returns the authenticated principal with a valid token', async () => {
      const res = await api('/auth/me', { token: adminToken });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@aivacol.com');
    });

    it('rejects the request without a token with 401', async () => {
      const res = await api('/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/admin-check', () => {
    it('grants access to an ADMIN', async () => {
      const res = await api('/auth/admin-check', { token: adminToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Access granted');
    });

    it('returns 403 for an OPERATOR', async () => {
      const res = await api('/auth/admin-check', { token: operatorToken });

      expect(res.status).toBe(403);
    });
  });
});
