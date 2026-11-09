import { handleAdminError, requireAdmin } from '../../src/admin-http.js';
import { createAdminService } from '../../src/services/admin.js';
import { sendJson } from '../../src/http.js';

const service = createAdminService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' });
  }

  try {
    await requireAdmin(req);
    const csv = await service.exportCsv(req.query);
    const filename = `diagnostico-cultura-lap-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.statusCode = 200;
    res.end('\uFEFF' + csv);
  } catch (error) {
    return handleAdminError(res, error);
  }
}
