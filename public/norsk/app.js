// NorskLive Pro — 2026 Strategic SaaS Core Engine
// Multi-Agent Norskprøve (HK-dir), Finn.no B2C Scraper, Kopinor-Safe CEFR Teleprompter, L1 (UA/RU/EN) Micro-Corrections

(function () {
  const state = {
    currentModule: 'norskprove', // 'norskprove' (Concept #1) | 'jobbintervju' (Concept #2) | 'pensum' (Concept #3)
    currentScenario: null,
    l1Lang: 'ru', // 'ru' | 'ua' | 'en'
    userLevel: 'B1',
    agentPersona: 'standard', // 'standard' | 'interrupting' | 'passive'
    speechRate: 0.96,
    blurMode: false,
    examPart: 1,
    usedWords: new Set(),
    savedGlossary: JSON.parse(localStorage.getItem('norsklive_glossary') || '[]'),
    chatHistory: [],
    coachingHistory: [],
    apiKey: localStorage.getItem('norsklive_gemini_key') || '',
    modelName: localStorage.getItem('norsklive_gemini_model') || 'gemini-2.5-flash',
    isRecording: false,
    isSpeaking: false,
    timerSeconds: 0,
    timerInterval: null
  };

  const els = {
    moduleTabs: document.querySelectorAll('.module-tab'),
    leftPanelTitle: document.getElementById('leftPanelTitle'),
    scenarioCountBadge: document.getElementById('scenarioCountBadge'),
    complianceNotice: document.getElementById('complianceNotice'),
    scenarioList: document.getElementById('scenarioList'),
    finnScraperBox: document.getElementById('finnScraperBox'),
    finnUrlInput: document.getElementById('finnUrlInput'),
    scrapeFinnBtn: document.getElementById('scrapeFinnBtn'),
    finnScrapeStatus: document.getElementById('finnScrapeStatus'),
    customLoaderTitle: document.getElementById('customLoaderTitle'),
    customSourceTextarea: document.getElementById('customSourceTextarea'),
    fileUploadInput: document.getElementById('fileUploadInput'),
    applyCustomSourceBtn: document.getElementById('applyCustomSourceBtn'),
    vocabProgressText: document.getElementById('vocabProgressText'),
    vocabProgressBar: document.getElementById('vocabProgressBar'),
    vocabBingoList: document.getElementById('vocabBingoList'),
    voiceOrb: document.getElementById('voiceOrb'),
    partnerAvatar: document.getElementById('partnerAvatar'),
    partnerName: document.getElementById('partnerName'),
    partnerRole: document.getElementById('partnerRole'),
    agentPersonaSelect: document.getElementById('agentPersonaSelect'),
    blurToggleBtn: document.getElementById('blurToggleBtn'),
    examPartBtn: document.getElementById('examPartBtn'),
    examBanner: document.getElementById('examBanner'),
    examStageLabel: document.getElementById('examStageLabel'),
    examPromptText: document.getElementById('examPromptText'),
    sessionTimerBadge: document.getElementById('sessionTimerBadge'),
    restartSessionBtn: document.getElementById('restartSessionBtn'),
    chatStream: document.getElementById('chatStream'),
    hintsContainer: document.getElementById('hintsContainer'),
    speakHintBtn: document.getElementById('speakHintBtn'),
    micToggleBtn: document.getElementById('micToggleBtn'),
    userSpeechInput: document.getElementById('userSpeechInput'),
    micStatusText: document.getElementById('micStatusText'),
    usedWordsToast: document.getElementById('usedWordsToast'),
    sendSpeechBtn: document.getElementById('sendSpeechBtn'),
    coachingCardsList: document.getElementById('coachingCardsList'),
    overallCefrBadge: document.getElementById('overallCefrBadge'),
    scoreFlyt: document.getElementById('scoreFlyt'),
    scoreOrd: document.getElementById('scoreOrd'),
    scoreGram: document.getElementById('scoreGram'),
    scoreArg: document.getElementById('scoreArg'),
    savedWordsCount: document.getElementById('savedWordsCount'),
    savedGlossaryList: document.getElementById('savedGlossaryList'),
    exportGlossaryBtn: document.getElementById('exportGlossaryBtn'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    l1LangSelect: document.getElementById('l1LangSelect'),
    userLevelSelect: document.getElementById('userLevelSelect'),
    openGrantModalBtn: document.getElementById('openGrantModalBtn'),
    grantModal: document.getElementById('grantModal'),
    closeGrantModalBtn: document.getElementById('closeGrantModalBtn'),
    openApiModalBtn: document.getElementById('openApiModalBtn'),
    apiStatusLabel: document.getElementById('apiStatusLabel'),
    apiModal: document.getElementById('apiModal'),
    geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
    geminiModelSelect: document.getElementById('geminiModelSelect'),
    closeApiModalBtn: document.getElementById('closeApiModalBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn')
  };

  // Helper to get localized L1 text (UA / RU / EN)
  function getL1Text(obj, ruKey = 'translation', uaKey = 'ua', enKey = 'en') {
    if (!obj) return '';
    if (state.l1Lang === 'ua' && obj[uaKey]) return obj[uaKey];
    if (state.l1Lang === 'en' && obj[enKey]) return obj[enKey];
    return obj[ruKey] || obj.ru || '';
  }

  // Web Speech API (nb-NO) Setup
  let recognition = null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'nb-NO';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      state.isRecording = true;
      els.micToggleBtn.classList.add('recording');
      els.voiceOrb.classList.remove('speaking');
      els.voiceOrb.classList.add('listening');
      els.micStatusText.textContent = '🔴 Слушаю норвежскую речь (L2 ASR nb-NO)... Говорите!';
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      els.userSpeechInput.value = transcript;
    };

    recognition.onerror = (event) => {
      state.isRecording = false;
      els.micToggleBtn.classList.remove('recording');
      els.voiceOrb.classList.remove('listening');
      els.micStatusText.textContent = `Статус микрофона: ${event.error}. Можно говорить или писать в поле.`;
    };

    recognition.onend = () => {
      const wasRecording = state.isRecording;
      state.isRecording = false;
      els.micToggleBtn.classList.remove('recording');
      els.voiceOrb.classList.remove('listening');
      els.micStatusText.textContent = 'L2 ASR Ready (`nb-NO` без автоисправления ошибок грамматики) — Нажми 🎙️';

      const text = els.userSpeechInput.value.trim();
      if (wasRecording && text.length > 1) {
        handleUserSubmission(text);
      }
    };
  }

  function init() {
    updateApiStatusBadge();
    renderSavedGlossary();
    startSessionTimer();
    switchModule('norskprove');
    bindEvents();
  }

  function updateApiStatusBadge() {
    if (state.apiKey && state.apiKey.startsWith('AIza')) {
      els.openApiModalBtn.classList.remove('demo-mode');
      els.apiStatusLabel.textContent = `Gemini Live (${state.modelName})`;
    } else {
      els.openApiModalBtn.classList.add('demo-mode');
      els.apiStatusLabel.textContent = 'Smart R&D Demo / API';
    }
  }

  function startSessionTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerSeconds = 0;
    state.timerInterval = setInterval(() => {
      state.timerSeconds++;
      const mins = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
      const secs = String(state.timerSeconds % 60).padStart(2, '0');
      els.sessionTimerBadge.textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);
  }

  // ============================================================================
  // MODULE SWITCHING (CONCEPTS #1, #2, #3)
  // ============================================================================
  function switchModule(moduleKey) {
    state.currentModule = moduleKey;
    els.moduleTabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.module === moduleKey);
    });

    if (moduleKey === 'norskprove') {
      els.leftPanelTitle.textContent = '🎓 Концепт №1: Norskprøve (HK-dir)';
      els.complianceNotice.innerHTML = '🏛️ <strong>Закон UDI (с 01.09.2025):</strong> Для получения ПМЖ обязательна сдача устного экзамена Norskprøve (A2/B1). Мультиагентная симуляция (Sensor + Medkandidat).';
      els.finnScraperBox.style.display = 'none';
      els.customLoaderTitle.textContent = '➕ Своя экзаменационная тема / список слов';
    } else if (moduleKey === 'jobbintervju') {
      els.leftPanelTitle.textContent = '💼 Концепт №2: Finn.no Jobbintervju';
      els.complianceNotice.innerHTML = '👔 <strong>Finn.no Scraper + Cultural Fit:</strong> Анализ разрыва между твоим CV и вакансией + адаптация ответов под норвежский командный стиль (lagspiller & lunsjprat).';
      els.finnScraperBox.style.display = 'block';
      els.customLoaderTitle.textContent = '➕ Вставь текст своего CV / Søknad и вакансии';
    } else {
      els.leftPanelTitle.textContent = '🛡️ Концепт №3: CEFR Teleprompter';
      els.complianceNotice.innerHTML = '🛡️ <strong>Åndsverkloven & Kopinor 2026–2027 Safe:</strong> 100% проприетарные модули CEFR (без незаконного копирования På vei / Stein på stein) + телесуфлёр на 10 твоих слов.';
      els.finnScraperBox.style.display = 'none';
      els.customLoaderTitle.textContent = '➕ Введи 10 своих слов для вывода в речь';
    }

    const list = window.NORSK_SCENARIOS[moduleKey] || [];
    els.scenarioCountBadge.textContent = `${list.length} сценария`;
    renderScenarioList(list);
    if (list.length > 0) {
      selectScenario(list[0]);
    }
  }

  function renderScenarioList(list) {
    els.scenarioList.innerHTML = '';
    list.forEach((sc) => {
      const div = document.createElement('div');
      div.className = `scenario-item ${state.currentScenario && state.currentScenario.id === sc.id ? 'active' : ''}`;
      div.innerHTML = `
        <div class="scenario-top">
          <span class="scenario-badge">${sc.badge}</span>
          <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">${sc.level}</span>
        </div>
        <div class="scenario-name">${sc.avatar} ${sc.title}</div>
        <div class="scenario-desc">${sc.description}</div>
      `;
      div.addEventListener('click', () => selectScenario(sc));
      els.scenarioList.appendChild(div);
    });
  }

  function selectScenario(scenario) {
    state.currentScenario = scenario;
    state.usedWords = new Set();
    state.chatHistory = [];
    state.coachingHistory = [];
    state.examPart = 1;
    startSessionTimer();

    renderScenarioList(window.NORSK_SCENARIOS[state.currentModule] || []);

    els.partnerAvatar.textContent = scenario.avatar || '🇳🇴';
    els.partnerName.textContent = scenario.partnerName;
    els.partnerRole.textContent = `${scenario.badge} · ${scenario.partnerRole}`;

    if (state.currentModule === 'norskprove' && scenario.examStructure) {
      els.examBanner.style.display = 'block';
      els.examPartBtn.style.display = 'inline-flex';
      updateExamStageUI();
    } else {
      els.examBanner.style.display = 'none';
      els.examPartBtn.style.display = 'none';
    }

    renderVocabBingo();

    els.chatStream.innerHTML = '';
    const openingL1 = state.l1Lang === 'ua'
      ? (scenario.openingUa || scenario.openingTranslation)
      : state.l1Lang === 'en'
      ? (scenario.openingEn || scenario.openingTranslation)
      : scenario.openingTranslation;

    appendMessage({
      sender: 'ai',
      norsk: scenario.openingLine,
      l1: openingL1
    });

    renderHints(scenario.hints || []);
    speakNorwegian(scenario.openingLine);
  }

  function updateExamStageUI() {
    const sc = state.currentScenario;
    if (!sc || !sc.examStructure) return;
    if (state.examPart === 1) {
      els.examStageLabel.textContent = '🎓 ЭТАП 1 (Individuell presentasjon — 2–3 мин): ';
      els.examPromptText.textContent = sc.examStructure.part1Prompt;
      els.examPartBtn.textContent = '⏭️ К Этапу 2 (Дебаты с Medkandidat)';
    } else if (state.examPart === 2) {
      els.examStageLabel.textContent = '🗣️ ЭТАП 2 (Samhandling — Диалог с напарником 5–7 мин): ';
      els.examPromptText.textContent = sc.examStructure.part2Prompt;
      els.examPartBtn.textContent = '⏭️ К Этапу 3 (Вопросы Sensor HK-dir)';
    } else {
      els.examStageLabel.textContent = '🏛️ ЭТАП 3 (Каверзные вопросы экзаменатора HK-dir): ';
      els.examPromptText.textContent = sc.examStructure.part3Prompt;
      els.examPartBtn.textContent = '✅ Завершить и скачать вердикт HK-dir';
    }
  }

  // ============================================================================
  // ACTIVE VOCABULARY BINGO & L1 TRANSLATIONS
  // ============================================================================
  function renderVocabBingo() {
    const words = (state.currentScenario && state.currentScenario.targetWords) || [];
    const usedCount = state.usedWords.size;
    const total = words.length;
    const pct = total > 0 ? Math.round((usedCount / total) * 100) : 0;

    els.vocabProgressText.textContent = `${usedCount} / ${total} brukt (${pct}%)`;
    els.vocabProgressBar.style.width = `${pct}%`;
    els.scoreOrd.textContent = `${usedCount} av ${total} målord (${pct}%)`;

    els.vocabBingoList.innerHTML = '';
    words.forEach((item) => {
      const isUsed = state.usedWords.has(item.word.toLowerCase());
      const l1Meaning = getL1Text(item, 'translation', 'ua', 'en');
      const chip = document.createElement('div');
      chip.className = `vocab-chip ${isUsed ? 'used' : ''}`;
      chip.innerHTML = `
        <div class="vocab-chip-top">
          <span class="vocab-word">🔊 ${item.word}</span>
          <span class="vocab-status">${isUsed ? '✓ BRUKT I TALE' : 'ЦЕЛЬ'}</span>
        </div>
        <div class="vocab-ru">${l1Meaning}</div>
        <div class="vocab-ex">«${item.example}»</div>
      `;
      chip.addEventListener('click', () => {
        speakNorwegian(item.example || item.word);
        saveToGlossary(item.word, l1Meaning, item.example);
      });
      els.vocabBingoList.appendChild(chip);
    });
  }

  function checkSpokenTargetWords(userText) {
    const words = (state.currentScenario && state.currentScenario.targetWords) || [];
    const normalizedInput = userText.toLowerCase();
    const newlyUsed = [];

    words.forEach((item) => {
      const target = item.word.toLowerCase();
      if (state.usedWords.has(target)) return;

      const cleanTarget = target.replace(/^å\s+/, '').trim();
      const rootStem = cleanTarget.length > 5 ? cleanTarget.slice(0, -2) : cleanTarget;

      if (normalizedInput.includes(cleanTarget) || (rootStem.length >= 4 && normalizedInput.includes(rootStem))) {
        state.usedWords.add(target);
        newlyUsed.push(item.word);
      }
    });

    if (newlyUsed.length > 0) {
      renderVocabBingo();
      els.usedWordsToast.textContent = `🎉 Использовано в речи: ${newlyUsed.join(', ')}`;
      setTimeout(() => {
        els.usedWordsToast.textContent = '';
      }, 4500);
    }
  }

  // ============================================================================
  // CHAT STREAM & TELEPROMPTER HINTS
  // ============================================================================
  function appendMessage({ sender, norsk, l1 }) {
    state.chatHistory.push({ sender, norsk, l1 });

    const div = document.createElement('div');
    div.className = `msg-bubble ${sender === 'ai' ? 'msg-ai' : 'msg-user'} ${state.blurMode && sender === 'ai' ? 'blur-text' : ''}`;

    const flagIcon = state.l1Lang === 'ua' ? '🇺🇦' : state.l1Lang === 'en' ? '🇬🇧' : '🇷🇺';
    const speakerLabel = sender === 'ai' ? `🇳🇴 ${state.currentScenario.partnerName}` : '🎙️ Du (Кандидат)';

    div.innerHTML = `
      <div class="msg-meta">
        <span>${speakerLabel}</span>
        <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="msg-norsk">${norsk}</div>
      ${l1 ? `<div class="msg-translation">${flagIcon} ${l1}</div>` : ''}
      <div class="msg-actions">
        <button class="mini-action-btn btn-replay">🔊 Озвучить</button>
        <button class="mini-action-btn btn-save-phrase">📌 В словарь</button>
      </div>
    `;

    div.querySelector('.btn-replay').addEventListener('click', () => speakNorwegian(norsk));
    div.querySelector('.btn-save-phrase').addEventListener('click', () => {
      saveToGlossary(norsk.slice(0, 65), l1 || 'Lagret fra samtale', norsk);
    });

    els.chatStream.appendChild(div);
    els.chatStream.scrollTop = els.chatStream.scrollHeight;
  }

  function renderHints(hints) {
    els.hintsContainer.innerHTML = '';
    (hints || []).forEach((h) => {
      const l1Hint = getL1Text(h, 'ru', 'ua', 'en');
      const card = document.createElement('div');
      card.className = 'hint-card';
      card.innerHTML = `
        <div class="hint-label">💡 ${h.label}</div>
        <div class="hint-norsk">«${h.norsk}»</div>
        <div class="hint-ru">${l1Hint}</div>
      `;
      card.addEventListener('click', () => {
        els.userSpeechInput.value = h.norsk;
        handleUserSubmission(h.norsk);
      });
      els.hintsContainer.appendChild(card);
    });
  }

  // ============================================================================
  // MULTI-AGENT AI ENGINE (A2->B2 LØFT + SAMHANDLING + JANTELOVEN FILTER)
  // ============================================================================
  async function handleUserSubmission(text) {
    const cleanText = (text || els.userSpeechInput.value || '').trim();
    if (!cleanText) return;

    els.userSpeechInput.value = '';
    window.speechSynthesis.cancel();

    appendMessage({ sender: 'user', norsk: cleanText, l1: '' });
    checkSpokenTargetWords(cleanText);

    els.micStatusText.textContent = '🧠 Анализ V2-грамматики, уровня CEFR (A2→B2) и критерия Samhandling...';

    try {
      let result;
      if (state.apiKey && state.apiKey.startsWith('AIza')) {
        result = await callGeminiCoachAPI(cleanText);
      } else {
        result = generateStrategicRAndDFallback(cleanText);
      }

      if (result.correction) {
        addCoachingCard(result.correction);
        updateHkdirScores(result.correction);
      }

      appendMessage({
        sender: 'ai',
        norsk: result.reply_norsk,
        l1: result.reply_l1
      });

      if (result.next_hints && result.next_hints.length > 0) {
        renderHints(result.next_hints);
      }

      speakNorwegian(result.reply_norsk);
      els.micStatusText.textContent = 'L2 ASR Ready (`nb-NO` без автоисправления ошибок грамматики) — Нажми 🎙️';
    } catch (err) {
      const fallback = generateStrategicRAndDFallback(cleanText);
      addCoachingCard(fallback.correction);
      appendMessage({ sender: 'ai', norsk: fallback.reply_norsk, l1: fallback.reply_l1 });
      renderHints(fallback.next_hints);
      speakNorwegian(fallback.reply_norsk);
    }
  }

  async function callGeminiCoachAPI(userText) {
    const sc = state.currentScenario;
    const langName = state.l1Lang === 'ua' ? 'Ukrainian (Українська)' : state.l1Lang === 'en' ? 'English' : 'Russian (Русский)';
    const personaInstruction = state.agentPersona === 'interrupting'
      ? 'Du spiller en uenig og litt avbrytende medkandidat (Jonas) på muntlig Norskprøve Del 2. Utfordre brukerens argument høflig men bestemt.'
      : state.agentPersona === 'passive'
      ? 'Du spiller en usikker og passiv medkandidat som svarer kort, slik at brukeren må vise Samhandling ved å stille deg åpne spørsmål.'
      : `Du spiller ${sc.partnerName} (${sc.partnerRole}).`;

    const prompt = `${personaInstruction}
Brukerens mål-nivå: ${state.userLevel}. Brukerens morsmål (L1) for grammatiske forklaringer: ${langName}.
Kontekst: ${sc.sourceText}
Brukeren sa: "${userText}"

Returner KUN gyldig JSON:
{
  "reply_norsk": "Svar på norsk Bokmål (2-3 setninger) + åpent spørsmål",
  "reply_l1": "Oversettelse av ditt svar til ${langName}",
  "correction": {
    "original": "${userText}",
    "natural_bokmal": "Naturlig norsk Bokmål",
    "b2_upgrade": "Oppgradert B2-setning (f.eks. med 'Det er avgjørende å ta hensyn til...', 'bærekraftig', 'til tross for at')",
    "grammar_rule_l1": "Forklaring av grammatikk (V2-inversjon / ordvalg) OG norsk kulturell/Samhandling-feedback på ${langName}",
    "cefr_estimate": "A2, B1, B1+ eller B2",
    "v2_status": "Korrekt V2 / Pass på V2-inversjon",
    "samhandling_status": "Vurdering av Samhandling / Lagspiller-fokus"
  },
  "next_hints": [
    { "label": "B2-oppgradert svar", "norsk": "Forslag 1 på norsk", "ru": "Oversettelse (${langName})", "ua": "Oversettelse (${langName})", "en": "Oversettelse (${langName})" },
    { "label": "Samhandling (Spør tilbake)", "norsk": "Forslag 2 med spørsmål til motparten", "ru": "Oversettelse (${langName})", "ua": "Oversettelse (${langName})", "en": "Oversettelse (${langName})" }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.modelName}:generateContent?key=${encodeURIComponent(state.apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6 }
      })
    });
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  }

  // Built-in DeepTech R&D Analyzer (Handles exact examples from the Strategic Analysis!)
  function generateStrategicRAndDFallback(userText) {
    const sc = state.currentScenario;
    const unused = (sc.targetWords || []).filter((w) => !state.usedWords.has(w.word.toLowerCase()));
    const nextTarget = unused[0] || sc.targetWords[0] || { word: 'bærekraftig', translation: 'устойчивый', ua: 'сталий', en: 'sustainable', example: 'Vi trenger en bærekraftig modell.' };

    // 1. Check exact benchmark phrase from the Strategic Report ("Jeg tenker at miljø er viktig")
    const isSimpleMiljo = /miljø\s+er\s+viktig|tenker\s+at\s+miljø/i.test(userText);
    // 2. Check V2 inversion error
    const v2Mistake = /^(i dag|i går|nå|derfor|dessuten|ofte|vanligvis|i norge|etterpå)\s+(jeg|vi|du|man|han|hun|de)\s+(\w+)/i.exec(userText);
    // 3. Check if user asked a question back (Critical for HK-dir Samhandling criterion!)
    const askedQuestion = userText.includes('?') || /hva\s+(tenker|mener|synes)\s+du|er\s+du\s+enig/i.test(userText);

    let naturalBokmal = userText;
    let b2Upgrade = '';
    let explanationL1 = '';
    let cefr = 'B1';
    let v2Status = '✓ Korrekt V2-inversjon';
    let samhandlingStatus = askedQuestion ? '★ Отличная инициатива (Samhandling B2!)' : '⚠️ Не забудь задать встречный вопрос напарнику!';

    if (isSimpleMiljo) {
      cefr = 'A2 (Базовая конструкция)';
      naturalBokmal = 'Jeg mener at det er svært viktig å ta vare på miljøet i hverdagen.';
      b2Upgrade = 'Det er avgjørende å ta hensyn til miljøet for å sikre en bærekraftig velferdsstat på lang sikt.';
      explanationL1 = state.l1Lang === 'ua'
        ? '🎯 R&D Аналіз (A2 → B2): Фраза «Jeg tenker at miljø er viktig» звучить на рівні A2 (калька з «я думаю» + іменник без означеного артикля «miljøet»). На рівень B2 замінюємо на безбезособову конструкцію «Det er avgjørende å ta hensyn til miljøet...».'
        : state.l1Lang === 'en'
        ? '🎯 R&D Analysis (A2 → B2): The phrase "Jeg tenker at miljø er viktig" scores at A2 level (missing definite article "miljøet" and basic verb). To hit B2 on Norskprøve, upgrade to: "Det er avgjørende å ta hensyn til miljøet for å sikre en bærekraftig velferdsstat."'
        : '🎯 R&D Разбор из ТЗ (A2 → B2): Фраза «Jeg tenker at miljø er viktig» оценивается экзаменатором HK-dir на уровень A2 (глагол «tenker» вместо «mener/synes» и пропуск определённого артикля «miljøet»). Для уровня B2 перестраиваем через инфинитивный оборот и идиому: «Det er avgjørende å ta hensyn til miljøet for å sikre en bærekraftig velferdsstat».';
    } else if (v2Mistake) {
      cefr = 'A2/B1';
      v2Status = '⚠️ Нарушение V2-инверсии';
      naturalBokmal = userText.replace(v2Mistake[0], `${v2Mistake[1]} ${v2Mistake[3]} ${v2Mistake[2].toLowerCase()}`);
      b2Upgrade = `${naturalBokmal.replace(/\.$/, '')}, og følgelig bør vi legge til rette for ${nextTarget.word}.`;
      explanationL1 = state.l1Lang === 'ua'
        ? `⚠️ Правило V2 (Інверсія в норвезькій): після обставини «${v2Mistake[1]}» дієслово «${v2Mistake[3]}» обов’язково ставиться на 2-ге місце перед підметом «${v2Mistake[2]}»!`
        : state.l1Lang === 'en'
        ? `⚠️ Norwegian V2 Inversion Rule: After the fronted adverbial "${v2Mistake[1]}", the finite verb "${v2Mistake[3]}" MUST come in 2nd position before the subject "${v2Mistake[2]}"!`
        : `⚠️ Правило V2 (Инверсия): после обстоятельства «${v2Mistake[1]}» глагол «${v2Mistake[3]}» в норвежском языке ОБЯЗАН стоять на 2-м месте перед подлежащим «${v2Mistake[2]}»!`;
    } else {
      cefr = userText.split(' ').length >= 12 ? 'B1+ / B2' : 'B1';
      b2Upgrade = `Det er avgjørende å understreke at ${userText.charAt(0).toLowerCase() + userText.slice(1).replace(/\.$/, '')}, særlig når det gjelder ${nextTarget.word}.`;
      explanationL1 = state.l1Lang === 'ua'
        ? `✅ Граматично правильно! Щоб підняти фразу до впевненого B2 та пройти Cultural Fit, додай цільове поняття «${nextTarget.word}» (${nextTarget.ua}) і залучи співрозмовника питанням.`
        : state.l1Lang === 'en'
        ? `✅ Grammatically solid! To elevate this to B2 and score high on Samhandling / Cultural Fit, weave in "${nextTarget.word}" (${nextTarget.en}) and ask your partner a follow-up question.`
        : `✅ Грамматически верно! Чтобы поднять ответ до уверенного B2 (и учесть скандинавский Cultural Fit / Samhandling), добавь связку «Det er avgjørende å...» и термин «${nextTarget.word}» (${nextTarget.translation}).`;
    }

    // Multi-Agent Persona Reply (Standard Sensor vs Interrupting Medkandidat vs Passive Medkandidat)
    let replyNorsk = '';
    let replyL1 = '';

    if (state.agentPersona === 'interrupting') {
      replyNorsk = `Unnskyld at jeg avbryter deg litt, men ser du ikke en fare ved dette? På den annen side kan jo økt press føre til store kostnader! Hvordan vil du løse utfordringen med «${nextTarget.word}» i praksis?`;
      replyL1 = state.l1Lang === 'ua'
        ? `[Агент: Перебиваючий Medkandidat] Вибач, що перебиваю, але хіба ти не бачиш тут ризику? З іншого боку, це може призвести до витрат! Як ти вирішиш питання з «${nextTarget.word}» на практиці?`
        : state.l1Lang === 'en'
        ? `[Agent: Interrupting Co-Candidate] Sorry to interrupt, but don't you see a risk here? On the other hand, this could increase costs! How would you handle "${nextTarget.word}" in practice?`
        : `[Агент: Спорящий Medkandidat] Извини, что перебиваю, но разве ты не видишь здесь риска? С другой стороны, это может привести к затратам! Как ты решишь вопрос с «${nextTarget.word}» на практике?`;
    } else if (state.agentPersona === 'passive') {
      replyNorsk = askedQuestion
        ? `Å ja, takk for at du spør meg! Jeg var litt usikker, men jeg er enig med deg i at ${nextTarget.word} er viktig. Hva tror du myndighetene eller bedriften bør gjøre først?`
        : `Ja... jeg vet ikke helt, kanskje det. (Tips fra Sensor: Medkandidaten din er passiv! Still et direkte spørsmål som «Hva mener du, Jonas?» for å få poeng på Samhandling!)`;
      replyL1 = askedQuestion
        ? `[Агент: Пассивный Medkandidat вовлечён!] О, спасибо, что спросил меня! Я немного сомневался, но согласен с тобой насчёт «${nextTarget.word}». Как думаешь, что нужно сделать в первую очередь?`
        : `[Агент: Пассивный Medkandidat молчит] Да... даже не знаю, может быть. (Подсказка экзаменатора HK-dir: Твой напарник пассивен! Задай ему прямой вопрос «Hva tenker du om dette?», чтобы заработать балл за Samhandling!)`;
    } else {
      replyNorsk = `Takk for et godt resonnement! Hvis vi knytter dette til «${nextTarget.word}» — hvilke konkrete konsekvenser tror du det får på lang sikt?`;
      replyL1 = state.l1Lang === 'ua'
        ? `Дякую за гарний аргумент! Якщо пов’язати це з поняттям «${nextTarget.word}» (${nextTarget.ua}) — які конкретні наслідки це матиме в довгостроковій перспективі?`
        : state.l1Lang === 'en'
        ? `Thank you for a strong argument! If we link this to "${nextTarget.word}" (${nextTarget.en}) — what concrete consequences will it have long-term?`
        : `Спасибо за хорошее рассуждение! Если связать это с понятием «${nextTarget.word}» (${nextTarget.translation}) — какие конкретные последствия это даст в долгосрочной перспективе?`;
    }

    return {
      reply_norsk: replyNorsk,
      reply_l1: replyL1,
      correction: {
        original: userText,
        natural_bokmal: naturalBokmal,
        b2_upgrade: b2Upgrade,
        grammar_rule_l1: explanationL1,
        cefr_estimate: cefr,
        v2_status: v2Status,
        samhandling_status: samhandlingStatus
      },
      next_hints: [
        {
          label: `B2-ответ с целевым словом «${nextTarget.word}»`,
          norsk: `Det er avgjørende å ta hensyn til ${nextTarget.word}, ettersom ${nextTarget.example.toLowerCase()}`,
          ru: `Критически важно учитывать «${nextTarget.word}», поскольку...`,
          ua: `Критично важливо враховувати «${nextTarget.word}», оскільки...`,
          en: `It is crucial to take "${nextTarget.word}" into account, since...`
        },
        {
          label: 'Samhandling (Вовлечь напарника на B2)',
          norsk: `På den annen side ser vi ulike synspunkter her. Hva tenker du om ${nextTarget.word} — er du enig i dette?`,
          ru: `С другой стороны, здесь есть разные мнения. А что ты думаешь о «${nextTarget.word}» — ты согласен?`,
          ua: `З іншого боку, тут є різні думки. А що ти думаєш про «${nextTarget.word}» — ти згоден?`,
          en: `On the other hand, there are different views here. What do you think about "${nextTarget.word}" — do you agree?`
        }
      ]
    };
  }

  function addCoachingCard(corr) {
    state.coachingHistory.unshift(corr);
    const card = document.createElement('div');
    card.className = 'coaching-card';
    card.innerHTML = `
      <div class="coaching-row">
        <span class="coaching-tag tag-said">🔴 Hva du sa (${corr.cefr_estimate || 'B1'})</span>
        <div style="color:#fda4af;">«${corr.original}»</div>
      </div>
      <div class="coaching-row">
        <span class="coaching-tag tag-better">🟢 Naturlig Bokmål</span>
        <div style="color:#6ee7b7; font-weight:600;">«${corr.natural_bokmal}»</div>
      </div>
      <div class="coaching-row">
        <span class="coaching-tag tag-b2">🚀 B2-Oppgradering (HK-dir / Business Løft)</span>
        <div style="color:#c7d2fe; font-weight:600;">«${corr.b2_upgrade}»</div>
      </div>
      <div class="coaching-row">
        <span class="coaching-tag tag-rule">💡 L1 Микро-коррекция (${state.l1Lang.toUpperCase()}) & Samhandling</span>
        <div style="color:#fde68a; font-size:0.78rem;">${corr.grammar_rule_l1}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="mini-action-btn btn-listen-b2">🔊 Прослушать B2-фразу</button>
        <button class="mini-action-btn btn-save-b2">📌 В словарь</button>
      </div>
    `;

    card.querySelector('.btn-listen-b2').addEventListener('click', () => speakNorwegian(corr.b2_upgrade));
    card.querySelector('.btn-save-b2').addEventListener('click', () => {
      saveToGlossary(corr.b2_upgrade, corr.grammar_rule_l1, corr.natural_bokmal);
    });

    els.coachingCardsList.prepend(card);
  }

  function updateHkdirScores(corr) {
    els.overallCefrBadge.textContent = `Уровень: ${corr.cefr_estimate || 'B1+'}`;
    els.scoreGram.textContent = corr.v2_status || '✓ Korrekt V2';
    els.scoreArg.textContent = corr.samhandling_status || 'Активный диалог';
  }

  function speakNorwegian(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'nb-NO';
    utter.rate = state.speechRate;
    const voices = window.speechSynthesis.getVoices();
    const noVoice = voices.find((v) => v.lang.includes('nb') || v.lang.includes('no'));
    if (noVoice) utter.voice = noVoice;
    utter.onstart = () => {
      els.voiceOrb.classList.remove('listening');
      els.voiceOrb.classList.add('speaking');
    };
    utter.onend = () => {
      els.voiceOrb.classList.remove('speaking');
    };
    window.speechSynthesis.speak(utter);
  }

  // ============================================================================
  // FINN.NO B2C URL SCRAPER (Calls our /api/scrape-finn endpoint)
  // ============================================================================
  async function handleScrapeFinnUrl() {
    const url = els.finnUrlInput.value.trim();
    if (!url) return;
    els.finnScrapeStatus.textContent = '⏳ Извлекаем описание вакансии и отраслевые ключевые слова с Finn.no...';

    try {
      const res = await fetch('/api/scrape-finn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка скрейпинга');

      els.customSourceTextarea.value = data.extractedText;
      els.finnScrapeStatus.textContent = `✅ Вакансия «${data.title}» загружена! Нажми кнопку генерации ниже.`;
      handleApplyCustomSource();
    } catch (e) {
      els.finnScrapeStatus.textContent = `⚠️ Инфо: ${e.message}. Вы можете вставить текст вакансии вручную ниже.`;
    }
  }

  // ============================================================================
  // PROPRIETARY 10-WORD TELEPROMPTER & CUSTOM SCENARIO GENERATOR
  // ============================================================================
  function handleApplyCustomSource() {
    const raw = els.customSourceTextarea.value.trim();
    if (!raw) return;

    const tokens = raw
      .replace(/[.,!?;:()"«»]/g, ' ')
      .split(/[\s,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4);

    const uniqueWords = [...new Set(tokens)].slice(0, 10);
    const targetWords = uniqueWords.map((w) => ({
      word: w.toLowerCase(),
      translation: 'Целевое слово из твоего списка / вакансии',
      ua: 'Цільове слово з твого списку / вакансії',
      en: 'Target word from your custom list / job ad',
      example: `Det er viktig å fokusere på ${w.toLowerCase()} i denne situasjonen.`
    }));

    const customScenario = {
      id: 'custom-' + Date.now(),
      title: '⚡ Кастомный тренажёр: ' + raw.slice(0, 34) + '...',
      level: state.userLevel,
      badge: '🛡️ Kopinor-Safe Custom',
      avatar: '🎯',
      partnerName: 'AI Sparringpartner (Персональный сценарий)',
      partnerRole: 'Динамический телесуфлёр по твоим словам и источнику',
      description: raw.slice(0, 130),
      sourceText: raw,
      targetWords: targetWords.length > 0 ? targetWords : window.NORSK_SCENARIOS.norskprove[0].targetWords,
      openingLine: `Jeg har lagt inn dine ${targetWords.length} målord i teleprompteren! La oss starte rollespillet. Hvordan vil du bruke «${(targetWords[0] && targetWords[0].word) || 'arbeidsmiljø'}» for å beskrive din erfaring eller mening her?`,
      openingTranslation: `Я загрузил твои целевые слова (${targetWords.length} шт.) в телесуфлёр! Давай начнём ролевую тренировку. Как ты используешь первое слово в своём ответе?`,
      openingUa: `Я завантажив твої цільові слова (${targetWords.length} шт.) у телесуфлер! Давай почнемо рольове тренування.`,
      openingEn: `I loaded your ${targetWords.length} target words into the teleprompter! Let us begin the roleplay.`,
      hints: [
        {
          label: 'Использовать слово №1 + №2 (B1/B2)',
          norsk: `Det er avgjørende å ta hensyn til ${(targetWords[0] && targetWords[0].word) || 'dette'}, spesielt i kombinasjon med ${(targetWords[1] && targetWords[1].word) || 'praksis'}.`,
          ru: 'Критически важно учитывать первое понятие, особенно в сочетании со вторым.',
          ua: 'Критично важливо враховувати перше поняття, особливо в поєднанні з другим.',
          en: 'It is crucial to consider the first concept, especially in combination with the second.'
        }
      ]
    };

    window.NORSK_SCENARIOS[state.currentModule].unshift(customScenario);
    selectScenario(customScenario);
    els.customSourceTextarea.value = '';
  }

  function saveToGlossary(word, translation, example) {
    if (state.savedGlossary.some((x) => x.word === word)) return;
    state.savedGlossary.unshift({ word, translation, example });
    localStorage.setItem('norsklive_glossary', JSON.stringify(state.savedGlossary));
    renderSavedGlossary();
  }

  function renderSavedGlossary() {
    els.savedWordsCount.textContent = state.savedGlossary.length;
    els.savedGlossaryList.innerHTML = '';
    state.savedGlossary.forEach((item) => {
      const badge = document.createElement('span');
      badge.className = 'scenario-badge';
      badge.style.cursor = 'pointer';
      badge.textContent = `📌 ${item.word}`;
      badge.addEventListener('click', () => speakNorwegian(item.example || item.word));
      els.savedGlossaryList.appendChild(badge);
    });
  }

  function exportReportAndGlossary() {
    const sc = state.currentScenario;
    const lines = [
      `# 🇳🇴 NorskLive Pro — HK-dir & R&D Rapport (${new Date().toLocaleDateString()})`,
      `**Концепт:** ${state.currentModule.toUpperCase()} | **Сценарий:** ${sc ? sc.title : ''}`,
      `**Язык L1 микро-коррекций:** ${state.l1Lang.toUpperCase()} | **Оценка уровня:** ${els.overallCefrBadge.textContent}`,
      `**Активный словарь (Bingo):** ${state.usedWords.size} из ${(sc && sc.targetWords.length) || 0}`,
      ``,
      `## 1. Трансформация фраз (A2 → B2) и L1 Микро-коррекции`,
      ...state.coachingHistory.map(
        (c, i) =>
          `### Реплика ${i + 1}\n- **Что сказал кандидат (${c.cefr_estimate}):** ${c.original}\n- **Naturlig Bokmål:** ${c.natural_bokmal}\n- **B2-Oppgradering:** ${c.b2_upgrade}\n- **L1 Разбор & Samhandling:** ${c.grammar_rule_l1}\n`
      ),
      `## 2. Личный словарь (Min Ordbok)`,
      ...state.savedGlossary.map((g) => `- **${g.word}** — ${g.translation} (*«${g.example}»*)`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `NorskLive-HKdir-Report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }

  function bindEvents() {
    els.moduleTabs.forEach((btn) => {
      btn.addEventListener('click', () => switchModule(btn.dataset.module));
    });

    els.l1LangSelect.addEventListener('change', (e) => {
      state.l1Lang = e.target.value;
      renderVocabBingo();
      if (state.currentScenario) renderHints(state.currentScenario.hints || []);
    });

    els.agentPersonaSelect.addEventListener('change', (e) => {
      state.agentPersona = e.target.value;
    });

    els.scrapeFinnBtn.addEventListener('click', handleScrapeFinnUrl);
    els.applyCustomSourceBtn.addEventListener('click', handleApplyCustomSource);

    els.micToggleBtn.addEventListener('click', () => {
      if (!recognition) {
        alert('Используйте браузер Chrome/Edge для голосового распознавания nb-NO или введите ответ текстом.');
        return;
      }
      if (state.isRecording) recognition.stop();
      else {
        window.speechSynthesis.cancel();
        recognition.start();
      }
    });

    els.sendSpeechBtn.addEventListener('click', () => handleUserSubmission(els.userSpeechInput.value));
    els.userSpeechInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUserSubmission(els.userSpeechInput.value);
      }
    });

    els.blurToggleBtn.addEventListener('click', () => {
      state.blurMode = !state.blurMode;
      els.blurToggleBtn.classList.toggle('active', state.blurMode);
      document.querySelectorAll('.msg-ai').forEach((el) => el.classList.toggle('blur-text', state.blurMode));
    });

    els.examPartBtn.addEventListener('click', () => {
      if (state.examPart < 3) {
        state.examPart++;
        updateExamStageUI();
        const sc = state.currentScenario;
        const nextPrompt = state.examPart === 2 ? sc.examStructure.part2Prompt : sc.examStructure.part3Prompt;
        appendMessage({ sender: 'ai', norsk: nextPrompt, l1: 'Переход к следующему регламентированному этапу экзамена HK-dir!' });
        speakNorwegian(nextPrompt);
      } else {
        exportReportAndGlossary();
      }
    });

    els.restartSessionBtn.addEventListener('click', () => {
      if (state.currentScenario) selectScenario(state.currentScenario);
    });

    els.speakHintBtn.addEventListener('click', () => {
      const lastAi = [...state.chatHistory].reverse().find((m) => m.sender === 'ai');
      if (lastAi) speakNorwegian(lastAi.norsk);
    });

    els.openGrantModalBtn.addEventListener('click', () => els.grantModal.classList.add('open'));
    els.closeGrantModalBtn.addEventListener('click', () => els.grantModal.classList.remove('open'));

    els.openApiModalBtn.addEventListener('click', () => {
      els.geminiApiKeyInput.value = state.apiKey;
      els.apiModal.classList.add('open');
    });
    els.closeApiModalBtn.addEventListener('click', () => els.apiModal.classList.remove('open'));
    els.saveApiKeyBtn.addEventListener('click', () => {
      state.apiKey = els.geminiApiKeyInput.value.trim();
      state.modelName = els.geminiModelSelect.value;
      localStorage.setItem('norsklive_gemini_key', state.apiKey);
      localStorage.setItem('norsklive_gemini_model', state.modelName);
      updateApiStatusBadge();
      els.apiModal.classList.remove('open');
    });

    els.exportGlossaryBtn.addEventListener('click', exportReportAndGlossary);
    els.generateReportBtn.addEventListener('click', exportReportAndGlossary);
  }

  init();
})();
