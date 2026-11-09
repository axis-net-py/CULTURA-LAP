import { readConfig } from './config.js';
import { readCookie, verifySessionToken } from './auth.js';
import { sendJson } from './http.js';

export class AdminError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AdminError';
    this.status = status;
  }
}

export async function requireAdmin(request) {
  const config = readConfig(process.env);
  const token = readCookie(request, 'cultura_lap_session');
  if (!token) throw new AdminError(401, 'Autenticação necessária.');
  try {
    await verifySessionToken(token, config.sessionSecret);
  } catch {
    throw new AdminError(401, 'Sessão inválida ou expirada.');
  }
  return config;
}

export function handleAdminError(response, error) {
  if (error instanceof AdminError) {
    return sendJson(response, error.status, { error: 'ADMIN_ERROR', message: error.message });
  }
  console.error('Admin API error:', error instanceof Error ? error.message : error);
  return sendJson(response, 500, { error: 'INTERNAL_ERROR', message: 'Não foi possível concluir a solicitação.' });
}

