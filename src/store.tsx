import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { TournamentState, Settings, Team, RoundPairing } from './types';
import { loadState, saveState, clearState, loadSettings, saveSettings, createEmptyRound } from './engine';
import { DEFAULT_SETTINGS } from './types';

interface AppContextType {
  state: TournamentState;
  settings: Settings;
  // Actions
  setHKTeam: (t: Team) => void;
  setOppTeam: (t: Team) => void;
  updateRounds: (rounds: Record<number, any>) => void;
  updateMatches: (matches: RoundPairing[]) => void;
  setCurrentRound: (r: number) => void;
  setTeamSizeMode: (m: 6 | 8) => void;
  resetState: () => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const defaultState: TournamentState = {
  hkTeam: null, oppTeam: null, currentRound: 0,
  rounds: {}, allMatches: [], teamSizeMode: 8,
};

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TournamentState>(() => loadState() || defaultState);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const setHKTeam = useCallback((t: Team) => setState(s => ({ ...s, hkTeam: t })), []);
  const setOppTeam = useCallback((t: Team) => setState(s => ({ ...s, oppTeam: t })), []);
  const setCurrentRound = useCallback((r: number) => setState(s => ({ ...s, currentRound: r })), []);
  const setTeamSizeMode = useCallback((m: 6 | 8) => setState(s => ({ ...s, teamSizeMode: m })), []);
  const resetState = useCallback(() => { clearState(); setState(defaultState); }, []);

  const updateRounds = useCallback((rounds: Record<number, any>) => {
    setState(s => ({ ...s, rounds: { ...s.rounds, ...rounds } }));
  }, []);

  const updateMatches = useCallback((matches: RoundPairing[]) => {
    setState(s => ({ ...s, allMatches: matches }));
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings(s => ({ ...s, ...partial }));
  }, []);

  return (
    <AppContext.Provider value={{
      state, settings, setHKTeam, setOppTeam,
      updateRounds, updateMatches, setCurrentRound,
      setTeamSizeMode, resetState, updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
