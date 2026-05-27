# 🏆 WTC Pairing Tool

A tournament pairing assistant for **Warhammer 40K World Team Championship (WTC)** matches.

## What It Does

WTC uses an 8-player team format where each round involves:
1. Each team selects a **Defender**
2. Each team selects **Attackers**
3. Defenders pick which opponent attacker they face

The tool guides you through 3 rounds of Attack/Defend pairings, showing:
- 📊 **Score matrix** — color-coded matchup data (green ≥4.0, yellow 3.0-3.9, red <3.0)
- ⭐ **Backward induction** — automatic best defender suggestion
- 💡 **Maximin suggestions** — optimal attacker pairs
- 🔢 **Dual score display** — shows both `[attacker→defender : defender→attacker]` scores
- 🏁 **Results page** — editable match table with team averages

Supports both **8-player** (3 rounds) and **6-player** (2 rounds) modes.

## How to Use

Open `index.html` in any browser. Password: `0821`

1. **Setup** — Select Hong Kong team + opponent from dropdowns
2. **Round 1** — Select defenders → attackers → pairings
3. **Round 2** — Same format with remaining players
4. **Round 3** — Final round + auto-pairing
5. **Results** — View/edit all matches and scores

## Adding Teams

Teams are stored as XML files in `teams/`. Format:

```xml
<team>
    <name>Team Name</name>
    <players>
        <player>
            <name>Player Name</name>
            <army>Army Name</army>
            <scores>
                <score opponent="Opponent Name">4.5</score>
            </scores>
        </player>
    </players>
</team>
```

Add the team key + display name to `TEAM_URLS` and `TEAM_NAMES` objects in `index.html`.

## Teams

21 teams currently loaded, including: Hong Kong, France, Japan, Malaysia, and various Chinese/regional teams.
