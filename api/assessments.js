import { sendJson, handleApiError } from '../src/http.js';
import { createAssessmentService } from '../src/services/assessments.js';

const service = createAssessmentService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await service.submit(body);
    return sendJson(res, 201, result);
  } catch (error) {
    return handleApiError(res, error);
  }
}
