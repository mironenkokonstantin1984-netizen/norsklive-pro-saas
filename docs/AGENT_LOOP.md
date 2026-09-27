# Цикл «Claude Code → Antigravity → Claude Code»

> **Статус:** workflow `.github/workflows/antigravity-agent.yml` (автозапуск Antigravity в Actions)
> пока **не добавлен** — ждёт явного решения владельца. Сейчас Antigravity запускается вручную в IDE
> и работает по правилам и скиллам ниже; постановка задач и ревью идут через issues/PR.

Задачи ставит и проверяет Claude Code, выполняет Antigravity CLI (`agy`) в GitHub Actions.
От владельца нужен только финальный Merge.

```
Claude Code: создаёт issue → ставит метку agent-task
        │  (событие issues.labeled)
        ▼
Action antigravity-agent: ветка agent/issue-N → agy -p (headless) → verify.sh → commit + push → draft PR
        │  push/PR/комментарий → событие в PR
        ▼
Claude Code просыпается (подписка на PR): проверяет критерии приёмки, тесты, код
   ├─ есть правки → комментарий "@antigravity …" → Action запускается снова → …
   └─ всё принято → PR переводится в Ready + комментарий «✅ Принято» → владелец жмёт Merge
```

## Разовая настройка (владелец репозитория)
1. **Secrets** (Settings → Secrets and variables → Actions → New repository secret):
   - `GEMINI_API_KEY` — ключ из Google AI Studio (на нём работает `agy`).
   - `AGENT_PAT` — fine-grained personal access token только на этот репозиторий, права
     *Contents*, *Pull requests*, *Issues* = Read and write. Нужен, потому что пуши через
     стандартный `GITHUB_TOKEN` не запускают CI.
2. **Labels**: создать метки `agent-task` и `needs-human`.
3. **Branch protection** для `master`: merge только через PR, обязательный зелёный CI.
4. Workflow работает только после того, как попал в `master` (события `issues` читаются из default-ветки).

## Правила и инструменты агента
- `AGENTS.md` — всегда активные правила.
- `.agents/rules/` — безопасность, тесты, границы задачи.
- `.agents/skills/` — `verify-before-pr` (самопроверка, скрипт `scripts/verify.sh`),
  `pr-report` (формат отчёта), `address-review` (как отвечать на ревью), `code-review` (самоаудит диффа).

## Защита от зацикливания
- Action реагирует только на действия владельца репозитория и только на комментарии,
  начинающиеся с `@antigravity`, в PR с веткой `agent/*`.
- Больше 5 раундов ревью → метка `needs-human`, агент останавливается. Тогда нужно решение человека.
- Параллельно по одному issue работает не больше одного запуска (`concurrency`).

## Рекомендуемые MCP для локального Antigravity IDE (по желанию)
Файл `~/.gemini/config/mcp_config.json`, всего не больше ~50 инструментов:
- **GitHub MCP** (официальный, `serverUrl: https://api.githubcopilot.com/mcp/`) — читать issues/PR и отвечать в них.
- **Context7** — актуальная документация библиотек (меньше выдуманных API).
- **Playwright MCP** — проверка интерфейса в браузере.
- С этапа M1 — **Supabase MCP** в режиме read-only.
