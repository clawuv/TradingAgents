# Hermes-Agent Integration Roadmap

This document tracks the TradingAgents productization work inspired by Hermes Agent.

## Current Focus

- [x] Telegram bot foundation
- [x] Persistent Telegram settings
- [x] Persistent Telegram job records
- [x] Proxy-aware Telegram connectivity
- [x] Default CLI profile (ticker/date/language/provider/models/analysts/depth)
- [ ] User memory and usage reporting
- [ ] Reset and session hygiene commands
- [ ] Scheduled briefings
- [ ] Shared command layer across CLI and Telegram
- [ ] Watchlists and reusable trading skills
- [ ] Multi-platform gateway abstraction

## P0

### Stable Telegram assistant

- [x] `/analyze`
- [x] `/status`
- [x] `/config`
- [x] `/set_provider`
- [x] `/set_language`
- [x] `/set_analysts`
- [x] `/set_checkpoint`
- [ ] `/usage`
- [ ] `/reset`
- [ ] User profile persistence
- [ ] Global + per-chat usage metrics
- [ ] Scheduled open/close briefings

## P1

### Long-lived assistant UX

- [ ] `/new`
- [ ] `/retry`
- [ ] `/last`
- [ ] `/watchlist`
- [ ] `/compare`
- [ ] Trading skills/templates
- [ ] Better operator observability (`/health`, `/jobs`, `/last_error`)

## P2

### Hermes-style platform expansion

- [ ] Shared gateway abstraction
- [ ] Discord / Slack adapters
- [ ] Cross-platform user identity
- [ ] Unified command protocol
- [ ] Proactive workflow orchestration

## Notes

- The immediate development batch is `User Memory + /reset + /usage`.
- Data is currently persisted under `data_cache_dir/telegram/`.
