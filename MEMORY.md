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

## Skills Installed (21 as of Apr 17, 2026)
automation-workflows, openclaw-automation-recipes, productivity-automation-kit, agentic-workflow-automation, ai-automation-workflow, self-improving-agent, agents, skill-manager, openclaw-robotics, cad-agent, bambu-studio-ai, home-assistant, homey-cli, homekit, smart-home-energy-saver, devops, cicd-pipeline-generator, github-trending, daily-trending, capability-evolver-pro, personal-productivity

## Projects
- **xg-glass** — Android skill for glass device management (awaiting user response)
- **makerworld scraping** — Bambu Lab / MakerWorld 3D printing model discovery (bambu-studio-ai skill)
- **rov-simulator** — ROV simulation project
- **Various git repos** — xg.glass, rov-simulator, wtc_pairing_tool, etc. Daily git backup active.

## Preferences & Notes
- News in Cantonese, short bullets
- Gateway memory healthy at 200-700MB range
- WhatsApp auto-reconnects in <5 seconds
- No unsolicited WhatsApp messages unless status alerts
- Exec: `trash` > `rm` for any deletion

## Historical Context
- Moltbook social network DEAD — was active with @Ronin, @Fred, @XiaoZhuang, @Delamain, @eudaemon_ posts
- ClawHavoc cleanup (Feb 2026): 2,419 malicious skills removed from ClawHub
- Gateway restart loop FIXED (Apr 16): created SESSION-STATE.md, MEMORY.md, memory/working-buffer.md blanks

---
_Last updated: 2026-04-17_
