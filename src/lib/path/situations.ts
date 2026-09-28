export interface PathSituation {
  id: string;
  titleNorsk: string;
  descriptionRu: string;
}

export const PATH_SITUATIONS: readonly PathSituation[] = [
  {
    id: 'jobbintervju',
    titleNorsk: 'Jobbintervju: fortell om erfaring og motivasjon',
    descriptionRu: 'Расскажите работодателю о своём опыте, сильных сторонах и мотивации к работе.'
  },
  {
    id: 'hos-legen',
    titleNorsk: 'Hos legen: beskriv symptomer og varighet',
    descriptionRu: 'Опишите симптомы, как давно началось недомогание, и уточните план лечения у врача.'
  },
  {
    id: 'nav-samtale',
    titleNorsk: 'NAV-samtale: plan for arbeid eller språktiltak',
    descriptionRu: 'Обсудите с консультантом NAV план поиска работы, стажировки или языковой практики.'
  },
  {
    id: 'foreldremote',
    titleNorsk: 'Foreldremøte på skolen: trivsel og samarbeid',
    descriptionRu: 'Поговорите с учителем о распорядке дня ребёнка, школьных мероприятиях и домашнем чтении.'
  },
  {
    id: 'leie-leilighet',
    titleNorsk: 'Leie leilighet: spørsmål om kontrakt og strøm',
    descriptionRu: 'Уточните у арендодателя условия договора, депозит, оплату электричества и правила дома.'
  },
  {
    id: 'nabokrangel',
    titleNorsk: 'Nabokrangel: løs uenighet om støy og fellesareal',
    descriptionRu: 'Спокойно договоритесь с соседом о тишине вечером и порядке в общих помещениях.'
  }
];

export function nextSituation(doneIds: string[] = []): PathSituation {
  const doneSet = new Set(doneIds);
  const found = PATH_SITUATIONS.find((item) => !doneSet.has(item.id));
  return found ?? PATH_SITUATIONS[0];
}
