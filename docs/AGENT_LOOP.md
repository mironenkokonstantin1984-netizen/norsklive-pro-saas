# Цикл «Claude Code → Antigravity → Claude Code» (полуавтомат)

Задачи ставит и проверяет Claude Code. Выполняет Antigravity в IDE владельца.
Владелец только запускает Antigravity одной фразой и в конце жмёт Merge.

```
Claude Code: создаёт issue с меткой agent-task (задача + критерии приёмки)
        │
        ▼
Владелец: «Antigravity, возьми задачу»  (одна фраза, см. ниже)
        │
        ▼
Antigravity (IDE + GitHub MCP): ветка agent/issue-N → код → verify.sh → push → PR «Closes #N»
        │  события PR приходят Claude Code автоматически
        ▼
Claude Code: проверяет критерии, тесты, код
   ├─ есть правки → комментарий в PR, начинающийся с "@antigravity"
   │        → владелец: «Antigravity, возьми ревью» → Antigravity правит → push → …
   └─ всё принято → комментарий «✅ Принято» → владелец жмёт Merge → Claude ставит следующий issue
```

## Разовая настройка Antigravity (владелец)
1. Подключить **GitHub MCP**: в Antigravity → `…` → MCP Servers → Manage MCP Servers → View raw config
   (`~/.gemini/config/mcp_config.json`) и добавить:
   ```json
   {
     "mcpServers": {
       "github": {
         "serverUrl": "https://api.githubcopilot.com/mcp/",
         "headers": { "Authorization": "Bearer <GitHub fine-grained token>" }
       }
     }
   }
   ```
   Токен: fine-grained PAT только на этот репозиторий, права *Contents*, *Pull requests*, *Issues* = Read and write.
   Официальная инструкция: https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-antigravity.md
2. По желанию: **Context7** (актуальная документация библиотек) и **Playwright MCP** (проверка UI в браузере).
   Всего держать не больше ~50 инструментов. С этапа M1 — **Supabase MCP** в режиме read-only.
3. Создать в репозитории метки `agent-task` и `needs-human` (если их ещё нет).

## Фразы для запуска Antigravity
**Новая задача:**
> Open the oldest open issue in mironenkokonstantin1984-netizen/norsklive-pro-saas labelled `agent-task` that has no linked PR. Follow AGENTS.md: create branch `agent/issue-<N>` from `master`, implement the issue exactly, run `bash .agents/skills/verify-before-pr/scripts/verify.sh` until it passes, push, and open a PR into `master` with "Closes #<N>" and the report from the pr-report skill.

**Правки по ревью:**
> Open my open PR on an `agent/*` branch in mironenkokonstantin1984-netizen/norsklive-pro-saas. Read the latest comment starting with `@antigravity` and all unresolved review threads. Follow the address-review skill: fix every point, run verify.sh until it passes, push to the same branch, and reply on the PR in the address-review format.

## Правила и инструменты агента
- `AGENTS.md` — всегда активные правила.
- `.agents/rules/` — безопасность, тесты, границы задачи.
- `.agents/skills/` — `verify-before-pr` (самопроверка, `scripts/verify.sh`), `pr-report` (формат отчёта),
  `address-review` (как отвечать на ревью), `code-review` (самоаудит диффа).

## Остановка
Если по одному PR больше 5 раундов ревью, Claude Code ставит метку `needs-human` и пишет владельцу,
в чём расхождение. Дальше решает человек.
