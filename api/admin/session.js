import { sendJson } from '../../src/http.js';
import { handleAdminError, requireAdmin } from '../../src/admin-http.js';
import { createAdminService } from '../../src/services/admin.js';
import { clearSessionCookie, sessionCookie } from '../../src/auth.js';

const service = createAdminService();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { token } = await service.login(body?.password);
      res.setHeader('Set-Cookie', sessionCookie(token));
      return sendJson(res, 200, { authenticated: true });
    } catch (error) {
      return handleAdminError(res, error);
    }
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return sendJson(res, 200, { authenticated: false });
  }

  if (req.method === 'GET') {
    try {
      await requireAdmin(req);
      return sendJson(res, 200, { authenticated: true });
    } catch (error) {
      return handleAdminError(res, error);
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' });
}
