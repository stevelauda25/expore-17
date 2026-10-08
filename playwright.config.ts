import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, reporter: [['list']],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', testMatch: ['**/editor-smoke.spec.ts', '**/integration.spec.ts', '**/facility.spec.ts', '**/product-usage.spec.ts', '**/shell.spec.ts'], use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: ['**/editor-smoke.spec.ts', '**/integration.spec.ts', '**/facility.spec.ts', '**/product-usage.spec.ts', '**/shell.spec.ts'], use: { browserName: 'webkit' } },
  ],
  use: { baseURL: 'http://127.0.0.1:5190', deviceScaleFactor: 1, reducedMotion: 'reduce' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5190 --strictPort', url: 'http://127.0.0.1:5190', reuseExistingServer: !process.env.CI },
})
