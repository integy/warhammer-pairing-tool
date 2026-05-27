import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import type { RoundState, Team } from '../types';
import { analyzeDefenders, getTopAttackers, autoOptimalRound, createEmptyRound } from '../engine';

function getScoreColor(s: number | undefined): string {
  if (s === undefined) return '#555';
  return s >= 4 ? '#4ade80' : s >= 3 ? '#fbbf24' : '#ef4444';
}

function ScoreLabel({ score }: { score: number | undefined }) {
  if (score === undefined) return null;
  return <span style={{ color: getScoreColor(score), fontSize: '0.75rem' }}>({score.toFixed(1)})</span>;
}

function BothScores({ attScore, defScore }: { attScore: number | undefined; defScore: number | undefined }) {
  return (
    <span style={{ fontSize: '0.75rem' }}>
      <span style={{ color: getScoreColor(attScore) }}>[{attScore?.toFixed(1) ?? '-'}</span>
      :<span style={{ color: getScoreColor(defScore) }}>{defScore?.toFixed(1) ?? '-'}]</span>
    </span>
  );
}

const PAGE_MAP: Record<number, string> = { 1: '⚔️ Round 1', 2: '⚔️ Round 2', 3: '⚔️ Round 3' };

export function RoundPage({ round }: { round: number }) {
  const { state, setCurrentRound, updateRounds, updateMatches, setTeamSizeMode } = useApp();
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

  // Sync state when rd changes
  useEffect(() => {
    setHkDef(rd.hkDefender);
    setOppDef(rd.oppDefender);
    setHkAtts(rd.hkAttackers || []);
    setOppAtts(rd.oppAttackers || []);
    setPickHK(rd.pickhk);
    setPickOpp(rd.pickopp);
    if (rd.done) setStep('pairing');
  }, [round]);

  const poolHK = rd.poolHK || hkTeam.players.map((_, i) => i);
  const poolOpp = rd.poolOpp || oppTeam.players.map((_, i) => i);

  // Backward induction analysis for this round
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
    const maxAtt = round === 3 ? 1 : 2;
    setHkAtts(result.hkAttackers.slice(0, maxAtt));
    setOppAtts(result.oppAttackers.slice(0, maxAtt));
    setStep('pairing');
  };

  const toggleHkAtt = (idx: number) => {
    const max = round === 3 ? 1 : 2;
    setHkAtts(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= max) { alert(`Max ${max} attacker(s)!`); return prev; }
      return [...prev, idx];
    });
  };
  const toggleOppAtt = (idx: number) => {
    const max = round === 3 ? 1 : 2;
    setOppAtts(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= max) { alert(`Max ${max} attacker(s)!`); return prev; }
      return [...prev, idx];
    });
  };

  const canPair = hkDef !== undefined && oppDef !== undefined && hkAtts.length >= 1 && oppAtts.length >= 1;

  const confirm = () => {
    if (pickHK === undefined || pickOpp === undefined) {
      alert('Both defenders must pick an opponent!'); return;
    }
    const matches = [...state.allMatches];

    // Match 1: HK Defender vs Opp attacker picked by HK defender
    matches.push({ round, hk: hkDef!, hkRole: 'defender', opp: pickOpp, oppRole: 'attacker' });
    // Match 2: Opp Defender vs HK attacker picked by Opp defender
    matches.push({ round, hk: pickHK, hkRole: 'attacker', opp: oppDef!, oppRole: 'defender' });

    const hkUsed = new Set([hkDef!, pickHK]);
    const oppUsed = new Set([oppDef!, pickOpp]);
    const unusedHK = poolHK.filter(i => !hkUsed.has(i));
    const unusedOpp = poolOpp.filter(i => !oppUsed.has(i));

    const updatedRound: RoundState = {
      hkDefender: hkDef, oppDefender: oppDef,
      hkAttackers: hkAtts, oppAttackers: oppAtts,
      pickhk: pickHK, pickopp: pickOpp,
      done: true, poolHK, poolOpp, unusedHK, unusedOpp,
    };

    updateMatches(matches);
    updateRounds({ [round]: updatedRound });

    if (round === 1) {
      if (state.teamSizeMode === 6) {
        updateRounds({ 3: { ...createEmptyRound(unusedHK, unusedOpp), poolHK: unusedHK, poolOpp: unusedOpp } });
        setCurrentRound(3);
      } else {
        updateRounds({ 2: { ...createEmptyRound(unusedHK, unusedOpp), poolHK: unusedHK, poolOpp: unusedOpp } });
        setCurrentRound(2);
      }
    } else if (round === 2) {
      // R3 pool = unused players from R2 (unpicked attacker already in unused, no double-count)
      updateRounds({ 3: { ...createEmptyRound(unusedHK, unusedOpp), poolHK: unusedHK, poolOpp: unusedOpp } });
      setCurrentRound(3);
    } else if (round === 3) {
      // Auto-pair remaining
      const unpickedHK = hkAtts.filter(i => i !== pickHK);
      const unpickedOpp = oppAtts.filter(i => i !== pickOpp);
      const allUsedHK = new Set([hkDef!, pickHK, ...hkAtts]);
      const allUsedOpp = new Set([oppDef!, pickOpp, ...oppAtts]);
      const lastHK = poolHK.filter(i => !allUsedHK.has(i));
      const lastOpp = poolOpp.filter(i => !allUsedOpp.has(i));

      for (let i = 0; i < unpickedHK.length && i < unpickedOpp.length; i++) {
        matches.push({ round, hk: unpickedHK[i], hkRole: 'auto-paired', opp: unpickedOpp[i], oppRole: 'auto-paired' });
      }
      for (let i = 0; i < lastHK.length && i < lastOpp.length; i++) {
        matches.push({ round, hk: lastHK[i], hkRole: 'auto-paired', opp: lastOpp[i], oppRole: 'auto-paired' });
      }
      updateMatches(matches);
      setCurrentRound(4);
    }
  };

  // Undo: go back to defender step
  const undo = () => {
    setHkDef(undefined);
    setOppDef(undefined);
    setHkAtts([]);
    setOppAtts([]);
    setPickHK(undefined);
    setPickOpp(undefined);
    setStep('defender');
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

  return (
    <div className="page active">
      <div className="panel">
        <h2 className="panel-title">{PAGE_MAP[round]} — Attack / Defend</h2>
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
                    return (
                      <th key={i} style={isBest ? { background: '#2d5a2d', color: '#4ade80' } : undefined}>
                        {p.name}⭐<br /><span style={{ fontSize: '0.65rem', color: '#888' }}>{p.army}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {poolOpp.map(oi => {
                  const opp = oppTeam.players[oi];
                  return (
                    <tr key={oi}>
                      <td className="row-header">{opp.name}</td>
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
              <select
                value={hkDef ?? ''}
                onChange={e => setHkDef(e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={rd.done}
              >
                <option value="">-- Select Defender --</option>
                {poolHK.map(i => (
                  <option key={i} value={i}>{hkTeam.players[i].name} ({hkTeam.players[i].army})</option>
                ))}
              </select>
            </div>
            <div>
              <h4 style={{ color: '#00d4ff' }}>🌐 {oppTeam.name} — Defender</h4>
              <select
                value={oppDef ?? ''}
                onChange={e => setOppDef(e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={rd.done}
              >
                <option value="">-- Select Defender --</option>
                {poolOpp.map(i => (
                  <option key={i} value={i}>{oppTeam.players[i].name} ({oppTeam.players[i].army})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn btn-success" onClick={doAutoOptimal} disabled={rd.done || poolHK.length < 2}>
              🤖 Auto-Optimal
            </button>
            <button className="btn btn-secondary" onClick={undo} style={{ marginLeft: 8 }}>
              ↩️ Undo
            </button>
          </div>
        </div>

        {/* Step 2: Attacker Selection */}
        {hkDef !== undefined && oppDef !== undefined && !rd.done && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: '#DE2910', marginBottom: 10 }}>
              🇭🇰 Select {round === 3 ? '1' : '2'} Attacker{round === 3 ? '' : 's'} vs {oppTeam.players[oppDef]?.name}
            </h4>
            <div className="pick-btns">
              {poolHK.filter(i => i !== hkDef).map(i => {
                const p = hkTeam.players[i];
                const attScore = p.scores?.[oppTeam.players[oppDef!]?.name];
                const defScore = oppTeam.players[oppDef!]?.scores?.[p.name];
                const isTop = getTopAttackers(poolHK.filter(j => j !== hkDef), oppTeam.players[oppDef!]?.name, hkTeam).includes(i);
                return (
                  <button
                    key={i}
                    className={`pick-btn ${hkAtts.includes(i) ? 'selected' : ''}`}
                    onClick={() => toggleHkAtt(i)}
                    disabled={rd.done}
                  >
                    {p.name} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                    <BothScores attScore={attScore} defScore={defScore} />
                    {isTop && ' ⭐'}
                  </button>
                );
              })}
            </div>

            <h4 style={{ color: '#00d4ff', marginBottom: 10, marginTop: 15 }}>
              🌐 Select {round === 3 ? '1' : '2'} Attacker{round === 3 ? '' : 's'} vs {hkTeam.players[hkDef]?.name}
            </h4>
            <div className="pick-btns">
              {poolOpp.filter(i => i !== oppDef).map(i => {
                const p = oppTeam.players[i];
                const attScore = p.scores?.[hkTeam.players[hkDef!]?.name];
                const defScore = hkTeam.players[hkDef!]?.scores?.[p.name];
                const isTop = getTopAttackers(poolOpp.filter(j => j !== oppDef), hkTeam.players[hkDef!]?.name, oppTeam).includes(i);
                return (
                  <button
                    key={i}
                    className={`pick-btn ${oppAtts.includes(i) ? 'selected' : ''}`}
                    onClick={() => toggleOppAtt(i)}
                    disabled={rd.done}
                  >
                    {p.name} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                    <BothScores attScore={attScore} defScore={defScore} />
                    {isTop && ' ⭐'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Match Pairing */}
        {canPair && !rd.done && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: '#FFDE00', marginBottom: 15 }}>🔗 Match Pairings</h3>

            {/* Match: HK Defender vs Opp Attacker */}
            <div className="match-card active" style={{ marginBottom: 12 }}>
              <div className="match-header">
                <span className="match-title">Match {state.allMatches.length + 1}</span>
              </div>
              <div className="match-content">
                <div className="slot defender">
                  <div className="name">🇭🇰 {hkTeam.players[hkDef!].name}</div>
                  <div className="army-tag">{hkTeam.players[hkDef!].army}</div>
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
                      return (
                        <button
                          key={i}
                          className={`pick-btn ${pickOpp === i ? 'selected' : ''}`}
                          onClick={() => setPickOpp(i)}
                        >
                          {p.name} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                          <BothScores attScore={attScore} defScore={defScore} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Match: Opp Defender vs HK Attacker */}
            <div className="match-card active" style={{ marginBottom: 12 }}>
              <div className="match-header">
                <span className="match-title">Match {state.allMatches.length + 2}</span>
              </div>
              <div className="match-content">
                <div className="slot attacker">
                  <div className="name">🌐 {oppTeam.players[oppDef!].name}</div>
                  <div className="army-tag">{oppTeam.players[oppDef!].army}</div>
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
                      return (
                        <button
                          key={i}
                          className={`pick-btn ${pickHK === i ? 'selected' : ''}`}
                          onClick={() => setPickHK(i)}
                        >
                          {p.name} <span style={{ color: '#888', fontSize: '0.7rem' }}>{p.army}</span>
                          <BothScores attScore={attScore} defScore={defScore} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="btn-center" style={{ marginTop: 15 }}>
              <button className="btn btn-success" onClick={confirm}>✓ Confirm Round {round}</button>
            </div>
          </div>
        )}

        {/* Already confirmed */}
        {rd.done && (
          <div className="info-banner" style={{ textAlign: 'center', padding: 20 }}>
            ✅ Round {round} confirmed! {round === 3 ? `${state.allMatches.length} total matches` : 'Proceeding to next round.'}
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
      </div>
    </div>
  );
}
