import { readConfig } from '../config.js';
import { createAdminRepository, getPool } from '../db.js';
import { createSessionToken, verifyAdminPassword } from '../auth.js';
import { AdminError } from '../admin-http.js';

export function createAdminService({ repository, config } = {}) {
  const cfg = config || readConfig(process.env);
  const repo = repository || createAdminRepository(getPool(cfg.databaseUrl));

  return {
    async login(password) {
      if (!password || typeof password !== 'string') {
        throw new AdminError(400, 'Senha obrigatória.');
      }
      const match = await verifyAdminPassword(password, cfg.adminPasswordHash);
      if (!match) {
        throw new AdminError(401, 'Credenciais inválidas.');
      }
      const token = await createSessionToken(cfg.sessionSecret);
      return { token };
    },

    async listAssessments(params = {}) {
      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
      const filters = {
        page,
        pageSize,
        search: typeof params.search === 'string' ? params.search.trim() : '',
        country: params.country === 'BR' || params.country === 'PY' ? params.country : '',
        from: params.from || '',
        to: params.to || ''
      };
      return repo.list(filters);
    },

    async getAssessment(id) {
      const item = await repo.findById(id);
      if (!item) throw new AdminError(404, 'Diagnóstico não encontrado.');
      return item;
    },

    async deleteAssessment(id) {
      const ok = await repo.softDelete(id);
      if (!ok) throw new AdminError(404, 'Diagnóstico não encontrado.');
      return { ok: true };
    },

    async exportCsv(params = {}) {
      const filters = {
        country: params.country === 'BR' || params.country === 'PY' ? params.country : ''
      };
      const rows = await repo.exportRows(filters);

      const headers = [
        'ID',
        'Data/Hora',
        'Nome',
        'Empresa',
        'Telefone',
        'País',
        'Idioma',
        'Pontos Totais',
        'Índice Cultural',
        'Maturidade Cultural',
        ...Array.from({ length: 20 }, (_, i) => `Q${i + 1}`)
      ];

      const csvRows = [headers.join(';')];

      for (const r of rows) {
        const answers = Array.isArray(r.answers) ? r.answers : [];
        const line = [
          r.id,
          r.completedAt,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.company || '').replace(/"/g, '""')}"`,
          r.phone,
          r.country,
          r.locale,
          r.totalScore,
          r.culturalIndex?.toFixed(2) || '',
          `"${(r.maturity?.name || '').replace(/"/g, '""')}"`,
          ...answers
        ];
        csvRows.push(line.join(';'));
      }

      return csvRows.join('\r\n');
    }
  };
}
