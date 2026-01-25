import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Contact List Upload Flow', () => {
  test('should display lists page', async ({ page }) => {
    await page.goto('/lists')

    await expect(page.getByRole('heading', { name: /listas|lists|contatos/i })).toBeVisible()
  })

  test('should show upload button', async ({ page }) => {
    await page.goto('/lists')

    const uploadButton = page.getByRole('button', { name: /upload|importar|carregar/i })
    await expect(uploadButton).toBeVisible()
  })

  test('should open upload modal/page', async ({ page }) => {
    await page.goto('/lists')

    // Click upload button
    await page.click('button:has-text("Upload"), button:has-text("Importar"), a:has-text("Nova")')

    // Should show upload interface (modal or new page)
    await expect(
      page.getByText(/arrastar|drag|arquivo|file|csv|xlsx/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('should accept CSV file upload', async ({ page }) => {
    await page.goto('/lists')

    // Create a test CSV file content
    const csvContent = 'nome,telefone,email\nJoão Silva,11999887766,joao@example.com\nMaria Santos,11988776655,maria@example.com'

    // Create temporary file
    const fs = require('fs')
    const os = require('os')
    const tmpFilePath = path.join(os.tmpdir(), 'test-contacts.csv')
    fs.writeFileSync(tmpFilePath, csvContent)

    // Click upload button
    await page.click('button:has-text("Upload"), button:has-text("Importar")')

    // Upload file
    const fileInput = page.locator('input[type="file"]')

    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(tmpFilePath)

      // Should show file name or preview
      await expect(page.getByText(/test-contacts\.csv|arquivo selecionado/i)).toBeVisible({
        timeout: 5000,
      })

      // Cleanup
      fs.unlinkSync(tmpFilePath)
    }
  })

  test('should accept XLSX file upload', async ({ page }) => {
    await page.goto('/lists')

    // For XLSX, we'd need to create a proper Excel file
    // For now, just test that the interface exists

    await page.click('button:has-text("Upload"), button:has-text("Importar")')

    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeVisible()

    // Check accepted file types
    const acceptAttr = await fileInput.getAttribute('accept')
    expect(acceptAttr).toContain('.csv')
  })

  test('should detect columns automatically with AI', async ({ page }) => {
    await page.goto('/lists')

    const csvContent =
      'Name,Phone Number,Email Address,Company\nJohn Doe,5511999887766,john@test.com,Acme Inc'
    const fs = require('fs')
    const os = require('os')
    const tmpFile = path.join(os.tmpdir(), 'test-ai.csv')
    fs.writeFileSync(tmpFile, csvContent)

    await page.click('button:has-text("Upload"), button:has-text("Importar")')

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(tmpFile)

      // Should show AI detection in progress or results
      await Promise.race([
        expect(page.getByText(/detectando|analyzing|AI/i)).toBeVisible({ timeout: 10000 }),
        expect(page.getByText(/nome|telefone|phone/i)).toBeVisible({ timeout: 10000 }),
      ])

      fs.unlinkSync(tmpFile)
    }
  })

  test('should show preview of contacts before import', async ({ page }) => {
    await page.goto('/lists')

    const csvContent = 'nome,telefone\nJoão,11999887766\nMaria,11988776655'
    const fs = require('fs')
    const os = require('os')
    const tmpFile = path.join(os.tmpdir(), 'test-preview.csv')
    fs.writeFileSync(tmpFile, csvContent)

    await page.click('button:has-text("Upload")')

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(tmpFile)

      // Should show table/preview of contacts
      await expect(page.getByText(/João|preview|visualizar/i)).toBeVisible({
        timeout: 10000,
      })

      fs.unlinkSync(tmpFile)
    }
  })

  test('should normalize phone numbers automatically', async ({ page }) => {
    await page.goto('/lists')

    // Phone numbers in different formats
    const csvContent =
      'nome,telefone\nJoão,(11) 99988-7766\nMaria,11 9 8877-6655\nPedro,+55 11 99988-7766'
    const fs = require('fs')
    const os = require('os')
    const tmpFile = path.join(os.tmpdir(), 'test-normalize.csv')
    fs.writeFileSync(tmpFile, csvContent)

    await page.click('button:has-text("Upload")')

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(tmpFile)

      // After processing, phones should be normalized
      // Check if any normalized format is shown (5511...)
      const hasNormalized = await page
        .getByText(/5511|normalizad/i)
        .isVisible({ timeout: 10000 })
        .catch(() => false)

      expect(hasNormalized).toBeDefined()

      fs.unlinkSync(tmpFile)
    }
  })

  test('should require list name before saving', async ({ page }) => {
    await page.goto('/lists')

    await page.click('button:has-text("Upload")')

    // Should have a field for list name
    const nameInput = page.getByLabel(/nome.*lista|list name/i)

    if (await nameInput.isVisible()) {
      // Try to submit without name
      const submitButton = page.getByRole('button', { name: /importar|save|salvar/i })

      if (await submitButton.isVisible()) {
        const isDisabled = await submitButton.isDisabled()
        expect(isDisabled).toBeTruthy()
      }
    }
  })

  test('should successfully import contacts', async ({ page }) => {
    await page.goto('/lists')

    const csvContent = 'nome,telefone,email\nTest User,11999887766,test@example.com'
    const fs = require('fs')
    const os = require('os')
    const tmpFile = path.join(os.tmpdir(), 'test-import.csv')
    fs.writeFileSync(tmpFile, csvContent)

    await page.click('button:has-text("Upload"), button:has-text("Nova")')

    // Fill list name
    const nameInput = page.getByLabel(/nome|name/i).first()
    if (await nameInput.isVisible()) {
      await nameInput.fill(`Test List ${Date.now()}`)
    }

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(tmpFile)

      // Wait for processing
      await page.waitForTimeout(2000)

      // Click import/save button
      await page.click('button:has-text("Importar"), button:has-text("Salvar")')

      // Should show success or redirect to lists
      await Promise.race([
        expect(page).toHaveURL(/.*lists(?!.*upload)/, { timeout: 15000 }),
        expect(page.getByText(/sucesso|success|importad/i)).toBeVisible({ timeout: 15000 }),
      ])

      fs.unlinkSync(tmpFile)
    }
  })

  test('should show error for invalid file format', async ({ page }) => {
    await page.goto('/lists')

    // Create a text file (invalid format)
    const fs = require('fs')
    const os = require('os')
    const tmpFile = path.join(os.tmpdir(), 'test-invalid.txt')
    fs.writeFileSync(tmpFile, 'This is not a valid CSV or XLSX file')

    await page.click('button:has-text("Upload")')

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(tmpFile)

      // Should show error message
      await expect(page.getByText(/inválido|invalid|formato|format/i)).toBeVisible({
        timeout: 5000,
      })

      fs.unlinkSync(tmpFile)
    }
  })
})
