import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import type { Team, TeamDataFile } from '../types';
import { createEmptyRound } from '../engine';
import { getFD, DISPOSITIONS } from '../missionData';

// Team manifest - will be populated from JSON files
let teamDataCache: Record<string, TeamDataFile> = {};

async function loadTeamJSON(key: string): Promise<TeamDataFile | null> {
  if (teamDataCache[key]) return teamDataCache[key];
  try {
    const resp = await fetch(`teams/${key}-team.json`);
    if (!resp.ok) return null;
    const data = await resp.json();
    teamDataCache[key] = data;
    return data;
  } catch { return null; }
}

async function loadAllTeams(): Promise<TeamDataFile[]> {
  // Try loading manifest
  try {
    const resp = await fetch('teams/manifest.json');
    if (resp.ok) {
      const manifest: { key: string; name: string }[] = await resp.json();
      const results = await Promise.all(manifest.map(async m => {
        const data = await loadTeamJSON(m.key);
        return data;
      }));
      return results.filter(Boolean) as TeamDataFile[];
    }
  } catch { /* fallback */ }

  // Fallback: load known teams
  const knownKeys = ['hk', 'hk6', 'japan', 'france', 'malaysia', 'blackstone', 'blackstone2',
    'changsha', 'wuhan', 'shenzhen', 'chillclub2', 'oasis', 'left', 'right', 'sigil', 'alpha',
    'biglittle', 'empire', 'moshow', 'teamhq'];
  const results = await Promise.all(knownKeys.map(k => loadTeamJSON(k)));
  return results.filter(Boolean) as TeamDataFile[];
}

function dataToTeam(data: TeamDataFile): Team {
  return {
    key: data.key,
    name: data.name,
    players: data.players.map(p => ({
      name: p.name,
      army: p.army,
      armyList: p.armyList,
      note: p.note,
      scores: p.scores || {},
    })),
  };
}

export function SetupPage() {
  const { state, setHKTeam, setOppTeam, setCurrentRound, setTeamSizeMode, updateRounds } = useApp();
  const [teams, setTeams] = useState<TeamDataFile[]>([]);
  const [hkKey, setHKKey] = useState(state.hkTeam?.key || 'hk');
  const [oppKey, setOppKey] = useState(state.oppTeam?.key || '');
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllTeams().then(setTeams);
  }, []);

  const doLoad = async () => {
    const hkData = await loadTeamJSON(hkKey);
    const oppData = oppKey ? await loadTeamJSON(oppKey) : null;
    if (hkData) setHKTeam(dataToTeam(hkData));
    if (oppData) setOppTeam(dataToTeam(oppData));
    setLoaded(true);
  };

  const startPairing = () => {
    if (!state.hkTeam || !state.oppTeam) return;
    const mode: 6 | 8 = (state.hkTeam.players.length === 6 && state.oppTeam.players.length === 6) ? 6 : 8;
    setTeamSizeMode(mode);

    const allHK = state.hkTeam.players.map((_, i) => i);
    const allOpp = state.oppTeam.players.map((_, i) => i);
    updateRounds({
      1: createEmptyRound(allHK, allOpp),
      2: createEmptyRound(allHK, allOpp),
      3: createEmptyRound(allHK, allOpp),
    });
    setCurrentRound(1);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data: TeamDataFile | TeamDataFile[] = JSON.parse(reader.result as string);
        const items = Array.isArray(data) ? data : [data];
        items.forEach(item => {
          teamDataCache[item.key] = item;
          setTeams(prev => {
            const exists = prev.find(t => t.key === item.key);
            return exists ? prev.map(t => t.key === item.key ? item : t) : [...prev, item];
          });
        });
        alert(`Imported ${items.length} team(s)`);
      } catch { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  const hkTeam = state.hkTeam;
  const oppTeam = state.oppTeam;

  const getScoreColor = (s: number | undefined): string => {
    if (s === undefined) return '#555';
    return s >= 4 ? '#4ade80' : s >= 3 ? '#fbbf24' : '#ef4444';
  };

  return (
    <div className="page active">
      <div className="panel">
        <h2 className="panel-title">🏗️ Team Setup</h2>

        {/* Undo / State indicator */}
        {state.allMatches.length > 0 && (
          <div className="info-banner">
            📋 Resume session — {state.allMatches.length} matches, Round {state.currentRound > 0 ? state.currentRound : '?'}
          </div>
        )}

        <div className="team-grid">
          <div className="team-box hk">
            <h3>🇭🇰 Hong Kong Team</h3>
            <select value={hkKey} onChange={e => { setHKKey(e.target.value); setLoaded(false); }}>
              <option value="">-- Select --</option>
              {teams.map(t => (
                <option key={t.key} value={t.key}>{t.name}</option>
              ))}
            </select>
            {hkTeam && (
              <div className="player-list">
                {hkTeam.players.map(p => {
                  const fd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                  return (
                    <div key={p.name} className="player-item">
                      <div className="player-info">
                        <span>{p.name}</span>
                        <span className="army-tag">{p.army}</span>
                        {fd && <span className={`fd-tag fd-${fd.tagClass}`}>{fd.shortName}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="team-box opp">
            <h3>🌐 Opponent Team</h3>
            <select value={oppKey} onChange={e => { setOppKey(e.target.value); setLoaded(false); }}>
              <option value="">-- Select --</option>
              {teams.map(t => (
                <option key={t.key} value={t.key}>{t.name}</option>
              ))}
            </select>
            {oppTeam && (
              <div className="player-list">
                {oppTeam.players.map(p => {
                  const fd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                  return (
                    <div key={p.name} className="player-item">
                      <div className="player-info">
                        <span>{p.name}</span>
                        <span className="army-tag">{p.army}</span>
                        {fd && <span className={`fd-tag fd-${fd.tagClass}`}>{fd.shortName}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="btn-center" style={{ marginTop: 15 }}>
          {!loaded || !hkTeam || !oppTeam ? (
            <button className="btn btn-primary" onClick={doLoad} disabled={!hkKey || !oppKey}>📥 Load Teams</button>
          ) : (
            <button className="btn btn-primary" onClick={startPairing}>
              🚀 Start {state.hkTeam && state.oppTeam && state.hkTeam.players.length === 6 && state.oppTeam.players.length === 6 ? '2-Round (6P)' : '3-Round (8P)'} Pairing
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>📂 Import JSON</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>

        {/* Score Matrix */}
        {hkTeam && oppTeam && (
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <h3 style={{ color: '#FFDE00', marginBottom: 10 }}>📊 Score Matrix</h3>
            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8 }}>
              <span style={{ color: '#4ade80' }}>■</span> ≥4.0 &nbsp;
              <span style={{ color: '#fbbf24' }}>■</span> 3.0-3.9 &nbsp;
              <span style={{ color: '#ef4444' }}>■</span> {'<'}3.0
            </p>
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Opponent \\ HK</th>
                  {hkTeam.players.map(p => {
                    const fd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                    return (
                      <th key={p.name}>{p.name}<br /><span style={{ fontSize: '0.65rem', color: '#888' }}>{p.army}</span>{fd && <><br /><span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.6rem' }}>{fd.shortName}</span></>}</th>
                    );
                  })}
                  <th className="avg-col">Avg</th>
                </tr>
              </thead>
              <tbody>
                {oppTeam.players.map(opp => {
                  const avg = hkTeam.players.reduce((s, hk) => s + (opp.scores[hk.name] || 0), 0) / hkTeam.players.length;
                  const fd = opp.forceDisposition ? getFD(opp.forceDisposition) : null;
                  return (
                    <tr key={opp.name}>
                      <td className="row-header">{opp.name}<br /><span style={{ fontSize: '0.7rem', color: '#888' }}>{opp.army}</span>{fd && <> <span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.6rem' }}>{fd.shortName}</span></>}</td>
                      {hkTeam.players.map(hk => {
                        const s = opp.scores[hk.name];
                        return <td key={hk.name} style={{ color: getScoreColor(s), fontWeight: 'bold' }}>{s !== undefined ? s.toFixed(1) : '-'}</td>;
                      })}
                      <td className="avg-col">{avg.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="row-header">Avg</td>
                  {hkTeam.players.map(hk => {
                    const avg = oppTeam.players.reduce((s, opp) => s + (opp.scores[hk.name] || 0), 0) / oppTeam.players.length;
                    return <td key={hk.name} className="avg-col">{avg.toFixed(2)}</td>;
                  })}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
