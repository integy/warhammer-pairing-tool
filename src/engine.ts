import type { TournamentState, Settings, RoundState, RoundPairing, Team } from './types';

const STORAGE_KEY = 'wtc-pairing-state';
const SETTINGS_KEY = 'wtc-pairing-settings';

export function loadState(): TournamentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveState(state: TournamentState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { password: '0821', passwordEnabled: true };
  } catch { return { password: '0821', passwordEnabled: true }; }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// --- Engine: backward induction for defender suggestion ---
export interface DefenderAnalysis {
  hkIdx: number;
  hkName: string;
  hkArmy: string;
  oppWorstAttScore: number;
  oppWorstAttName: string;
  hkAttackAvg: number;
  netAdvantage: number;
}

export function analyzeDefenders(
  hkTeam: Team,
  oppTeam: Team,
  hkPool: number[],
  oppPool: number[]
): DefenderAnalysis[] {
  const hkPlayers = hkPool.map(i => hkTeam.players[i]);
  const oppPlayers = oppPool.map(i => oppTeam.players[i]);

  return hkPool.map((hkIdx) => {
    const hkPlayer = hkTeam.players[hkIdx];

    let oppWorstAttScore = Infinity;
    let oppWorstAttName = '-';
    oppPlayers.forEach(opp => {
      const s = opp.scores?.[hkPlayer.name];
      if (s !== undefined && s < oppWorstAttScore) {
        oppWorstAttScore = s;
        oppWorstAttName = opp.name;
      }
    });

    const remaining = hkPool.filter(i => i !== hkIdx);
    const hkAttackAvg = remaining.reduce((sum, idx) => {
      let best = -Infinity;
      oppPlayers.forEach(opp => {
        const s = hkTeam.players[idx].scores?.[opp.name];
        if (s !== undefined && s > best) best = s;
      });
      return sum + (best > -Infinity ? best : 0);
    }, 0) / (remaining.length || 1);

    return {
      hkIdx, hkName: hkPlayer.name, hkArmy: hkPlayer.army || '',
      oppWorstAttScore, oppWorstAttName, hkAttackAvg,
      netAdvantage: hkAttackAvg - oppWorstAttScore
    };
  }).sort((a, b) => b.netAdvantage - a.netAdvantage);
}

export function getTopAttackers(
  pool: number[],
  defenderName: string,
  team: Team
): number[] {
  if (pool.length < 2) return pool;
  const scored = pool
    .map(idx => ({ idx, score: team.players[idx]?.scores?.[defenderName] }))
    .filter(p => p.score !== undefined)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (scored.length < 2) return scored.map(s => s.idx);
  const cutoff = scored[1].score;
  return scored.filter(p => (p.score ?? 0) >= (cutoff ?? 0)).map(p => p.idx);
}

// Auto-optimal pairing for the entire round
export function autoOptimalRound(
  hkTeam: Team,
  oppTeam: Team,
  poolHK: number[],
  poolOpp: number[]
): { hkDefender: number; oppDefender: number; hkAttackers: number[]; oppAttackers: number[] } {
  const analysis = analyzeDefenders(hkTeam, oppTeam, poolHK, poolOpp);
  const bestHKDef = analysis[0].hkIdx;

  // Opponent also wants to minimize HK's advantage — they pick defender with lowest opponent avg
  const oppAnalysis = analyzeDefenders(oppTeam, hkTeam, poolOpp, poolHK);
  const bestOppDef = oppAnalysis[0].hkIdx;

  // HK attackers: top 2 vs opp defender
  const hkAttPool = poolHK.filter(i => i !== bestHKDef);
  const hkAtts = getTopAttackers(hkAttPool, oppTeam.players[bestOppDef].name, hkTeam).slice(0, 2);

  // Opp attackers: top 2 vs hk defender
  const oppAttPool = poolOpp.filter(i => i !== bestOppDef);
  const oppAtts = getTopAttackers(oppAttPool, hkTeam.players[bestHKDef].name, oppTeam).slice(0, 2);

  return { hkDefender: bestHKDef, oppDefender: bestOppDef, hkAttackers: hkAtts, oppAttackers: oppAtts };
}

export function createEmptyRound(poolHK: number[], poolOpp: number[]): RoundState {
  return {
    hkAttackers: [], oppAttackers: [],
    done: false, poolHK: [...poolHK], poolOpp: [...poolOpp],
    unusedHK: [], unusedOpp: [],
  };
}
