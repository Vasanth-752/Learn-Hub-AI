/**
 * In-process integration tests using supertest.
 * app.ts has no app.listen() side effects — safe to import directly.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import request from 'supertest';
import assert from 'assert';
import app from '../app';

function pass(label: string, detail?: string) {
  console.log(`  ✅ PASS  ${label}${detail ? `\n     ${detail}` : ''}`);
}

function fail(label: string, detail: string) {
  console.error(`  ❌ FAIL  ${label}: ${detail}`);
  process.exitCode = 1;
}

function skip(label: string, reason: string) {
  console.warn(`  ⏭  SKIP  ${label}\n           — ${reason}`);
}

async function runTests() {
  console.log('\n══════════════════════════════════════════');
  console.log(' LearnHub AI — Express In-Process Tests');
  console.log('══════════════════════════════════════════\n');

  // ── 1. GET /api/health → 200 ──────────────────────────────────────────────
  console.log('── GET /api/health ──────────────────────');
  try {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200, `expected 200, got ${res.status}`);
    assert.strictEqual(res.body.status, 'ok', `expected body.status="ok", got "${res.body.status}"`);
    assert.ok(typeof res.body.timestamp === 'string', 'expected body.timestamp to be a string');
    pass('GET /api/health → 200', `body: ${JSON.stringify(res.body)}`);
  } catch (err: any) {
    fail('GET /api/health', err.message);
  }

  // ── 2. GET /api/me — no token → 401 ──────────────────────────────────────
  console.log('\n── GET /api/me (no token) ───────────────');
  try {
    const res = await request(app).get('/api/me');
    assert.strictEqual(res.status, 401, `expected 401, got ${res.status}`);
    assert.ok(typeof res.body.error === 'string', 'expected body.error string');
    pass('GET /api/me (no Authorization header) → 401', `body: ${JSON.stringify(res.body)}`);
  } catch (err: any) {
    fail('GET /api/me (no token)', err.message);
  }

  // ── 3. GET /api/me — malformed token → 401 ───────────────────────────────
  console.log('\n── GET /api/me (malformed token) ────────');
  try {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer not.a.real.jwt');
    assert.strictEqual(res.status, 401, `expected 401, got ${res.status}`);
    pass('GET /api/me (malformed JWT) → 401', `body: ${JSON.stringify(res.body)}`);
  } catch (err: any) {
    fail('GET /api/me (malformed JWT)', err.message);
  }

  // ── 4. GET /api/test-error — global error handler shape ──────────────────
  console.log('\n── GET /api/test-error (error handler) ─');
  try {
    const res = await request(app).get('/api/test-error');
    assert.strictEqual(res.status, 422, `expected 422, got ${res.status}`);
    assert.strictEqual(res.body.error, 'Intentional test error', `wrong error message: "${res.body.error}"`);
    assert.strictEqual(res.body.code, 'TEST_ERROR', `expected code="TEST_ERROR", got "${res.body.code}"`);
    assert.deepStrictEqual(res.body.details, { intentional: true }, `wrong details: ${JSON.stringify(res.body.details)}`);
    pass(
      'GET /api/test-error → 422 with standardized error shape',
      `body: ${JSON.stringify(res.body)}`
    );
  } catch (err: any) {
    fail('GET /api/test-error (error handler)', err.message);
  }

  // ── 5. GET /api/me — valid token → 200 ───────────────────────────────────
  console.log('\n── GET /api/me (valid token → 200) ──────');
  const USER_A_JWT = process.env.TEST_USER_A_JWT;
  if (!USER_A_JWT) {
    skip('GET /api/me (valid JWT) → 200 + profile body', 'TEST_USER_A_JWT not set in .env');
  } else {
    try {
      const res = await request(app).get('/api/me').set('Authorization', `Bearer ${USER_A_JWT}`);
      assert.strictEqual(res.status, 200, `expected 200, got ${res.status} body: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.user?.id, 'expected body.user.id');
      assert.ok(res.body.user?.email, 'expected body.user.email');
      assert.ok(res.body.profile?.id, 'expected body.profile.id');
      assert.strictEqual(res.body.user.id, res.body.profile.id, 'user.id must equal profile.id');
      pass('GET /api/me (valid JWT) → 200', `user.id=${res.body.user.id} email=${res.body.user.email}`);
    } catch (err: any) {
      fail('GET /api/me (valid JWT)', err.message);
    }
  }

  // ── 6. Cross-user RLS isolation ───────────────────────────────────────────
  console.log('\n── Cross-user RLS isolation ─────────────');
  const USER_B_ID = process.env.TEST_USER_B_ID;
  if (!USER_A_JWT || !USER_B_ID) {
    skip('User A JWT cannot retrieve User B profile row', 'TEST_USER_A_JWT and/or TEST_USER_B_ID not set in .env');
  } else {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const userAClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${USER_A_JWT}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await userAClient.from('profiles').select('id').eq('id', USER_B_ID).single();
      if (error?.code === 'PGRST116' || !data) {
        pass('User A cannot read User B profile row (RLS → 0 rows)');
      } else {
        fail('Cross-user RLS isolation', `User A retrieved User B row — RLS NOT enforced! Row: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      fail('Cross-user RLS isolation', err.message);
    }
  }

  console.log('\n══════════════════════════════════════════\n');
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
