import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic'
    }
  },
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
    env: {
      AUTH_ENABLED: 'false'
    }
  }
});

