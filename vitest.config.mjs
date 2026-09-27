import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic'
    }
  },
  test: {
    env: {
      AUTH_ENABLED: 'false'
    }
  }
});
