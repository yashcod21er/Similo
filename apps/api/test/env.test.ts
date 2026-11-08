import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv } from '../src/config/env.js';

describe('parseEnv', () => {
  it('applies safe development defaults', () => {
    const env = parseEnv({});
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGINS: ['http://localhost:5173'],
      MONGODB_DB_NAME: 'similo',
      AI_SERVICE_URL: 'http://localhost:8000',
    });
    expect(env.MONGODB_URI).toBeUndefined();
  });

  it('splits and trims CORS_ORIGINS', () => {
    const env = parseEnv({ CORS_ORIGINS: 'https://a.example, https://b.example ,' });
    expect(env.CORS_ORIGINS).toEqual(['https://a.example', 'https://b.example']);
  });

  it('treats an empty MONGODB_URI as not set', () => {
    expect(parseEnv({ MONGODB_URI: '  ' }).MONGODB_URI).toBeUndefined();
  });

  it('accepts mongodb+srv connection strings', () => {
    const uri = 'mongodb+srv://user:pass@cluster0.example.mongodb.net';
    expect(parseEnv({ MONGODB_URI: uri }).MONGODB_URI).toBe(uri);
  });

  it('rejects a MONGODB_URI with the wrong scheme', () => {
    expect(() => parseEnv({ MONGODB_URI: 'http://localhost:27017' })).toThrow(EnvValidationError);
  });

  it('requires MONGODB_URI in production', () => {
    expect(() => parseEnv({ NODE_ENV: 'production' })).toThrow(/MONGODB_URI is required/);
  });

  it('rejects an invalid port', () => {
    expect(() => parseEnv({ PORT: '99999' })).toThrow(/PORT/);
  });

  it('never echoes secret values in error messages', () => {
    try {
      parseEnv({ MONGODB_URI: 'postgres://admin:SuperSecret@db' });
      expect.fail('parseEnv should have thrown');
    } catch (err) {
      expect((err as Error).message).not.toContain('SuperSecret');
    }
  });
});
