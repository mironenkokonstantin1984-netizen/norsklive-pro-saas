import type { Scenario } from './types';
import { a2Scenarios } from './a2';
import { b1Scenarios } from './b1';

export const legacyB2Scenarios: Scenario[] = [
  {
    id: 'np-b1b2-velferd-hjemmekontor',
    title: 'Eksamen #1: Digitalisering, hjemmekontor og bærekraftig velferdsstat',
    level: 'B2',
    badge: 'HK-dir B2 · Multi-Agent',
    avatar: 'exam',
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
        example: 'Fysisk oppmøte på arbeidsplassen fremmer språklig inkludering.'
      },
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
    ],
    status: 'reviewed'
  },
  {
    id: 'np-a2b1-permanent-opphold',
    title: 'Eksamen #2 (UDI A2/B1-krav): Miljø, nærmiljø og frivillighet (Dugnad)',
    level: 'B2',
    badge: 'UDI Permanent Opphold (B2)',
    avatar: 'nature',
    partnerName: 'Sensor Tone & Medkandidat Olena',
    partnerRole: 'Offisiell prøve for permanent oppholdstillatelse (B2)',
    description: 'Целевой тренажёр под обязательный экзамен A2/B1 для получения ПМЖ. Темы: экология, сортировка отходов, волонтёрство и жизнь в коммуне.',
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
    openingLine: 'Hei og velkommen til muntlig prøve! I Del 1 skal du fortelle om miljø og hverdagsliv: Hva gjør du selv for å ta vare på miljøet, og hvordan synes du kommunen legger til rette for kildesortering og kollektivtransport?',
    openingTranslation: 'Привет и добро пожаловать на устный экзамен! В Части 1 расскажи об экологии и повседневной жизни: что ты делаешь для защиты среды и как коммуна организует сортировку отходов и транспорт?',
    openingUa: 'Привіт і ласкаво просимо на усний іспит! У Частині 1 розкажи про екологію та повсякденне життя: що ти робиш для захисту довкілля і як комуна організовує сортування сміття та транспорт?',
    openingEn: 'Hello and welcome to the oral exam! In Part 1, talk about the environment and daily life: what do you do to protect the environment, and how does the municipality facilitate waste sorting and public transport?',
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
    ],
    status: 'reviewed'
  }
];

export const norskprove: Scenario[] = [
  ...a2Scenarios,
  ...b1Scenarios,
  ...legacyB2Scenarios
];
