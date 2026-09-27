# Цикл «Claude Code → Antigravity → Claude Code»

Задачи ставит и проверяет Claude Code. Выполняет Antigravity в IDE владельца.
**Владелец делает две вещи: запускает задачу одной командой и жмёт Merge.** Вопросы и правки
Antigravity и Claude Code решают между собой в PR на GitHub.

```
Claude Code: создаёт issue с меткой agent-task (задача + критерии приёмки)
        │
        ▼
Владелец: одна команда /goal (см. ниже)
        │
        ▼
Antigravity: ветка agent/issue-N → первый коммит → черновой PR «Closes #N» → остальные задачи
        │   вопрос? → комментарий в PR «❓ Question for reviewer: …» → Claude отвечает в PR
        ▼
Antigravity: CI зелёный → PR «Ready for review» → скилл review-loop (каждые 5 мин читает PR)
        │
        ▼
Claude Code (события PR приходят автоматически): проверяет критерии, тесты, код
   ├─ есть правки → комментарий «@antigravity …» → Antigravity сам подхватывает, правит, пушит → …
   └─ всё принято → комментарий «✅ … accepted» → Antigravity завершает цель
        │
        ▼
Владелец: Merge → Claude Code ставит следующий issue
```

## Разовая настройка Antigravity (владелец)
1. **GitHub MCP**: `…` → MCP Servers → Manage MCP Servers → View raw config
   (`~/.gemini/config/mcp_config.json`):
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
2. **Без подтверждений** — Settings → Agent:
   - *Terminal Command Auto Execution* → **Always Proceed** (или Turbo);
   - *Review Policy* → **Always Proceed**;
   - *Deny list* (эти команды всё равно спросят): `git push --force`, `git push -f`, `git push origin master`,
     `git reset --hard`, `rm -rf`, `gh pr merge`, `npm publish`;
   - если «Always Proceed» всё равно спрашивает (известная ошибка Antigravity), добавить в *Allow list*:
     `npm`, `npx`, `git`, `node`, `bash`, `curl`.
3. По желанию: **Context7** и **Playwright MCP**. Всего не больше ~50 инструментов MCP.

## Команда запуска (одна на задачу)
```
/goal Implement issue #<N> in mironenkokonstantin1984-netizen/norsklive-pro-saas exactly as written, following AGENTS.md (Autonomy section): never ask me for confirmation. Draft PR after the first commit; questions only as "❓ Question for reviewer:" comments on the PR. When done and CI is green, mark Ready for review and follow the review-loop skill until the reviewer posts ✅ accepted.
```
Перед этим: `git checkout master && git pull`.

## Правила и инструменты агента
- `AGENTS.md` — всегда активные правила, включая раздел *Autonomy*.
- `.agents/rules/` — безопасность, тесты, границы задачи.
- `.agents/skills/` — `verify-before-pr` (самопроверка), `pr-report` (отчёт), `address-review` (ответ на
  ревью), `review-loop` (ожидание ревью без владельца), `code-review` (самоаудит диффа), `design-system`
  (токены и правила интерфейса, `docs/DESIGN_SYSTEM.md`).

## Когда нужен владелец
- Merge PR.
- Решения, которые не относятся к коду: деньги, аккаунты, продукт — Claude Code спрашивает в своём чате.
- `⏸ Stopped waiting` в PR (3 часа без ответа или больше 5 раундов ревью) — перезапустить задачу или решить спор.
