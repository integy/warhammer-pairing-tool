# 🏆 WTC Pairing Tool v2

A React-powered tournament pairing assistant for **Warhammer 40K World Team Championship (WTC)** matches.

## What's New in v2

- ⚛️ **React + TypeScript rewrite** — modular, maintainable component architecture
- 💾 **localStorage persistence** — never lose your tournament state on refresh
- 🤖 **Auto-Optimal Pairing** — one-click best defender + attacker selection using maximin algorithm
- 📂 **JSON team format** — easier to edit, import/export support
- ↩️ **Undo support** — go back at any step
- 📥 **Export results** — CSV download + clipboard copy
- ⚙️ **Configurable settings** — change password, enable/disable protection
- 📱 **Mobile responsive** — works on phone and desktop

## Quick Start

```bash
npm install
npm run dev      # Development server
npm run build    # Production build to dist/
```

## How to Use

Open the app, enter password (`0821` by default).

1. **Setup** — Select Hong Kong team + opponent, view score matrix
2. **Round 1** — Select defenders → Click 🤖 Auto-Optimal or pick attackers manually → Pair → Confirm
3. **Round 2** — Same format with remaining players (skipped in 6P mode)
4. **Round 3** — Final round + auto-pairing for leftovers
5. **Results** — Edit scores, export CSV, copy to clipboard

## Adding Teams

Teams are JSON files in `teams/`. Format:

```json
{
  "key": "myteam",
  "name": "My Team",
  "players": [
    {
      "name": "Player Name",
      "army": "Army Name",
      "scores": { "Opponent Name": 4.5 }
    }
  ]
}
```

Add the team to `teams/manifest.json` or use the **Import JSON** button in the Setup page.

## Teams

20 teams loaded: Hong Kong, France, Japan, Malaysia, 黑石要塞, 長沙battle, 武漢擂肥王, Team HQ, and more.

## Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- localStorage for persistence
- No backend required — fully static
