import type { ExamScenario } from './types';

export const a2Scenarios: ExamScenario[] = [
  // 1. ARBEID
  {
    id: 'np-a2-presentation-arbeid',
    title: 'Presentasjon: Arbeid og yrke',
    level: 'A2',
    part: 'presentation',
    topic: 'arbeid',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell kort om deg selv og arbeidssituasjonen din.',
    sourceText: 'Fortell om jobben din eller en jobb du ønsker å ha i Norge. Hva gjør du i hverdagen?',
    targetWords: [
      { word: 'kollega', translation: 'коллега', ua: 'колега', en: 'colleague' },
      { word: 'sjef', translation: 'начальник', ua: 'керівник', en: 'boss' },
      { word: 'pause', translation: 'перерыв', ua: 'перерва', en: 'break' },
      { word: 'kontor', translation: 'офис', ua: 'офіс', en: 'office' },
      { word: 'oppgave', translation: 'задача, обязанность', ua: 'завдання, обов’язок', en: 'task' },
      { word: 'arbeidstid', translation: 'рабочее время', ua: 'робочий час', en: 'working hours' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om jobben din eller en jobb du ønsker å ha?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о вашей работе или работе, которую хотите получить?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про вашу роботу або роботу, яку хочете отримати?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about your job or a job you would like to have?',
    hints: [
      {
        label: 'Start (A2)',
        norsk: 'Jeg jobber som...',
        ru: 'Я работаю...',
        ua: 'Я працюю...',
        en: 'I work as...'
      },
      {
        label: 'Trivsel',
        norsk: 'Jeg trives godt med mine kolleger.',
        ru: 'Мне хорошо работается с коллегами.',
        ua: 'Мені добре працюється з колегами.',
        en: 'I enjoy working with my colleagues.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-arbeid',
    title: 'Bildebeskrivelse: På kontoret',
    level: 'A2',
    part: 'picture',
    topic: 'arbeid',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv bildet av kontoret og tingene du ser i rommet.',
    sourceText: 'Beskriv arbeidsplassen på bildet: skrivebordet, stolen, datamaskinen og planten.',
    targetWords: [
      { word: 'skrivebord', translation: 'письменный стол', ua: 'письмовий стіл', en: 'desk' },
      { word: 'skjerm', translation: 'монитор, экран', ua: 'монітор, екран', en: 'screen' },
      { word: 'kontorstol', translation: 'офисное кресло', ua: 'офісне крісло', en: 'office chair' },
      { word: 'plante', translation: 'растение', ua: 'рослина', en: 'plant' },
      { word: 'kaffekopp', translation: 'кофейная чашка', ua: 'чашка кави', en: 'coffee cup' },
      { word: 'veggklokke', translation: 'настенные часы', ua: 'настінний годинник', en: 'wall clock' }
    ],
    openingLine: 'Se på bildet av kontoret. Kan du beskrive hva du ser i rommet og hvor tingene står?',
    openingTranslation: 'Посмотрите на изображение офиса. Опишите, что вы видите в комнате и где стоят вещи?',
    openingUa: 'Подивіться на зображення офісу. Опишіть, що ви бачите в кімнаті та де стоять речі?',
    openingEn: 'Look at the picture of the office. Can you describe what you see in the room and where things are located?',
    hints: [
      {
        label: 'Plassering (A2)',
        norsk: 'På skrivebordet står det en dataskjerm og en kaffekopp.',
        ru: 'На столе стоит монитор и чашка кофе.',
        ua: 'На столі стоїть монітор і чашка кави.',
        en: 'On the desk there is a computer monitor and a coffee cup.'
      }
    ],
    image: {
      src: '/scenarios/images/workplace.svg',
      alt_nb: 'Et kontor med skrivebord, datamaskin, kontorstol, vindu og en grønn plante.',
      alt_l1: {
        ru: 'Офис с рабочим столом, компьютером, офисным креслом, окном и растением.',
        uk: 'Офіс із робочим столом, комп’ютером, офісним кріслом, вікном і рослиною.',
        en: 'An office with a desk, computer, office chair, window, and a plant.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-arbeid',
    title: 'Samtale: En vanlig arbeidsdag',
    level: 'A2',
    part: 'conversation',
    topic: 'arbeid',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om arbeidstider, oppgaver og pauser.',
    sourceText: 'Snakk sammen om hvordan en typisk arbeidsdag ser ut for dere.',
    targetWords: [
      { word: 'vakt', translation: 'смена', ua: 'зміна', en: 'shift' },
      { word: 'lunsj', translation: 'обед', ua: 'обід', en: 'lunch' },
      { word: 'starte', translation: 'начинать', ua: 'починати', en: 'to start' },
      { word: 'travel', translation: 'занятой, напряженный', ua: 'зайнятий', en: 'busy' },
      { word: 'hjelpe', translation: 'помогать', ua: 'допомагати', en: 'to help' },
      { word: 'slutte', translation: 'заканчивать', ua: 'закінчувати', en: 'to finish' }
    ],
    openingLine: 'Hei! Jeg jobber i butikk og starter ofte tidlig. Når begynner arbeidsdagen din, og hva gjør du først?',
    openingTranslation: 'Привет! Я работаю в магазине и часто начинаю рано. Когда начинается твой рабочий день и что ты делаешь сначала?',
    openingUa: 'Привіт! Я працюю в магазині й часто починаю рано. Коли починається твій робочий день і що ти робиш спочатку?',
    openingEn: 'Hi! I work in a shop and often start early. When does your workday start, and what do you do first?',
    hints: [
      {
        label: 'Svar (A2)',
        norsk: 'Jeg begynner på jobb klokka åtte, og jeg starter med en kopp kaffe.',
        ru: 'Я начинаю работу в восемь и начинаю с чашки кофе.',
        ua: 'Я починаю роботу о восьмій і починаю з чашки кави.',
        en: 'I start work at eight o’clock, and I begin with a cup of coffee.'
      }
    ],
    status: 'draft'
  },

  // 2. BOLIG
  {
    id: 'np-a2-presentation-bolig',
    title: 'Presentasjon: Boligen min',
    level: 'A2',
    part: 'presentation',
    topic: 'bolig',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om hvordan du bor, rommene og nabolaget ditt.',
    sourceText: 'Fortell om leiligheten eller huset ditt, hvor du bor og hva du liker med boligen.',
    targetWords: [
      { word: 'leilighet', translation: 'квартира', ua: 'квартира', en: 'apartment' },
      { word: 'soverom', translation: 'спальня', ua: 'спальня', en: 'bedroom' },
      { word: 'stue', translation: 'гостиная', ua: 'вітальня', en: 'living room' },
      { word: 'kjøkken', translation: 'кухня', ua: 'кухня', en: 'kitchen' },
      { word: 'nabo', translation: 'сосед', ua: 'сусід', en: 'neighbour' },
      { word: 'leie', translation: 'арендовать, снимать', ua: 'орендувати', en: 'to rent' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om hvordan du bor i dag?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о том, как вы живете сегодня?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про те, як ви живете сьогодні?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about how you live today?',
    hints: [
      {
        label: 'Beskriv boligen',
        norsk: 'Jeg leier en leilighet med to soverom og en fin stue.',
        ru: 'Я снимаю квартиру с двумя спальнями и хорошей гостиной.',
        ua: 'Я орендую квартиру з двома спальнями та гарною вітальнею.',
        en: 'I rent an apartment with two bedrooms and a nice living room.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-bolig',
    title: 'Bildebeskrivelse: I stua',
    level: 'A2',
    part: 'picture',
    topic: 'bolig',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv bildet av stua og møblene du ser der.',
    sourceText: 'Beskriv stua på bildet: sofaen, bordet, lampen, hylla og teppet.',
    targetWords: [
      { word: 'sofa', translation: 'диван', ua: 'диван', en: 'sofa' },
      { word: 'salongbord', translation: 'журнальный столик', ua: 'журнальний столик', en: 'coffee table' },
      { word: 'gulvlampe', translation: 'торшер', ua: 'торшер', en: 'floor lamp' },
      { word: 'bokhylle', translation: 'книжная полка', ua: 'книжкова полиця', en: 'bookshelf' },
      { word: 'teppe', translation: 'ковер', ua: 'килим', en: 'rug' },
      { word: 'bilde', translation: 'картина', ua: 'картина', en: 'picture' }
    ],
    openingLine: 'Se på bildet av stua. Kan du beskrive møblene og fortelle hva du ser i rommet?',
    openingTranslation: 'Посмотрите на изображение гостиной. Опишите мебель и расскажите, что вы видите в комнате?',
    openingUa: 'Подивіться на зображення вітальні. Опишіть меблі та розкажіть, що ви бачите в кімнаті?',
    openingEn: 'Look at the picture of the living room. Can you describe the furniture and what you see in the room?',
    hints: [
      {
        label: 'Detaljer',
        norsk: 'Foran sofaen ligger det et teppe, og på veggen henger et bilde.',
        ru: 'Перед диваном лежит ковер, а на стене висит картина.',
        ua: 'Перед диваном лежить килим, а на стіні висить картина.',
        en: 'In front of the sofa is a rug, and on the wall hangs a picture.'
      }
    ],
    image: {
      src: '/scenarios/images/flat.svg',
      alt_nb: 'En stue med sofa, salongbord, gulvlampe, bokhylle, teppe og bilde på veggen.',
      alt_l1: {
        ru: 'Гостиная с диваном, журнальным столиком, торшером, книжной полкой, ковром и картиной.',
        uk: 'Вітальня з диваном, журнальним столиком, торшером, книжковою полицею, килимом і картиною.',
        en: 'A living room with a sofa, coffee table, floor lamp, bookshelf, rug, and picture.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-bolig',
    title: 'Samtale: Finne et sted å bo',
    level: 'A2',
    part: 'conversation',
    topic: 'bolig',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om hvor det er best å bo.',
    sourceText: 'Diskuter fordeler med å bo i sentrum eller utenfor byen.',
    targetWords: [
      { word: 'husleie', translation: 'арендная плата', ua: 'орендна плата', en: 'rent' },
      { word: 'sentrum', translation: 'центр города', ua: 'центр міста', en: 'city centre' },
      { word: 'balkong', translation: 'балкон', ua: 'балкон', en: 'balcony' },
      { word: 'flytte', translation: 'переезжать', ua: 'переїжджати', en: 'to move' },
      { word: 'lys', translation: 'светлый', ua: 'світлий', en: 'bright' },
      { word: 'rolig', translation: 'спокойный', ua: 'спокійний', en: 'quiet' }
    ],
    openingLine: 'Hei! Jeg leter etter en ny leilighet nå. Liker du best å bo midt i sentrum eller litt utenfor byen?',
    openingTranslation: 'Привет! Я сейчас ищу новую квартиру. Тебе больше нравится жить в центре или немного за городом?',
    openingUa: 'Привіт! Я зараз шукаю нову квартиру. Тобі більше подобається жити в центрі чи трохи за містом?',
    openingEn: 'Hi! I am looking for a new apartment now. Do you prefer living right in the city centre or outside town?',
    hints: [
      {
        label: 'Mening',
        norsk: 'Jeg foretrekker å bo utenfor byen fordi det er mer rolig der.',
        ru: 'Я предпочитаю жить за городом, потому что там спокойнее.',
        ua: 'Я волію жити за містом, тому що там спокійніше.',
        en: 'I prefer living outside town because it is quieter there.'
      }
    ],
    status: 'draft'
  },

  // 3. HELSE
  {
    id: 'np-a2-presentation-helse',
    title: 'Presentasjon: Helse og gode vaner',
    level: 'A2',
    part: 'presentation',
    topic: 'helse',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om hva du gjør for å ta vare på helsen i hverdagen.',
    sourceText: 'Fortell om mat, søvn, trening og hva du gjør for å holde deg frisk.',
    targetWords: [
      { word: 'frisk', translation: 'здоровый', ua: 'здоровий', en: 'healthy' },
      { word: 'syk', translation: 'больной', ua: 'хворий', en: 'sick' },
      { word: 'medisin', translation: 'лекарство', ua: 'ліки', en: 'medicine' },
      { word: 'lege', translation: 'врач', ua: 'лікар', en: 'doctor' },
      { word: 'trene', translation: 'тренироваться', ua: 'тренуватися', en: 'to exercise' },
      { word: 'sove', translation: 'спать', ua: 'спати', en: 'to sleep' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om hva du gjør for å holde deg frisk?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о том, что вы делаете, чтобы оставаться здоровым?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про те, що ви робите, щоб залишатися здоровим?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about what you do to stay healthy?',
    hints: [
      {
        label: 'Gode vaner',
        norsk: 'Jeg prøver å spise sunn mat og trene to ganger i uka.',
        ru: 'Я стараюсь есть здоровую пищу и тренироваться дважды в неделю.',
        ua: 'Я намагаюся їсти здорову їжу і тренуватися двічі на тиждень.',
        en: 'I try to eat healthy food and exercise twice a week.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-helse',
    title: 'Bildebeskrivelse: Hos legen',
    level: 'A2',
    part: 'picture',
    topic: 'helse',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv legekontoret og utstyret på bildet.',
    sourceText: 'Beskriv legekontoret: undersøkelsesbenken, skrivebordet, stetoskopet og skapet.',
    targetWords: [
      { word: 'undersøkelsesbenk', translation: 'смотровая кушетка', ua: 'оглядова кушетка', en: 'examination bed' },
      { word: 'stetoskop', translation: 'стетоскоп', ua: 'стетоскоп', en: 'stethoscope' },
      { word: 'skap', translation: 'шкафчик', ua: 'шафка', en: 'cabinet' },
      { word: 'stol', translation: 'стул', ua: 'стілець', en: 'chair' },
      { word: 'skrivebord', translation: 'письменный стол', ua: 'письмовий стіл', en: 'desk' },
      { word: 'plakat', translation: 'плакат', ua: 'плакат', en: 'poster' }
    ],
    openingLine: 'Se på bildet av legekontoret. Kan du beskrive hva du ser i dette rommet?',
    openingTranslation: 'Посмотрите на изображение кабинета врача. Опишите, что вы видите в этой комнате?',
    openingUa: 'Подивіться на зображення кабінету лікаря. Опишіть, що ви бачите в цій кімнаті?',
    openingEn: 'Look at the picture of the doctor’s office. Can you describe what you see in this room?',
    hints: [
      {
        label: 'Gjenstander',
        norsk: 'I midten ser jeg en undersøkelsesbenk, og på veggen henger et skap med et rødt kors.',
        ru: 'Посередине я вижу кушетку, а на стене висит шкафчик с красным крестом.',
        ua: 'Посередині я бачу кушетку, а на стіні висить шафка з червоним хрестом.',
        en: 'In the middle I see an examination bed, and on the wall hangs a cabinet with a red cross.'
      }
    ],
    image: {
      src: '/scenarios/images/doctor.svg',
      alt_nb: 'Et legekontor med undersøkelsesbenk, skrivebord, stetoskop og førstehjelpsskap.',
      alt_l1: {
        ru: 'Кабинет врача с кушеткой, столом, стетоскопом и аптечкой на стене.',
        uk: 'Кабінет лікаря з кушеткою, столом, стетоскопом і аптечкою на стіні.',
        en: 'A doctor’s office with an examination bed, desk, stethoscope, and medical cabinet.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-helse',
    title: 'Samtale: Når man er forkjølet',
    level: 'A2',
    part: 'conversation',
    topic: 'helse',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om hva man gjør når man blir syk.',
    sourceText: 'Snakk sammen om hva dere pleier å gjøre når dere er syke eller forkjølet.',
    targetWords: [
      { word: 'feber', translation: 'температура, жар', ua: 'температура, гарячка', en: 'fever' },
      { word: 'forkjølet', translation: 'простуженный', ua: 'застуджений', en: 'having a cold' },
      { word: 'apotek', translation: 'аптека', ua: 'аптека', en: 'pharmacy' },
      { word: 'te', translation: 'чай', ua: 'чай', en: 'tea' },
      { word: 'slappe av', translation: 'отдыхать', ua: 'відпочивати', en: 'to relax' },
      { word: 'time', translation: 'прием, запись', ua: 'запис, візит', en: 'appointment' }
    ],
    openingLine: 'Hei! Jeg var forkjølet forrige uke med feber. Hva pleier du å gjøre når du føler deg dårlig?',
    openingTranslation: 'Привет! На прошлой неделе я простудился с температурой. Что ты обычно делаешь, когда плохо себя чувствуешь?',
    openingUa: 'Привіт! Минулого тижня я застудився з температурою. Що ти зазвичай робиш, коли погано почуваєшся?',
    openingEn: 'Hi! I had a cold last week with a fever. What do you usually do when you feel unwell?',
    hints: [
      {
        label: 'Råd',
        norsk: 'Når jeg er forkjølet, drikker jeg varm te og slapper av hjemme.',
        ru: 'Когда я простужен, я пью горячий чай и отдыхаю дома.',
        ua: 'Коли я застуджений, я п’ю гарячий чай і відпочиваю вдома.',
        en: 'When I have a cold, I drink hot tea and relax at home.'
      }
    ],
    status: 'draft'
  },

  // 4. FAMILIE
  {
    id: 'np-a2-presentation-familie',
    title: 'Presentasjon: Familien min',
    level: 'A2',
    part: 'presentation',
    topic: 'familie',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om familien din, hvem du bor sammen med og hva dere gjør.',
    sourceText: 'Fortell om foreldre, søsken, barn og hyggelige ting dere gjør sammen.',
    targetWords: [
      { word: 'foreldre', translation: 'родители', ua: 'батьки', en: 'parents' },
      { word: 'søsken', translation: 'братья и сестры', ua: 'брати та сестри', en: 'siblings' },
      { word: 'barn', translation: 'дети', ua: 'діти', en: 'children' },
      { word: 'besteforeldre', translation: 'бабушка и дедушка', ua: 'бабуся та дідусь', en: 'grandparents' },
      { word: 'bo', translation: 'жить', ua: 'жити', en: 'to live' },
      { word: 'besøke', translation: 'навещать', ua: 'відвідувати', en: 'to visit' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle litt om familien din?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите немного о вашей семье?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть трохи про вашу родину?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell a little about your family?',
    hints: [
      {
        label: 'Familie',
        norsk: 'Jeg har to søsken og vi snakker ofte sammen på telefonen.',
        ru: 'У меня двое братьев/сестер, и мы часто созваниваемся.',
        ua: 'У мене двоє братів/сестер, і ми часто говоримо телефоном.',
        en: 'I have two siblings, and we often talk on the phone.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-familie',
    title: 'Bildebeskrivelse: Rundt spisebordet',
    level: 'A2',
    part: 'picture',
    topic: 'familie',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv spisebordet og tingene som er gjort klart til måltid.',
    sourceText: 'Beskriv spisestua på bildet: spisebordet, stolene, tallerknene og fruktfatet.',
    targetWords: [
      { word: 'spisebord', translation: 'обеденный стол', ua: 'обідній стіл', en: 'dining table' },
      { word: 'stol', translation: 'стул', ua: 'стілець', en: 'chair' },
      { word: 'tallerken', translation: 'тарелка', ua: 'тарілка', en: 'plate' },
      { word: 'glass', translation: 'стакан', ua: 'склянка', en: 'glass' },
      { word: 'fruktfat', translation: 'ваза с фруктами', ua: 'ваза з фруктами', en: 'fruit bowl' },
      { word: 'taklampe', translation: 'потолочная лампа', ua: 'стельова лампа', en: 'ceiling lamp' }
    ],
    openingLine: 'Se på bildet av spisestua. Kan du beskrive spisebordet og tingene som står på det?',
    openingTranslation: 'Посмотрите на изображение столовой. Опишите обеденный стол и то, что на нем стоит?',
    openingUa: 'Подивіться на зображення їдальні. Опишіть обідній стіл і речі, що на ньому стоять?',
    openingEn: 'Look at the picture of the dining room. Can you describe the dining table and the things on it?',
    hints: [
      {
        label: 'Detalj',
        norsk: 'Bordet er dekket med tallerkener og glass, og midt på bordet står et fruktfat.',
        ru: 'Стол накрыт тарелками и стаканами, а в центре стоит ваза с фруктами.',
        ua: 'Стіл накритий тарілками та склянками, а посередині стоїть ваза з фруктами.',
        en: 'The table is set with plates and glasses, and in the middle is a fruit bowl.'
      }
    ],
    image: {
      src: '/scenarios/images/family.svg',
      alt_nb: 'En spisestue med dekket spisebord, fire stoler, fruktfat, vindu og taklampe.',
      alt_l1: {
        ru: 'Столовая с накрытым столом, четырьмя стульями, вазой с фруктами, окном и лампой.',
        uk: 'Їдальня з накритим столом, чотирма стільцями, вазою з фруктами, вікном і лампою.',
        en: 'A dining room with a set table, four chairs, a fruit bowl, window, and ceiling lamp.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-familie',
    title: 'Samtale: Sammen i helgene',
    level: 'A2',
    part: 'conversation',
    topic: 'familie',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om familietid og felles aktiviteter i helgen.',
    sourceText: 'Snakk sammen om hva dere og familien liker å gjøre i helgene.',
    targetWords: [
      { word: 'middag', translation: 'ужин, обед', ua: 'вечеря', en: 'dinner' },
      { word: 'helg', translation: 'выходные', ua: 'вихідні', en: 'weekend' },
      { word: 'sammen', translation: 'вместе', ua: 'разом', en: 'together' },
      { word: 'lage mat', translation: 'готовить еду', ua: 'готувати їжу', en: 'to cook' },
      { word: 'snakke', translation: 'разговаривать', ua: 'розмовляти', en: 'to talk' },
      { word: 'gå tur', translation: 'гулять', ua: 'гуляти', en: 'to go for a walk' }
    ],
    openingLine: 'Hei! I helgene pleier familien min å spise middag sammen. Hva liker du og familien din å gjøre i helgen?',
    openingTranslation: 'Привет! По выходным моя семья обычно ужинает вместе. А что ты и твоя семья любите делать на выходных?',
    openingUa: 'Привіт! У вихідні моя родина зазвичай вечеряє разом. А що ти і твоя родина любите робити на вихідних?',
    openingEn: 'Hi! On weekends my family usually has dinner together. What do you and your family like to do on weekends?',
    hints: [
      {
        label: 'Helg',
        norsk: 'Vi liker å lage mat sammen og gå en tur i parken.',
        ru: 'Мы любим готовить еду вместе и гулять в парке.',
        ua: 'Ми любимо готувати їжу разом і гуляти в парку.',
        en: 'We like to cook together and go for a walk in the park.'
      }
    ],
    status: 'draft'
  },

  // 5. HANDEL
  {
    id: 'np-a2-presentation-handel',
    title: 'Presentasjon: Å handle i hverdagen',
    level: 'A2',
    part: 'presentation',
    topic: 'handel',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om hvordan og hvor du handler mat og andre ting.',
    sourceText: 'Fortell om innkjøp i hverdagen: butikker, handlelister og hva du kjøper.',
    targetWords: [
      { word: 'butikk', translation: 'магазин', ua: 'магазин', en: 'shop' },
      { word: 'handle', translation: 'делать покупки', ua: 'робити покупки', en: 'to shop' },
      { word: 'handleliste', translation: 'список покупок', ua: 'список покупок', en: 'shopping list' },
      { word: 'matvarer', translation: 'продукты питания', ua: 'продукти харчування', en: 'groceries' },
      { word: 'pris', translation: 'цена', ua: 'ціна', en: 'price' },
      { word: 'betale', translation: 'платить', ua: 'платити', en: 'to pay' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om hvordan du handler mat i hverdagen?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о том, как вы покупаете продукты в повседневной жизни?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про те, як ви купуєте продукти в повсякденному житті?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about how you shop for groceries in everyday life?',
    hints: [
      {
        label: 'Innkjøp',
        norsk: 'Jeg handler matvarer to ganger i uka, og jeg skriver alltid en handleliste.',
        ru: 'Я покупаю продукты дважды в неделю и всегда пишу список покупок.',
        ua: 'Я купую продукти двічі на тиждень і завжди пишу список покупок.',
        en: 'I buy groceries twice a week, and I always write a shopping list.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-handel',
    title: 'Bildebeskrivelse: I matbutikken',
    level: 'A2',
    part: 'picture',
    topic: 'handel',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv butikken, varehyllene og kasseområdet på bildet.',
    sourceText: 'Beskriv matbutikken på bildet: hyllene med mat, kassen, kurven og skiltet.',
    targetWords: [
      { word: 'hylle', translation: 'полка', ua: 'полиця', en: 'shelf' },
      { word: 'kassedisk', translation: 'кассовая стойка', ua: 'касова стійка', en: 'checkout counter' },
      { word: 'kassaapparat', translation: 'кассовый аппарат', ua: 'касовий апарат', en: 'cash register' },
      { word: 'handlekurv', translation: 'корзина для покупок', ua: 'кошик для покупок', en: 'shopping basket' },
      { word: 'tilbud', translation: 'скидка, акция', ua: 'знижка, акція', en: 'special offer' },
      { word: 'vare', translation: 'товар', ua: 'товар', en: 'item, goods' }
    ],
    openingLine: 'Se på bildet fra matbutikken. Kan du beskrive hva du ser på hyllene og ved kassen?',
    openingTranslation: 'Посмотрите на изображение продуктового магазина. Опишите, что вы видите на полках и у кассы?',
    openingUa: 'Подивіться на зображення продуктового магазину. Опишіть, що ви бачите на полицях та біля каси?',
    openingEn: 'Look at the picture from the grocery store. Can you describe what you see on the shelves and at the checkout?',
    hints: [
      {
        label: 'Beskrivelse',
        norsk: 'På hyllene står det melk og brød, og foran kassen står en handlekurv.',
        ru: 'На полках стоят молоко и хлеб, а перед кассой стоит корзина.',
        ua: 'На полицях стоять молоко та хліб, а перед касою стоїть кошик.',
        en: 'On the shelves there is milk and bread, and in front of the counter is a shopping basket.'
      }
    ],
    image: {
      src: '/scenarios/images/shop.svg',
      alt_nb: 'En matbutikk med varehylle, kassedisk, kassaapparat, handlekurv og tilbudsskilt.',
      alt_l1: {
        ru: 'Продуктовый магазин с полкой товаров, кассой, кассовым аппаратом, корзиной и знаком скидки.',
        uk: 'Продуктовий магазин із полицею товарів, касою, касовим апаратом, кошиком і знаком знижки.',
        en: 'A grocery store with shelves, checkout counter, cash register, shopping basket, and discount sign.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-handel',
    title: 'Samtale: Mat og priser',
    level: 'A2',
    part: 'conversation',
    topic: 'handel',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om priser og handleopplevelser.',
    sourceText: 'Diskuter matpriser, gode tilbud og hvordan man kan spare penger.',
    targetWords: [
      { word: 'dyr', translation: 'дорогой', ua: 'дорогий', en: 'expensive' },
      { word: 'billig', translation: 'дешевый', ua: 'дешевий', en: 'cheap' },
      { word: 'melk', translation: 'молоко', ua: 'молоко', en: 'milk' },
      { word: 'brød', translation: 'хлеб', ua: 'хліб', en: 'bread' },
      { word: 'spare', translation: 'экономить', ua: 'економити', en: 'to save' },
      { word: 'velge', translation: 'выбирать', ua: 'вибирати', en: 'to choose' }
    ],
    openingLine: 'Hei! Jeg synes matprisene har blitt ganske høye i det siste. Pleier du å sjekke tilbud før du handler?',
    openingTranslation: 'Привет! Мне кажется, цены на еду в последнее время выросли. Ты проверяешь скидки перед покупками?',
    openingUa: 'Привіт! Мені здається, ціни на їжу останнім часом зросли. Ти перевіряєш знижки перед покупками?',
    openingEn: 'Hi! I think food prices have gotten quite high lately. Do you usually check deals before shopping?',
    hints: [
      {
        label: 'Innkjøp',
        norsk: 'Ja, jeg prøver å kjøpe varer på tilbud for å spare penger.',
        ru: 'Да, я стараюсь покупать товары по скидке, чтобы сэкономить.',
        ua: 'Так, я намагаюся купувати товари за знижкою, щоб заощадити.',
        en: 'Yes, I try to buy items on sale to save money.'
      }
    ],
    status: 'draft'
  },

  // 6. TRANSPORT
  {
    id: 'np-a2-presentation-transport',
    title: 'Presentasjon: Hvordan jeg reiser',
    level: 'A2',
    part: 'presentation',
    topic: 'transport',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om reiseveien din og transportmidlene du bruker.',
    sourceText: 'Fortell om hvordan du kommer deg til jobb, skole eller butikken i hverdagen.',
    targetWords: [
      { word: 'buss', translation: 'автобус', ua: 'автобус', en: 'bus' },
      { word: 'tog', translation: 'поезд', ua: 'поїзд', en: 'train' },
      { word: 'billett', translation: 'билет', ua: 'квиток', en: 'ticket' },
      { word: 'holdeplass', translation: 'остановка', ua: 'зупинка', en: 'stop' },
      { word: 'reise', translation: 'ехать, путешествовать', ua: 'подорожувати, їхати', en: 'to travel' },
      { word: 'tid', translation: 'время', ua: 'час', en: 'time' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om hvordan du reiser til jobb eller skole?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о том, как вы добираетесь до работы или учебы?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про те, як ви дістаєтеся до роботи чи навчання?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about how you travel to work or school?',
    hints: [
      {
        label: 'Transport',
        norsk: 'Jeg tar bussen hver morgen, og turen tar omtrent tjue minutter.',
        ru: 'Каждое утро я еду на автобусе, поездка занимает около 20 минут.',
        ua: 'Щоранку я їду автобусом, поїздка займає близько 20 хвилин.',
        en: 'I take the bus every morning, and the trip takes about twenty minutes.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-transport',
    title: 'Bildebeskrivelse: På bussholdeplassen',
    level: 'A2',
    part: 'picture',
    topic: 'transport',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv bussholdeplassen og bussen på bildet.',
    sourceText: 'Beskriv bussholdeplassen: busskuret, benken, skiltet, lykten og bussen.',
    targetWords: [
      { word: 'busskur', translation: 'автобусный навес', ua: 'навіс зупинки', en: 'bus shelter' },
      { word: 'benk', translation: 'скамейка', ua: 'лавка', en: 'bench' },
      { word: 'rutetabell', translation: 'расписание', ua: 'розклад', en: 'timetable' },
      { word: 'skilt', translation: 'знак', ua: 'знак', en: 'sign' },
      { word: 'gatelykt', translation: 'уличный фонарь', ua: 'вуличний ліхтар', en: 'streetlight' },
      { word: 'vegbane', translation: 'проезжая часть', ua: 'проїзна частина', en: 'roadway' }
    ],
    openingLine: 'Se på bildet av bussholdeplassen. Kan du beskrive hva du ser på bildet?',
    openingTranslation: 'Посмотрите на изображение автобусной остановки. Опишите, что вы видите на картинке?',
    openingUa: 'Подивіться на зображення автобусної зупинки. Опишіть, що ви бачите на картинці?',
    openingEn: 'Look at the picture of the bus stop. Can you describe what you see in the picture?',
    hints: [
      {
        label: 'Beskrivelse',
        norsk: 'Under busskuret er det en benk, og en rød buss kommer kjørende.',
        ru: 'Под навесом стоит скамейка, и подъезжает красный автобус.',
        ua: 'Під навісом стоїть лавка, і під’їжджає червоний автобус.',
        en: 'Under the shelter there is a bench, and a red bus is driving up.'
      }
    ],
    image: {
      src: '/scenarios/images/bus-stop.svg',
      alt_nb: 'En bussholdeplass med busskur, benk, rutetabell, gatelykt og en rød buss som kommer.',
      alt_l1: {
        ru: 'Автобусная остановка со стеклянным навесом, скамейкой, расписанием, фонарём и подъезжающим автобусом.',
        uk: 'Автобусна зупинка зі скляним навісом, лавкою, розкладом, ліхтарем і автобусом, що під’їжджає.',
        en: 'A bus stop with a shelter, bench, timetable, street light, and an approaching bus.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-transport',
    title: 'Samtale: Buss eller sykkel',
    level: 'A2',
    part: 'conversation',
    topic: 'transport',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om buss, sykkel og reisevaner.',
    sourceText: 'Diskuter hva som er raskest og mest behagelig for å komme seg rundt.',
    targetWords: [
      { word: 'sykle', translation: 'ездить на велосипеде', ua: 'їздити на велосипеді', en: 'to cycle' },
      { word: 'bil', translation: 'машина', ua: 'авто', en: 'car' },
      { word: 'vente', translation: 'ждать', ua: 'чекати', en: 'to wait' },
      { word: 'forsinket', translation: 'опоздавший, задержанный', ua: 'запізнілий', en: 'delayed' },
      { word: 'gå', translation: 'идти пешком', ua: 'ходити пішки', en: 'to walk' },
      { word: 'rask', translation: 'быстрый', ua: 'швидкий', en: 'fast' }
    ],
    openingLine: 'Hei! Jeg tar nesten alltid bussen, men om sommeren liker jeg å sykle. Hva foretrekker du å reise med?',
    openingTranslation: 'Привет! Я почти всегда езжу на автобусе, но летом люблю кататься на велосипеде. На чем ты предпочитаешь ездить?',
    openingUa: 'Привіт! Я майже завжди їжджу автобусом, але влітку люблю кататися на велосипеді. Чим ти віддаєш перевагу їздити?',
    openingEn: 'Hi! I almost always take the bus, but in the summer I like to cycle. What do you prefer traveling by?',
    hints: [
      {
        label: 'Preferanse',
        norsk: 'Jeg liker å sykle fordi det er sunt og raskt.',
        ru: 'Мне нравится ездить на велосипеде, потому что это полезно и быстро.',
        ua: 'Мені подобається їздити на велосипеді, бо це корисно і швидко.',
        en: 'I like cycling because it is healthy and fast.'
      }
    ],
    status: 'draft'
  },

  // 7. FRITID
  {
    id: 'np-a2-presentation-fritid',
    title: 'Presentasjon: Fritid og interesser',
    level: 'A2',
    part: 'presentation',
    topic: 'fritid',
    badge: 'Norskprøve A2 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om hva du liker å gjøre på fritiden og i helgene.',
    sourceText: 'Fortell om hobbyer, venner, turer og aktiviteter du trives med.',
    targetWords: [
      { word: 'fritid', translation: 'свободное время', ua: 'вільний час', en: 'free time' },
      { word: 'hobby', translation: 'хобби', ua: 'хобі', en: 'hobby' },
      { word: 'venner', translation: 'друзья', ua: 'друзі', en: 'friends' },
      { word: 'natur', translation: 'природа', ua: 'природа', en: 'nature' },
      { word: 'lese', translation: 'читать', ua: 'читати', en: 'to read' },
      { word: 'musikk', translation: 'музыка', ua: 'музика', en: 'music' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om hva du liker å gjøre på fritiden?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о том, что вы любите делать в свободное время?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про те, що ви любите робити у вільний час?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about what you like to do in your free time?',
    hints: [
      {
        label: 'Interesser',
        norsk: 'På fritiden liker jeg å være sammen med venner og høre på musikk.',
        ru: 'В свободное время мне нравится быть с друзьями и слушать музыку.',
        ua: 'У вільний час мені подобається бути з друзями і слухати музику.',
        en: 'In my free time I like to be with friends and listen to music.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-a2-picture-fritid',
    title: 'Bildebeskrivelse: I parken',
    level: 'A2',
    part: 'picture',
    topic: 'fritid',
    badge: 'Norskprøve A2 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv parken, naturen og tingene på bildet.',
    sourceText: 'Beskriv parken: trærne, benken, gangstien, sykkelen og blomstene.',
    targetWords: [
      { word: 'tre', translation: 'дерево', ua: 'дерево', en: 'tree' },
      { word: 'parkbenk', translation: 'парковая скамейка', ua: 'паркова лавка', en: 'park bench' },
      { word: 'gangsti', translation: 'пешеходная дорожка', ua: 'пішохідна доріжка', en: 'walking path' },
      { word: 'sykkel', translation: 'велосипед', ua: 'велосипед', en: 'bicycle' },
      { word: 'blomst', translation: 'цветок', ua: 'квітка', en: 'flower' },
      { word: 'gress', translation: 'трава', ua: 'трава', en: 'grass' }
    ],
    openingLine: 'Se på bildet av parken. Kan du beskrive hva du ser av natur og gjenstander der?',
    openingTranslation: 'Посмотрите на изображение парка. Опишите природу и предметы, которые вы там видите?',
    openingUa: 'Подивіться на зображення парку. Опишіть природу та предмети, які ви там бачите?',
    openingEn: 'Look at the picture of the park. Can you describe what you see of nature and objects there?',
    hints: [
      {
        label: 'Beskrivelse',
        norsk: 'Langs gangstien står det en benk, og ved siden av står en sykkel.',
        ru: 'Вдоль дорожки стоит скамейка, а рядом стоит велосипед.',
        ua: 'Уздовж доріжки стоїть лавка, а поруч стоїть велосипед.',
        en: 'Along the path is a bench, and next to it stands a bicycle.'
      }
    ],
    image: {
      src: '/scenarios/images/park.svg',
      alt_nb: 'En offentlig park med grønne trær, parkbenk, gangsti, sykkel og blomsterbed.',
      alt_l1: {
        ru: 'Городской парк с деревьями, скамейкой, дорожкой, велосипедом и цветами.',
        uk: 'Міський парк із деревами, лавкою, доріжкою, велосипедом і квітами.',
        en: 'A public park with trees, bench, walking path, bicycle, and flowers.'
      }
    },
    status: 'draft'
  },
  {
    id: 'np-a2-conversation-fritid',
    title: 'Samtale: Planer for helgen',
    level: 'A2',
    part: 'conversation',
    topic: 'fritid',
    badge: 'Norskprøve A2 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Samtale med Jonas om helgeplaner og friluftsaktiviteter.',
    sourceText: 'Diskuter hva dere planlegger å gjøre i helgen når dere har fri.',
    targetWords: [
      { word: 'skog', translation: 'лес', ua: 'ліс', en: 'forest' },
      { word: 'kafé', translation: 'кафе', ua: 'кафе', en: 'café' },
      { word: 'kino', translation: 'кинотеатр', ua: 'кінотеатр', en: 'cinema' },
      { word: 'fri', translation: 'свободный от работы', ua: 'вільний', en: 'free, off' },
      { word: 'treffe', translation: 'встречать', ua: 'зустрічати', en: 'to meet' },
      { word: 'lyst', translation: 'желание', ua: 'бажання', en: 'desire, want' }
    ],
    openingLine: 'Hei! Til helgen har jeg lyst til å gå en lang tur i skogen. Hva liker du å gjøre når du har fri?',
    openingTranslation: 'Привет! На выходных я хочу пойти на долгую прогулку в лес. А что ты любишь делать, когда свободен?',
    openingUa: 'Привіт! На вихідних я хочу піти на довгу прогулянку в ліс. А що ти любиш робити, коли вільний?',
    openingEn: 'Hi! This weekend I would like to go for a long walk in the forest. What do you like to do when you have time off?',
    hints: [
      {
        label: 'Planer',
        norsk: 'Jeg har lyst til å gå på kino eller treffe noen venner på en kafé.',
        ru: 'Я хочу пойти в кино или встретиться с друзьями в кафе.',
        ua: 'Я хочу піти в кіно або зустрітися з друзями в кафе.',
        en: 'I want to go to the cinema or meet some friends at a café.'
      }
    ],
    status: 'draft'
  }
];
