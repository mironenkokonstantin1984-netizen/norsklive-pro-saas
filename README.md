# 🇳🇴 NorskLive Pro — AI Muntlig Språkpartner & HK-dir Eksamen Simulator

**NorskLive Pro** — полнофункциональная SaaS-платформа (3-в-1 MVP) для подготовки к устному экзамену **Norskprøve Muntlig (HK-dir)**, прохождения собеседований на норвежском языке (**Jobbintervju på norsk**) и вывода лексики в активную речь через юридически чистый **CEFR Teleprompter (`Åndsverkloven & Kopinor 2026–2027 Compliant`)**.

📄 **Полное бизнес-обоснование, анализ рынка, расчёт Unit-экономики и архитектура:**  
👉 [**NORSKLIVE_PRO_SAAS_BLUEPRINT_2026.md**](./NORSKLIVE_PRO_SAAS_BLUEPRINT_2026.md)

---

## 🚀 3 Концепта внутри платформы

1. **🎓 Концепт №1: `Norskprøve Muntlig Simulator (HK-dir A2–B1 / B1–B2)`**
   * Разработан под требование **UDI (от 1 сентября 2025 г.)** об обязательной сдаче устного экзамена для получения ПМЖ (*Permanent oppholdstillatelse*).
   * **Мультиагентная архитектура:** 3 хронометрированных этапа (`Del 1: Individuell presentasjon`, `Del 2: Samhandling med medkandidat`, `Del 3: Sensor-utspørring`) с выбором поведения второго ИИ-кандидата (*Спорящий/перебивающий* или *Пассивный/нерешительный* для тренировки критерия `Samhandling`).
   * **Трансформация фраз `A2 → B2` + Проверка правила `V2-inversjon`** с микро-коррекциями на родном языке пользователя (**L1: 🇺🇦 Українська | 🇷🇺 Русский | 🇬🇧 English**).

2. **💼 Концепт №2: `Jobbintervju på norsk (Stillingsannonse-analyse + CV Gap + Lunsjprat)`**
   * Вставка текста реальной вакансии и резюме кандидата (`Stillingsannonse & CV`) для персонализированного тренинга интервью.
   * Отработка отраслевой лексики (**B2B Sales, Logistikk & Supply Chain, AI Automation, IT, Helse**) + дипломатический фильтр норвежской корпоративной культуры (*lagspiller, medvirkning, flat struktur*) и тренажёр **`Uformell Lunsjprat ved kaffemaskinen`**.

3. **🛡️ Концепт №3: `CEFR Aktiv-Teleprompter (100% Åndsverkloven & Kopinor 2026–2027 Safe)`**
   * Собственная юридически чистая база сценариев CEFR (параллельная муниципальной программе *Voksenopplæring* без копирования защищённых учебников *På vei / Stein på stein*).
   * **Генеративный 10-словный Телесуфлёр (`Active Recall Bingo`):** автоматическое распознавание целевых слов в живой речи пользователя (`✓ BRUKT I TALE`).

---

## ⚙️ Переменные окружения (Environment Variables)

Скопируйте `.env.example` в `.env` (или задайте переменные окружения в Vercel / облачной среде):

| Переменная | Обязательна | По умолчанию | Описание |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Нет* | `""` | Серверный API-ключ Google Gemini. *Если не задан, сервер автоматически использует детерминированный R&D-движок (`fallback`).* |
| `GEMINI_MODEL` | Нет | `gemini-2.5-flash` | Модель Gemini для генерации ответов и языкового коучинга (`POST /api/coach`). |
| `PORT` | Нет | `3000` | Порт локального HTTP-сервера. |

> **Безопасность:** Ключ `GEMINI_API_KEY` хранится исключительно на сервере и никогда не передаётся в браузер клиента. Маршрут `POST /api/coach` (Next.js App Router) защищён валидацией `Zod`, заголовками безопасности в `next.config.ts`, лимитом тела запроса (`16kb`), защитой от prompt-injection и rate-лимитером (`30 запросов / 10 минут` на IP по `x-forwarded-for`).

---

## 🛠️ Быстрый запуск, проверка кода и тесты

```bash
# 1. Установка зависимостей (Node.js >= 20)
npm ci

# 2. Режим разработки (Next.js dev server)
npm run dev

# 3. Проверка линтером (ESLint) и типами (TypeScript)
npm run lint
npm run typecheck

# 4. Запуск модульных и интеграционных тестов (Vitest)
npm test

# 5. Production-сборка и запуск Next.js сервера
npm run build
npm start
```

Откройте в браузере (Chrome / Edge):
👉 **`http://localhost:3000/`** (маршрут `/norsk` автоматически перенаправляется на `/`).
