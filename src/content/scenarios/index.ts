import type { ScenariosByModule } from './types';
import { norskprove } from './norskprove';
import { jobbintervju } from './jobbintervju';
import { pensum } from './pensum';

export const scenariosByModule: ScenariosByModule = {
  norskprove,
  jobbintervju,
  pensum
};

export * from './types';
export { norskprove, jobbintervju, pensum };
