// Force Dispositions and mission matrix for WH40K 11th Edition
// Data sourced from Goonhammer / Tabletop Battles (June 2026) / GDM 2026

export type ForceDisposition =
  | 'reconnaissance'
  | 'priority-assets'
  | 'disruption'
  | 'take-and-hold'
  | 'purge-the-foe';

export interface FDInfo {
  key: ForceDisposition;
  name: string;
  shortName: string;
  description: string;
  color: string;        // CSS color
  tagClass: string;      // CSS class suffix
  emoji: string;
}

export interface MissionInfo {
  name: string;
  image: string;
  back?: string;         // Rules/back page image
  objectives?: number;
  scoring: string[];
}

export const DISPOSITIONS: FDInfo[] = [
  {
    key: 'reconnaissance',
    name: 'Reconnaissance',
    shortName: 'Recon',
    description: 'Mobility-focused. Rewards table-quarter control, actions at specific locations, and fast repositioning. Favours MSU playstyles.',
    color: '#FFDE00',
    tagClass: 'recon',
    emoji: '🔍',
  },
  {
    key: 'priority-assets',
    name: 'Priority Assets',
    shortName: 'Assets',
    description: 'Most action-heavy disposition. Every mission has a special action. Requires high-OC, fast action units.',
    color: '#b44dff',
    tagClass: 'priority',
    emoji: '💎',
  },
  {
    key: 'disruption',
    name: 'Disruption',
    shortName: 'Disrupt',
    description: 'Hit-and-run tactics, mixing action play with objective control. Rewards fast, small, lethal units.',
    color: '#00d4ff',
    tagClass: 'disruption',
    emoji: '⚡',
  },
  {
    key: 'take-and-hold',
    name: 'Take and Hold',
    shortName: 'Hold',
    description: 'Classic objective holding — no actions. The only disposition that scores VP for holding your home objective.',
    color: '#00cc66',
    tagClass: 'takehold',
    emoji: '🛡️',
  },
  {
    key: 'purge-the-foe',
    name: 'Purge the Foe',
    shortName: 'Purge',
    description: 'Straightforward destruction. Rewards destroying enemy units and holding objectives.',
    color: '#DE2910',
    tagClass: 'purge',
    emoji: '💀',
  },
];

const BASE_IMG = 'mission-cards';

// Matrix: missions[myFD][oppFD] = my mission
// So if I'm Recon vs Opp Purge, I get Reconnaissance→Purge mission
type MissionMatrix = Record<ForceDisposition, Record<ForceDisposition, MissionInfo>>;

export const MISSION_MATRIX: MissionMatrix = {
  reconnaissance: {
    reconnaissance: {
      name: 'Gather Intel',
      image: `${BASE_IMG}/reconnaissance__gather-intel.png`,
      back: `${BASE_IMG}/reconnaissance__gather-intel-back.png`,
      scoring: [
        'Mirror match. Race to gather intelligence at key locations.',
        'Move fast, complete actions, deny opponent\'s intel-gathering.',
        'Pure mobility duel.',
      ],
    },
    'take-and-hold': {
      name: 'Reconnaissance Sweep',
      image: `${BASE_IMG}/reconnaissance__reconnaissance-sweep.png`,
      objectives: 5,
      scoring: [
        '3 VP — 3+ units wholly within 3 different table quarters (not within 6" of centre). [End of turn]',
        '6 VP — 4+ units wholly within 4 different table quarters.',
        '1 VP each — Destroy an enemy unit. [End of turn]',
      ],
    },
    'purge-the-foe': {
      name: 'Triangulation',
      image: `${BASE_IMG}/reconnaissance__triangulation.png`,
      back: `${BASE_IMG}/reconnaissance__triangulation-back.png`,
      scoring: [
        'Complete actions at multiple locations to triangulate and score.',
        'Purge opponent tries to intercept — speed vs. firepower.',
        'Spread out and complete actions before opponent responds.',
      ],
    },
    disruption: {
      name: 'Surveil the Foe',
      image: `${BASE_IMG}/reconnaissance__surveil-the-foe.png`,
      back: `${BASE_IMG}/reconnaissance__surveil-the-foe-back.png`,
      scoring: [
        'Deploy units at specific locations to surveil the enemy.',
        'Both players highly mobile — cat and mouse.',
        'Positioning and timing over raw killing power.',
      ],
    },
    'priority-assets': {
      name: 'Search and Scour',
      image: `${BASE_IMG}/reconnaissance__search-and-scour.png`,
      scoring: [
        'Search target zones and complete actions to score.',
        'Both players heavy on actions — ultimate action-economy matchup.',
        'Fast, sacrificial action units essential.',
      ],
    },
  },
  'priority-assets': {
    'priority-assets': {
      name: 'Sabotage',
      image: `${BASE_IMG}/priority-assets__sabotage.png`,
      back: `${BASE_IMG}/priority-assets__sabotage-back.png`,
      scoring: [
        'Mirror match. Both players complete actions to score.',
        'Pure action economy — whoever completes more actions faster wins.',
        'Control objectives to enable action completion.',
      ],
    },
    'take-and-hold': {
      name: 'Secure Asset',
      image: `${BASE_IMG}/priority-assets__secure-asset.png`,
      back: `${BASE_IMG}/priority-assets__secure-asset-back.png`,
      objectives: 6,
      scoring: [
        '4 VP — Secure Asset action on an objective (excl. home). [End of turn]',
        '2 VP — Destroy ≥1 unit within range of a Central Objective. [End of turn]',
        '4 VP — Control objective excl. home. [Command phase, 2nd+]',
        '4 VP bonus — Control 3+ objectives including home.',
      ],
    },
    'purge-the-foe': {
      name: 'Vital Link',
      image: `${BASE_IMG}/priority-assets__vital-link.png`,
      back: `${BASE_IMG}/priority-assets__vital-link-back.png`,
      scoring: [
        'Complete critical actions to establish a Vital Link.',
        'Purge the Foe opponent focuses on killing — speed is your advantage.',
        'Control objectives to protect your actions.',
      ],
    },
    disruption: {
      name: 'Extract Relic',
      image: `${BASE_IMG}/priority-assets__extract-relic.png`,
      back: `${BASE_IMG}/priority-assets__extract-relic-back.png`,
      scoring: [
        'Extract the relic by completing actions on key objectives.',
        'Both players have actions — race to complete yours first.',
        'Fast, expendable action units are critical.',
      ],
    },
    reconnaissance: {
      name: 'Vanguard Operation',
      image: `${BASE_IMG}/priority-assets__vanguard-operation.png`,
      back: `${BASE_IMG}/priority-assets__vanguard-operation-back.png`,
      scoring: [
        'Execute vanguard actions while controlling objectives.',
        'Both players highly mobile — action-economy duel.',
        'Push forward aggressively to complete actions first.',
      ],
    },
  },
  disruption: {
    disruption: {
      name: 'Outmanoeuvre',
      image: `${BASE_IMG}/disruption__outmanoeuvre.png`,
      objectives: 5,
      scoring: [
        '10 VP — Control opponent\'s home objective. [Any battle round, end of your turn]',
        '4 VP each — Control each objective excluding home. [1st battle round, end of your turn]',
        '5 VP each — Control each objective excluding home. [2nd–3rd, end of Command phase]',
        '6 VP each — Control each objective excluding home. [4th+, end of your turn]',
      ],
    },
    'take-and-hold': {
      name: 'Death Trap',
      image: `${BASE_IMG}/disruption__death-trap.png`,
      back: `${BASE_IMG}/disruption__death-trap-back.png`,
      objectives: 5,
      scoring: [
        'Perform actions on objectives you control to score VP.',
        'Control No Man\'s Land objectives for additional scoring.',
        'Opponent (Take and Hold): scores purely by holding objectives.',
      ],
    },
    'purge-the-foe': {
      name: 'Delaying Action',
      image: `${BASE_IMG}/disruption__delaying-action.png`,
      objectives: 5,
      scoring: [
        'Perform actions on objectives to score VP.',
        'Each enemy unit destroyed: 1 VP [End of your turn].',
        'Stall the Purge the Foe opponent while completing actions.',
      ],
    },
    'priority-assets': {
      name: 'Locate and Deny',
      image: `${BASE_IMG}/disruption__locate-and-deny.png`,
      back: `${BASE_IMG}/disruption__locate-and-deny-back.png`,
      objectives: 5,
      scoring: [
        'Both players have actions. Identify and deny opponent\'s priority assets.',
        'Control No Man\'s Land objectives for additional scoring.',
        'Fast action units essential to outpace Priority Assets.',
      ],
    },
    reconnaissance: {
      name: 'Smoke and Mirrors',
      image: `${BASE_IMG}/disruption__smoke-and-mirrors.png`,
      back: `${BASE_IMG}/disruption__smoke-and-mirrors-back.png`,
      objectives: 6,
      scoring: [
        'Only 6-objective Disruption mission. Two central objectives.',
        'Perform actions on objectives. Highly mobile cat-and-mouse vs Recon.',
        'Deception and speed are key.',
      ],
    },
  },
  'take-and-hold': {
    'take-and-hold': {
      name: 'Battlefield Dominance',
      image: `${BASE_IMG}/take-and-hold__battlefield-dominance.png`,
      objectives: 5,
      scoring: [
        '2 VP — Control more objectives than opponent. [1st–2nd, end of turn]',
        '3 VP each — Control each objective. [2nd+, end of Command phase]',
        '+2 VP each — Bonus for each excl. home, if you control home objective.',
      ],
    },
    disruption: {
      name: 'Determined Acquisition',
      image: `${BASE_IMG}/take-and-hold__determined-acquisition.png`,
      objectives: 5,
      scoring: [
        'Score VP by holding objectives. Disruption opponent busy with actions.',
        'Hold your ground — don\'t let hit-and-run tactics dislodge you.',
        'Durable objective-holding units essential.',
      ],
    },
    'purge-the-foe': {
      name: 'Immovable Object',
      image: `${BASE_IMG}/take-and-hold__immovable-object.png`,
      objectives: 5,
      scoring: [
        'Hold objectives to score VP. Purge opponent kills your units to stop you.',
        'Survive the onslaught and maintain objective control.',
        'Resilience is everything — the longer you hold, the more you score.',
      ],
    },
    'priority-assets': {
      name: 'Inescapable Dominion',
      image: `${BASE_IMG}/take-and-hold__inescapable-dominion.png`,
      objectives: 6,
      scoring: [
        'Only 6-objective Take and Hold mission. Favours Take and Hold.',
        'Score VP by holding objectives. Priority Assets spread thin on actions.',
        'Two central objectives provide safer scoring.',
      ],
    },
    reconnaissance: {
      name: 'Purge and Secure',
      image: `${BASE_IMG}/take-and-hold__purge-and-secure.png`,
      objectives: 5,
      scoring: [
        'Hold objectives to score VP. Reconnaissance moves around table edges.',
        'Clear the area and secure objectives before being flanked.',
        'Prevent encirclement by holding key positions.',
      ],
    },
  },
  'purge-the-foe': {
    'purge-the-foe': {
      name: 'Meatgrinder',
      image: `${BASE_IMG}/purge-the-foe__meatgrinder.png`,
      objectives: 5,
      scoring: [
        'Mirror match. Both players score by destroying enemy units + holding objectives.',
        'Pure attrition — superior killing power wins.',
        'Control objectives outside your deployment zone for additional VP.',
      ],
    },
    'take-and-hold': {
      name: 'Unstoppable Force',
      image: `${BASE_IMG}/purge-the-foe__unstoppable-force.png`,
      objectives: 5,
      scoring: [
        'Destroy ≥1 enemy unit: score VP each turn.',
        'Control objectives outside deployment zone: score VP [Command phase, 2nd+].',
        'Control objective you didn\'t control at start of turn: 3 VP [End of turn].',
        'End of battle: 5 VP for controlling Central Objective.',
      ],
    },
    disruption: {
      name: 'Punishment',
      image: `${BASE_IMG}/purge-the-foe__punishment.png`,
      objectives: 5,
      scoring: [
        'Primary scoring through destroying enemy units.',
        'Control objectives outside deployment zone for additional VP.',
        'Punish Disruption\'s hit-and-run tactics with overwhelming firepower.',
      ],
    },
    'priority-assets': {
      name: 'Destroyer\'s Wrath',
      image: `${BASE_IMG}/purge-the-foe__destroyers-wrath.png`,
      scoring: [
        'Destroy enemy units to score VP.',
        'Priority Assets opponent is busy with actions — press the attack.',
        'Prevent opponent\'s action completion by eliminating action units.',
      ],
    },
    reconnaissance: {
      name: 'Consecrate',
      image: `${BASE_IMG}/purge-the-foe__consecrate.png`,
      scoring: [
        'Destroy enemy units and hold objectives to score.',
        'Reconnaissance opponent spreads across table — deny their movement.',
        'Control key positions to block table-quarter scoring.',
      ],
    },
  },
};

// Lookup FD info by key
export function getFD(key: ForceDisposition): FDInfo {
  return DISPOSITIONS.find(d => d.key === key)!;
}

// Get the mission for a specific player given both players' FDs
export function getMission(fd: ForceDisposition, vsFd: ForceDisposition): MissionInfo {
  return MISSION_MATRIX[fd][vsFd];
}
