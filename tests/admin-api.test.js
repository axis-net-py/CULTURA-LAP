import { describe, expect, it } from 'vitest';
import { createAdminService } from '../src/services/admin.js';
import { createAdminRepository } from '../src/db.js';
import { AdminError } from '../src/admin-http.js';

describe('AdminService', () => {
  const service = createAdminService({
    repository: createAdminRepository(null)
  });

  it('authenticates with correct MetodoLAP2026! password', async () => {
    const { token } = await service.login('MetodoLAP2026!');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('rejects incorrect password', async () => {
    await expect(service.login('wrongpassword')).rejects.toThrow(AdminError);
  });

  it('lists assessments and generates CSV export', async () => {
    const list = await service.listAssessments();
    expect(list.items).toBeDefined();
    expect(Array.isArray(list.items)).toBe(true);

    const csv = await service.exportCsv();
    expect(csv).toContain('ID;Data/Hora;Nome;Empresa;Telefone;País;Idioma;Pontos Totais;Índice Cultural;Maturidade Cultural');
  });

  it('rejects nonexistent assessment in getAssessment', async () => {
    await expect(service.getAssessment(9999)).rejects.toThrow(AdminError);
  });

  it('computes company overview and lists companies', async () => {
    const overview = await service.getOverview({ company: 'DALET' });
    expect(overview).toBeDefined();
    expect(overview.company).toBe('DALET');
    expect(Array.isArray(overview.dimensions)).toBe(true);

    const companies = await service.listCompanies();
    expect(Array.isArray(companies)).toBe(true);
  });
});
