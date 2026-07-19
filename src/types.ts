import type { ForceDisposition } from './missionData';

export interface Player {
  name: string;
  army: string;
  armyList?: string;
  note?: string;
  forceDisposition?: ForceDisposition;
  scores: Record<string, number>;
}

export interface Team {
  key: string;
  name: string;
  players: Player[];
}

export interface RoundPairing {
  round: number;
  hk: number;       // HK player index
  hkRole: 'defender' | 'attacker' | 'auto-paired';
  opp: number;      // Opp player index
  oppRole: 'defender' | 'attacker' | 'auto-paired';
  hkScore?: number;
  oppScore?: number;
  tableNo?: number;
}

export interface RoundState {
  hkDefender?: number;
  oppDefender?: number;
  hkAttackers: number[];
  oppAttackers: number[];
  pickhk?: number;
  pickopp?: number;
  done: boolean;
  poolHK: number[];
  poolOpp: number[];
  unusedHK: number[];
  unusedOpp: number[];
}

export interface TournamentState {
  hkTeam: Team | null;
  oppTeam: Team | null;
  currentRound: number;
  rounds: Record<number, RoundState>;
  allMatches: RoundPairing[];
  teamSizeMode: 6 | 8;
}

export interface Settings {
  password: string;
  passwordEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  password: '0821',
  passwordEnabled: true,
};

export interface TeamDataFile {
  key: string;
  name: string;
  players: {
    name: string;
    army: string;
    armyList?: string;
    note?: string;
    forceDisposition?: ForceDisposition;
    scores: Record<string, number>;
  }[];
}
