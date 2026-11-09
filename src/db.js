import pg from 'pg';
import { cultureBlocks, dimensions } from './content/questions.js';

let pool;
let migrationDone = false;

export function getPool(connectionString) {
  if (!connectionString) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000
    });
  }
  return pool;
}

export async function ensureSchema(database) {
  if (migrationDone || !database) return;
  await database.query(`
    CREATE TABLE IF NOT EXISTS cultural_assessments (
      id SERIAL PRIMARY KEY,
      idempotency_key TEXT UNIQUE NOT NULL,
      participant_name TEXT NOT NULL,
      company TEXT NOT NULL,
      phone_e164 TEXT NOT NULL,
      country VARCHAR(2) NOT NULL,
      locale VARCHAR(10) NOT NULL,
      consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      answers JSONB NOT NULL,
      total_score INT NOT NULL,
      cultural_index NUMERIC(3,2) NOT NULL,
      maturity JSONB NOT NULL,
      dimensions JSONB NOT NULL,
      whatsapp_url TEXT,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_cultural_assessments_company ON cultural_assessments(company);
    CREATE INDEX IF NOT EXISTS idx_cultural_assessments_country ON cultural_assessments(country);
    CREATE INDEX IF NOT EXISTS idx_cultural_assessments_completed ON cultural_assessments(completed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cultural_assessments_deleted ON cultural_assessments(deleted_at);
  `);
  migrationDone = true;
}

// In-memory store for fallback / testing without DB
const memoryStore = [];

export function calculateOverview(rows, companyFilter = '') {
  if (!rows || rows.length === 0) {
    return {
      count: 0,
      company: companyFilter || 'Todas as empresas',
      avgCulturalIndex: 0,
      avgTotalScore: 0,
      dimensions: [],
      strengths: [],
      gaps: [],
      maturity: null
    };
  }

  const count = rows.length;
  let totalScoreSum = 0;
  let indexSum = 0;
  const questionSums = Array(20).fill(0);
  const questionCounts = Array(20).fill(0);

  for (const r of rows) {
    totalScoreSum += Number(r.total_score ?? r.totalScore ?? 0);
    indexSum += Number(r.cultural_index ?? r.culturalIndex ?? 0);
    const ans = r.answers;
    if (Array.isArray(ans)) {
      ans.forEach((val, idx) => {
        if (typeof val === 'number') {
          questionSums[idx] += val;
          questionCounts[idx] += 1;
        }
      });
    }
  }

  const avgTotalScore = Math.round((totalScoreSum / count) * 10) / 10;
  const avgCulturalIndex = Number((indexSum / count).toFixed(2));

  // Dimension averages
  const ptBlocks = cultureBlocks['pt-BR'] || [];
  const allQuestions = ptBlocks.flatMap((b) => b.questions || []);
  const dimsConfig = dimensions['pt-BR'] || [];

  const dimsResult = dimsConfig.map((dim) => {
    let dimSum = 0;
    let dimQCount = 0;
    dim.questionIds.forEach((qId) => {
      const idx = qId - 1;
      if (questionCounts[idx] > 0) {
        dimSum += questionSums[idx] / questionCounts[idx];
        dimQCount += 1;
      }
    });
    const avg = dimQCount > 0 ? Number((dimSum / dimQCount).toFixed(2)) : 0;
    const percentage = Math.round((avg / 5) * 100);
    return {
      id: dim.id,
      title: dim.title,
      description: dim.desc,
      average: avg,
      percentage
    };
  });

  // Questions breakdown with text
  const questionStats = allQuestions.map((q, idx) => {
    const avg = questionCounts[idx] > 0 ? Number((questionSums[idx] / questionCounts[idx]).toFixed(2)) : 0;
    return {
      id: q.id,
      text: q.text,
      average: avg,
      percentage: Math.round((avg / 5) * 100)
    };
  });

  // Top 3 strengths (highest average)
  const sortedByScoreDesc = [...questionStats].sort((a, b) => b.average - a.average);
  const strengths = sortedByScoreDesc.slice(0, 3);

  // Top 3 priority bottlenecks (lowest average)
  const sortedByScoreAsc = [...questionStats].sort((a, b) => a.average - b.average);
  const gaps = sortedByScoreAsc.slice(0, 3);

  // Collective Maturity
  let maturity;
  if (avgCulturalIndex >= 4.2) {
    maturity = {
      band: 'SOLID',
      name: 'Cultura Consolidada e de Alta Performance',
      color: '#047857',
      bgColor: '#ecfdf5',
      description: 'Valores e práticas estão profundamente enraizados no dia a dia da equipe, gerando previsibilidade, disciplina e alto engajamento coletivo.'
    };
  } else if (avgCulturalIndex >= 3.2) {
    maturity = {
      band: 'BUILDING',
      name: 'Cultura em Construção e Alinhamento',
      color: '#d97706',
      bgColor: '#fffbeb',
      description: 'Bases culturais presentes, porém com variações entre setores ou lacunas de consistência entre o discurso e a rotina prática.'
    };
  } else {
    maturity = {
      band: 'RISK',
      name: 'Cultura Vulnerável com Risco de Ruptura',
      color: '#dc2626',
      bgColor: '#fef2f2',
      description: 'Fragilidades acentuadas em alinhamento, liderança exemplar ou segurança psicológica, demandando plano de ação imediato.'
    };
  }

  return {
    count,
    company: companyFilter || 'Todas as empresas',
    avgCulturalIndex,
    avgTotalScore,
    dimensions: dimsResult,
    strengths,
    gaps,
    maturity
  };
}

export function createAssessmentRepository(database) {
  if (!database) {
    return {
      async findByIdempotencyKey(key) {
        return memoryStore.find((r) => r.idempotencyKey === key) || null;
      },
      async insert(record) {
        const existing = memoryStore.find((r) => r.idempotencyKey === record.idempotencyKey);
        if (existing) return existing;
        const saved = {
          id: memoryStore.length + 1,
          ...record,
          completedAt: new Date().toISOString()
        };
        memoryStore.unshift(saved);
        return saved;
      }
    };
  }

  const mapRow = (row) => row && ({
    id: row.id,
    idempotencyKey: row.idempotency_key,
    participant: {
      name: row.participant_name,
      company: row.company,
      phone: row.phone_e164,
      country: row.country
    },
    locale: row.locale,
    consentAt: row.consent_at.toISOString(),
    answers: row.answers,
    totalScore: row.total_score,
    culturalIndex: Number(row.cultural_index),
    maturity: row.maturity,
    dimensions: row.dimensions,
    whatsappUrl: row.whatsapp_url,
    completedAt: row.completed_at.toISOString()
  });

  return {
    async findByIdempotencyKey(key) {
      await ensureSchema(database);
      const { rows } = await database.query('SELECT * FROM cultural_assessments WHERE idempotency_key = $1 LIMIT 1', [key]);
      return mapRow(rows[0]);
    },
    async insert(record) {
      await ensureSchema(database);
      const { rows } = await database.query(
        `INSERT INTO cultural_assessments
          (idempotency_key, participant_name, company, phone_e164, country, locale, consent_at, answers, total_score, cultural_index, maturity, dimensions, whatsapp_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
         RETURNING *`,
        [
          record.idempotencyKey,
          record.participant.name,
          record.participant.company,
          record.participant.phone,
          record.participant.country,
          record.locale,
          record.consentAt,
          JSON.stringify(record.answers),
          record.totalScore,
          record.culturalIndex,
          JSON.stringify(record.maturity),
          JSON.stringify(record.dimensions),
          record.whatsappUrl
        ]
      );
      return mapRow(rows[0]);
    }
  };
}

const adminRow = (row) => ({
  id: row.id,
  completedAt: row.completed_at ? (row.completed_at.toISOString ? row.completed_at.toISOString() : row.completed_at) : new Date().toISOString(),
  name: row.participant_name || row.participant?.name,
  company: row.company || row.participant?.company,
  phone: row.phone_e164 || row.participant?.phone,
  country: row.country || row.participant?.country,
  locale: row.locale,
  totalScore: row.total_score ?? row.totalScore,
  culturalIndex: Number(row.cultural_index ?? row.culturalIndex),
  maturity: row.maturity,
  dimensions: row.dimensions,
  answers: row.answers,
  whatsappUrl: row.whatsapp_url || row.whatsappUrl
});

function whereClause(filters) {
  const values = [];
  const clauses = ['deleted_at IS NULL'];
  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(participant_name ILIKE $${values.length} OR company ILIKE $${values.length} OR phone_e164 ILIKE $${values.length})`);
  }
  if (filters.company) {
    values.push(`%${filters.company}%`);
    clauses.push(`company ILIKE $${values.length}`);
  }
  if (filters.country) {
    values.push(filters.country);
    clauses.push(`country = $${values.length}`);
  }
  if (filters.from) {
    values.push(filters.from);
    clauses.push(`completed_at >= $${values.length}::date`);
  }
  if (filters.to) {
    values.push(filters.to);
    clauses.push(`completed_at < ($${values.length}::date + interval '1 day')`);
  }
  return { sql: clauses.join(' AND '), values };
}

export function createAdminRepository(database) {
  if (!database) {
    return {
      async list(filters) {
        let items = memoryStore.filter((r) => !r.deletedAt);
        if (filters.search) {
          const s = filters.search.toLowerCase();
          items = items.filter((r) =>
            (r.participant?.name || r.name || '').toLowerCase().includes(s) ||
            (r.participant?.company || r.company || '').toLowerCase().includes(s) ||
            (r.participant?.phone || r.phone || '').includes(s)
          );
        }
        if (filters.company) {
          const c = filters.company.toLowerCase();
          items = items.filter((r) =>
            (r.participant?.company || r.company || '').toLowerCase().includes(c)
          );
        }
        if (filters.country) {
          items = items.filter((r) => (r.participant?.country || r.country) === filters.country);
        }
        const total = items.length;
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 20;
        const paginated = items.slice((page - 1) * pageSize, page * pageSize);
        return { items: paginated.map(adminRow), total };
      },
      async findById(id) {
        const item = memoryStore.find((r) => r.id === Number(id) && !r.deletedAt);
        return item ? adminRow(item) : null;
      },
      async softDelete(id) {
        const item = memoryStore.find((r) => r.id === Number(id));
        if (item) {
          item.deletedAt = new Date().toISOString();
          return true;
        }
        return false;
      },
      async exportRows(filters) {
        let items = memoryStore.filter((r) => !r.deletedAt);
        if (filters.company) {
          const c = filters.company.toLowerCase();
          items = items.filter((r) => (r.participant?.company || r.company || '').toLowerCase().includes(c));
        }
        if (filters.country) {
          items = items.filter((r) => (r.participant?.country || r.country) === filters.country);
        }
        return items.map(adminRow);
      },
      async getOverview(filters = {}) {
        let items = memoryStore.filter((r) => !r.deletedAt);
        if (filters.company) {
          const c = filters.company.toLowerCase();
          items = items.filter((r) => (r.participant?.company || r.company || '').toLowerCase().includes(c));
        }
        if (filters.country) {
          items = items.filter((r) => (r.participant?.country || r.country) === filters.country);
        }
        return calculateOverview(items, filters.company);
      },
      async listCompanies() {
        const set = new Set();
        memoryStore.forEach((r) => {
          if (!r.deletedAt) {
            const c = (r.participant?.company || r.company || '').trim();
            if (c) set.add(c);
          }
        });
        return Array.from(set).sort();
      }
    };
  }

  return {
    async list(filters) {
      await ensureSchema(database);
      const where = whereClause(filters);
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const offset = (page - 1) * pageSize;
      const [items, count] = await Promise.all([
        database.query(
          `SELECT * FROM cultural_assessments WHERE ${where.sql} ORDER BY completed_at DESC LIMIT $${where.values.length + 1} OFFSET $${where.values.length + 2}`,
          [...where.values, pageSize, offset]
        ),
        database.query(`SELECT count(*)::int AS total FROM cultural_assessments WHERE ${where.sql}`, where.values)
      ]);
      return { items: items.rows.map(adminRow), total: count.rows[0].total };
    },
    async findById(id) {
      await ensureSchema(database);
      const { rows } = await database.query('SELECT * FROM cultural_assessments WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id]);
      return rows[0] ? adminRow(rows[0]) : null;
    },
    async softDelete(id) {
      await ensureSchema(database);
      const { rowCount } = await database.query('UPDATE cultural_assessments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', [id]);
      return rowCount === 1;
    },
    async exportRows(filters) {
      await ensureSchema(database);
      const where = whereClause(filters);
      const { rows } = await database.query(`SELECT * FROM cultural_assessments WHERE ${where.sql} ORDER BY completed_at DESC LIMIT 10000`, where.values);
      return rows.map(adminRow);
    },
    async getOverview(filters = {}) {
      await ensureSchema(database);
      const where = whereClause(filters);
      const { rows } = await database.query(`SELECT * FROM cultural_assessments WHERE ${where.sql} ORDER BY completed_at DESC LIMIT 10000`, where.values);
      return calculateOverview(rows, filters.company);
    },
    async listCompanies() {
      await ensureSchema(database);
      const { rows } = await database.query(
        `SELECT DISTINCT company FROM cultural_assessments WHERE deleted_at IS NULL AND company IS NOT NULL AND company != '' ORDER BY company ASC`
      );
      return rows.map((r) => r.company);
    }
  };
}
