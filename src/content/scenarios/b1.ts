import type { ExamScenario } from './types';

export const b1Scenarios: ExamScenario[] = [
  // 1. ARBEID
  {
    id: 'np-b1-presentation-arbeid',
    title: 'Presentasjon: Arbeidserfaring og yrkesvalg',
    level: 'B1',
    part: 'presentation',
    topic: 'arbeid',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om yrkesbakgrunnen din, oppgaver og hvorfor du trives med yrket.',
    sourceText: 'Fortell om utdanning, tidligere arbeidserfaring og hva som kreves for å trives i jobben.',
    targetWords: [
      { word: 'yrkeserfaring', translation: 'опыт работы', ua: 'досвід роботи', en: 'work experience' },
      { word: 'arbeidsmiljø', translation: 'рабочая атмосфера', ua: 'робоче середовище', en: 'work environment' },
      { word: 'ansvar', translation: 'ответственность', ua: 'відповідальність', en: 'responsibility' },
      { word: 'utfordring', translation: 'сложность, вызов', ua: 'виклик, труднощі', en: 'challenge' },
      { word: 'mulighet', translation: 'возможность', ua: 'можливість', en: 'opportunity' },
      { word: 'trives', translation: 'чувствовать себя комфортно', ua: 'почуватися комфортно', en: 'to thrive, enjoy' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om din yrkesbakgrunn og hvorfor du valgte dette yrket?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о вашем профессиональном опыте и почему вы выбрали эту профессию?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про ваш професійний досвід і чому ви обрали цю професію?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about your professional background and why you chose this profession?',
    hints: [
      {
        label: 'Begrunnelse (B1)',
        norsk: 'Jeg valgte dette yrket fordi jeg liker å ha ansvar og samarbeide med andre.',
        ru: 'Я выбрал эту профессию, потому что мне нравится нести ответственность и сотрудничать с другими.',
        ua: 'Я обрав цю професію, тому що мені подобається нести відповідальність і співпрацювати з іншими.',
        en: 'I chose this profession because I enjoy having responsibility and collaborating with others.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-arbeid',
    title: 'Bildebeskrivelse: Arbeidsplassen og trivsel',
    level: 'B1',
    part: 'picture',
    topic: 'arbeid',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv kontoret og reflekter over hva som skaper en god arbeidsplass.',
    sourceText: 'Beskriv arbeidsplassen på bildet og drøft hvorfor fysisk tilrettelegging påvirker konsentrasjon.',
    targetWords: [
      { word: 'belysning', translation: 'освещение', ua: 'освітлення', en: 'lighting' },
      { word: 'utstyr', translation: 'оборудование', ua: 'обладнання', en: 'equipment' },
      { word: 'tilrettelegge', translation: 'организовывать, обустраивать', ua: 'облаштовувати', en: 'to facilitate, adapt' },
      { word: 'konsentrasjon', translation: 'концентрация', ua: 'концентрація', en: 'concentration' },
      { word: 'skjermtid', translation: 'время перед экраном', ua: 'час перед екраном', en: 'screen time' },
      { word: 'ergonomi', translation: 'эргономика', ua: 'ергономіка', en: 'ergonomics' }
    ],
    openingLine: 'Se på bildet av kontoret. Beskriv arbeidsplassen, og fortell hvorfor det fysiske miljøet på jobben har betydning for trivselen.',
    openingTranslation: 'Посмотрите на изображение офиса. Опишите рабочее место и объясните, почему физическая обстановка влияет на самочувствие работников.',
    openingUa: 'Подивіться на зображення офісу. Опишіть робоче місце та поясніть, чому фізичне оточення впливає на самопочуття працівників.',
    openingEn: 'Look at the picture of the office. Describe the workplace, and explain why the physical environment at work affects well-being.',
    hints: [
      {
        label: 'Refleksjon (B1)',
        norsk: 'God belysning og en behagelig stol er avgjørende for å unngå ryggsmerter.',
        ru: 'Хорошее освещение и удобное кресло имеют решающее значение для предотвращения болей в спине.',
        ua: 'Гарне освітлення та зручне крісло мають вирішальне значення для запобігання болю в спині.',
        en: 'Good lighting and a comfortable chair are crucial to avoid back pain.'
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
    id: 'np-b1-conversation-arbeid',
    title: 'Samtale: Åpen planløsning eller eget kontor',
    level: 'B1',
    part: 'conversation',
    topic: 'arbeid',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter fordeler og ulemper ved åpent kontorlandskap med Jonas.',
    sourceText: 'Drøft sammen om åpent landskap gir bedre samarbeid eller for mye støy.',
    targetWords: [
      { word: 'forstyrre', translation: 'мешать, беспокоить', ua: 'заважати', en: 'to disturb' },
      { word: 'samarbeid', translation: 'сотрудничество', ua: 'співпраця', en: 'collaboration' },
      { word: 'privatliv', translation: 'приватность, личное пространство', ua: 'приватність', en: 'privacy' },
      { word: 'effektiv', translation: 'эффективный', ua: 'ефективний', en: 'efficient' },
      { word: 'støy', translation: 'шум', ua: 'шум', en: 'noise' },
      { word: 'ulempe', translation: 'недостаток', ua: 'недолік', en: 'disadvantage' }
    ],
    openingLine: 'Hei! På min arbeidsplass sitter alle i åpent landskap. Hva tenker du er best — eget kontor eller åpent kontorlandskap?',
    openingTranslation: 'Привет! У меня на работе все сидят в открытом пространстве. Как ты думаешь, что лучше — отдельный кабинет или открытый офис?',
    openingUa: 'Привіт! У мене на роботі всі сидять у відкритому просторі. Як ти думаєш, що краще — окремий кабінет чи відкритий офіс?',
    openingEn: 'Hi! At my workplace everyone sits in an open-plan office. What do you think is best — private office or open-plan?',
    hints: [
      {
        label: 'Synspunkt (B1)',
        norsk: 'Selv om åpent landskap fremmer samarbeid, kan mye støy gjøre det vanskelig å konsentrere seg.',
        ru: 'Хотя открытый офис способствует сотрудничеству, сильный шум мешает сосредоточиться.',
        ua: 'Хоча відкритий офіс сприяє співпраці, сильний шум заважає зосередитися.',
        en: 'Although an open plan promotes collaboration, too much noise can make it hard to concentrate.'
      }
    ],
    status: 'draft'
  },

  // 2. BOLIG
  {
    id: 'np-b1-presentation-bolig',
    title: 'Presentasjon: Boligforhold og beliggenhet',
    level: 'B1',
    part: 'presentation',
    topic: 'bolig',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om boligen din, beliggenheten og hvorfor den passer for deg.',
    sourceText: 'Fortell om boligen, nabolaget og vurderinger rundt beliggenhet og trivsel.',
    targetWords: [
      { word: 'beliggenhet', translation: 'расположение', ua: 'розташування', en: 'location' },
      { word: 'fasiliteter', translation: 'удобства', ua: 'зручності', en: 'facilities' },
      { word: 'nabolag', translation: 'район, окрестности', ua: 'район, сусідство', en: 'neighbourhood' },
      { word: 'oppussing', translation: 'ремонт', ua: 'ремонт', en: 'renovation' },
      { word: 'trivsel', translation: 'душевный комфорт, уют', ua: 'комфорт, затишок', en: 'well-being, comfort' },
      { word: 'boareal', translation: 'жилая площадь', ua: 'житлова площа', en: 'living space' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om boligen din og hvorfor beliggenheten passer for deg?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о вашем жилье и почему это расположение подходит вам?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про ваше житло і чому це розташування підходить вам?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about your home and why the location suits you?',
    hints: [
      {
        label: 'Begrunnelse (B1)',
        norsk: 'Beliggenheten er praktisk fordi jeg har kort vei til både kollektivtransport og butikker.',
        ru: 'Расположение удобное, потому что мне близко и до транспорта, и до магазинов.',
        ua: 'Розташування зручне, тому що мені близько і до транспорту, і до магазинів.',
        en: 'The location is convenient because I have a short distance to both public transit and shops.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-bolig',
    title: 'Bildebeskrivelse: Hjemmekos og interiør',
    level: 'B1',
    part: 'picture',
    topic: 'bolig',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv stua og drøft hva som gjør et hjem hyggelig og trygt.',
    sourceText: 'Beskriv rommet på bildet og reflekter over betydningen av et trygt og trivelig hjem.',
    targetWords: [
      { word: 'innredning', translation: 'интерьер, обстановка', ua: 'інтер’єр, облаштування', en: 'interior decoration' },
      { word: 'atmosfære', translation: 'атмосфера', ua: 'атмосфера', en: 'atmosphere' },
      { word: 'komfortabel', translation: 'удобный, комфортный', ua: 'комфортний', en: 'comfortable' },
      { word: 'samlingspunkt', translation: 'место сбора', ua: 'місце збору', en: 'gathering point' },
      { word: 'dekorasjon', translation: 'декор, украшение', ua: 'декор, прикраса', en: 'decoration' },
      { word: 'belysning', translation: 'освещение', ua: 'освітлення', en: 'lighting' }
    ],
    openingLine: 'Se på bildet av stua. Beskriv rommet, og forklar hva som gjør et hjem hyggelig og komfortabelt å bo i.',
    openingTranslation: 'Посмотрите на изображение гостиной. Опишите комнату и объясните, что делает дом уютным и комфортным для жизни.',
    openingUa: 'Подивіться на зображення вітальні. Опишіть кімнату та поясніть, що робить дім затишним і комфортним для життя.',
    openingEn: 'Look at the picture of the living room. Describe the room, and explain what makes a home pleasant and comfortable to live in.',
    hints: [
      {
        label: 'Trivsel (B1)',
        norsk: 'Møblene og den varme belysningen skaper en avslappende atmosfære i stua.',
        ru: 'Мебель и теплое освещение создают расслабляющую атмосферу в гостиной.',
        ua: 'Меблі та тепле освітлення створюють розслаблюючу атмосферу у вітальні.',
        en: 'The furniture and warm lighting create a relaxing atmosphere in the living room.'
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
    id: 'np-b1-conversation-bolig',
    title: 'Samtale: Å leie eller kjøpe bolig',
    level: 'B1',
    part: 'conversation',
    topic: 'bolig',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter fordeler og ulemper ved å eie versus leie bolig i Norge.',
    sourceText: 'Drøft sammen økonomiske hensyn, fleksibilitet og vedlikehold ved kjøp eller leie.',
    targetWords: [
      { word: 'boliglån', translation: 'ипотечный кредит', ua: 'іпотечний кредит', en: 'mortgage' },
      { word: 'egenkapital', translation: 'собственный капитал', ua: 'власний капітал', en: 'equity, down payment' },
      { word: 'rente', translation: 'процентная ставка', ua: 'відсоткова ставка', en: 'interest rate' },
      { word: 'vedlikehold', translation: 'техническое обслуживание, ремонт', ua: 'обслуговування, ремонт', en: 'maintenance' },
      { word: 'investering', translation: 'инвестиция', ua: 'інвестиція', en: 'investment' },
      { word: 'fleksibilitet', translation: 'гибкость', ua: 'гнучкість', en: 'flexibility' }
    ],
    openingLine: 'Hei! Mange mener det alltid lønner seg å eie bolig i Norge. Hva tenker du — er det best å eie eller å leie?',
    openingTranslation: 'Привет! Многие считают, что в Норвегии всегда выгодно иметь свое жилье. Что думаешь — лучше владеть или снимать?',
    openingUa: 'Привіт! Багато хто вважає, що в Норвегії завжди вигідно мати власне житло. Що думаєш — краще володіти чи орендувати?',
    openingEn: 'Hi! Many people believe it always pays off to own a home in Norway. What do you think — is it better to own or to rent?',
    hints: [
      {
        label: 'Argument (B1)',
        norsk: 'Å eie gir større trygghet på sikt, men krever en del egenkapital og ansvar for vedlikehold.',
        ru: 'Владение дает больше уверенности в перспективе, но требует капитала и ответственности за ремонт.',
        ua: 'Власне житло дає більше впевненості у перспективі, але вимагає капіталу та відповідальності за ремонт.',
        en: 'Owning gives greater long-term security, but requires equity and responsibility for maintenance.'
      }
    ],
    status: 'draft'
  },

  // 3. HELSE
  {
    id: 'np-b1-presentation-helse',
    title: 'Presentasjon: Helse og livsstil',
    level: 'B1',
    part: 'presentation',
    topic: 'helse',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om livsstilen din, kosthold og forebygging av helseplager.',
    sourceText: 'Fortell om hvordan du holder kroppen og hodet i form i en travel hverdag.',
    targetWords: [
      { word: 'kosthold', translation: 'питание, рацион', ua: 'раціон, харчування', en: 'diet, nutrition' },
      { word: 'regelmessig', translation: 'регулярный', ua: 'регулярний', en: 'regular' },
      { word: 'forebygge', translation: 'предотвращать', ua: 'запобігати', en: 'to prevent' },
      { word: 'energi', translation: 'энергия', ua: 'енергія', en: 'energy' },
      { word: 'overskudd', translation: 'бодрость, запас сил', ua: 'бадьорість, запас сил', en: 'vitality, surplus energy' },
      { word: 'belastning', translation: 'нагрузка, напряжение', ua: 'навантаження, напруга', en: 'strain, load' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om hvordan du balanserer jobb, hvile og sunne vaner?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о том, как вы балансируете работу, отдых и здоровые привычки?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про те, як ви балансуєте роботу, відпочинок і здорові звички?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about how you balance work, rest, and healthy habits?',
    hints: [
      {
        label: 'Livsstil (B1)',
        norsk: 'Et variert kosthold og regelmessig søvn gir meg overskudd til å takle utfordringer på jobb.',
        ru: 'Разнообразное питание и регулярный сон дают мне силы справляться с вызовами на работе.',
        ua: 'Різноманітне харчування та регулярний сон дають мені сили долати труднощі на роботі.',
        en: 'A varied diet and regular sleep give me the energy to handle challenges at work.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-helse',
    title: 'Bildebeskrivelse: Helsevesenet og pasientmøtet',
    level: 'B1',
    part: 'picture',
    topic: 'helse',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv legekontoret og reflekter over tillit og dialog med legen.',
    sourceText: 'Beskriv bildet av legekontoret og drøft pasientens behov for trygghet og god veiledning.',
    targetWords: [
      { word: 'fastlege', translation: 'семейный врач', ua: 'сімейний лікар', en: 'general practitioner' },
      { word: 'konsultasjon', translation: 'консультация', ua: 'консультація', en: 'consultation' },
      { word: 'behandling', translation: 'лечение', ua: 'лікування', en: 'treatment' },
      { word: 'tillit', translation: 'доверие', ua: 'довіра', en: 'trust' },
      { word: 'symptomer', translation: 'симптомы', ua: 'симптоми', en: 'symptoms' },
      { word: 'henvisning', translation: 'направление к специалисту', ua: 'направлення до спеціаліста', en: 'referral' }
    ],
    openingLine: 'Se på bildet av legekontoret. Beskriv hva du ser, og fortell hvorfor god kommunikasjon med fastlegen er viktig for pasienten.',
    openingTranslation: 'Посмотрите на изображение кабинета врача. Опишите то, что видите, и объясните, почему хороший диалог с врачом важен для пациента.',
    openingUa: 'Подивіться на зображення кабінету лікаря. Опишіть те, що бачите, та поясніть, чому хороший діалог із лікарем важливий для пацієнта.',
    openingEn: 'Look at the picture of the doctor’s office. Describe what you see, and explain why good communication with the GP is important for the patient.',
    hints: [
      {
        label: 'Kommunikasjon (B1)',
        norsk: 'Det er viktig at pasienten føler tillit og tør å forklare alle sine symptomer grundig.',
        ru: 'Важно, чтобы пациент доверял врачу и не боялся подробно объяснить все симптомы.',
        ua: 'Важливо, щоб пацієнт довіряв лікарю і не боявся детально пояснити всі симптоми.',
        en: 'It is important that the patient feels trust and dares to explain all their symptoms thoroughly.'
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
    id: 'np-b1-conversation-helse',
    title: 'Samtale: Stress og balanse i hverdagen',
    level: 'B1',
    part: 'conversation',
    topic: 'helse',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter håndtering av hverdagsstress og tiltak for mer ro.',
    sourceText: 'Drøft sammen hvordan man unngår stress og prioriterer egen helse.',
    targetWords: [
      { word: 'forventning', translation: 'ожидание', ua: 'очікування', en: 'expectation' },
      { word: 'avkobling', translation: 'разрядка, отдых', ua: 'розрядка, відпочинок', en: 'unwinding, relaxation' },
      { word: 'prioritere', translation: 'расставлять приоритеты', ua: 'розставляти пріоритети', en: 'to prioritize' },
      { word: 'press', translation: 'давление, стресс', ua: 'тиск, стрес', en: 'pressure' },
      { word: 'frisk luft', translation: 'свежий воздух', ua: 'свіже повітря', en: 'fresh air' },
      { word: 'søvnkvalitet', translation: 'качество сна', ua: 'якість сну', en: 'sleep quality' }
    ],
    openingLine: 'Hei! Mange opplever hverdagsstress på grunn av jobb og forpliktelser. Hva gjør du for å stresse ned og hente ny energi?',
    openingTranslation: 'Привет! Многие испытывают повседневный стресс из-за работы и обязательств. Что ты делаешь, чтобы снять стресс и восстановить силы?',
    openingUa: 'Привіт! Багато хто відчуває щоденний стрес через роботу та обов’язки. Що ти робиш, щоб зняти стрес і відновити сили?',
    openingEn: 'Hi! Many people experience everyday stress due to work and obligations. What do you do to de-stress and recharge?',
    hints: [
      {
        label: 'Mestring (B1)',
        norsk: 'Jeg prioriterer å gå en tur i frisk luft for å koble av fra hverdagens press.',
        ru: 'Я стараюсь выйти на прогулку на свежий воздух, чтобы отключиться от давления будней.',
        ua: 'Я намагаюся вийти на прогулянку на свіже повітря, щоб відволіктися від тиску буднів.',
        en: 'I prioritize going for a walk in fresh air to unwind from everyday pressure.'
      }
    ],
    status: 'draft'
  },

  // 4. FAMILIE
  {
    id: 'np-b1-presentation-familie',
    title: 'Presentasjon: Familie og generasjoner',
    level: 'B1',
    part: 'presentation',
    topic: 'familie',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om familiens rolle og hvordan dere støtter hverandre.',
    sourceText: 'Fortell om tradisjoner, kontakt mellom generasjoner og samhold i familien.',
    targetWords: [
      { word: 'fellesskap', translation: 'единство, сплоченность', ua: 'єдність, спільнота', en: 'togetherness, community' },
      { word: 'oppdragelse', translation: 'воспитание', ua: 'виховання', en: 'upbringing' },
      { word: 'støtte', translation: 'поддержка', ua: 'підтримка', en: 'support' },
      { word: 'tradisjon', translation: 'традиция', ua: 'традиція', en: 'tradition' },
      { word: 'generasjon', translation: 'поколение', ua: 'покоління', en: 'generation' },
      { word: 'omsorg', translation: 'забота', ua: 'турбота', en: 'care' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om familiens rolle og hvordan dere støtter hverandre?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о роли семьи и о том, как вы поддерживаете друг друга?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про роль родини та про те, як ви підтримуєте одне одного?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about the role of family and how you support each other?',
    hints: [
      {
        label: 'Samhold (B1)',
        norsk: 'For meg betyr familien gjensidig støtte og omsorg på tvers av generasjoner.',
        ru: 'Для меня семья означает взаимную поддержку и заботу сквозь поколения.',
        ua: 'Для мене родина означає взаємну підтримку і турботу крізь покоління.',
        en: 'For me, family means mutual support and care across generations.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-familie',
    title: 'Bildebeskrivelse: Felles måltider og samvær',
    level: 'B1',
    part: 'picture',
    topic: 'familie',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv spisestua og reflekter over felles måltider for samholdet.',
    sourceText: 'Beskriv rommet på bildet og drøft hvorfor måltider sammen styrker familierelasjoner.',
    targetWords: [
      { word: 'samhold', translation: 'сплоченность', ua: 'згуртованість', en: 'solidarity, cohesion' },
      { word: 'samtaleemne', translation: 'тема для разговора', ua: 'тема для розмови', en: 'conversation topic' },
      { word: 'tilstedeværelse', translation: 'присутствие, вовлеченность', ua: 'присутність, залученість', en: 'presence' },
      { word: 'hverdagsprat', translation: 'разговоры о буднях', ua: 'буденна розмова', en: 'everyday chat' },
      { word: 'rutine', translation: 'рутина, обычай', ua: 'рутина, звичка', en: 'routine' },
      { word: 'dele', translation: 'делиться', ua: 'ділитися', en: 'to share' }
    ],
    openingLine: 'Se på bildet av spisestua. Beskriv rommet, og forklar hvorfor felles måltider er viktige for samholdet i en familie.',
    openingTranslation: 'Посмотрите на изображение столовой. Опишите комнату и объясните, почему совместные трапезы важны для сплоченности семьи.',
    openingUa: 'Подивіться на зображення їдальні. Опишіть кімнату та поясніть, чому спільні трапези важливі для згуртованості родини.',
    openingEn: 'Look at the picture of the dining room. Describe the room, and explain why shared meals are important for family cohesion.',
    hints: [
      {
        label: 'Måltid (B1)',
        norsk: 'Felles middager gir tid til god hverdagsprat uten forstyrrelser fra mobiler.',
        ru: 'Совместные обеды дают время для хорошего разговора без отвлечения на телефоны.',
        ua: 'Спільні обіди дають час для гарної розмови без відволікання на телефони.',
        en: 'Shared dinners provide time for good everyday talk without mobile phone distractions.'
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
    id: 'np-b1-conversation-familie',
    title: 'Samtale: Balanse mellom jobb og familieliv',
    level: 'B1',
    part: 'conversation',
    topic: 'familie',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter organisering i hverdagen og fordeling av oppgaver i familien.',
    sourceText: 'Drøft sammen hvordan foreldre kan kombinere karriere med omsorg for barn.',
    targetWords: [
      { word: 'tidsklemme', translation: 'нехватка времени, цейтнот', ua: 'брак часу, цейтнот', en: 'time crunch' },
      { word: 'fordele', translation: 'распределять', ua: 'розподіляти', en: 'to distribute' },
      { word: 'samvittighet', translation: 'совесть', ua: 'совість', en: 'conscience' },
      { word: 'fleksitid', translation: 'гибкий график', ua: 'гнучкий графік', en: 'flexitime' },
      { word: 'samarbeide', translation: 'сотрудничать, кооперироваться', ua: 'співпрацювати', en: 'to collaborate' },
      { word: 'rettferdig', translation: 'справедливый', ua: 'справедливий', en: 'fair' }
    ],
    openingLine: 'Hei! Det kan være krevende å kombinere full jobb med familieliv. Hvordan tror du man best kan finne balansen?',
    openingTranslation: 'Привет! Совмещать полную занятость с семейной жизнью бывает непросто. Как ты думаешь, как лучше всего найти баланс?',
    openingUa: 'Привіт! Поєднувати повну зайнятість із сімейним життям буває непросто. Як ти думаєш, як найкраще знайти баланс?',
    openingEn: 'Hi! It can be demanding to combine full-time work with family life. How do you think one can best find the balance?',
    hints: [
      {
        label: 'Løsning (B1)',
        norsk: 'Det hjelper mye å fordele husarbeidet rettferdig og utnytte fleksitid på jobben.',
        ru: 'Очень помогает справедливое распределение домашних обязанностей и гибкий график работы.',
        ua: 'Дуже допомагає справедливий розподіл домашніх обов’язків і гнучкий графік роботи.',
        en: 'It helps a lot to distribute housework fairly and use flexitime at work.'
      }
    ],
    status: 'draft'
  },

  // 5. HANDEL
  {
    id: 'np-b1-presentation-handel',
    title: 'Presentasjon: Forbruk og handlemønster',
    level: 'B1',
    part: 'presentation',
    topic: 'handel',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om forbruksvanene dine og hva som påvirker innkjøpene.',
    sourceText: 'Fortell om hvordan du planlegger innkjøp, budsjett og vurderer kvalitet mot pris.',
    targetWords: [
      { word: 'forbruk', translation: 'потребление, расходы', ua: 'споживання, витрати', en: 'consumption' },
      { word: 'kvalitet', translation: 'качество', ua: 'якість', en: 'quality' },
      { word: 'budsjett', translation: 'бюджет', ua: 'бюджет', en: 'budget' },
      { word: 'påvirke', translation: 'влиять', ua: 'впливати', en: 'to influence' },
      { word: 'netthandel', translation: 'интернет-покупки', ua: 'онлайн-покупки', en: 'online shopping' },
      { word: 'vurdere', translation: 'оценивать, взвешивать', ua: 'оцінювати', en: 'to evaluate, consider' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om forbruksvanene dine og hva som påvirker valgene dine?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о ваших потребительских привычках и о том, что влияет на ваш выбор?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про ваші споживчі звички та про те, що впливає на ваш вибір?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about your consumer habits and what influences your choices?',
    hints: [
      {
        label: 'Forbruk (B1)',
        norsk: 'Jeg prøver å holde meg til et månedlig budsjett og vurdere kvalitet før jeg kjøper noe nytt.',
        ru: 'Я стараюсь держаться месячного бюджета и оценивать качество перед покупкой нового.',
        ua: 'Я намагаюся триматися місячного бюджету й оцінювати якість перед покупкою нового.',
        en: 'I try to stick to a monthly budget and consider quality before buying something new.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-handel',
    title: 'Bildebeskrivelse: Nærbutikken og lokalsamfunnet',
    level: 'B1',
    part: 'picture',
    topic: 'handel',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv butikken og drøft nærbutikkens rolle i nabolaget.',
    sourceText: 'Beskriv butikken på bildet og drøft nærbutikkens betydning som sosial møteplass.',
    targetWords: [
      { word: 'utvalg', translation: 'ассортимент', ua: 'асортимент', en: 'selection, assortment' },
      { word: 'møteplass', translation: 'место встречи', ua: 'місце зустрічі', en: 'meeting place' },
      { word: 'tilgjengelighet', translation: 'доступность', ua: 'доступність', en: 'accessibility' },
      { word: 'handleopplevelse', translation: 'впечатление от покупок', ua: 'досвід покупок', en: 'shopping experience' },
      { word: 'betjening', translation: 'обслуживание, персонал', ua: 'обслуговування, персонал', en: 'service, staff' },
      { word: 'varebeholdning', translation: 'наличие товаров', ua: 'наявність товарів', en: 'inventory' }
    ],
    openingLine: 'Se på bildet av butikken. Beskriv detaljene, og drøft hvorfor lokale matbutikker er viktige møteplasser i et nabolag.',
    openingTranslation: 'Посмотрите на изображение магазина. Опишите детали и обсудите, почему местные магазины важны как место встреч в районе.',
    openingUa: 'Подивіться на зображення магазину. Опишіть деталі та обговоріть, чому місцеві магазини важливі як місце зустрічей у районі.',
    openingEn: 'Look at the picture of the shop. Describe the details, and discuss why local grocery stores are important meeting places in a neighbourhood.',
    hints: [
      {
        label: 'Møteplass (B1)',
        norsk: 'Nærbutikken er ikke bare et sted å handle, men også en arena for å slå av en prat med naboer.',
        ru: 'Магазин у дома — это не просто место покупок, но и возможность поболтать с соседями.',
        ua: 'Магазин біля дому — це не просто місце покупок, а й можливість поспілкуватися із сусідами.',
        en: 'The local shop is not just a place to shop, but also an arena for chatting with neighbours.'
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
    id: 'np-b1-conversation-handel',
    title: 'Samtale: Netthandel eller fysisk butikk',
    level: 'B1',
    part: 'conversation',
    topic: 'handel',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter fordeler og ulemper ved netthandel versus fysiske butikker.',
    sourceText: 'Drøft sammen om netthandel truer lokale butikker, og hva som er mest praktisk.',
    targetWords: [
      { word: 'retur', translation: 'возврат товара', ua: 'повернення товару', en: 'return' },
      { word: 'leveringstid', translation: 'срок доставки', ua: 'термін доставки', en: 'delivery time' },
      { word: 'prøve', translation: 'примерять, пробовать', ua: 'приміряти', en: 'to try on' },
      { word: 'utvalg', translation: 'выбор, ассортимент', ua: 'вибір', en: 'selection' },
      { word: 'frakt', translation: 'доставка, перевозка', ua: 'доставка', en: 'shipping, freight' },
      { word: 'praktisk', translation: 'практичный, удобный', ua: 'практичний', en: 'convenient' }
    ],
    openingLine: 'Hei! Flere og flere handler klær og elektronikk på nettet. Hva foretrekker du — nettbutikk eller fysisk butikk?',
    openingTranslation: 'Привет! Все больше людей покупают одежду и технику в интернете. Что ты предпочитаешь — онлайн-магазин или обычный?',
    openingUa: 'Привіт! Дедалі більше людей купують одяг і техніку в інтернеті. Чому ти віддаєш перевагу — онлайн-магазину чи звичайному?',
    openingEn: 'Hi! More and more people shop for clothes and electronics online. What do you prefer — online or physical store?',
    hints: [
      {
        label: 'Fordeler (B1)',
        norsk: 'Netthandel er veldig praktisk, men jeg foretrekker fysiske butikker når jeg må prøve klær.',
        ru: 'Покупки онлайн очень удобны, но я предпочитаю обычные магазины, когда нужно примерить одежду.',
        ua: 'Покупки онлайн дуже зручні, але я віддаю перевагу звичайним магазинам, коли потрібно приміряти одяг.',
        en: 'Online shopping is very convenient, but I prefer physical stores when I have to try on clothes.'
      }
    ],
    status: 'draft'
  },

  // 6. TRANSPORT
  {
    id: 'np-b1-presentation-transport',
    title: 'Presentasjon: Transport og reisevaner',
    level: 'B1',
    part: 'presentation',
    topic: 'transport',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om transportvanene dine og kollektivtilbudet i ditt område.',
    sourceText: 'Fortell om reisevei, pålitelighet og hva som skal til for at flere reiser kollektivt.',
    targetWords: [
      { word: 'kollektivtilbud', translation: 'предложение общественного транспорта', ua: 'громадський транспорт', en: 'public transit service' },
      { word: 'pålitelig', translation: 'надежный', ua: 'надійний', en: 'reliable' },
      { word: 'avgang', translation: 'отправление, рейс', ua: 'відправлення, рейс', en: 'departure' },
      { word: 'forbindelse', translation: 'сообщение, пересадка', ua: 'сполучення', en: 'connection' },
      { word: 'månedskort', translation: 'проездной билет на месяц', ua: 'місячний проїзний', en: 'monthly pass' },
      { word: 'reisevei', translation: 'дорога на работу/учебу', ua: 'дорога на роботу', en: 'commute' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om transportvanene dine og hvordan tilbudet fungerer der du bor?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите о ваших транспортных привычках и о том, как работает транспорт там, где вы живете?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про ваші транспортні звички та про те, як працює транспорт там, де ви живете?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about your transport habits and how the service works where you live?',
    hints: [
      {
        label: 'Vurdering (B1)',
        norsk: 'Kollektivtilbudet er pålitelig med hyppige avganger, så jeg lar bilen stå hjemme.',
        ru: 'Общественный транспорт надежен с частыми рейсами, поэтому я оставляю машину дома.',
        ua: 'Громадський транспорт надійний із частими рейсами, тому я залишаю авто вдома.',
        en: 'Public transit is reliable with frequent departures, so I leave the car at home.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-transport',
    title: 'Bildebeskrivelse: Venteområdet og kollektivnettet',
    level: 'B1',
    part: 'picture',
    topic: 'transport',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv bussholdeplassen og forklar hva som gjør kollektivtransport attraktiv.',
    sourceText: 'Beskriv bildet av holdeplassen og drøft hva som kreves for at passasjerer skal føle seg trygge.',
    targetWords: [
      { word: 'passasjer', translation: 'пассажир', ua: 'пасажир', en: 'passenger' },
      { word: 'punktlighet', translation: 'пунктуальность', ua: 'пунктуальність', en: 'punctuality' },
      { word: 'skjerming', translation: 'укрытие от непогоды', ua: 'захист від негоди', en: 'shelter, protection' },
      { word: 'informasjon', translation: 'информация', ua: 'інформація', en: 'information' },
      { word: 'trygghet', translation: 'безопасность, спокойствие', ua: 'безпека, спокій', en: 'safety, security' },
      { word: 'frekvens', translation: 'частота рейсов', ua: 'частота рейсів', en: 'frequency' }
    ],
    openingLine: 'Se på bildet av bussholdeplassen. Beskriv holdeplassen, og forklar hva som gjør et kollektivnett attraktivt for passasjerene.',
    openingTranslation: 'Посмотрите на изображение автобусной остановки. Опишите ее и объясните, что делает общественный транспорт привлекательным для пассажиров.',
    openingUa: 'Подивіться на зображення автобусної зупинки. Опишіть її та поясніть, що робить громадський транспорт привабливим для пасажирів.',
    openingEn: 'Look at the picture of the bus stop. Describe the stop, and explain what makes a transit network attractive to passengers.',
    hints: [
      {
        label: 'Punktlighet (B1)',
        norsk: 'Presis punktlighet og oppdaterte rutetabeller er avgjørende for at folk skal stole på bussen.',
        ru: 'Точная пунктуальность и актуальное расписание решают все для доверия пассажиров к автобусу.',
        ua: 'Точна пунктуальність та актуальний розклад вирішують усе для довіри пасажирів до автобуса.',
        en: 'Precise punctuality and updated timetables are crucial for people to trust the bus.'
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
    id: 'np-b1-conversation-transport',
    title: 'Samtale: Kollektivtransport eller egen bil',
    level: 'B1',
    part: 'conversation',
    topic: 'transport',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter bompenger, bilbruk og kollektivtilbud i byer og distrikter.',
    sourceText: 'Drøft sammen hvorvidt kollektivtransport kan erstatte privatbilen overalt.',
    targetWords: [
      { word: 'bompenger', translation: 'плата за проезд', ua: 'плата за проїзд', en: 'toll fees' },
      { word: 'parkeringsplass', translation: 'парковочное место', ua: 'паркувальне місце', en: 'parking space' },
      { word: 'tilgjengelig', translation: 'доступный', ua: 'доступний', en: 'accessible' },
      { word: 'distrikt', translation: 'регион, провинция', ua: 'район, провінція', en: 'district, rural area' },
      { word: 'kostnad', translation: 'расходы, стоимость', ua: 'витрати', en: 'cost, expense' },
      { word: 'uavhengig', translation: 'независимый', ua: 'незалежний', en: 'independent' }
    ],
    openingLine: 'Hei! I byene blir det dyrere å kjøre bil på grunn av bompenger. Bør folk flest bruke mer kollektivtransport?',
    openingTranslation: 'Привет! В городах водить машину становится дороже из-за платных дорог. Должно ли большинство людей больше пользоваться общественным транспортом?',
    openingUa: 'Привіт! У містах їздити авто стає дорожче через платні дороги. Чи має більшість людей більше користуватися громадським транспортом?',
    openingEn: 'Hi! In cities driving is getting more expensive due to toll roads. Should most people use more public transit?',
    hints: [
      {
        label: 'Synspunkt (B1)',
        norsk: 'I store byer fungerer kollektivt bra, men i distriktene er folk helt avhengige av bil.',
        ru: 'В крупных городах транспорт работает хорошо, но в провинции люди полностью зависят от машины.',
        ua: 'У великих містах транспорт працює добре, але в провінції люди повністю залежать від авто.',
        en: 'In big cities transit works well, but in rural areas people are completely dependent on cars.'
      }
    ],
    status: 'draft'
  },

  // 7. FRITID
  {
    id: 'np-b1-presentation-fritid',
    title: 'Presentasjon: Friluftsliv og meningsfull fritid',
    level: 'B1',
    part: 'presentation',
    topic: 'fritid',
    badge: 'Norskprøve B1 · Del 1',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Fortell om friluftsliv og fritidsaktiviteter som gir energi og glede.',
    sourceText: 'Fortell om naturopplevelser, hobbyer og hvordan du kobler av fra plikter.',
    targetWords: [
      { word: 'friluftsliv', translation: 'жизнь на природе, походы', ua: 'активний відпочинок на природі', en: 'outdoor life' },
      { word: 'naturopplevelse', translation: 'впечатления от природы', ua: 'враження від природи', en: 'nature experience' },
      { word: 'koble av', translation: 'отвлечься, перезагрузиться', ua: 'відволіктися, перезавантажитися', en: 'to disconnect, unwind' },
      { word: 'fellesskap', translation: 'сообщество, общение', ua: 'спільнота, коло спілкування', en: 'community' },
      { word: 'engasjement', translation: 'увлеченность, участие', ua: 'захопленість, участь', en: 'engagement' },
      { word: 'trivsel', translation: 'благополучие, радость', ua: 'затишок, комфорт', en: 'well-being' }
    ],
    openingLine: 'Velkommen til muntlig prøve. Vi begynner med en kort presentasjon. Kan du fortelle om friluftsliv og hva slags fritidsaktiviteter som gir deg glede?',
    openingTranslation: 'Добро пожаловать на устный экзамен. Мы начнем с короткой презентации. Расскажите об активном отдыхе на природе и о том, какие увлечения приносят вам радость?',
    openingUa: 'Ласкаво просимо на усний іспит. Ми почнемо з короткої презентації. Розкажіть про активний відпочинок на природі та про те, які захоплення приносять вам радість?',
    openingEn: 'Welcome to the oral exam. We start with a short presentation. Can you tell about outdoor life and what leisure activities bring you joy?',
    hints: [
      {
        label: 'Friluftsliv (B1)',
        norsk: 'Norsk natur gir fantastiske muligheter til å koble av og hente ny inspirasjon.',
        ru: 'Норвежская природа дает фантастические возможности отдохнуть и зарядиться вдохновением.',
        ua: 'Норвезька природа дає фантастичні можливості відпочити і зарядитися натхненням.',
        en: 'Norwegian nature offers fantastic opportunities to unwind and gain new inspiration.'
      }
    ],
    status: 'draft'
  },
  {
    id: 'np-b1-picture-fritid',
    title: 'Bildebeskrivelse: Grønne lunger i byen',
    level: 'B1',
    part: 'picture',
    topic: 'fritid',
    badge: 'Norskprøve B1 · Del 2',
    avatar: 'exam',
    partnerName: 'Sensor Kari',
    partnerRole: 'Eksaminator ved HK-dir',
    description: 'Beskriv parken og drøft hvorfor grønne lunger er viktige for innbyggerne.',
    sourceText: 'Beskriv parken på bildet og drøft betydningen av offentlige friområder i tettbygde strøk.',
    targetWords: [
      { word: 'grøntområde', translation: 'зеленая зона', ua: 'зелена зона', en: 'green space' },
      { word: 'rekreasjon', translation: 'отдых, рекреация', ua: 'відпочинок, рекреація', en: 'recreation' },
      { word: 'innbygger', translation: 'житель', ua: 'мешканець', en: 'resident' },
      { word: 'fysisk aktivitet', translation: 'физическая активность', ua: 'фізична активність', en: 'physical activity' },
      { word: 'møtested', translation: 'место встреч', ua: 'місце зустрічей', en: 'meeting place' },
      { word: 'bevare', translation: 'сохранять, беречь', ua: 'зберігати, берегти', en: 'to preserve' }
    ],
    openingLine: 'Se på bildet av parken. Beskriv hva du ser, og drøft hvorfor offentlige parker er viktige for innbyggerne.',
    openingTranslation: 'Посмотрите на изображение парка. Опишите то, что видите, и обсудите, почему общественные парки важны для жителей.',
    openingUa: 'Подивіться на зображення парку. Опишіть те, що бачите, та обговоріть, чому громадські парки важливі для мешканців.',
    openingEn: 'Look at the picture of the park. Describe what you see, and discuss why public parks are important for residents.',
    hints: [
      {
        label: 'Grøntområder (B1)',
        norsk: 'Parker fungerer som grønne lunger der folk kan drive med fysisk aktivitet og møte venner.',
        ru: 'Парки служат зелеными легкими, где люди могут заниматься спортом и встречаться с друзьями.',
        ua: 'Парки слугують зеленими легенями, де люди можуть займатися спортом і зустрічатися з друзями.',
        en: 'Parks act as green lungs where people can engage in physical activity and meet friends.'
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
    id: 'np-b1-conversation-fritid',
    title: 'Samtale: Skjermtid mot fysisk aktivitet',
    level: 'B1',
    part: 'conversation',
    topic: 'fritid',
    badge: 'Norskprøve B1 · Del 3',
    avatar: 'exam',
    partnerName: 'Medkandidat Jonas',
    partnerRole: 'Medkandidat på muntlig prøve',
    description: 'Diskuter skjermbruk og hvordan man motiverer seg til mer bevegelse.',
    sourceText: 'Drøft sammen hvordan man kan finne balansen mellom digitale medier og aktiv fritid.',
    targetWords: [
      { word: 'skjermtid', translation: 'время перед экраном', ua: 'час перед екраном', en: 'screen time' },
      { word: 'vane', translation: 'привычка', ua: 'звичка', en: 'habit' },
      { word: 'motivasjon', translation: 'мотивация', ua: 'мотивація', en: 'motivation' },
      { word: 'dørstokkmil', translation: 'первый шаг, барьер начала', ua: 'перший важкий крок', en: 'barrier to starting' },
      { word: 'frisk luft', translation: 'свежий воздух', ua: 'свіже повітря', en: 'fresh air' },
      { word: 'sosial', translation: 'общительный, социальный', ua: 'соціальний, товариський', en: 'social' }
    ],
    openingLine: 'Hei! Mange bruker mye fritid foran TV eller mobil. Hva tror du vi kan gjøre for å være mer aktive?',
    openingTranslation: 'Привет! Многие проводят много свободного времени перед телевизором или телефоном. Что мы можем сделать, чтобы быть активнее?',
    openingUa: 'Привіт! Багато хто проводить багато вільного часу перед телевізором чи телефоном. Що ми можемо зробити, щоб бути активнішими?',
    openingEn: 'Hi! Many people spend a lot of free time in front of the TV or phone. What do you think we can do to be more active?',
    hints: [
      {
        label: 'Motivasjon (B1)',
        norsk: 'Å gjøre avtaler med venner om å trene sammen gjør det mye lettere å komme seg ut.',
        ru: 'Договоренности с друзьями о совместных тренировках помогают выбраться из дома.',
        ua: 'Домовленості з друзями про спільні тренування допомагають вийти з дому.',
        en: 'Making agreements with friends to exercise together makes it much easier to get out.'
      }
    ],
    status: 'draft'
  }
];
