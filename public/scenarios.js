// NorskLive Pro — 2026 Strategic SaaS Edition
// 100% Åndsverkloven & Kopinor-KS (2026-2027) Compliant Proprietary CEFR Content
// Supports L1 Micro-Corrections in Ukrainian (UA - 64% Voksenopplæring share), Russian (RU), and English (EN)

const _root = typeof window !== 'undefined' ? window : globalThis;

_root.NORSK_SCENARIOS = {
  // ============================================================================
  // CONCEPT #1: NORSKPRØVE MUNTLIG SIMULATOR (HK-dir Multi-Agent Architecture)
  // Driven by UDI Sept 1, 2025 Permanent Residency Oral Exam Mandate (A2/B1/B2)
  // ============================================================================
  norskprove: [
    {
      id: 'np-b1b2-velferd-hjemmekontor',
      title: 'Eksamen #1: Digitalisering, hjemmekontor og bærekraftig velferdsstat',
      level: 'B1–B2',
      badge: 'HK-dir B1–B2 · Multi-Agent',
      avatar: '🏛️',
      partnerName: 'Sensor Kari (HK-dir) & Medkandidat Jonas',
      partnerRole: 'Multi-Agent Eksamen: Del 1 (Monolog) · Del 2 (Medkandidat-debatt) · Del 3 (Sensor)',
      description: 'Официальный регламент HK-dir (20–25 мин): 1) Презентация (2–3 мин), 2) Samhandling-дебаты со вторым ИИ-кандидатом (перебивающим или пассивным), 3) Каверзные вопросы экзаменатора.',
      examStructure: {
        part1Prompt: 'DEL 1 (Individuell presentasjon — 2–3 min): Gjør rede for fordeler og ulemper ved økt bruk av hjemmekontor og digitalisering i det norske arbeidslivet.',
        part2Prompt: 'DEL 2 (Samhandling med Medkandidat — 5–7 min): Diskuter med medkandidat Jonas: Bør arbeidstakere ha lovfestet rett til hjemmekontor, eller svekker det arbeidsmiljøet og integreringen av nyansatte? (Husk å ta initiativ og inkludere medkandidaten!)',
        part3Prompt: 'DEL 3 (Sensor-utspørring — Samfunn & Velferdsstat): Hvordan henger høy sysselsetting sammen med finansieringen av den norske velferdsstaten når eldrebølgen øker?'
      },
      sourceText: `HK-dir Vurderingsmatrise (Uttale, Ordforråd, Grammatikk, Samhandling): For B2 kreves systematisk argumentasjon, inversjon (V2-regelen), komplekse leddsetninger og evne til å håndtere en medkandidat som enten avbryter eller er passiv.`,
      targetWords: [
        {
          word: 'å ta hensyn til',
          translation: 'учитывать / принимать во внимание',
          ua: 'брати до уваги / враховувати',
          en: 'to take into account / consider',
          example: 'Det er avgjørende å ta hensyn til miljøet og arbeidsmiljøet.'
        },
        {
          word: 'bærekraftig',
          translation: 'устойчивый / жизнеспособный',
          ua: 'сталий / життєздатний у довгостроковій перспективі',
          en: 'sustainable / viable long-term',
          example: 'Vi må sikre en bærekraftig velferdsstat for fremtiden.'
        },
        {
          word: 'på den annen side',
          translation: 'с другой стороны (связка B2)',
          ua: 'з іншого боку (зв’язка рівня B2)',
          en: 'on the other hand (B2 discourse marker)',
          example: 'På den annen side mister man den uformelle lunsjpraten.'
        },
        {
          word: 'til tross for at',
          translation: 'несмотря на то, что',
          ua: 'незважаючи на те, що',
          en: 'despite the fact that',
          example: 'Til tross for at man sparer reisetid, kan man føle seg isolert.'
        },
        {
          word: 'sysselsetting',
          translation: 'занятость населения',
          ua: 'зайнятість населення',
          en: 'employment rate / workforce participation',
          example: 'Høy sysselsetting er grunnmuren i den norske modellen.'
        },
        {
          word: 'inkludering',
          translation: 'интеграция / вовлечение в коллектив',
          ua: 'інтеграція / залучення до колективу',
          en: 'inclusion / workplace integration',
          example: 'Fysisk oppmøte på arbeidsplassen fremmer språklig inkludering.' },
        {
          word: 'følgelig',
          translation: 'следовательно / таким образом (B2)',
          ua: 'отже / відповідно (маркер B2)',
          en: 'consequently / therefore (B2)',
          example: 'Flere eldre lever lenger, og følgelig øker behovet for arbeidskraft.'
        }
      ],
      openingLine: 'Velkommen til muntlig norskprøve (B1–B2). Etter de nye UDI-reglene vurderer vi fire kriterier: Uttale, Ordforråd, Grammatikk og Samhandling. Vi starter med Del 1 (2–3 minutter monolog): Hva mener du er de viktigste fordelene og ulempene ved hjemmekontor og digitalisering for arbeidstakeren og det norske samfunnet? Vær så god!',
      openingTranslation: 'Добро пожаловать на устный Norskprøve (B1–B2). По новым правилам UDI мы оцениваем 4 критерия: Произношение, Словарь, Грамматику и Взаимодействие (Samhandling). Начинаем с Части 1 (монолог 2–3 мин): Каковы главные плюсы и минусы удалённой работы для работника и норвежского общества?',
      openingUa: 'Ласкаво просимо на усний Norskprøve (B1–B2). За новими правилами UDI ми оцінюємо 4 критерії: Вимову, Словниковий запас, Граматику та Взаємодію (Samhandling). Починаємо з Частини 1 (монолог 2–3 хв): Які головні переваги та недоліки дистанційної роботи для працівника та норвезького суспільства?',
      openingEn: 'Welcome to the oral Norskprøve (B1–B2). Under the new UDI regulations, we assess 4 criteria: Pronunciation, Vocabulary, Grammar, and Interaction (Samhandling). Let us begin with Part 1 (2–3 min monologue): What are the main advantages and disadvantages of remote work for employees and Norwegian society?',
      hints: [
        {
          label: 'B2-løft fra A2 til B2 (Strukturert)',
          norsk: 'Det er avgjørende å ta hensyn til både effektivitet og sosial tilhørighet når vi diskuterer hjemmekontor.',
          ru: 'Критически важно учитывать как эффективность, так и социальную принадлежность при обсуждении удалёнки.',
          ua: 'Критично важливо враховувати як ефективність, так і соціальну приналежність під час обговорення дистанційної роботи.',
          en: 'It is crucial to consider both efficiency and social belonging when discussing remote work.'
        },
        {
          label: 'Samhandling (Inkluder medkandidaten)',
          norsk: 'På den annen side kan for mye hjemmekontor svekke inkluderingen av nyansatte. Hva tenker du om dette, Jonas — er du enig?',
          ru: 'С другой стороны, избыток удалёнки может ослабить интеграцию новичков. Что ты об этом думаешь, Йонас — ты согласен?',
          ua: 'З іншого боку, надмірна дистанційна робота може послабити інтеграцію новачків. Що ти про це думаєш, Йонасе — ти згоден?',
          en: 'On the other hand, excessive remote work can weaken the inclusion of new hires. What do you think about this, Jonas — do you agree?'
        },
        {
          label: 'Velferdsstaten & Sysselsetting (B2)',
          norsk: 'Til tross for at fleksibilitet reduserer sykefravær, er høy sysselsetting og sterkt arbeidsmiljø nødvendig for en bærekraftig velferdsstat.',
          ru: 'Несмотря на то что гибкость снижает больничные, высокая занятость и сильный коллектив необходимы для устойчивого государства благосостояния.',
          ua: 'Незважаючи на те що гнучкість знижує лікарняні, висока зайнятість і сильний колектив необхідні для сталої держави добробуту.',
          en: 'Despite flexibility reducing sick leave, high employment and a strong work environment are necessary for a sustainable welfare state.'
        }
      ]
    },
    {
      id: 'np-a2b1-permanent-opphold',
      title: 'Eksamen #2 (UDI A2/B1-krav): Miljø, nærmiljø og frivillighet (Dugnad)',
      level: 'A2–B1',
      badge: 'UDI Permanent Opphold (A2–B1)',
      avatar: '🌱',
      partnerName: 'Sensor Tone & Medkandidat Olena',
      partnerRole: 'Offisiell prøve for permanent oppholdstillatelse (A2–B1)',
      description: 'Целевой тренажёр под обязательный экзамен A2/B1 для получения ПМЖ (Permanent oppholdstillatelse с 1 сентября 2025 г.). Темы: экология, сортировка отходов, волонтёрство и жизнь в коммуне.',
      examStructure: {
        part1Prompt: 'DEL 1 (Presentasjon): Fortell hva du gjør i hverdagen for å ta vare på miljøet, og hvorfor kildesortering og kollektivtransport er viktig.',
        part2Prompt: 'DEL 2 (Samhandling med medkandidat Olena): Diskuter sammen: Hvordan kan frivillige organisasjoner og idrettslag hjelpe innvandrere med å bli integrert i lokalsamfunnet?',
        part3Prompt: 'DEL 3 (Spørsmål fra sensor): Bør det være dyrere å kjøre bil i byene for å beskytte miljøet, eller rammer det barnefamilier urettferdig?'
      },
      sourceText: `UDI krever bestått muntlig prøve på A2/B1 for permanent oppholdstillatelse. Sensor ser etter evnen til å begrunne meninger (fordi, derfor, ettersom) og aktivt stille spørsmål til medkandidaten.`,
      targetWords: [
        { word: 'kildesortering', translation: 'раздельный сбор мусора', ua: 'сортування сміття', en: 'waste sorting / recycling', example: 'Kildesortering i hverdagen er en enkel måte å bidra på.' },
        { word: 'kollektivtransport', translation: 'общественный транспорт', ua: 'громадський транспорт', en: 'public transport', example: 'Jeg reiser med kollektivtransport til jobben hver dag.' },
        { word: 'lokalsamfunn', translation: 'местное сообщество / коммуна', ua: 'місцева громада', en: 'local community', example: 'Frivillig arbeid styrker samholdet i lokalsamfunnet.' },
        { word: 'å ta hensyn til', translation: 'принимать во внимание', ua: 'враховувати', en: 'to take into consideration', example: 'Vi må ta hensyn til barnefamilier som bor utenfor byen.' },
        { word: 'frivillighet', translation: 'волонтёрство', ua: 'волонтерство', en: 'volunteering', example: 'Frivillighet gir et verdifullt nettverk i Norge.' },
        { word: 'imidlertid', translation: 'однако / тем не менее', ua: 'однак / проте', en: 'however / nevertheless', example: 'Bompenger reduserer trafikk; imidlertid blir det dyrt for mange.' }
      ],
      openingLine: 'Hei og velkommen til muntlig prøve (A2–B1)! I Del 1 skal du fortelle om miljø og hverdagsliv: Hva gjør du selv for å ta vare på miljøet, og hvordan synes du kommunen legger til rette for kildesortering og kollektivtransport?',
      openingTranslation: 'Привет и добро пожаловать на устный экзамен (A2–B1)! В Части 1 расскажи об экологии и повседневной жизни: что ты делаешь для защиты среды и как коммуна организует сортировку отходов и транспорт?',
      openingUa: 'Привіт і ласкаво просимо на усний іспит (A2–B1)! У Частині 1 розкажи про екологію та повсякденне життя: що ти робиш для захисту довкілля і як комуна організовує сортування сміття та транспорт?',
      openingEn: 'Hello and welcome to the oral exam (A2–B1)! In Part 1, talk about the environment and daily life: what do you do to protect the environment, and how does the municipality facilitate waste sorting and public transport?',
      hints: [
        {
          label: 'Oppgradering fra A2 til B1+',
          norsk: 'I stedet for å si bare «miljø er viktig», sier jeg: Det er avgjørende å ta hensyn til miljøet gjennom kildesortering og kollektivtransport.',
          ru: 'Вместо простого «экология важна»: Критически важно заботиться о среде через сортировку отходов и общественный транспорт.',
          ua: 'Замість простого «екологія важлива»: Критично важливо дбати про довкілля через сортування сміття та громадський транспорт.',
          en: 'Instead of just "environment is important": It is crucial to care for the environment through waste sorting and public transport.'
        },
        {
          label: 'Inkluder medkandidaten (Samhandling)',
          norsk: 'Jeg bruker ofte kollektivtransport til jobb. Hvordan er tilbudet der du bor, Olena — bruker du buss eller bil?',
          ru: 'Я часто езжу на работу общественным транспортом. А как с этим там, где ты живёшь, Олена — ты пользуешься автобусом или машиной?',
          ua: 'Я часто їжджу на роботу громадським транспортом. А як із цим там, де ти живеш, Олено — ти користуєшся автобусом чи авто?',
          en: 'I often take public transport to work. How is the service where you live, Olena — do you use the bus or a car?'
        }
      ]
    }
  ],

  // ============================================================================
  // CONCEPT #2: JOBBINTERVJU PÅ NORSK (Job Ad + CV Gap + Lunsjprat)
  // ============================================================================
  jobbintervju: [
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
  ],

  // ============================================================================
  // CONCEPT #3: PROPRIETARY CEFR TELEPROMPTER (100% Åndsverkloven & Kopinor Safe)
  // Parallel to Voksenopplæring themes WITHOUT copyright infringement
  // ============================================================================
  pensum: [
    {
      id: 'cefr-b1-fastlege-helse',
      title: 'CEFR B1 Modul: Fastlege, egenmelding og helsesystemet',
      level: 'A2–B1',
      badge: '🛡️ Kopinor-Safe CEFR B1',
      avatar: '🩺',
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
      badge: '🛡️ Kopinor-Safe CEFR B1',
      avatar: '🏠',
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
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = _root.NORSK_SCENARIOS;
}
