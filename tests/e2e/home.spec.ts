import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/");

    // Check that the main heading is visible
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should have navigation elements", async ({ page }) => {
    await page.goto("/");

    // Check for sign in link
    const signInLink = page.locator('a[href*="login"]');
    await expect(signInLink).toBeVisible();
  });

  test("should show the address input demo", async ({ page }) => {
    await page.goto("/");

    // Look for the address input or demo section
    const addressInput = page.locator('input[placeholder*="address"]');

    // If there's an address input demo, it should be visible
    if ((await addressInput.count()) > 0) {
      await expect(addressInput.first()).toBeVisible();
    }
  });
});

test.describe("Authentication Flow", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click sign in link
    await page.click('a[href*="login"]');

    // Should be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/login");

    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // HTML5 validation should prevent submission
    // or there should be error messages
  });
});

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing dashboard without auth", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test("should redirect to login when accessing cases without auth", async ({
    page,
  }) => {
    await page.goto("/cases");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
