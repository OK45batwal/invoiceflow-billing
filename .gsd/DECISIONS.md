# DECISIONS.md

## Active Decisions

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2026-03-31 | Application shape | Keep a single Node.js + Express app serving both API and frontend | Matches the current codebase and keeps local deployment simple |
| 2026-03-31 | Storage strategy | Keep JSON as the default store and SQLite as an opt-in mode | Preserves zero-config local use while allowing safer persistence where supported |
| 2026-03-31 | Auth model | Keep role-based `admin` and `staff` users with bearer-token sessions | Aligns with the current UI, route guards, and operational simplicity |
| 2026-03-31 | GSD versioning scope | Commit durable project docs and ignore session-oriented files | Keeps repo history focused while preserving local working memory |
