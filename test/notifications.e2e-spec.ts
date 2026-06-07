import { api, adminLogin, operatorLogin } from './helpers';

describe('Notifications (e2e)', () => {
  let adminToken: string;
  let adminId: number;
  let operatorToken: string;
  let notificationId: string | undefined;

  beforeAll(async () => {
    const admin = await adminLogin();
    adminToken = admin.accessToken;
    adminId = admin.user.id;
    operatorToken = (await operatorLogin()).accessToken;

    const list = await api('/notifications', { token: adminToken });
    notificationId = list.body.data?.[0]?.id;
  });

  it('GET /notifications returns only the authenticated user notifications', async () => {
    const res = await api('/notifications', { token: adminToken });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const item of res.body.data) {
      expect(item.userId).toBe(adminId);
    }
  });

  it('PATCH /notifications/:id/read marks the notification as read', async () => {
    if (!notificationId) {
      console.warn('No seeded notification found; skipping mark-as-read check.');
      return;
    }

    const res = await api(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      token: adminToken,
    });
    expect(res.status).toBe(200);

    const after = await api(`/notifications/${notificationId}`, {
      token: adminToken,
    });
    expect(after.body.data.read).toBe(true);
  });

  it('forbids a user from altering another user notification', async () => {
    if (!notificationId) {
      console.warn('No seeded notification found; skipping ownership check.');
      return;
    }

    const res = await api(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      token: operatorToken,
    });

    expect(res.status).toBe(403);
  });
});
