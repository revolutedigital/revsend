# E2E Tests with Playwright

## Overview

End-to-end tests for critical user journeys in RevSend using Playwright.

## Prerequisites

1. **Database** must be running (PostgreSQL on the configured port)
2. **Next.js dev server** will be started automatically by Playwright

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Run specific browser
npm run test:e2e -- --project=chromium

# View test report
npm run test:e2e:report
```

## Test Structure

### Global Setup (`global-setup.ts`)
- Creates or logs in with a test user (`e2e-test@example.com`)
- Saves authentication state to `.auth/user.json`
- Runs once before all tests

### Global Teardown (`global-teardown.ts`)
- Cleans up authentication storage
- Runs once after all tests

### Test Files

1. **`auth.spec.ts`** - Authentication flows (login, register)
   - Uses unauthenticated context (no storage state)

2. **`campaign-creation.spec.ts`** - Campaign creation wizard
   - Uses authenticated context (with storage state)

3. **`list-upload.spec.ts`** - Contact list upload and management
   - Uses authenticated context (with storage state)

## Test User

The tests use a dedicated test user:
- **Email**: `e2e-test@example.com`
- **Password**: `TestPassword123!`
- **Name**: `E2E Test User`

This user is created automatically via the registration flow on first run.

## Configuration

Playwright config is in `playwright.config.ts`:
- Tests run on multiple browsers: Chromium, Firefox, WebKit
- Mobile viewports: Mobile Chrome, Mobile Safari
- Videos and screenshots captured on failure
- Parallel execution enabled

## Troubleshooting

### Tests fail with "Can't reach database"
- Ensure PostgreSQL is running on the configured port
- Check `DATABASE_URL` in `.env`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check that the Next.js dev server is starting correctly

### Authentication fails
- Delete `.auth/user.json` and run tests again
- Check that registration is working in the app
