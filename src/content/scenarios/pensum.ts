import type { Scenario } from './types';

export const pensum: Scenario[] = [
  {
    id: 'cefr-b1-fastlege-helse',
    title: 'CEFR B1 Modul: Fastlege, egenmelding og helsesystemet',
    level: 'A2–B1',
    badge: 'Kopinor-Safe CEFR B1',
    avatar: 'doctor',
    partnerName: 'Dr. Lindholm (Fastlege på legesenteret)',
    partnerRole: 'Proprietært CEFR-scenarie: Konsultasjon hos fastlegen, sykmelding og NAV',
    description: 'Юридически чистый проприетарный модуль CEFR (без использования текстов сторонних издательств). Практика похода к семейному врачу (fastlege), больничного листа (egenmelding vs. sykmelding) и описания симптомов.',
    sourceText: `Proprietært CEFR B1-innhold (Åndsverkloven-kompatibelt): I Norge har alle innbyggere rett til en fastlege. Ved kortvarig sykdom kan arbeidstakere bruke egenmelding, mens lengre fravær krever gradert eller full sykmelding fra lege.`,
    targetWords: [
      { word: 'fastlege', translation: 'семейный / участковый врач', ua: 'сімейний лікар (фастлеге)', en: 'general practitioner (GP)', example: 'Jeg har bestilt time hos fastlegen min.' },
      { word: 'egenmelding', translation: 'самостоятельный больничный (1–3 дня)', ua: 'лікарняний без довідки лікаря (до 3 днів)', en: 'self-certified sick leave', example: 'Jeg har allerede brukt tre dager med egenmelding.' },
      { word: 'gradert sykmelding', translation: 'частичный больничный (например, 50%)', ua: 'частковий лікарняний (наприклад, 50%)', en: 'graded/partial sick leave', example: 'Kanskje en gradert sykmelding på 50 prosent passer best?' },
      { word: 'bivirkning', translation: 'побочный эффект', ua: 'побічний ефект', en: 'side effect', example: 'Har denne medisinen noen bivirkninger?' },
      { word: 'henvisning', translation: 'направление к узкому специалисту', ua: 'направлення до вузького спеціаліста', en: 'medical referral to a specialist', example: 'Jeg trenger en henvisning til fysioterapeut.' },
      { word: 'tilrettelegging', translation: 'адаптация условий труда на работе', ua: 'адаптація умов праці на роботі', en: 'workplace accommodation', example: 'Arbeidsgiver tilbyr god tilrettelegging med hjemmekontor.' }
    ],
    openingLine: 'God dag, kom inn og sitt ned! Jeg ser i journalen at du har hatt smerter i ryggen og utmattelse den siste uka, og at du allerede har brukt egenmelding. Kan du beskrive hvordan formen er nå, og om vi bør vurdere tilrettelegging eller gradert sykmelding?',
    openingTranslation: 'Добрый день, проходите и присаживайтесь! Вижу в карте, что у вас боли в спине и усталость последнюю неделю, и вы уже использовали egenmelding. Опишите ваше самочувствие сейчас — стоит ли нам рассмотреть адаптацию на работе или частичный больничный?',
    openingUa: 'Добрий день, проходьте та сідайте! Бачу в картці, що у вас біль у спині та втома останній тиждень, і ви вже використали egenmelding. Опишіть ваше самопочуття зараз — чи варто нам розглянути адаптацію на роботі або частковий лікарняний?',
    openingEn: 'Good day, come in and have a seat! I see in your chart that you have had back pain and fatigue this past week and already used self-certified sick leave. Can you describe how you feel now, and whether we should consider workplace accommodation or partial sick leave?',
    hints: [
      {
        label: 'Foreslå gradert sykmelding + tilrettelegging',
        norsk: 'Ettersom jeg allerede har brukt egenmelding, tror jeg en gradert sykmelding med tilrettelegging på arbeidsplassen vil fungere best.',
        ru: 'Поскольку я уже использовал egenmelding, думаю, частичный больничный с адаптацией условий на рабочем месте подойдёт лучше всего.',
        ua: 'Оскільки я вже використав egenmelding, думаю, частковий лікарняний з адаптацією умов на робочому місці підійде найкраще.',
        en: 'Since I have already used self-certified sick leave, I think partial sick leave with workplace accommodation will work best.'
      },
      {
        label: 'Be om henvisning til spesialist',
        norsk: 'I tillegg lurer jeg på om jeg kan få en henvisning til fysioterapeut, og om tablettene har noen bivirkninger?',
        ru: 'Кроме того, я хотел спросить, могу ли я получить направление к физиотерапевту и есть ли у таблеток побочные эффекты?',
        ua: 'Крім того, я хотів запитати, чи можу я отримати направлення до фізіотерапевта і чи мають таблетки побічні ефекти?',
        en: 'Additionally, I was wondering if I could get a referral to a physiotherapist, and whether the medication has any side effects?'
      }
    ]
  },
  {
    id: 'cefr-b1-bolig-kontrakt',
    title: 'CEFR B1 Modul: Leiekontrakt, depositumskonto og husleieloven',
    level: 'A2–B1',
    badge: 'Kopinor-Safe CEFR B1',
    avatar: 'home',
    partnerName: 'Sander (Utleier på visning)',
    partnerRole: 'Proprietært CEFR-scenarie: Visning på leilighet, depositumskonto og oppsigelsestid',
    description: 'Юридически чистый ролевой сценарий по поиску жилья в Норвегии: обсуждение договора аренды (husleiekontrakt), специального депозитного счёта (depositumskonto), коммунальных услуг и срока уведомления о выезде.',
    sourceText: `Proprietært CEFR-innhold: Etter husleieloven skal depositum alltid stå på en sperret depositumskonto i leietakerens navn, aldri overføres direkte til utleiers private konto.`,
    targetWords: [
      { word: 'depositumskonto', translation: 'блокированный депозитный счёт в банке', ua: 'спеціальний депозитний рахунок у банку', en: 'escrow deposit account', example: 'Depositumet må settes inn på en egen depositumskonto.' },
      { word: 'oppsigelsestid', translation: 'срок уведомления о расторжении договора', ua: 'термін попередження про розірвання договору', en: 'notice period', example: 'Vi avtaler tre måneders gjensidig oppsigelsestid.' },
      { word: 'inkludert i husleien', translation: 'включено в арендную плату', ua: 'включено в орендну плату', en: 'included in the rent', example: 'Er strøm og internett inkludert i husleien?' },
      { word: 'vedlikehold', translation: 'техническое обслуживание / мелкий ремонт', ua: 'технічне обслуговування / дрібний ремонт', en: 'maintenance', example: 'Hvem har ansvaret for vanlig vedlikehold i leiligheten?' },
      { word: 'innflytting', translation: 'заселение / въезд', ua: 'заселення / в’їзд', en: 'moving in', example: 'Leiligheten er klar for innflytting fra første oktober.' }
    ],
    openingLine: 'Velkommen på visning! Hyggelig at du kunne komme. Leiligheten er ledig for innflytting fra første neste måned. Har du noen spørsmål om leiekontrakten, oppsigelsestid eller hva som er inkludert i husleien?',
    openingTranslation: 'Добро пожаловать на просмотр квартиры! Приятно, что вы смогли прийти. Квартира свободна для заселения с 1 числа следующего месяца. Есть ли у вас вопросы по договору аренды, сроку уведомления или тому, что включено в квартплату?',
    openingUa: 'Ласкаво просимо на перегляд квартири! Приємно, що ви змогли прийти. Квартира вільна для заселення з 1 числа наступного місяця. Чи є у вас запитання щодо договору оренди, терміну попередження або того, що включено в квартплату?',
    openingEn: 'Welcome to the apartment viewing! Glad you could make it. The apartment is available for move-in on the first of next month. Do you have any questions about the lease, notice period, or what is included in the rent?',
    hints: [
      {
        label: 'Spør om depositumskonto & strøm',
        norsk: 'Leiligheten ser veldig lys og fin ut! Jeg lurer på om strøm og oppvarming er inkludert i husleien, og om du oppretter en ordinær depositumskonto i banken?',
        ru: 'Квартира выглядит очень светлой и красивой! Подскажите, включены ли электричество и отопление в квартплату, и открываете ли вы официальный depositumskonto в банке?',
        ua: 'Квартира виглядає дуже світлою та гарною! Підкажіть, чи включені електрика та опалення в квартплату, і чи відкриваєте ви офіційний depositumskonto в банку?',
        en: 'The apartment looks very bright and nice! I am wondering if electricity and heating are included in the rent, and whether you set up a standard deposit account in the bank?'
      }
    ]
  }
];
