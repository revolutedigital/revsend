import { chromium, FullConfig } from '@playwright/test'

// Test user credentials
export const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
  name: 'E2E Test User',
}

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  const storageState = 'tests/e2e/.auth/user.json'

  console.log('🔧 Setting up E2E test environment...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Try to login with existing user
    console.log('📝 Attempting to login with test user...')
    await page.goto(`${baseURL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Check if login was successful
    try {
      await page.waitForURL(/.*dashboard/, { timeout: 5000 })
      console.log('✅ Logged in with existing test user')
    } catch {
      // Login failed, user doesn't exist. Register new user.
      console.log('👤 Test user not found, creating new user via registration...')

      await page.goto(`${baseURL}/register`)
      await page.fill('input[name="name"]', TEST_USER.name)
      await page.fill('input[type="email"]', TEST_USER.email)
      await page.fill('input[type="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')

      // Wait for successful registration (redirect to dashboard or success message)
      await page.waitForURL(/.*dashboard/, { timeout: 10000 })
      console.log('✅ Created and logged in as new test user')
    }

    // Save auth state
    await context.storageState({ path: storageState })
    console.log(`✅ Saved auth state to ${storageState}`)

    await browser.close()
    console.log('✅ E2E test environment ready!')
  } catch (error) {
    console.error('❌ Failed to set up E2E environment:', error)
    await browser.close()
    throw error
  }
}

export default globalSetup
