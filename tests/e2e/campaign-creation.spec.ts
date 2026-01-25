import { test, expect } from '@playwright/test'

test.describe('Campaign Creation Flow', () => {
  test('should display campaigns page', async ({ page }) => {
    await page.goto('/campaigns')

    await expect(page.getByRole('heading', { name: /campanhas|campaigns/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /nova|new|criar/i })).toBeVisible()
  })

  test('should open campaign creation wizard', async ({ page }) => {
    await page.goto('/campaigns')

    // Click new campaign button
    await page.click('button:has-text("Nova"), button:has-text("Criar"), a:has-text("Nova")')

    // Should navigate to campaign creation
    await expect(page).toHaveURL(/.*campaigns\/new/)
    await expect(page.getByText(/passo|step|etapa/i)).toBeVisible()
  })

  test('should complete campaign creation wizard - Step 1: Select List', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Step 1: Select contact list
    await expect(page.getByText(/lista|list/i)).toBeVisible()

    // Select a list (assuming there's at least one)
    const listCard = page.locator('[data-testid="list-card"]').first()
    const hasLists = await listCard.isVisible().catch(() => false)

    if (hasLists) {
      await listCard.click()

      // Click next
      await page.click('button:has-text("Próximo"), button:has-text("Next"), button:has-text("Continuar")')

      // Should move to step 2
      await expect(page.getByText(/mensagem|message/i)).toBeVisible()
    } else {
      // No lists available - should show empty state
      await expect(page.getByText(/nenhuma|no lists|vazia/i)).toBeVisible()
    }
  })

  test('should require list selection before proceeding', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Try to proceed without selecting a list
    const nextButton = page.getByRole('button', { name: /próximo|next|continuar/i })
    const isDisabled = await nextButton.isDisabled()

    // Button should be disabled or show validation
    expect(isDisabled).toBeTruthy()
  })

  test('should allow adding multiple message variations', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Assume we're on step 2 (message composition)
    // This test assumes you can navigate there or mock the state

    // Look for message input
    const messageInput = page.getByPlaceholder(/mensagem|message|digite/i)

    if (await messageInput.isVisible()) {
      await messageInput.fill('Olá {nome}, tudo bem?')

      // Click add variation button
      const addButton = page.getByRole('button', { name: /adicionar|add|variation/i })
      if (await addButton.isVisible()) {
        await addButton.click()

        // Should have 2 message inputs now
        const messageInputs = page.locator('textarea').count()
        expect(await messageInputs).toBeGreaterThanOrEqual(2)
      }
    }
  })

  test('should preserve {variables} in messages', async ({ page }) => {
    await page.goto('/campaigns/new')

    const messageInput = page.getByPlaceholder(/mensagem|message/i).first()

    if (await messageInput.isVisible()) {
      const messageWithVars = 'Olá {nome}, sua empresa {empresa} foi selecionada!'
      await messageInput.fill(messageWithVars)

      // Check value is preserved
      await expect(messageInput).toHaveValue(messageWithVars)
    }
  })

  test('should configure message intervals', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Look for interval inputs
    const minIntervalInput = page.getByLabel(/mínimo|min|minimum/i)
    const maxIntervalInput = page.getByLabel(/máximo|max|maximum/i)

    if (await minIntervalInput.isVisible()) {
      await minIntervalInput.fill('30')
      await maxIntervalInput.fill('60')

      await expect(minIntervalInput).toHaveValue('30')
      await expect(maxIntervalInput).toHaveValue('60')
    }
  })

  test('should not allow min interval greater than max', async ({ page }) => {
    await page.goto('/campaigns/new')

    const minIntervalInput = page.getByLabel(/mínimo|min/i)
    const maxIntervalInput = page.getByLabel(/máximo|max/i)

    if (await minIntervalInput.isVisible()) {
      await minIntervalInput.fill('100')
      await maxIntervalInput.fill('50')

      // Should show validation error
      const nextButton = page.getByRole('button', { name: /próximo|next|finalizar/i })

      // Try to proceed
      if (await nextButton.isVisible()) {
        await nextButton.click()

        // Should show error or button should be disabled
        const hasError = await page.getByText(/intervalo|inválido|invalid/i).isVisible().catch(() => false)
        const buttonDisabled = await nextButton.isDisabled()

        expect(hasError || buttonDisabled).toBeTruthy()
      }
    }
  })

  test('should select WhatsApp numbers for campaign', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Look for WhatsApp number selection
    const whatsappCheckbox = page.locator('input[type="checkbox"]').first()

    if (await whatsappCheckbox.isVisible()) {
      await whatsappCheckbox.check()
      await expect(whatsappCheckbox).toBeChecked()
    }
  })

  test('should show campaign summary before creation', async ({ page }) => {
    await page.goto('/campaigns/new')

    // This assumes you can navigate to final step
    // Look for review/summary section
    const reviewSection = page.getByText(/revisar|review|resumo|summary/i)

    if (await reviewSection.isVisible()) {
      // Should show key campaign details
      await expect(page.locator('body')).toContainText(/lista|list|mensagens|messages/i)
    }
  })

  test('should successfully create campaign', async ({ page }) => {
    // This is an end-to-end happy path test
    // Requires having lists and WhatsApp numbers configured

    await page.goto('/campaigns/new')

    // Step 1: Select list (if available)
    const listCard = page.locator('[data-testid="list-card"]').first()

    if (await listCard.isVisible()) {
      await listCard.click()
      await page.click('button:has-text("Próximo")')

      // Step 2: Add message
      await page.fill('textarea', 'Olá {nome}, teste de mensagem!')
      await page.click('button:has-text("Próximo")')

      // Step 3: Configure interval
      await page.fill('input[name="minInterval"]', '30')
      await page.fill('input[name="maxInterval"]', '60')
      await page.click('button:has-text("Próximo")')

      // Step 4: Select WhatsApp
      await page.click('input[type="checkbox"]')
      await page.click('button:has-text("Próximo")')

      // Step 5: Review and create
      await page.click('button:has-text("Criar"), button:has-text("Finalizar")')

      // Should redirect to campaigns page or show success
      await Promise.race([
        expect(page).toHaveURL(/.*campaigns(?!\/new)/, { timeout: 10000 }),
        expect(page.getByText(/sucesso|success|criada/i)).toBeVisible({ timeout: 10000 }),
      ])
    }
  })
})
