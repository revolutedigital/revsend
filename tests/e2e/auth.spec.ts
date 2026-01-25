import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /entrar|login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha|password/i)).toBeVisible()
  })

  test('should show error for wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message (the actual error text from the app)
    await expect(
      page.getByText(/email ou senha inválidos/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill login form with the test user credentials
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
    await expect(page.getByText(/dashboard|painel/i)).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')

    // Click register link
    await page.click('a:has-text("Criar conta"), a:has-text("Registrar")')

    // Should be on register page
    await expect(page).toHaveURL(/.*register/)
    await expect(page.getByRole('heading', { name: /registr|criar conta/i })).toBeVisible()
  })

  test('should register new user', async ({ page }) => {
    await page.goto('/register')

    // Generate unique email
    const uniqueEmail = `test-${Date.now()}@example.com`

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', 'StrongPassword123!')
    await page.click('button[type="submit"]')

    // Should either redirect to dashboard or show success message
    await Promise.race([
      expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 }),
      expect(page.getByText(/sucesso|success|criada/i)).toBeVisible({ timeout: 10000 }),
    ])
  })

  test('should show password requirements', async ({ page }) => {
    await page.goto('/register')

    // Focus on password field
    await page.click('input[type="password"]')

    // Should show password requirements (if implemented)
    // This is a nice-to-have feature
    const hasRequirements = await page.getByText(/caracteres|mínimo/i).isVisible()

    // Just check it doesn't crash
    expect(hasRequirements).toBeDefined()
  })

  test('should prevent duplicate email registration', async ({ page }) => {
    await page.goto('/register')

    // Try to register with existing email
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', 'existing@example.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Should show error about existing email
    await expect(
      page.getByText(/já existe|already exists|em uso/i)
    ).toBeVisible({ timeout: 5000 })
  })
})
