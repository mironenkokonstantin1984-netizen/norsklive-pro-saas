import type { Scenario } from './types';

export const jobbintervju: Scenario[] = [
  {
    id: 'jobb-intervju-om-deg-selv',
    title: 'Intervju: fortell om deg selv og erfaring',
    level: 'A2–B1',
    badge: 'Jobbintervju · Om deg selv',
    avatar: 'briefcase',
    partnerName: 'Kari (intervjuer)',
    partnerRole: 'Leder som intervjuer deg',
    description:
      'Первый вопрос любого собеседования: коротко расскажите о себе, об опыте и о том, какую работу вы ищете. Подходит для любой профессии.',
    sourceText: `Et vanlig jobbintervju i Norge. Intervjueren vil bli kjent med kandidaten: bakgrunn, utdanning, arbeidserfaring, sterke sider og hva slags jobb kandidaten søker. Intervjueren vet ingenting om kandidaten på forhånd og spør med enkle, vennlige spørsmål.`,
    targetWords: [
      {
        word: 'erfaring',
        translation: 'опыт',
        ua: 'досвід',
        en: 'experience',
        example: 'Jeg har tre års erfaring fra butikk.'
      },
      {
        word: 'utdanning',
        translation: 'образование',
        ua: 'освіта',
        en: 'education',
        example: 'Jeg har utdanning som sykepleier fra hjemlandet mitt.'
      },
      {
        word: 'å jobbe som',
        translation: 'работать кем-то',
        ua: 'працювати ким-небудь',
        en: 'to work as',
        example: 'Før jobbet jeg som sjåfør.'
      },
      {
        word: 'sterke sider',
        translation: 'сильные стороны',
        ua: 'сильні сторони',
        en: 'strengths',
        example: 'En av mine sterke sider er at jeg er punktlig.'
      },
      {
        word: 'ansvar',
        translation: 'ответственность',
        ua: 'відповідальність',
        en: 'responsibility',
        example: 'I den jobben hadde jeg ansvar for lageret.'
      },
      {
        word: 'å lære',
        translation: 'учиться, учить',
        ua: 'вчитися',
        en: 'to learn',
        example: 'Jeg liker å lære nye ting på jobben.'
      }
    ],
    openingLine: 'Hei og velkommen! Kan du fortelle litt om deg selv og hva slags jobb du søker?',
    openingTranslation:
      'Здравствуйте и добро пожаловать! Можете немного рассказать о себе и о том, какую работу вы ищете?',
    openingUa:
      'Вітаю і ласкаво просимо! Можете трохи розповісти про себе і про те, яку роботу ви шукаєте?',
    openingEn:
      'Hello and welcome! Can you tell me a little about yourself and what kind of job you are looking for?',
    hints: [
      {
        label: 'Kort om deg selv',
        norsk:
          'Jeg heter … og kommer fra … Jeg har bodd i Norge i … år. Jeg har erfaring som … og nå søker jeg jobb som …',
        ru: 'Меня зовут … я из … Я живу в Норвегии … лет. У меня есть опыт работы …, и сейчас я ищу работу …',
        ua: 'Мене звати … я з … Я живу в Норвегії … років. Я маю досвід роботи …, і зараз шукаю роботу …',
        en: 'My name is … and I come from … I have lived in Norway for … years. I have experience as … and now I am looking for a job as …'
      },
      {
        label: 'Sterke sider',
        norsk:
          'En av mine sterke sider er at jeg er pålitelig. Jeg liker å lære nye ting og å jobbe sammen med andre.',
        ru: 'Одна из моих сильных сторон — я надёжный человек. Мне нравится учиться новому и работать вместе с другими.',
        ua: 'Одна з моїх сильних сторін — я надійна людина. Мені подобається вчитися новому і працювати разом з іншими.',
        en: 'One of my strengths is that I am reliable. I like learning new things and working with others.'
      }
    ]
  },
  {
    id: 'jobb-intervju-motivasjon',
    title: 'Intervju: hvorfor vil du jobbe hos oss?',
    level: 'A2–B1',
    badge: 'Jobbintervju · Motivasjon',
    avatar: 'briefcase',
    partnerName: 'Ole (intervjuer)',
    partnerRole: 'Leder som spør om motivasjonen din',
    description:
      'Вопрос о мотивации: почему вы хотите работать именно здесь и что можете дать команде. Подходит для любой профессии.',
    sourceText: `Et vanlig jobbintervju i Norge. Intervjueren spør hvorfor kandidaten vil ha jobben, hva kandidaten vet om arbeidsplassen, og hva kandidaten kan bidra med. Intervjueren vet ingenting om kandidaten på forhånd.`,
    targetWords: [
      {
        word: 'motivert',
        translation: 'мотивированный',
        ua: 'вмотивований',
        en: 'motivated',
        example: 'Jeg er veldig motivert for denne jobben.'
      },
      {
        word: 'å bidra',
        translation: 'вносить вклад',
        ua: 'робити внесок',
        en: 'to contribute',
        example: 'Jeg vil gjerne bidra til et godt arbeidsmiljø.'
      },
      {
        word: 'arbeidsplass',
        translation: 'место работы',
        ua: 'місце роботи',
        en: 'workplace',
        example: 'Dere har et godt rykte som arbeidsplass.'
      },
      {
        word: 'å samarbeide',
        translation: 'сотрудничать',
        ua: 'співпрацювати',
        en: 'to cooperate',
        example: 'Jeg liker å samarbeide med kollegaer.'
      },
      {
        word: 'å utvikle seg',
        translation: 'развиваться',
        ua: 'розвиватися',
        en: 'to develop oneself',
        example: 'Her kan jeg utvikle meg faglig.'
      },
      {
        word: 'fast stilling',
        translation: 'постоянная должность',
        ua: 'постійна посада',
        en: 'permanent position',
        example: 'Jeg ønsker meg en fast stilling.'
      }
    ],
    openingLine: 'Hei og velkommen! Hvorfor vil du jobbe hos oss?',
    openingTranslation: 'Здравствуйте и добро пожаловать! Почему вы хотите работать у нас?',
    openingUa: 'Вітаю і ласкаво просимо! Чому ви хочете працювати у нас?',
    openingEn: 'Hello and welcome! Why do you want to work with us?',
    hints: [
      {
        label: 'Motivasjon',
        norsk:
          'Jeg er motivert fordi jobben passer til erfaringen min. Jeg vil gjerne bidra og utvikle meg her.',
        ru: 'Я мотивирован, потому что работа подходит к моему опыту. Я хочу внести вклад и развиваться здесь.',
        ua: 'Я вмотивований, тому що робота відповідає моєму досвіду. Я хочу зробити внесок і розвиватися тут.',
        en: 'I am motivated because the job fits my experience. I would like to contribute and develop here.'
      },
      {
        label: 'Spør tilbake',
        norsk: 'Kan du fortelle litt mer om hvordan en vanlig arbeidsdag ser ut hos dere?',
        ru: 'Можете рассказать подробнее, как выглядит обычный рабочий день у вас?',
        ua: 'Можете розповісти детальніше, як виглядає звичайний робочий день у вас?',
        en: 'Could you tell me more about what a normal working day looks like here?'
      }
    ]
  },
  {
    id: 'jobb-lunsjprat-kultur',
    title: 'Uformell Lunsjprat & Kaffemaskin-simulator (Cultural Fit)',
    level: 'A2–B2',
    badge: 'Norsk Arbeidskultur (Lunsjprat)',
    avatar: 'coffee',
    partnerName: 'Marte (Kollega i lunsjpausen)',
    partnerRole: 'Sosial integrering på norsk arbeidsplass (Fredagslunsj & småprat)',
    description:
      'Тренажёр неформального общения за обедом (matpakke / fredagslunsj). Оценка социальной интеграции и мягкого скандинавского юмора.',
    sourceText: `I skandinaviske selskaper med flat struktur skjer mye av tillitsbyggingen under lunsjpraten kl. 11:30. Temaer: helgeplaner, tur i marka, oppussing, værmelding og balanse mellom jobb og fritid.`,
    targetWords: [
      {
        word: 'å lade batteriene',
        translation: 'перезарядить батарейки (отдохнуть)',
        ua: 'перезарядити батарейки (відпочити)',
        en: 'to recharge ones batteries',
        example: 'I helgen skal jeg bare slappe av og lade batteriene.'
      },
      {
        word: 'travel uke',
        translation: 'загруженная рабочая неделя',
        ua: 'насичений робочий тиждень',
        en: 'busy week',
        example: 'Det har vært en skikkelig travel uke på avdelingen.'
      },
      {
        word: 'helgeplaner',
        translation: 'планы на выходные',
        ua: 'плани на вихідні',
        en: 'weekend plans',
        example: 'Har du noen hyggelige helgeplaner?'
      },
      {
        word: 'arbeidsmiljø',
        translation: 'атмосфера в коллективе',
        ua: 'атмосфера в колективі',
        en: 'workplace environment',
        example: 'Jeg trives veldig godt i dette arbeidsmiljøet.'
      },
      {
        word: 'å koble av',
        translation: 'отключиться от работы / развеяться',
        ua: 'переключитися з роботи / відпочити',
        en: 'to unwind / disconnect after work',
        example: 'En tur i skogen hjelper meg å koble av.'
      }
    ],
    openingLine:
      'Endelig fredag og tid for lunsj! Det har vært en ganske travel uke, synes jeg. Hvordan synes du de første ukene her hos oss har vært, og har du noen hyggelige helgeplaner for å lade batteriene?',
    openingTranslation:
      'Наконец-то пятница и время ланча! Неделя выдалась насыщенной. Как тебе первые недели у нас в компании, и есть ли приятные планы на выходные, чтобы перезарядить батарейки?',
    openingUa:
      'Нарешті п’ятниця і час обіду! Тиждень видався насиченим. Як тобі перші тижні у нас в компанії, і чи є приємні плани на вихідні, щоб перезарядити батарейки?',
    openingEn:
      'Finally Friday and lunchtime! It has been quite a busy week. How have your first weeks here with us been, and do you have nice weekend plans to recharge your batteries?',
    hints: [
      {
        label: 'Varmt svar om arbeidsmiljøet',
        norsk:
          'Jeg trives utrolig godt! Alle i arbeidsmiljøet har vært så hjelpsomme, og i helgen skal jeg koble av med en tur i marka for å lade batteriene.',
        ru: 'Мне очень нравится! Все в коллективе так помогают, а на выходных я планирую отключиться от дел на прогулке в лесу, чтобы перезарядить батарейки.',
        ua: 'Мені дуже подобається! Усі в колективі так допомагають, а на вихідних я планую переключитися на прогулянці в лісі, щоб перезарядити батарейки.',
        en: 'I am enjoying it so much! Everyone in the team has been so helpful, and this weekend I will unwind with a walk in the woods to recharge.'
      }
    ]
  }
];
