const scenariosByModule = require('../public/scenarios');

function findScenario(moduleKey, scenarioId, customScenario) {
  if (customScenario && customScenario.sourceText) {
    return customScenario;
  }
  const moduleList = scenariosByModule[moduleKey] || scenariosByModule.norskprove || [];
  const found = moduleList.find((sc) => sc.id === scenarioId);
  return found || moduleList[0] || scenariosByModule.norskprove[0];
}

function generateStrategicRAndDFallback({
  userText,
  module = 'norskprove',
  scenarioId = 'np-b1b2-velferd-hjemmekontor',
  l1 = 'ru',
  persona = 'standard',
  usedWords = [],
  customScenario = null
}) {
  const sc = findScenario(module, scenarioId, customScenario);
  const usedSet = new Set((usedWords || []).map((w) => w.toLowerCase()));
  const targetWords = sc.targetWords || [];
  const unused = targetWords.filter((w) => !usedSet.has(w.word.toLowerCase()));
  const nextTarget = unused[0] ||
    targetWords[0] || {
      word: 'bærekraftig',
      translation: 'устойчивый',
      ua: 'сталий',
      en: 'sustainable',
      example: 'Vi trenger en bærekraftig modell.'
    };

  // 1. Check exact benchmark phrase from the Strategic Report ("Jeg tenker at miljø er viktig")
  const isSimpleMiljo = /miljø\s+er\s+viktig|tenker\s+at\s+miljø/i.test(userText);

  // 2. Check Norwegian V2 inversion error (e.g. "I dag jeg liker kaffe")
  const v2Mistake =
    /^(i dag|i går|nå|derfor|dessuten|ofte|vanligvis|i norge|etterpå|på jobben)\s+(jeg|vi|du|man|han|hun|de)\s+(\w+)/i.exec(
      userText.trim()
    );

  // 3. Check if user asked a follow-up question (HK-dir Samhandling criterion)
  const askedQuestion =
    userText.includes('?') || /hva\s+(tenker|mener|synes)\s+du|er\s+du\s+enig/i.test(userText);

  let naturalBokmal = userText;
  let b2Upgrade = '';
  let explanationL1 = '';
  let cefr = 'B1';
  let v2Status = '✓ Korrekt V2-inversjon';
  const samhandlingStatus = askedQuestion
    ? '★ Отличная инициатива (Samhandling B2!)'
    : '⚠️ Не забудь задать встречный вопрос напарнику!';

  if (isSimpleMiljo) {
    cefr = 'A2';
    naturalBokmal = 'Jeg mener at det er svært viktig å ta vare på miljøet i hverdagen.';
    b2Upgrade =
      'Det er avgjørende å ta hensyn til miljøet for å sikre en bærekraftig velferdsstat på lang sikt.';
    explanationL1 =
      l1 === 'ua'
        ? '🎯 R&D Аналіз (A2 → B2): Фраза «Jeg tenker at miljø er viktig» звучить на рівні A2 (калька з «я думаю» + іменник без означеного артикля «miljøet»). На рівень B2 замінюємо на безособову конструкцію «Det er avgjørende å ta hensyn til miljøet...».'
        : l1 === 'en'
          ? '🎯 R&D Analysis (A2 → B2): The phrase "Jeg tenker at miljø er viktig" scores at A2 level (missing definite article "miljøet" and basic verb). To hit B2 on Norskprøve, upgrade to: "Det er avgjørende å ta hensyn til miljøet for å sikre en bærekraftig velferdsstat."'
          : '🎯 R&D Разбор (A2 → B2): Фраза «Jeg tenker at miljø er viktig» оценивается экзаменатором HK-dir на уровень A2 (глагол «tenker» вместо «mener/synes» и пропуск определённого артикля «miljøet»). Для уровня B2 перестраиваем через инфинитивный оборот: «Det er avgjørende å ta hensyn til miljøet for å sikre en bærekraftig velferdsstat».';
  } else if (v2Mistake) {
    cefr = 'A2';
    v2Status = '⚠️ Pass på V2-inversjon (V2-feil oppdaget)';
    const adverbial = v2Mistake[1];
    const subject = v2Mistake[2].toLowerCase();
    const verb = v2Mistake[3];
    naturalBokmal = userText.trim().replace(v2Mistake[0], `${adverbial} ${verb} ${subject}`);
    b2Upgrade = `${naturalBokmal.replace(/\.$/, '')}, og følgelig bør vi legge til rette for ${nextTarget.word}.`;
    explanationL1 =
      l1 === 'ua'
        ? `⚠️ Правило V2 (Інверсія в норвезькій): після обставини «${adverbial}» дієслово «${verb}» обов’язково ставиться на 2-ге місце перед підметом «${subject}»!`
        : l1 === 'en'
          ? `⚠️ Norwegian V2 Inversion Rule: After the fronted adverbial "${adverbial}", the finite verb "${verb}" MUST come in 2nd position before the subject "${subject}"!`
          : `⚠️ Правило V2 (Инверсия): после обстоятельства «${adverbial}» глагол «${verb}» в норвежском языке ОБЯЗАН стоять на 2-м месте перед подлежащим «${subject}»!`;
  } else {
    cefr = userText.split(/\s+/).length >= 12 ? 'B1+ / B2' : 'B1';
    b2Upgrade = `Det er avgjørende å understreke at ${
      userText.charAt(0).toLowerCase() + userText.slice(1).replace(/\.$/, '')
    }, særlig når det gjelder ${nextTarget.word}.`;
    explanationL1 =
      l1 === 'ua'
        ? `✅ Граматично правильно! Щоб підняти фразу до впевненого B2 та пройти Cultural Fit, додай цільове поняття «${nextTarget.word}» (${nextTarget.ua || nextTarget.translation}) і залучи співрозмовника питанням.`
        : l1 === 'en'
          ? `✅ Grammatically solid! To elevate this to B2 and score high on Samhandling / Cultural Fit, weave in "${nextTarget.word}" (${nextTarget.en || nextTarget.translation}) and ask your partner a follow-up question.`
          : `✅ Грамматически верно! Чтобы поднять ответ до уверенного B2 (и учесть скандинавский Cultural Fit / Samhandling), добавь связку «Det er avgjørende å...» и термин «${nextTarget.word}» (${nextTarget.translation}).`;
  }

  let replyNorsk = '';
  let replyL1 = '';

  if (persona === 'interrupting') {
    replyNorsk = `Unnskyld at jeg avbryter deg litt, men ser du ikke en fare ved dette? På den annen side kan jo økt press føre til store kostnader! Hvordan vil du løse utfordringen med «${nextTarget.word}» i praksis?`;
    replyL1 =
      l1 === 'ua'
        ? `[Агент: Перебиваючий Medkandidat] Вибач, що перебиваю, але хіба ти не бачиш тут ризику? З іншого боку, це може призвести до витрат! Як ти вирішиш питання з «${nextTarget.word}» на практиці?`
        : l1 === 'en'
          ? `[Agent: Interrupting Co-Candidate] Sorry to interrupt, but don't you see a risk here? On the other hand, this could increase costs! How would you handle "${nextTarget.word}" in practice?`
          : `[Агент: Спорящий Medkandidat] Извини, что перебиваю, но разве ты не видишь здесь риска? С другой стороны, это может привести к затратам! Как ты решишь вопрос с «${nextTarget.word}» на практике?`;
  } else if (persona === 'passive') {
    replyNorsk = askedQuestion
      ? `Å ja, takk for at du spør meg! Jeg var litt usikker, men jeg er enig med deg i at ${nextTarget.word} er viktig. Hva tror du myndighetene eller bedriften bør gjøre først?`
      : `Ja... jeg vet ikke helt, kanskje det. (Tips fra Sensor: Medkandidaten din er passiv! Still et direkte spørsmål som «Hva mener du, Jonas?» for å få poeng på Samhandling!)`;
    replyL1 = askedQuestion
      ? `[Агент: Пассивный Medkandidat вовлечён!] О, спасибо, что спросил меня! Я немного сомневался, но согласен с тобой насчёт «${nextTarget.word}». Как думаешь, что нужно сделать в первую очередь?`
      : `[Агент: Пассивный Medkandidat молчит] Да... даже не знаю, может быть. (Подсказка экзаменатора HK-dir: Твой напарник пассивен! Задай ему прямой вопрос «Hva tenker du om dette?», чтобы заработать балл за Samhandling!)`;
  } else {
    replyNorsk = `Takk for et godt resonnement! Hvis vi knytter dette til «${nextTarget.word}» — hvilke konkrete konsekvenser tror du det får på lang sikt?`;
    replyL1 =
      l1 === 'ua'
        ? `Дякую за гарний аргумент! Якщо пов’язати це з поняттям «${nextTarget.word}» (${nextTarget.ua || nextTarget.translation}) — які конкретні наслідки це матиме в довгостроковій перспективі?`
        : l1 === 'en'
          ? `Thank you for a strong argument! If we link this to "${nextTarget.word}" (${nextTarget.en || nextTarget.translation}) — what concrete consequences will it have long-term?`
          : `Спасибо за хорошее рассуждение! Если связать это с понятием «${nextTarget.word}» (${nextTarget.translation}) — какие конкретные последствия это даст в долгосрочной перспективе?`;
  }

  const exampleSentence = nextTarget.example || `Vi bør satse på ${nextTarget.word}.`;

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
        norsk: `Det er avgjørende å ta hensyn til ${nextTarget.word}, ettersom ${exampleSentence.toLowerCase()}`,
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

module.exports = {
  generateStrategicRAndDFallback,
  findScenario
};
