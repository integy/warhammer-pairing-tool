import { useState } from 'react';
import { useApp } from '../store';
import type { RoundPairing } from '../types';
import { getMission } from '../missionData';

// Inline FD lookup
const FD_MAP: Record<string, { shortName: string; tagClass: string }> = {
  'reconnaissance': { shortName: 'Recon', tagClass: 'recon' },
  'priority-assets': { shortName: 'Assets', tagClass: 'priority' },
  'disruption': { shortName: 'Disrupt', tagClass: 'disruption' },
  'take-and-hold': { shortName: 'Hold', tagClass: 'takehold' },
  'purge-the-foe': { shortName: 'Purge', tagClass: 'purge' },
};
function fdLabel(key?: string): string {
  const labels: Record<string, string> = {
    'reconnaissance': 'Recon', 'priority-assets': 'Assets',
    'disruption': 'Disrupt', 'take-and-hold': 'Hold', 'purge-the-foe': 'Purge',
  };
  return key ? ` [${labels[key] ?? key}]` : '';
}

function ScoreBadge({ score }: { score: number | undefined }) {
  if (score === undefined) return null;
  const color = score >= 4 ? '#4ade80' : score <= 2 ? '#ef4444' : '#fbbf24';
  return <span style={{ color, fontSize: '0.75rem' }}>({score.toFixed(1)})</span>;
}

export function ResultsPage() {
  const { state, updateMatches, setCurrentRound, resetState } = useApp();
  const hkTeam = state.hkTeam!;
  const oppTeam = state.oppTeam!;
  const [localMatches, setLocalMatches] = useState<RoundPairing[]>([...state.allMatches]);

  const updateScore = (idx: number, side: 'hk' | 'opp', val: string) => {
    const num = parseFloat(val) || 0;
    const updated = localMatches.map((m, i) => {
      if (i !== idx) return m;
      return side === 'hk' ? { ...m, hkScore: num } : { ...m, oppScore: num };
    });
    setLocalMatches(updated);
    updateMatches(updated);
  };

  const hkAvg = localMatches.length ? (localMatches.reduce((s, m) => s + (m.hkScore || 0), 0) / localMatches.length).toFixed(2) : '-';
  const oppAvg = localMatches.length ? (localMatches.reduce((s, m) => s + (m.oppScore || 0), 0) / localMatches.length).toFixed(2) : '-';

  const exportCSV = () => {
    const header = 'Table,HK Player,HK Army,HK Score,Opp Score,Opp Army,Opp Player';
    const rows = localMatches.map((m, i) => {
      const hk = hkTeam.players[m.hk];
      const opp = oppTeam.players[m.opp];
      return `${i + 1},"${hk?.name || '-'}","${hk?.army || '-'}",${m.hkScore || 0},${m.oppScore || 0},"${opp?.army || '-'}","${opp?.name || '-'}"`;
    });
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wtc-results-${hkTeam.name}-vs-${oppTeam.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = localMatches.map((m, i) => {
      const hk = hkTeam.players[m.hk];
      const opp = oppTeam.players[m.opp];
      return `Table ${i + 1}: 🇭🇰 ${hk?.name} (${hk?.army}) ${m.hkScore || 0} - ${m.oppScore || 0} ${opp?.name} (${opp?.army}) 🌐`;
    }).join('\n') + `\n\n🇭🇰 ${hkTeam.name}: ${hkAvg} avg\n🌐 ${oppTeam.name}: ${oppAvg} avg`;
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!')).catch(() => alert('Failed to copy'));
  };

  return (
    <div className="page active">
      <div className="panel">
        <h2 className="panel-title">🏆 Final Results</h2>

        {/* Score summary */}
        <div className="results-summary">
          <div className="result-box hk">
            <h3>🇭🇰 {hkTeam.name}</h3>
            <div className="score">{hkAvg}</div>
            <div className="label">Avg Score</div>
          </div>
          <div className="result-box opp">
            <h3>🌐 {oppTeam.name}</h3>
            <div className="score">{oppAvg}</div>
            <div className="label">Avg Score</div>
          </div>
        </div>

        {/* Match results table */}
        <h3 style={{ color: '#FFDE00', marginBottom: 15 }}>📊 Match Results</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>🇭🇰 HK Player</th>
                <th>HK Army</th>
                <th>HK FD</th>
                <th>HK Score</th>
                <th></th>
                <th>Opp Score</th>
                <th>Opp FD</th>
                <th>Opp Army</th>
                <th>🌐 Opp Player</th>
                <th>🎯 Mission</th>
              </tr>
            </thead>
            <tbody>
              {localMatches.map((m, i) => {
                const hk = hkTeam.players[m.hk];
                const opp = oppTeam.players[m.opp];
                const hkFd = fdLabel(hk?.forceDisposition);
                const oppFd = fdLabel(opp?.forceDisposition);
                const mission = (hk?.forceDisposition && opp?.forceDisposition)
                  ? getMission(hk.forceDisposition, opp.forceDisposition) : null;
                return (
                  <tr key={i}>
                    <td><input type="number" className="table-no" value={m.tableNo || i + 1} readOnly /></td>
                    <td className="hk-side">
                      <div>🇭🇰 {hk?.name}</div>
                      <ScoreBadge score={hk?.scores?.[opp?.name]} />
                    </td>
                    <td>{hk?.army}</td>
                    <td style={{ fontSize: '0.75rem', color: '#8892b0' }}>{hkFd || '-'}</td>
                    <td><input type="number" className="score-input" value={m.hkScore || ''} min={0} max={20} step={0.5} onChange={e => updateScore(i, 'hk', e.target.value)} /></td>
                    <td style={{ color: '#888' }}>vs</td>
                    <td><input type="number" className="score-input" value={m.oppScore || ''} min={0} max={20} step={0.5} onChange={e => updateScore(i, 'opp', e.target.value)} /></td>
                    <td style={{ fontSize: '0.75rem', color: '#8892b0' }}>{oppFd || '-'}</td>
                    <td>{opp?.army}</td>
                    <td className="opp-side">
                      <div>🌐 {opp?.name}</div>
                      <ScoreBadge score={opp?.scores?.[hk?.name]} />
                    </td>
                    <td className="mission-cell">{mission ? mission.name : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Export + Actions */}
        <div className="btn-center" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportCSV}>📥 Export CSV</button>
          <button className="btn btn-secondary" onClick={copyToClipboard}>📋 Copy to Clipboard</button>
          <button className="btn btn-secondary" onClick={() => setCurrentRound(3)}>← Back to R3</button>
          <button className="btn btn-primary" onClick={resetState}>🔄 New Tournament</button>
        </div>
      </div>
    </div>
  );
}
