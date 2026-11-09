import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.js';

describe('readConfig', () => {
  it('reads config with defaults in development', () => {
    const config = readConfig({
      NODE_ENV: 'development'
    });
    expect(config.nodeEnv).toBe('development');
    expect(config.sessionSecret).toBeDefined();
    expect(config.adminPasswordHash).toBeDefined();
    expect(config.retentionDays).toBe(730);
  });
});
