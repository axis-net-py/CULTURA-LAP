import { sendJson } from '../../../src/http.js';
import { handleAdminError, requireAdmin } from '../../../src/admin-http.js';
import { createAdminService } from '../../../src/services/admin.js';

const service = createAdminService();

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE');
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' });
  }

  try {
    await requireAdmin(req);
    if (req.method === 'GET') {
      const result = await service.getAssessment(req.query.id);
      return sendJson(res, 200, result);
    }
    const result = await service.deleteAssessment(req.query.id);
    return sendJson(res, 200, result);
  } catch (error) {
    return handleAdminError(res, error);
  }
}
