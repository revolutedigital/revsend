import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E tests
 *
 * Critical user journeys tested:
 * 1. Authentication (login/register)
 * 2. Campaign creation flow
 * 3. List upload
 * 4. WhatsApp connection
 * 5. CRM pipeline interaction
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Global setup & teardown
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    // Unauthenticated tests (auth flow)
    {
      name: 'chromium:unauthenticated',
      testMatch: '**/auth.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated tests (requires login)
    {
      name: 'chromium',
      testIgnore: '**/auth.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },

    {
      name: 'firefox',
      testIgnore: '**/auth.spec.ts',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },

    {
      name: 'webkit',
      testIgnore: '**/auth.spec.ts',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      testIgnore: '**/auth.spec.ts',
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
    {
      name: 'Mobile Safari',
      testIgnore: '**/auth.spec.ts',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
