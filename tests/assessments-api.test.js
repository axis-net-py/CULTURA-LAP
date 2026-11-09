import { describe, expect, it } from 'vitest';
import { createAssessmentService } from '../src/services/assessments.js';
import { createAssessmentRepository } from '../src/db.js';

describe('AssessmentService', () => {
  const service = createAssessmentService({
    repository: createAssessmentRepository(null) // in-memory
  });

  it('submits a valid assessment and returns scores and whatsapp URL', async () => {
    const payload = {
      participant: {
        name: 'Maria Fernandes',
        company: 'Dalet Corp',
        country: 'BR',
        phone: '(45) 99111-2222',
        consent: true
      },
      locale: 'pt-BR',
      answers: Array(20).fill(4)
    };

    const result = await service.submit(payload);
    expect(result.id).toBeDefined();
    expect(result.participant.name).toBe('Maria Fernandes');
    expect(result.participant.company).toBe('Dalet Corp');
    expect(result.scores.culturalIndex).toBe(4.0);
    expect(result.scores.totalScore).toBe(80);
    expect(result.maturity.name).toBe('Cultura Sólida');
    expect(result.whatsappUrl).toContain('https://wa.me/5545991112222');
  });

  it('is idempotent on duplicate submission with same phone and answers', async () => {
    const payload = {
      participant: {
        name: 'Carlos Mendez',
        company: 'Empresa PY',
        country: 'PY',
        phone: '0981 555 666',
        consent: true
      },
      locale: 'es-PY',
      answers: Array(20).fill(5)
    };

    const first = await service.submit(payload);
    const second = await service.submit(payload);
    expect(first.id).toBe(second.id);
  });
});

