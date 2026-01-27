import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility Tests - WCAG 2.2 AA Compliance
 * Uses axe-core for automated accessibility scanning
 */

test.describe('Accessibility - WCAG 2.2 AA', () => {
  test.describe('Public Pages', () => {
    test('Login page should have no accessibility violations', async ({ page }) => {
      await page.goto('/login')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('Register page should have no accessibility violations', async ({ page }) => {
      await page.goto('/register')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('Forgot password page should have no accessibility violations', async ({ page }) => {
      await page.goto('/forgot-password')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('Landing page should have no accessibility violations', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('Skip link should be visible on focus', async ({ page }) => {
      await page.goto('/login')

      // Press Tab to focus on skip link
      await page.keyboard.press('Tab')

      // Check if skip link is visible (it should have focus and be visible)
      const skipLink = page.locator('.skip-link:focus')
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeVisible()
      }
    })

    test('All interactive elements should be keyboard accessible', async ({ page }) => {
      await page.goto('/login')

      // Tab through all interactive elements
      const focusableElements = await page.locator(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).all()

      for (const element of focusableElements) {
        // Check that element can receive focus
        await element.focus()
        const isFocused = await element.evaluate((el) => document.activeElement === el)
        expect(isFocused).toBe(true)
      }
    })

    test('Focus should be visible on all focusable elements', async ({ page }) => {
      await page.goto('/login')

      // Tab through elements and check for focus visibility
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')

        // Get the currently focused element
        const focusedElement = page.locator(':focus')
        if (await focusedElement.count() > 0) {
          // Check that focus indicator is visible (either outline or ring)
          const hasVisibleFocus = await focusedElement.evaluate((el) => {
            const styles = window.getComputedStyle(el)
            const outline = styles.outline
            const boxShadow = styles.boxShadow
            // Check if there's a visible outline or box-shadow
            return (
              (outline && outline !== 'none' && !outline.includes('0px')) ||
              (boxShadow && boxShadow !== 'none')
            )
          })
          // Focus should be visible (outline or ring)
          expect(hasVisibleFocus).toBe(true)
        }
      }
    })
  })

  test.describe('Color Contrast', () => {
    test('Text should have sufficient color contrast', async ({ page }) => {
      await page.goto('/login')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('body')
        .analyze()

      // Filter only color contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast'
      )

      expect(contrastViolations).toEqual([])
    })
  })

  test.describe('Form Accessibility', () => {
    test('Form inputs should have associated labels', async ({ page }) => {
      await page.goto('/login')

      const inputs = await page.locator('input:not([type="hidden"])').all()

      for (const input of inputs) {
        const inputId = await input.getAttribute('id')
        if (inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`)
          const hasLabel = (await label.count()) > 0

          // Or check for aria-label or aria-labelledby
          const ariaLabel = await input.getAttribute('aria-label')
          const ariaLabelledby = await input.getAttribute('aria-labelledby')

          expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy()
        }
      }
    })

    test('Form errors should be announced to screen readers', async ({ page }) => {
      await page.goto('/login')

      // Submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"]')
      if (await submitButton.count() > 0) {
        await submitButton.click()

        // Wait for any error messages
        await page.waitForTimeout(500)

        // Check for aria-live regions or error messages with proper ARIA
        const errorMessages = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]')
        const errorCount = await errorMessages.count()

        // If there are errors, they should be properly announced
        if (errorCount > 0) {
          for (const error of await errorMessages.all()) {
            const isVisible = await error.isVisible()
            expect(isVisible).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Images and Icons', () => {
    test('Images should have alt text', async ({ page }) => {
      await page.goto('/login')

      const images = await page.locator('img').all()

      for (const img of images) {
        const alt = await img.getAttribute('alt')
        const role = await img.getAttribute('role')

        // Image should have alt text OR role="presentation" for decorative images
        expect(alt !== null || role === 'presentation' || role === 'none').toBe(true)
      }
    })

    test('Icon-only buttons should have accessible names', async ({ page }) => {
      await page.goto('/login')

      const iconButtons = await page.locator('button:has(svg):not(:has-text)').all()

      for (const button of iconButtons) {
        const ariaLabel = await button.getAttribute('aria-label')
        const title = await button.getAttribute('title')
        const innerText = await button.innerText()

        // Button should have accessible name
        const hasAccessibleName = ariaLabel || title || innerText.trim().length > 0
        expect(hasAccessibleName).toBe(true)
      }
    })
  })

  test.describe('Semantic Structure', () => {
    test('Page should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/login')

      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()

      let previousLevel = 0
      for (const heading of headings) {
        const tagName = await heading.evaluate((el) => el.tagName)
        const currentLevel = parseInt(tagName.replace('H', ''))

        // Heading level should not skip (e.g., h1 -> h3)
        // Allow going from h1 to h2 to h3, etc. or going back up
        if (previousLevel > 0) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
        }

        previousLevel = currentLevel
      }
    })

    test('Page should have main landmark', async ({ page }) => {
      await page.goto('/login')

      const main = page.locator('main, [role="main"]')
      await expect(main).toHaveCount(1)
    })

    test('Navigation should be properly labeled', async ({ page }) => {
      await page.goto('/login')

      const navs = await page.locator('nav, [role="navigation"]').all()

      for (const nav of navs) {
        const ariaLabel = await nav.getAttribute('aria-label')
        const ariaLabelledby = await nav.getAttribute('aria-labelledby')

        // If there are multiple navs, they should be labeled
        if (navs.length > 1) {
          expect(ariaLabel || ariaLabelledby).toBeTruthy()
        }
      }
    })
  })

  test.describe('Motion and Animation', () => {
    test('Animations should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/login')

      // Check that animations are disabled
      const animatedElements = await page.locator('[class*="animate"]').all()

      for (const element of animatedElements) {
        const animationDuration = await element.evaluate((el) => {
          return window.getComputedStyle(el).animationDuration
        })

        // Animation should be very short or none
        const durationMs = parseFloat(animationDuration) * 1000
        expect(durationMs).toBeLessThanOrEqual(10)
      }
    })
  })

  test.describe('ARIA Attributes', () => {
    test('ARIA attributes should be valid', async ({ page }) => {
      await page.goto('/login')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      // Filter ARIA-related violations
      const ariaViolations = accessibilityScanResults.violations.filter((v) =>
        v.id.startsWith('aria-')
      )

      expect(ariaViolations).toEqual([])
    })

    test('Interactive elements should have accessible names', async ({ page }) => {
      await page.goto('/login')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      // Filter button/link name violations
      const nameViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'button-name' || v.id === 'link-name'
      )

      expect(nameViolations).toEqual([])
    })
  })
})

/**
 * Helper function to generate accessibility report
 */
export async function generateAccessibilityReport(page: any) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return {
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
    summary: {
      total: results.violations.length + results.passes.length,
      passed: results.passes.length,
      failed: results.violations.length,
      score: Math.round((results.passes.length / (results.passes.length + results.violations.length)) * 100),
    },
  }
}
