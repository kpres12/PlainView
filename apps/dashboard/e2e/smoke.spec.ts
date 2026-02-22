import { test, expect } from '@playwright/test'

test.describe('Plainview Dashboard Smoke Tests', () => {
  test('loads the dashboard and shows navbar', async ({ page }) => {
    await page.goto('/')
    // Navbar should be visible with the PLAINVIEW title
    await expect(page.locator('text=PLAINVIEW')).toBeVisible()
    // Should show COMMAND CENTER as default nav item
    await expect(page.locator('text=COMMAND CENTER')).toBeVisible()
    // Online status indicator should be present
    await expect(page.locator('text=ONLINE')).toBeVisible()
  })

  test('navigates between views', async ({ page }) => {
    await page.goto('/')

    // Click MISSIONS nav item
    await page.locator('text=MISSIONS').click()
    // Should still show navbar
    await expect(page.locator('text=PLAINVIEW')).toBeVisible()

    // Click FLOWIQ nav item
    await page.locator('text=FLOWIQ').click()
    await expect(page.locator('text=PLAINVIEW')).toBeVisible()

    // Click ALERTS nav item
    await page.locator('text=ALERTS').click()
    await expect(page.locator('text=PLAINVIEW')).toBeVisible()

    // Navigate back to command center
    await page.locator('text=COMMAND CENTER').click()
    await expect(page.locator('text=FLEET STATUS')).toBeVisible()
  })

  test('command center shows asset list', async ({ page }) => {
    await page.goto('/')
    // Should show fleet status section
    await expect(page.locator('text=FLEET STATUS')).toBeVisible()
    // Should show at least one asset
    await expect(page.locator('text=Roustabout-01')).toBeVisible()
  })
})
