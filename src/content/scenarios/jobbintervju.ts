import type { Scenario } from './types';

export const jobbintervju: Scenario[] = [
  {
    id: 'jobb-b2b-logistikk-ai',
    title: 'Intervju Case: Key Account Manager / Logistikk & AI-automasjon',
    level: 'B1–B2',
    badge: 'Stillingsannonse + CV Gap-analyse',
    avatar: '👔',
    partnerName: 'Anders Lindqvist (Kommersiell Direktør)',
    partnerRole: 'Norsk HR & Fagleder (Sjekker faglig match + kulturell «lagspiller»-fit)',
    description: 'Симулятор собеседования под вакансию с Finn.no и твоё CV (B2B Sales + Logistics + AI Automation). Включает дипломатический фильтр под скандинавскую культуру (flat struktur & lagspiller).',
    sourceText: `Finn.no Stilling: Forretningsutvikler / Key Account Manager innen Logistikk & Digitalisering.
Krav: Erfaring med verdikjeden (supply chain), B2B-relasjonssalg og automatisering av arbeidsflyt. I norsk bedriftskultur verdsettes lagspill, medvirkning, lavmælt profesjonalitet og evne til uformell lunsjprat høyere enn aggressiv selvskryt.`,
    targetWords: [
      { word: 'verdikjede', translation: 'цепочка поставок / создания стоимости', ua: 'ланцюжок постачання / створення вартості', en: 'value chain / supply chain', example: 'Jeg kjenner hele verdikjeden fra lager til sluttkunde.' },
      { word: 'å effektivisere', translation: 'оптимизировать / повышать эффективность', ua: 'оптимізувати / підвищувати ефективність', en: 'to streamline / optimize efficiency', example: 'Vi klarte å effektivisere ordreflyten ved hjelp av AI.' },
      { word: 'lagspiller', translation: 'командный игрок (ключевая ценность в Норвегии)', ua: 'командний гравець (ключова цінність у Норвегії)', en: 'team player (core Norwegian workplace value)', example: 'Jeg er resultatorientert, men først og fremst en god lagspiller.' },
      { word: 'medvirkning', translation: 'вовлечённость сотрудников (скандинавская модель)', ua: 'залученість працівників до прийняття рішень', en: 'employee participation / co-determination', example: 'God endringsledelse i Norge krever medvirkning fra hele teamet.' },
      { word: 'langsiktige relasjoner', translation: 'долгосрочные отношения с клиентами', ua: 'довгострокові відносини з клієнтами', en: 'long-term client relationships', example: 'I det norske B2B-markedet bygger vi langsiktige relasjoner basert på tillit.' },
      { word: 'tverrfaglig', translation: 'междисциплинарный / кросс-функциональный', ua: 'міждисциплінарний / крос-функціональний', en: 'interdisciplinary / cross-functional', example: 'Min tverrfaglige bakgrunn gjør det lett å samarbeide mellom IT og logistikk.' }
    ],
    openingLine: 'Hei og velkommen til intervju! Vi har analysert Finn.no-annonsen vår opp mot din CV. Kombinasjonen din av logistikk, B2B-salg og AI-automatisering skiller seg virkelig ut. Kan du fortelle hvordan du vil bruke denne tverrfaglige erfaringen hos oss — samtidig som du passer inn i vår flate, norske teamkultur?',
    openingTranslation: 'Привет и добро пожаловать на интервью! Мы сопоставили нашу вакансию на Finn.no с твоим резюме. Твой опыт на стыке логистики, B2B-продаж и AI выделяется. Расскажи, как ты применишь этот междисциплинарный опыт у нас, вписавшись в нашу плоскую норвежскую командную культуру?',
    openingUa: 'Привіт і ласкаво просимо на співбесіду! Ми зіставили нашу вакансію на Finn.no з твоїм резюме. Твій досвід на стику логістики, B2B-продажів та ШІ виділяється. Розкажи, як ти застосуєш цей міждисциплінарний досвід у нас, вписавшись у нашу плоску норвезьку командну культуру?',
    openingEn: 'Hello and welcome to the interview! We matched our Finn.no job posting against your CV. Your combination of logistics, B2B sales, and AI automation really stands out. Can you explain how you will apply this cross-functional experience here while fitting into our flat Norwegian team culture?',
    hints: [
      {
        label: 'Diplomatisk Norsk B2B-svar (Lagspiller)',
        norsk: 'Takk! Min tverrfaglige bakgrunn gjør at jeg forstår hele verdikjeden, men for meg handler suksess om å være en god lagspiller og skape resultater sammen med teamet.',
        ru: 'Спасибо! Мой междисциплинарный опыт позволяет понимать всю цепочку поставок, но для меня успех — это быть командным игроком и создавать результат вместе с командой.',
        ua: 'Дякую! Мій міждисциплінарний досвід дозволяє розуміти весь ланцюжок постачання, але для мене успіх — це бути командним гравцем і досягати результату разом із командою.',
        en: 'Thank you! My cross-functional background helps me understand the entire value chain, but for me success is about being a team player and achieving results together.'
      },
      {
        label: 'AI-effektivisering med medvirkning',
        norsk: 'Når vi skal effektivisere arbeidsprosesser med AI, legger jeg stor vekt på medvirkning fra kollegaene, slik at løsningene faktisk hjelper dem i hverdagen.',
        ru: 'Когда мы оптимизируем процессы с помощью ИИ, я делаю большой упор на вовлечение коллег (medvirkning), чтобы решения реально помогали им в работе.',
        ua: 'Коли ми оптимізуємо процеси за допомогою ШІ, я роблю великий акцент на залученні колег (medvirkning), щоб рішення реально допомагали їм у роботі.',
        en: 'When streamlining processes with AI, I emphasize employee involvement (medvirkning) so the solutions genuinely help colleagues in their daily work.'
      }
    ]
  },
  {
    id: 'jobb-lunsjprat-kultur',
    title: 'Uformell Lunsjprat & Kaffemaskin-simulator (Cultural Fit)',
    level: 'A2–B2',
    badge: 'Norsk Arbeidskultur (Lunsjprat)',
    avatar: '☕',
    partnerName: 'Marte (Kollega i lunsjpausen)',
    partnerRole: 'Sosial integrering på norsk arbeidsplass (Fredagslunsj & småprat)',
    description: 'Тренажёр неформального общения за обедом (matpakke / fredagslunsj). Оценка социальной интеграции и мягкого скандинавского юмора.',
    sourceText: `I skandinaviske selskaper med flat struktur skjer mye av tillitsbyggingen under lunsjpraten kl. 11:30. Temaer: helgeplaner, tur i marka, oppussing, værmelding og balanse mellom jobb og fritid.`,
    targetWords: [
      { word: 'å lade batteriene', translation: 'перезарядить батарейки (отдохнуть)', ua: 'перезарядити батарейки (відпочити)', en: 'to recharge ones batteries', example: 'I helgen skal jeg bare slappe av og lade batteriene.' },
      { word: 'travel uke', translation: 'загруженная рабочая неделя', ua: 'насичений робочий тиждень', en: 'busy week', example: 'Det har vært en skikkelig travel uke på avdelingen.' },
      { word: 'helgeplaner', translation: 'планы на выходные', ua: 'плани на вихідні', en: 'weekend plans', example: 'Har du noen hyggelige helgeplaner?' },
      { word: 'arbeidsmiljø', translation: 'атмосфера в коллективе', ua: 'атмосфера в колективі', en: 'workplace environment', example: 'Jeg trives veldig godt i dette arbeidsmiljøet.' },
      { word: 'å koble av', translation: 'отключиться от работы / развеяться', ua: 'переключитися з роботи / відпочити', en: 'to unwind / disconnect after work', example: 'En tur i skogen hjelper meg å koble av.' }
    ],
    openingLine: 'Endelig fredag og tid for lunsj! Det har vært en ganske travel uke, synes jeg. Hvordan synes du de første ukene her hos oss har vært, og har du noen hyggelige helgeplaner for å lade batteriene?',
    openingTranslation: 'Наконец-то пятница и время ланча! Неделя выдалась насыщенной. Как тебе первые недели у нас в компании, и есть ли приятные планы на выходные, чтобы перезарядить батарейки?',
    openingUa: 'Нарешті п’ятниця і час обіду! Тиждень видався насиченим. Як тобі перші тижні у нас в компанії, і чи є приємні плани на вихідні, щоб перезарядити батарейки?',
    openingEn: 'Finally Friday and lunchtime! It has been quite a busy week. How have your first weeks here with us been, and do you have nice weekend plans to recharge your batteries?',
    hints: [
      {
        label: 'Varmt svar om arbeidsmiljøet',
        norsk: 'Jeg trives utrolig godt! Alle i arbeidsmiljøet har vært så hjelpsomme, og i helgen skal jeg koble av med en tur i marka for å lade batteriene.',
        ru: 'Мне очень нравится! Все в коллективе так помогают, а на выходных я планирую отключиться от дел на прогулке в лесу, чтобы перезарядить батарейки.',
        ua: 'Мені дуже подобається! Усі в колективі так допомагають, а на вихідних я планую переключитися на прогулянці в лісі, щоб перезарядити батарейки.',
        en: 'I am enjoying it so much! Everyone in the team has been so helpful, and this weekend I will unwind with a walk in the woods to recharge.'
      }
    ]
  }
];
