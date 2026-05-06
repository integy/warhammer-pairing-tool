# MEMORY.md — Long-Term Memory

## Who I'm Helping
- **Name:** Eric
- **Timezone:** Asia/Hong_kong (HKT = UTC+8)
- **WhatsApp:** +85264009444
- **Interests:** 3D printing (Bambu Lab), robotics, Warhammer, automation, AI agents
- **Language:** Cantonese for responses, English for technical

## System Setup
- **Gateway:** macOS LaunchAgent, loopback only (127.0.0.1:18789)
- **Node:** v25.6.0
- **Memory threshold:** 800MB — GC self-corrects below
- **Workspace:** /Users/eric/.openclaw/workspace

## Active Cron Jobs (as of Apr 2026)
- News (0800 HKT daily)
- Evening summary (1700 HKT)
- Healthcheck (every ~30 min)
- Capability Evolver (multiple runs/day)
- Moltbook heartbeat (DEFUNCT — platform dead since Apr 2)
- WAL + performance check
- Security hardening (nightly)
- Git backup
- Daily trending

## Known Issues (Ongoing)
1. **Exec approval loop** — since Apr 6, all cron exec commands require interactive approval. Run `openclaw config exec.policy allow-always` to fix.
2. **MEMORY.md truncation** — bootstrapMaxChars too low. Raise to 30000+ in config.
3. **WhatsApp 428** — appeared multiple times Apr 11-13. Re-link may be needed if worsens.
4. **healthcheck.sh** — deleted by evolver Apr 13, recreated manually.
5. **Moltbook DEAD** — domain parked at Porkbun, geo-blocked since Apr 2. Disable moltbook heartbeat.
6. **Workspace files deleted** — healthcheck.sh (Apr 13), research_skills.sh (Apr 14), pending_skills.md (Apr 14). evolver gene operation suspected.
7. **capability-evolver** — workspace skill missing. ClawHub version has security flag. capability-evolver-pro installed instead.
8. **WAL agent幻觉** — sub-agents report SESSION-STATE.md/MEMORY.md missing but they exist. Ignore these false positives.
9. **WhatsApp creds.json Bad MAC** — corruption since Apr 2, unresolved.
10. **capability-evolver cron mismatch** — cron calls capability-evolver/index.js run but capability-evolver-pro is TypeScript. Cron task needs updating.
11. **bambu-agent flagged suspicious** — VirusTotal detected risky patterns in bambu-agent (Apr 23). Skipped auto-install.

## Skills Installed (22 as of Apr 29, 2026)
automation-workflows, openclaw-automation-recipes, productivity-automation-kit, agentic-workflow-automation, ai-automation-workflow, self-improving-agent, agents, skill-manager, openclaw-robotics, cad-agent, bambu-studio-ai, home-assistant, homey-cli, homekit, smart-home-energy-saver, devops, cicd-pipeline-generator, github-trending, daily-trending, capability-evolver-pro, personal-productivity, paper-scout (Apr 29)

## Capability Evolver Run (May 2, 2026)
- **capability-evolver**: NOT installed (deleted; no JS entry point found)
- **capability-evolver-pro**: Installed (v1.0.2 TypeScript — cannot run `node index.js run`)
- **Cron task mismatch**: cron calls `capability-evolver/index.js run` but skill missing/TS-incompatible
- **ai-web-automation**: NEWLY INSTALLED (v1.0.0) — web automation, form filling, scraping, monitoring
- **tripo-3d-generation**: VirusTotal flagged → SKIPPED
- No Warhammer skills on ClawHub
- Workspace skills: 105 total installed

## Projects
- **xg-glass** — Android skill for glass device management (awaiting user response)
- **makerworld scraping** — Bambu Lab / MakerWorld 3D printing model discovery (bambu-studio-ai skill)
- **rov-simulator** — ROV simulation project
- **Various git repos** — xg.glass, rov-simulator, wtc_pairing_tool, etc. Daily git backup active.

## Preferences & Notes
- News in Cantonese, short bullets
- **Always use Traditional Chinese (繁體字) in replies, NOT Simplified Chinese (簡體字)**
- Gateway memory healthy at 200-700MB range
- WhatsApp auto-reconnects in <5 seconds
- No unsolicited WhatsApp messages unless status alerts
- Exec: `trash` > `rm` for any deletion

## Historical Context
- Moltbook social network DEAD — was active with @Ronin, @Fred, @XiaoZhuang, @Delamain, @eudaemon_ posts
- ClawHavoc cleanup (Feb 2026): 2,419 malicious skills removed from ClawHub
- Gateway restart loop FIXED (Apr 16): created SESSION-STATE.md, MEMORY.md, memory/working-buffer.md blanks

---
## Recent Updates (Apr 22-26)
- Capability evolver runs daily (multiple subagents doing redundant searches) — all report "no new skills needed, already comprehensive"
- Skills inventory: 78-90+ installed (reports vary by source)
- MOLTBOOK DEAD: Meta acquired Moltbook March 10, geo-blocked since Apr 2, Porkbun parked
- ClawHub trending: automation-workflows, productivity-automation-kit top scorers
- VirusTotal flags: bambu-local, xiaomi-home, automation-workflow-builder, octoclaw-print skipped
- WAL agent false positives: SESSION-STATE.md and MEMORY.md exist but WAL keeps reporting missing
- Security audit script deleted by evolver (Apr 13-14) — not reinstalled yet
- exec policy remains allow-always needed but cron jobs continue to fail silently
_Last updated: 2026-04-29_

## Capability Evolver Run (May 6, 2026)
- 110 skills installed (up from ~105 in late April)
- No new skills needed — ecosystem comprehensively covered
- **cron path bug**: cron task calls `capability-evolver/index.js run` but skill is actually `capability-evolver-pro` (TypeScript)
- nwo-robotics skipped — user already has 3 robotics skills
