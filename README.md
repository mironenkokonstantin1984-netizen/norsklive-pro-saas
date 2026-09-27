# 🇳🇴 NorskLive Pro — AI Muntlig Språkpartner & HK-dir Eksamen Simulator (SaaS 2026)

Полнофункциональная платформа (3-в-1 SaaS MVP) для подготовки к устному экзамену **Norskprøve Muntlig (HK-dir)**, прохождения собеседований по вакансиям **Finn.no (`Jobbintervju på norsk`)** и вывода лексики в активную речь через юридически чистый **CEFR Teleprompter (`Åndsverkloven & Kopinor 2026–2027 Compliant`)**.

📄 **Полное бизнес-обоснование, анализ рынка, расчёт Unit-экономики и архитектура:**  
👉 [**NORSKLIVE_PRO_SAAS_BLUEPRINT_2026.md**](./NORSKLIVE_PRO_SAAS_BLUEPRINT_2026.md)

---

## 🚀 3 Коммерческих Концепта внутри платформы

1. **🎓 Концепт №1: `Norskprøve Muntlig Simulator (HK-dir A2–B1 / B1–B2)`**
   * Разработан под новое требование **UDI (от 1 сентября 2025 г.)** об обязательной сдаче устного экзамена для получения ПМЖ (*Permanent oppholdstillatelse*).
   * **Мультиагентная архитектура:** 3 хронометрированных этапа (`Del 1: Individuell presentasjon`, `Del 2: Samhandling med medkandidat`, `Del 3: Sensor-utspørring`) с выбором поведения второго ИИ-кандидата (*Спорящий/перебивающий* или *Пассивный/нерешительный* для тренировки критерия `Samhandling`).
   * **Трансформация фраз `A2 → B2` + Проверка правила `V2-inversjon`** с микро-коррекциями на родном языке пользователя (**L1: 🇺🇦 Українська | 🇷🇺 Русский | 🇬🇧 English**).

2. **💼 Концепт №2: `Jobbintervju på norsk (Finn.no B2C Scraper + CV Gap + Lunsjprat)`**
   * Серверный скрейпер вакансий **`POST /api/scrape-finn`** (`server.js`) извлекает публичные данные вакансий с `Finn.no` без необходимости партнёрского API-ключа.
   * Отработка отраслевой лексики (**B2B Sales, Logistikk & Supply Chain, AI Automation, IT, Helse**) + дипломатический фильтр норвежской корпоративной культуры (*lagspiller, medvirkning, flat struktur*) и тренажёр **`Uformell Lunsjprat ved kaffemaskinen`**.

3. **🛡️ Концепт №3: `CEFR Aktiv-Teleprompter (100% Åndsverkloven & Kopinor 2026–2027 Safe)`**
   * Собственная юридически чистая база сценариев CEFR (параллельная муниципальной программе *Voksenopplæring* без копирования защищённых учебников *På vei / Stein på stein*).
   * **Генеративный 10-словный Телесуфлёр (`Active Recall Bingo`):** автоматическое распознавание целевых слов в живой речи пользователя (`✓ BRUKT I TALE`).

---

## 🛠️ Быстрый запуск проекта локально

```bash
npm install
npm start
```

Откройте в браузере (Chrome / Edge):
👉 **`http://localhost:3000/norsk`**
