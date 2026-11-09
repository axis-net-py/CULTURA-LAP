import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://disc_lap_owner:npg_qmrDgICje96z@ep-rapid-poetry-ac8u96oh-pooler.sa-east-1.aws.neon.tech/disc_lap?sslmode=require';

async function migrate() {
  console.log('Connecting to Neon PostgreSQL...');
  const client = new pg.Client({ connectionString });
  await client.connect();
  console.log('Connected! Creating schema for CULTURA-LAP...');

  await client.query(`
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

  console.log('Schema created successfully!');

  const check = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cultural_assessments'
    ORDER BY ordinal_position;
  `);

  console.log('Columns in cultural_assessments:');
  check.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

  await client.end();
  console.log('Migration finished.');
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
