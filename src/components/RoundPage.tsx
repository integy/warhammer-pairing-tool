import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import type { RoundState, RoundPairing } from '../types';
import { analyzeDefenders, getTopAttackers, autoOptimalRound, createEmptyRound } from '../engine';
import { getMission, getFD, DISPOSITIONS } from '../missionData';
import type { ForceDisposition, MissionInfo } from '../missionData';

function getScoreColor(s: number | undefined): string {
  if (s === undefined) return '#555';
  return s >= 4 ? '#4ade80' : s >= 3 ? '#fbbf24' : '#ef4444';
}

function BothScores({ attScore, defScore }: { attScore: number | undefined; defScore: number | undefined }) {
  return (
    <span style={{ fontSize: '0.75rem' }}>
      <span style={{ color: getScoreColor(attScore) }}>[{attScore?.toFixed(1) ?? '-'}</span>
      :<span style={{ color: getScoreColor(defScore) }}>{defScore?.toFixed(1) ?? '-'}]</span>
    </span>
  );
}

function MissionMini({ mission, fd, vsFd }: { mission: MissionInfo; fd: ForceDisposition; vsFd: ForceDisposition }) {
  const [showBack, setShowBack] = useState(false);
  const fdInfo = getFD(fd);
  const vsFdInfo = getFD(vsFd);
  return (
    <div className="mission-mini">
      <h4>🎯 {mission.name}</h4>
      <div className="mission-pair">
        <span className={`fd-tag fd-${fdInfo.tagClass}`}>{fdInfo.shortName}</span>
        {' vs '}
        <span className={`fd-tag fd-${vsFdInfo.tagClass}`}>{vsFdInfo.shortName}</span>
      </div>
      {mission.objectives && <div className="mission-obj">🎯 {mission.objectives} Objective Markers</div>}
      <img className="mission-img" src={mission.image} alt={mission.name} />
      {mission.back && (
        <>
          <img className={`mission-back-img${showBack ? ' visible' : ''}`} src={mission.back} alt={`${mission.name} (rules)`} />
          <button className="mission-flip-btn" onClick={() => setShowBack(!showBack)}>
            🔄 {showBack ? 'Show Front' : 'Show Rules (back)'}
          </button>
        </>
      )}
      {mission.scoring.length > 0 && (
        <div className="mission-desc">
          {mission.scoring.slice(0, 2).map((s, i) => <div key={i}>• {s}</div>)}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  matchNum, hkName, hkArmy, hkRole, oppName, oppArmy, oppRole,
  hkScore, oppScore, onHkScore, onOppScore, editable,
}: {
  matchNum: number; hkName: string; hkArmy: string; hkRole: string;
  oppName: string; oppArmy: string; oppRole: string;
  hkScore?: number; oppScore?: number;
  onHkScore?: (v: number) => void; onOppScore?: (v: number) => void;
  editable?: boolean;
}) {
  return (
    <div className="match-card active" style={{ marginBottom: 12 }}>
      <div className="match-header">
        <span className="match-title">Match {matchNum}</span>
      </div>
      <div className="match-content">
        <div className={`slot ${hkRole === 'defender' ? 'defender' : 'attacker'}`}>
          <div className="name">🇭🇰 {hkName}</div>
          <div className="army-tag">{hkArmy}</div>
          <div className="role">{hkRole.toUpperCase()}</div>
        </div>
        <div className="vs">VS</div>
        <div className={`slot ${oppRole === 'defender' ? 'defender' : 'attacker'}`}>
          <div className="name">🌐 {oppName}</div>
          <div className="army-tag">{oppArmy}</div>
          <div className="role">{oppRole.toUpperCase()}</div>
        </div>
      </div>
      {editable && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>HK Score</div>
            <input
              type="number" className="score-input"
              value={hkScore ?? ''} min={0} max={20} step={0.5}
              onChange={e => onHkScore?.(parseFloat(e.target.value) || 0)}
              placeholder="–"
            />
          </div>
          <span style={{ color: '#FFDE00', fontWeight: 'bold' }}>vs</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>Opp Score</div>
            <input
              type="number" className="score-input"
              value={oppScore ?? ''} min={0} max={20} step={0.5}
              onChange={e => onOppScore?.(parseFloat(e.target.value) || 0)}
              placeholder="–"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE_MAP: Record<number, string> = { 1: '⚔️ Round 1', 2: '⚔️ Round 2', 3: '⚔️ Round 3' };

export function RoundPage({ round }: { round: number }) {
  const { state, setCurrentRound, updateRounds, updateMatches } = useApp();
  const hkTeam = state.hkTeam!;
  const oppTeam = state.oppTeam!;

  const rd = state.rounds[round] || createEmptyRound(
    hkTeam.players.map((_, i) => i),
    oppTeam.players.map((_, i) => i)
  );

  const [hkDef, setHkDef] = useState<number | undefined>(rd.hkDefender);
  const [oppDef, setOppDef] = useState<number | undefined>(rd.oppDefender);
  const [hkAtts, setHkAtts] = useState<number[]>(rd.hkAttackers || []);
  const [oppAtts, setOppAtts] = useState<number[]>(rd.oppAttackers || []);
  const [pickHK, setPickHK] = useState<number | undefined>(rd.pickhk);
  const [pickOpp, setPickOpp] = useState<number | undefined>(rd.pickopp);
  const [step, setStep] = useState<'defender' | 'attacker' | 'pairing'>(
    rd.done ? 'pairing' : hkDef !== undefined && oppDef !== undefined ?
      (hkAtts.length >= 2 && oppAtts.length >= 2 ? 'pairing' : 'attacker') : 'defender'
  );
  // R3 auto-pair preview
  const [r3AutoMatches, setR3AutoMatches] = useState<{ hk: number; opp: number }[]>([]);

  // Store confirmed match data for summary display + undo
  const [confirmedData, setConfirmedData] = useState<{
    hkDef: number; oppDef: number; pickHK: number; pickOpp: number;
    hkDefScore?: number; oppDefScore?: number;
    hkAttScore?: number; oppAttScore?: number;
    autoMatches?: { hk: number; opp: number }[];
  } | null>(rd.done && rd.hkDefender !== undefined ? {
    hkDef: rd.hkDefender, oppDef: rd.oppDefender!,
    pickHK: rd.pickhk!, pickOpp: rd.pickopp!,
  } : null);

  // Sync state when rd changes (navigating between rounds)
  useEffect(() => {
    setHkDef(rd.hkDefender);
    setOppDef(rd.oppDefender);
    setHkAtts(rd.hkAttackers || []);
    setOppAtts(rd.oppAttackers || []);
    setPickHK(rd.pickhk);
    setPickOpp(rd.pickopp);
    setR3AutoMatches([]);
    if (rd.done && rd.hkDefender !== undefined) {
      setConfirmedData({
        hkDef: rd.hkDefender, oppDef: rd.oppDefender!,
        pickHK: rd.pickhk!, pickOpp: rd.pickopp!,
      });
      setStep('pairing');
    } else if (!rd.done) {
      setConfirmedData(null);
    }
  }, [round]);

  const poolHK = rd.poolHK || hkTeam.players.map((_, i) => i);
  const poolOpp = rd.poolOpp || oppTeam.players.map((_, i) => i);

  // Backward induction analysis
  const defenderAnalysis = useMemo(() => {
    if (!hkTeam || !oppTeam || poolHK.length < 2 || poolOpp.length < 2) return [];
    return analyzeDefenders(hkTeam, oppTeam, poolHK, poolOpp);
  }, [hkTeam, oppTeam, poolHK, poolOpp, round]);

  const bestDefenders = defenderAnalysis.filter(
    d => Math.abs(d.netAdvantage - defenderAnalysis[0]?.netAdvantage) < 0.001
  );
  const bestDefIndices = new Set(bestDefenders.map(d => d.hkIdx));

  const doAutoOptimal = () => {
    const result = autoOptimalRound(hkTeam, oppTeam, poolHK, poolOpp);
    setHkDef(result.hkDefender);
    setOppDef(result.oppDefender);
    setHkAtts(result.hkAttackers.slice(0, 2));
    setOppAtts(result.oppAttackers.slice(0, 2));
    setStep('pairing');
  };

  const toggleHkAtt = (idx: number) => {
    const max = 2;
    setHkAtts(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= max) { alert(`Max ${max} attacker(s)!`); return prev; }
      return [...prev, idx];
    });
  };
  const toggleOppAtt = (idx: number) => {
    const max = 2;
    setOppAtts(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= max) { alert(`Max ${max} attacker(s)!`); return prev; }
      return [...prev, idx];
    });
  };

  const canPair = hkDef !== undefined && oppDef !== undefined && hkAtts.length >= 1 && oppAtts.length >= 1;

  // ──── Confirm Round (R1/R2: full confirm. R3: preview auto-pair first) ────
  const confirm = () => {
    if (pickHK === undefined || pickOpp === undefined) {
      alert('Both defenders must pick an opponent!'); return;
    }

    if (round === 3) {
      // R3: preview auto-pair before confirming
      const unpickedHK = hkAtts.filter(i => i !== pickHK);
      const unpickedOpp = oppAtts.filter(i => i !== pickOpp);
      const allUsedHK = new Set([hkDef!, pickHK, ...hkAtts]);
      const allUsedOpp = new Set([oppDef!, pickOpp, ...oppAtts]);
      const lastHK = poolHK.filter(i => !allUsedHK.has(i));
      const lastOpp = poolOpp.filter(i => !allUsedOpp.has(i));

      const autoPairs: { hk: number; opp: number }[] = [];
      for (let i = 0; i < unpickedHK.length && i < unpickedOpp.length; i++) {
        autoPairs.push({ hk: unpickedHK[i], opp: unpickedOpp[i] });
      }
      for (let i = 0; i < lastHK.length && i < lastOpp.length; i++) {
        autoPairs.push({ hk: lastHK[i], opp: lastOpp[i] });
      }
      setR3AutoMatches(autoPairs);
      return;
    }

    doFullConfirm();
  };

  const doFullConfirm = () => {
    if (pickHK === undefined || pickOpp === undefined) return;
    const matches = [...state.allMatches];

    matches.push({ round, hk: hkDef!, hkRole: 'defender', opp: pickOpp, oppRole: 'attacker' });
    matches.push({ round, hk: pickHK, hkRole: 'attacker', opp: oppDef!, oppRole: 'defender' });

    const hkUsed = new Set([hkDef!, pickHK]);
    const oppUsed = new Set([oppDef!, pickOpp]);
    const unusedHK = poolHK.filter(i => !hkUsed.has(i));
    const unusedOpp = poolOpp.filter(i => !oppUsed.has(i));

    // Auto-pair for R3
    let autoMatches: { hk: number; opp: number }[] = [];
    if (round === 3) {
      const unpickedHK = hkAtts.filter(i => i !== pickHK);
      const unpickedOpp = oppAtts.filter(i => i !== pickOpp);
      const allUsedHK = new Set([hkDef!, pickHK, ...hkAtts]);
      const allUsedOpp = new Set([oppDef!, pickOpp, ...oppAtts]);
      const lastHK = poolHK.filter(i => !allUsedHK.has(i));
      const lastOpp = poolOpp.filter(i => !allUsedOpp.has(i));

      for (let i = 0; i < unpickedHK.length && i < unpickedOpp.length; i++) {
        matches.push({ round, hk: unpickedHK[i], hkRole: 'auto-paired', opp: unpickedOpp[i], oppRole: 'auto-paired' });
        autoMatches.push({ hk: unpickedHK[i], opp: unpickedOpp[i] });
      }
      for (let i = 0; i < lastHK.length && i < lastOpp.length; i++) {
        matches.push({ round, hk: lastHK[i], hkRole: 'auto-paired', opp: lastOpp[i], oppRole: 'auto-paired' });
        autoMatches.push({ hk: lastHK[i], opp: lastOpp[i] });
      }
    }

    const updatedRound: RoundState = {
      hkDefender: hkDef, oppDefender: oppDef,
      hkAttackers: hkAtts, oppAttackers: oppAtts,
      pickhk: pickHK, pickopp: pickOpp,
      done: true, poolHK, poolOpp, unusedHK, unusedOpp,
    };

    updateMatches(matches);
    updateRounds({ [round]: updatedRound });

    setConfirmedData({
      hkDef: hkDef!, oppDef: oppDef!,
      pickHK, pickOpp, autoMatches,
    });
    setR3AutoMatches([]);

    if (round === 1) {
      if (state.teamSizeMode === 6) {
        updateRounds({ 3: { ...createEmptyRound(unusedHK, unusedOpp), poolHK: unusedHK, poolOpp: unusedOpp } });
        setCurrentRound(3);
      } else {
        updateRounds({ 2: { ...createEmptyRound(unusedHK, unusedOpp), poolHK: unusedHK, poolOpp: unusedOpp } });
        setCurrentRound(2);
      }
    } else if (round === 2) {
      updateRounds({ 3: { ...createEmptyRound(unusedHK, unusedOpp), poolHK: unusedHK, poolOpp: unusedOpp } });
      setCurrentRound(3);
    } else {
      // R3 done → results
      setCurrentRound(4);
    }
  };

  // ──── Undo confirm: revert entire round ────
  const undoConfirm = () => {
    if (!confirmedData) return;

    // Count matches to remove
    let removeCount = 2; // 2 defender matches
    if (round === 3 && confirmedData.autoMatches) {
      removeCount += confirmedData.autoMatches.length;
    }
    const updatedMatches = state.allMatches.slice(0, -removeCount);

    // Reset this round + clear subsequent rounds
    const resetRounds: Record<number, RoundState> = {
      [round]: { ...createEmptyRound(poolHK, poolOpp), poolHK: [...poolHK], poolOpp: [...poolOpp] },
    };

    if (round === 1) {
      const allHK = hkTeam.players.map((_, i) => i);
      const allOpp = oppTeam.players.map((_, i) => i);
      resetRounds[2] = createEmptyRound(allHK, allOpp);
      resetRounds[3] = createEmptyRound(allHK, allOpp);
    } else if (round === 2) {
      resetRounds[3] = createEmptyRound(poolHK, poolOpp);
    }

    updateMatches(updatedMatches);
    updateRounds(resetRounds);
    setCurrentRound(round);

    // Reset local state
    setHkDef(undefined);
    setOppDef(undefined);
    setHkAtts([]);
    setOppAtts([]);
    setPickHK(undefined);
    setPickOpp(undefined);
    setStep('defender');
    setConfirmedData(null);
    setR3AutoMatches([]);
  };

  // Undo selection: go back to defender step (within same round, before confirm)
  const undoSelection = () => {
    setHkDef(undefined);
    setOppDef(undefined);
    setHkAtts([]);
    setOppAtts([]);
    setPickHK(undefined);
    setPickOpp(undefined);
    setStep('defender');
    setR3AutoMatches([]);
  };

  // Update score in confirmed summary
  const updateConfirmedScore = (side: 'hkDef' | 'oppDef' | 'hkAtt' | 'oppAtt', val: number) => {
    setConfirmedData(prev => prev ? { ...prev, [`${side}Score`]: val } : prev);
    // Also update the actual match in allMatches
    const matches = [...state.allMatches];
    const baseIdx = matches.length - (round === 3 && confirmedData?.autoMatches ? 2 + confirmedData.autoMatches.length : 2);
    if (side === 'hkDef' || side === 'oppDef') {
      const m = matches[baseIdx];
      if (m) {
        if (side === 'hkDef') m.hkScore = val;
        else m.oppScore = val;
        updateMatches(matches);
      }
    }
    if (side === 'hkAtt' || side === 'oppAtt') {
      const m = matches[baseIdx + 1];
      if (m) {
        if (side === 'hkAtt') m.hkScore = val;
        else m.oppScore = val;
        updateMatches(matches);
      }
    }
  };

  // 6P mode: R2 is skipped
  if (round === 2 && state.teamSizeMode === 6) {
    return (
      <div className="page active">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 15 }}>⏭️</div>
          <h3 style={{ color: '#FFDE00' }}>Round 2 Skipped</h3>
          <p style={{ color: '#8892b0' }}>6-person mode: R1 → R3 → Results</p>
          <button className="btn btn-primary" onClick={() => setCurrentRound(3)}>Go to Round 3 →</button>
        </div>
      </div>
    );
  }

  // Find match indices for confirmed matches
  const getConfirmedMatchIndices = () => {
    const total = state.allMatches.length;
    const r3AutoCount = round === 3 && confirmedData?.autoMatches ? confirmedData.autoMatches.length : 0;
    const thisRoundCount = 2 + r3AutoCount;
    return {
      baseIdx: total - thisRoundCount,
      count: thisRoundCount,
    };
  };

  const { baseIdx } = rd.done && confirmedData ? getConfirmedMatchIndices() : { baseIdx: 0 };

  return (
    <div className="page active">
      <div className="panel">
        <h2 className="panel-title">{PAGE_MAP[round]} — Attack / Defend</h2>

        {/* ──── NOT CONFIRMED: show pairing UI ──── */}
        {!rd.done && (
          <>
            <p style={{ color: '#FFDE00', marginBottom: 15 }}>
              Available: HK {poolHK.length} players, Opp {poolOpp.length} players
              {state.teamSizeMode === 6 && <span> · 6-Person Mode</span>}
            </p>

            {/* Backward induction suggestion */}
            {defenderAnalysis.length > 0 && (
              <div className="suggestion-box">
                💡 <b>Suggested HK Defender{bestDefenders.length > 1 ? 's (TIE)' : ''}:</b>{' '}
                {bestDefenders.map(d => d.hkName).join(', ')}{' '}
                | Net advantage: {bestDefenders[0].netAdvantage >= 0 ? '+' : ''}{bestDefenders[0].netAdvantage.toFixed(1)}
              </div>
            )}

            {/* Score Matrix */}
            {hkTeam && oppTeam && (
              <div style={{ marginTop: 15, marginBottom: 20, overflowX: 'auto' }}>
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Opp \\ HK</th>
                      {poolHK.map(i => {
                        const p = hkTeam.players[i];
                        const isBest = bestDefIndices.has(i);
                        const fd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                        return (
                          <th key={i} style={isBest ? { background: '#2d5a2d', color: '#4ade80' } : undefined}>
                            {p.name}⭐<br /><span style={{ fontSize: '0.65rem', color: '#888' }}>{p.army}</span>{fd && <><br /><span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.55rem' }}>{fd.shortName}</span></>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {poolOpp.map(oi => {
                      const opp = oppTeam.players[oi];
                      const ofd = opp.forceDisposition ? getFD(opp.forceDisposition) : null;
                      return (
                        <tr key={oi}>
                          <td className="row-header">{opp.name}{ofd && <> <span className={`fd-tag fd-${ofd.tagClass}`} style={{ fontSize: '0.55rem' }}>{ofd.shortName}</span></>}</td>
                          {poolHK.map(hi => {
                            const s = opp.scores?.[hkTeam.players[hi].name];
                            return <td key={hi} style={{ color: getScoreColor(s), fontWeight: 'bold' }}>{s?.toFixed(1) ?? '-'}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Step 1: Defender Selection */}
            <div style={{ marginBottom: 20 }}>
              <div className="defender-row">
                <div>
                  <h4 style={{ color: '#DE2910' }}>🇭🇰 {hkTeam.name} — Defender</h4>
                  <select value={hkDef ?? ''} onChange={e => setHkDef(e.target.value ? parseInt(e.target.value) : undefined)}>
                    <option value="">-- Select Defender --</option>
                    {poolHK.map(i => (
                      <option key={i} value={i}>{hkTeam.players[i].name} ({hkTeam.players[i].army})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <h4 style={{ color: '#00d4ff' }}>🌐 {oppTeam.name} — Defender</h4>
                  <select value={oppDef ?? ''} onChange={e => setOppDef(e.target.value ? parseInt(e.target.value) : undefined)}>
                    <option value="">-- Select Defender --</option>
                    {poolOpp.map(i => (
                      <option key={i} value={i}>{oppTeam.players[i].name} ({oppTeam.players[i].army})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button className="btn btn-success" onClick={doAutoOptimal} disabled={poolHK.length < 2}>
                  🤖 Auto-Optimal
                </button>
                <button className="btn btn-secondary" onClick={undoSelection} style={{ marginLeft: 8 }}>
                  ↩️ Undo Selection
                </button>
              </div>
            </div>

            {/* Step 2: Attacker Selection */}
            {hkDef !== undefined && oppDef !== undefined && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: '#DE2910', marginBottom: 10 }}>
                  🇭🇰 Select 2 Attackers vs {oppTeam.players[oppDef]?.name}
                </h4>
                <div className="pick-btns">
                  {poolHK.filter(i => i !== hkDef).map(i => {
                    const p = hkTeam.players[i];
                    const attScore = p.scores?.[oppTeam.players[oppDef!]?.name];
                    const defScore = oppTeam.players[oppDef!]?.scores?.[p.name];
                    const isTop = getTopAttackers(poolHK.filter(j => j !== hkDef), oppTeam.players[oppDef!]?.name, hkTeam).includes(i);
                    const fd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                    return (
                      <button key={i} className={`pick-btn ${hkAtts.includes(i) ? 'selected' : ''}`} onClick={() => toggleHkAtt(i)}>
                        {p.name}{fd && <span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.55rem', marginLeft: 4 }}>{fd.shortName}</span>} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                        <BothScores attScore={attScore} defScore={defScore} />
                        {isTop && ' ⭐'}
                      </button>
                    );
                  })}
                </div>

                <h4 style={{ color: '#00d4ff', marginBottom: 10, marginTop: 15 }}>
                  🌐 Select 2 Attackers vs {hkTeam.players[hkDef]?.name}
                </h4>
                <div className="pick-btns">
                  {poolOpp.filter(i => i !== oppDef).map(i => {
                    const p = oppTeam.players[i];
                    const attScore = p.scores?.[hkTeam.players[hkDef!]?.name];
                    const defScore = hkTeam.players[hkDef!]?.scores?.[p.name];
                    const isTop = getTopAttackers(poolOpp.filter(j => j !== oppDef), hkTeam.players[hkDef!]?.name, oppTeam).includes(i);
                    const fd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                    return (
                      <button key={i} className={`pick-btn ${oppAtts.includes(i) ? 'selected' : ''}`} onClick={() => toggleOppAtt(i)}>
                        {p.name}{fd && <span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.55rem', marginLeft: 4 }}>{fd.shortName}</span>} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                        <BothScores attScore={attScore} defScore={defScore} />
                        {isTop && ' ⭐'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Match Pairing */}
            {canPair && r3AutoMatches.length === 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ color: '#FFDE00', marginBottom: 15 }}>🔗 Match Pairings</h3>

                {/* HK Defender vs Opp Attacker */}
                <div className="match-card active" style={{ marginBottom: 12 }}>
                  <div className="match-header">
                    <span className="match-title">Match {state.allMatches.length + 1}</span>
                  </div>
                  <div className="match-content">
                    <div className="slot defender">
                      <div className="name">🇭🇰 {hkTeam.players[hkDef!].name}</div>
                      <div className="army-tag">{hkTeam.players[hkDef!].army}</div>
                      {hkTeam.players[hkDef!].forceDisposition && (() => { const fd = getFD(hkTeam.players[hkDef!].forceDisposition!); return <span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.6rem', marginTop: 4, display: 'inline-block' }}>{fd.shortName}</span>; })()}
                      <div className="role">DEFENDER</div>
                    </div>
                    <div className="vs">VS</div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#8892b0' }}>Choose opponent:</label>
                      <div className="pick-btns" style={{ marginTop: 5 }}>
                        {oppAtts.map(i => {
                          const p = oppTeam.players[i];
                          const attScore = p.scores?.[hkTeam.players[hkDef!]?.name];
                          const defScore = hkTeam.players[hkDef!]?.scores?.[p.name];
                          const ofd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                          return (
                            <button key={i} className={`pick-btn ${pickOpp === i ? 'selected' : ''}`} onClick={() => setPickOpp(i)}>
                              {p.name}{ofd && <span className={`fd-tag fd-${ofd.tagClass}`} style={{ fontSize: '0.55rem', marginLeft: 4 }}>{ofd.shortName}</span>} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                              <BothScores attScore={attScore} defScore={defScore} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opp Defender vs HK Attacker */}
                <div className="match-card active" style={{ marginBottom: 12 }}>
                  <div className="match-header">
                    <span className="match-title">Match {state.allMatches.length + 2}</span>
                  </div>
                  <div className="match-content">
                    <div className="slot attacker">
                      <div className="name">🌐 {oppTeam.players[oppDef!].name}</div>
                      <div className="army-tag">{oppTeam.players[oppDef!].army}</div>
                      {oppTeam.players[oppDef!].forceDisposition && (() => { const fd = getFD(oppTeam.players[oppDef!].forceDisposition!); return <span className={`fd-tag fd-${fd.tagClass}`} style={{ fontSize: '0.6rem', marginTop: 4, display: 'inline-block' }}>{fd.shortName}</span>; })()}
                      <div className="role">DEFENDER</div>
                    </div>
                    <div className="vs">VS</div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#8892b0' }}>Choose opponent:</label>
                      <div className="pick-btns" style={{ marginTop: 5 }}>
                        {hkAtts.map(i => {
                          const p = hkTeam.players[i];
                          const attScore = p.scores?.[oppTeam.players[oppDef!]?.name];
                          const defScore = oppTeam.players[oppDef!]?.scores?.[p.name];
                          const hfd = p.forceDisposition ? getFD(p.forceDisposition) : null;
                          return (
                            <button key={i} className={`pick-btn ${pickHK === i ? 'selected' : ''}`} onClick={() => setPickHK(i)}>
                              {p.name}{hfd && <span className={`fd-tag fd-${hfd.tagClass}`} style={{ fontSize: '0.55rem', marginLeft: 4 }}>{hfd.shortName}</span>} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                              <BothScores attScore={attScore} defScore={defScore} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="btn-center" style={{ marginTop: 15 }}>
                  <button className="btn btn-success" onClick={confirm}>
                    {round === 3 ? '✓ Preview Auto-Pair →' : `✓ Confirm Round ${round}`}
                  </button>
                </div>
              </div>
            )}

            {/* R3 Auto-Pair Preview */}
            {round === 3 && r3AutoMatches.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="info-banner" style={{ marginBottom: 16 }}>
                  💡 Auto-paired matches from remaining players. Review then confirm.
                </div>
                <h3 style={{ color: '#FFDE00', marginBottom: 15 }}>🤖 Auto-Pair Matches</h3>
                {r3AutoMatches.map((ap, i) => (
                  <MatchCard
                    key={i}
                    matchNum={state.allMatches.length + 3 + i}
                    hkName={hkTeam.players[ap.hk]?.name || '-'}
                    hkArmy={hkTeam.players[ap.hk]?.army || '-'}
                    hkRole="auto-paired"
                    oppName={oppTeam.players[ap.opp]?.name || '-'}
                    oppArmy={oppTeam.players[ap.opp]?.army || '-'}
                    oppRole="auto-paired"
                  />
                ))}
                <div className="btn-center" style={{ marginTop: 15 }}>
                  <button className="btn btn-secondary" onClick={() => setR3AutoMatches([])} style={{ marginRight: 8 }}>
                    ← Back
                  </button>
                  <button className="btn btn-success" onClick={doFullConfirm}>
                    ✓ Confirm All R3 Matches
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="btn-center" style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setCurrentRound(round > 1 ? round - 1 : 0)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={() => setCurrentRound(round < 4 ? round + 1 : 4)}>
                {round === 3 ? 'View Results →' : `Round ${round + 1} →`}
              </button>
            </div>
          </>
        )}

        {/* ──── CONFIRMED: show match summary ──── */}
        {rd.done && confirmedData && (
          <>
            <div className="info-banner" style={{ marginBottom: 16 }}>
              ✅ Round {round} confirmed — {2 + (confirmedData.autoMatches?.length || 0)} matches
            </div>

            <h3 style={{ color: '#FFDE00', marginBottom: 15 }}>📋 Match Summary</h3>

            {/* Match 1: HK Defender vs Opp Attacker */}
            <MatchCard
              matchNum={baseIdx + 1}
              hkName={hkTeam.players[confirmedData.hkDef]?.name || '-'}
              hkArmy={hkTeam.players[confirmedData.hkDef]?.army || '-'}
              hkRole="defender"
              oppName={oppTeam.players[confirmedData.pickOpp]?.name || '-'}
              oppArmy={oppTeam.players[confirmedData.pickOpp]?.army || '-'}
              oppRole="attacker"
              hkScore={confirmedData.hkDefScore}
              oppScore={confirmedData.oppDefScore}
              onHkScore={v => updateConfirmedScore('hkDef', v)}
              onOppScore={v => updateConfirmedScore('oppDef', v)}
              editable
            />

            {/* Match 2: Opp Defender vs HK Attacker */}
            <MatchCard
              matchNum={baseIdx + 2}
              hkName={hkTeam.players[confirmedData.pickHK]?.name || '-'}
              hkArmy={hkTeam.players[confirmedData.pickHK]?.army || '-'}
              hkRole="attacker"
              oppName={oppTeam.players[confirmedData.oppDef]?.name || '-'}
              oppArmy={oppTeam.players[confirmedData.oppDef]?.army || '-'}
              oppRole="defender"
              hkScore={confirmedData.hkAttScore}
              oppScore={confirmedData.oppAttScore}
              onHkScore={v => updateConfirmedScore('hkAtt', v)}
              onOppScore={v => updateConfirmedScore('oppAtt', v)}
              editable
            />

            {/* R3 Auto-pair matches */}
            {confirmedData.autoMatches?.map((ap, i) => (
              <MatchCard
                key={i}
                matchNum={baseIdx + 3 + i}
                hkName={hkTeam.players[ap.hk]?.name || '-'}
                hkArmy={hkTeam.players[ap.hk]?.army || '-'}
                hkRole="auto-paired"
                oppName={oppTeam.players[ap.opp]?.name || '-'}
                oppArmy={oppTeam.players[ap.opp]?.army || '-'}
                oppRole="auto-paired"
              />
            ))}

            {/* ──── Mission Summary ──── */}
            {(() => {
              const hkDefPlayer = hkTeam.players[confirmedData.hkDef];
              const oppAttPlayer = oppTeam.players[confirmedData.pickOpp];
              const hkAttPlayer = hkTeam.players[confirmedData.pickHK];
              const oppDefPlayer = oppTeam.players[confirmedData.oppDef];

              const hkDefHasFD = hkDefPlayer?.forceDisposition;
              const oppAttHasFD = oppAttPlayer?.forceDisposition;
              const hkAttHasFD = hkAttPlayer?.forceDisposition;
              const oppDefHasFD = oppDefPlayer?.forceDisposition;

              const showMissions = hkDefHasFD || hkAttHasFD || oppDefHasFD || oppAttHasFD;

              if (!showMissions) return null;

              return (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ color: '#FFDE00', marginBottom: 15 }}>🎯 Generated Missions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Match 1: HK Defender mission */}
                    {hkDefHasFD && oppAttHasFD && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#DE2910', marginBottom: 6 }}>
                          🇭🇰 {hkDefPlayer.name} ({hkDefPlayer.army})
                        </div>
                        <MissionMini
                          mission={getMission(hkDefPlayer.forceDisposition!, oppAttPlayer.forceDisposition!)}
                          fd={hkDefPlayer.forceDisposition!}
                          vsFd={oppAttPlayer.forceDisposition!}
                        />
                      </div>
                    )}
                    {/* Match 2: HK Attacker mission */}
                    {hkAttHasFD && oppDefHasFD && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#DE2910', marginBottom: 6 }}>
                          🇭🇰 {hkAttPlayer.name} ({hkAttPlayer.army})
                        </div>
                        <MissionMini
                          mission={getMission(hkAttPlayer.forceDisposition!, oppDefPlayer.forceDisposition!)}
                          fd={hkAttPlayer.forceDisposition!}
                          vsFd={oppDefPlayer.forceDisposition!}
                        />
                      </div>
                    )}
                  </div>
                  {/* Auto-paired missions */}
                  {confirmedData.autoMatches?.map((ap, i) => {
                    const hkP = hkTeam.players[ap.hk];
                    const oppP = oppTeam.players[ap.opp];
                    if (!hkP?.forceDisposition || !oppP?.forceDisposition) return null;
                    return (
                      <div key={i} style={{ marginTop: 14 }}>
                        <div style={{ fontSize: '0.8rem', color: '#DE2910', marginBottom: 6 }}>
                          🇭🇰 {hkP.name} ({hkP.army}) — Auto-paired
                        </div>
                        <MissionMini
                          mission={getMission(hkP.forceDisposition, oppP.forceDisposition)}
                          fd={hkP.forceDisposition}
                          vsFd={oppP.forceDisposition}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="btn-center" style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={undoConfirm}>
                ↩️ Undo Confirm
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentRound(round > 1 ? round - 1 : 0)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={() => setCurrentRound(round < 4 ? round + 1 : 4)}>
                {round === 3 ? 'View Results →' : `Round ${round + 1} →`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
