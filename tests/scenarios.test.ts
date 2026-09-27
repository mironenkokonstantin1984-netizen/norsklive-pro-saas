import { describe, test, expect } from 'vitest';
import { scenariosByModule } from '../src/content/scenarios';
import legacyScenarios from '../public/scenarios.js';

describe('Scenarios drift guard (Task 1)', () => {
  test('scenariosByModule in src/content/scenarios deep-equals public/scenarios.js', () => {
    expect(scenariosByModule).toEqual(legacyScenarios);
  });
});
