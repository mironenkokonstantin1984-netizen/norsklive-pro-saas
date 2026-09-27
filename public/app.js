// NorskLive Pro — Client Studio Engine
// Calls server-side POST /api/coach; no client-side API keys or external scraping

(function () {
  const state = {
    currentModule: 'norskprove',
    currentScenario: null,
    l1Lang: 'ru',
    userLevel: 'B1',
    agentPersona: 'standard',
    speechRate: 0.96,
    blurMode: false,
    examPart: 1,
    usedWords: new Set(),
    savedGlossary: JSON.parse(localStorage.getItem('norsklive_glossary') || '[]'),
    chatHistory: [],
    coachingHistory: [],
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
    userLevelSelect: document.getElementById('userLevelSelect')
  };

  function getL1Text(obj, ruKey = 'translation', uaKey = 'ua', enKey = 'en') {
    if (!obj) return '';
    if (state.l1Lang === 'ua' && obj[uaKey]) return obj[uaKey];
    if (state.l1Lang === 'en' && obj[enKey]) return obj[enKey];
    return obj[ruKey] || obj.ru || '';
  }

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
      els.micStatusText.textContent =
        'L2 ASR Ready (`nb-NO` без автоисправления ошибок грамматики) — Нажми 🎙️';

      const text = els.userSpeechInput.value.trim();
      if (wasRecording && text.length > 1) {
        handleUserSubmission(text);
      }
    };
  }

  function init() {
    renderSavedGlossary();
    startSessionTimer();
    switchModule('norskprove');
    bindEvents();
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

  function switchModule(moduleKey) {
    state.currentModule = moduleKey;
    els.moduleTabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.module === moduleKey);
    });

    if (moduleKey === 'norskprove') {
      els.leftPanelTitle.textContent = '🎓 1. Norskprøve Muntlig (HK-dir)';
      els.complianceNotice.innerHTML =
        '🏛️ <strong>Закон UDI (с 01.09.2025):</strong> Для получения ПМЖ обязательна сдача устного экзамена Norskprøve (A2/B1). Мультиагентная симуляция (Sensor + Medkandidat).';
      els.customLoaderTitle.textContent = '➕ Своя экзаменационная тема / список слов';
    } else if (moduleKey === 'jobbintervju') {
      els.leftPanelTitle.textContent = '💼 2. Jobbintervju på norsk';
      els.complianceNotice.innerHTML =
        '👔 <strong>CV + Вакансия & Cultural Fit:</strong> Анализ разрыва между твоим CV и вакансией + адаптация ответов под норвежский командный стиль (lagspiller & lunsjprat).';
      els.customLoaderTitle.textContent = '➕ Вставьте текст вакансии и вашего CV';
    } else {
      els.leftPanelTitle.textContent = '🛡️ 3. CEFR Teleprompter';
      els.complianceNotice.innerHTML =
        '🛡️ <strong>Åndsverkloven & Kopinor 2026–2027 Safe:</strong> 100% проприетарные модули CEFR + телесуфлёр на 10 твоих слов.';
      els.customLoaderTitle.textContent = '➕ Введите 10 своих слов для вывода в речь';
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
    const openingL1 =
      state.l1Lang === 'ua'
        ? scenario.openingUa || scenario.openingTranslation
        : state.l1Lang === 'en'
          ? scenario.openingEn || scenario.openingTranslation
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

      if (
        normalizedInput.includes(cleanTarget) ||
        (rootStem.length >= 4 && normalizedInput.includes(rootStem))
      ) {
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

  function appendMessage({ sender, norsk, l1 }) {
    state.chatHistory.push({ sender, norsk, l1 });

    const div = document.createElement('div');
    div.className = `msg-bubble ${sender === 'ai' ? 'msg-ai' : 'msg-user'} ${state.blurMode && sender === 'ai' ? 'blur-text' : ''}`;

    const flagIcon = state.l1Lang === 'ua' ? '🇺🇦' : state.l1Lang === 'en' ? '🇬🇧' : '🇷🇺';
    const speakerLabel =
      sender === 'ai' ? `🇳🇴 ${state.currentScenario.partnerName}` : '🎙️ Du (Кандидат)';

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

  async function handleUserSubmission(text) {
    const cleanText = (text || els.userSpeechInput.value || '').trim();
    if (!cleanText) return;

    els.userSpeechInput.value = '';
    window.speechSynthesis.cancel();

    appendMessage({ sender: 'user', norsk: cleanText, l1: '' });
    checkSpokenTargetWords(cleanText);

    els.micStatusText.textContent =
      '🧠 Серверный анализ V2-грамматики, уровня CEFR (A2→B2) и критерия Samhandling...';

    try {
      const sc = state.currentScenario;
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: state.currentModule,
          scenarioId: sc ? sc.id : 'np-b1b2-velferd-hjemmekontor',
          level: state.userLevel,
          l1: state.l1Lang,
          persona: state.agentPersona,
          userText: cleanText,
          history: state.chatHistory.slice(-20),
          usedWords: Array.from(state.usedWords),
          customScenario:
            sc && String(sc.id).startsWith('custom-')
              ? {
                  id: sc.id,
                  title: sc.title,
                  partnerName: sc.partnerName,
                  partnerRole: sc.partnerRole,
                  sourceText: sc.sourceText,
                  targetWords: sc.targetWords
                }
              : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

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
      els.micStatusText.textContent =
        'L2 ASR Ready (`nb-NO` без автоисправления ошибок грамматики) — Нажми 🎙️';
    } catch (err) {
      els.micStatusText.textContent = `Ошибка связи с сервером: ${err.message}`;
    }
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

    card.querySelector('.btn-listen-b2').addEventListener('click', () =>
      speakNorwegian(corr.b2_upgrade)
    );
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
      targetWords:
        targetWords.length > 0 ? targetWords : window.NORSK_SCENARIOS.norskprove[0].targetWords,
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

    els.userLevelSelect.addEventListener('change', (e) => {
      state.userLevel = e.target.value;
    });

    els.agentPersonaSelect.addEventListener('change', (e) => {
      state.agentPersona = e.target.value;
    });

    els.applyCustomSourceBtn.addEventListener('click', handleApplyCustomSource);

    els.fileUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        els.customSourceTextarea.value = ev.target.result;
      };
      reader.readAsText(file);
    });

    els.micToggleBtn.addEventListener('click', () => {
      if (!recognition) {
        alert(
          'Используйте браузер Chrome/Edge для голосового распознавания nb-NO или введите ответ текстом.'
        );
        return;
      }
      if (state.isRecording) recognition.stop();
      else {
        window.speechSynthesis.cancel();
        recognition.start();
      }
    });

    els.sendSpeechBtn.addEventListener('click', () =>
      handleUserSubmission(els.userSpeechInput.value)
    );
    els.userSpeechInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUserSubmission(els.userSpeechInput.value);
      }
    });

    els.blurToggleBtn.addEventListener('click', () => {
      state.blurMode = !state.blurMode;
      els.blurToggleBtn.classList.toggle('active', state.blurMode);
      document
        .querySelectorAll('.msg-ai')
        .forEach((el) => el.classList.toggle('blur-text', state.blurMode));
    });

    els.examPartBtn.addEventListener('click', () => {
      if (state.examPart < 3) {
        state.examPart++;
        updateExamStageUI();
        const sc = state.currentScenario;
        const nextPrompt =
          state.examPart === 2 ? sc.examStructure.part2Prompt : sc.examStructure.part3Prompt;
        appendMessage({
          sender: 'ai',
          norsk: nextPrompt,
          l1: 'Переход к следующему регламентированному этапу экзамена HK-dir!'
        });
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

    els.exportGlossaryBtn.addEventListener('click', exportReportAndGlossary);
    els.generateReportBtn.addEventListener('click', exportReportAndGlossary);
  }

  init();
})();
