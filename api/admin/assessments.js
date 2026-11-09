import { sendJson } from '../../src/http.js';
import { handleAdminError, requireAdmin } from '../../src/admin-http.js';
import { createAdminService } from '../../src/services/admin.js';

const service = createAdminService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' });
  }

  try {
    await requireAdmin(req);
    const result = await service.listAssessments(req.query);
    return sendJson(res, 200, result);
  } catch (error) {
    return handleAdminError(res, error);
  }
}

