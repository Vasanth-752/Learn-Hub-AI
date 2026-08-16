import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sevisxngifoqkinauiti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mXmU6v_0-FGXQbGjUEXZcQ_pJPKUIk6';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignup() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Generate a unique test email
  const testEmail = `test-${Date.now()}@test.com`;
  const testPassword = 'TestPass123!';

  console.log('Testing signup with:', testEmail);

  try {
    // Navigate to auth page
    await page.goto('http://localhost:5173/auth');
    await page.waitForLoadState('networkidle');

    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Click register tab/button (switch to register form)
    // The register form is switched via state, not tabs - look for "Sign up" link
    const signUpLink = page.locator('text=Sign up').first();
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForTimeout(500);
    }

    // Fill register form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[id="confirm-password"]', testPassword);

    // Submit
    await page.click('button:has-text("Create Account")');

    // Wait for response
    await page.waitForTimeout(5000);

    // Debug: get page content
    const pageContent = await page.content();
    console.log('--- Page content after submit ---');
    console.log(pageContent.substring(0, 5000));

    // Check for success message
    const successMsg = await page.locator('text=Registration successful').isVisible().catch(() => false);
    const errorMsg = await page.locator('.error-message').textContent().catch(() => null);

    console.log('Success message visible:', successMsg);
    console.log('Error message:', errorMsg);

    // Now query the profiles table directly to verify trigger fired
    console.log('\n--- Querying profiles table ---');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword })).data.user?.id || '');

    if (error) {
      console.log('Query error:', error.message);
    } else {
      console.log('Profiles found:', profiles);
    }

    // Also try to get the user from auth
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.log('Auth error:', authError.message);
    } else if (user) {
      console.log('Auth user:', { id: user.id, email: user.email, created_at: user.created_at });

      // Query profiles for this user
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (profileError) {
        console.log('Profile query error:', profileError.message);
      } else {
        console.log('Profile for user:', userProfile);
      }
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

testSignup();