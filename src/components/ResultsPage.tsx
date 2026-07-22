import { useApp } from '../store';
import { getMission } from '../missionData';

// Inline FD lookup
function fdLabel(key?: string): string {
  const labels: Record<string, string> = {
    'reconnaissance': 'Recon', 'priority-assets': 'Assets',
    'disruption': 'Disrupt', 'take-and-hold': 'Hold', 'purge-the-foe': 'Purge',
  };
  return key ? ` [${labels[key] ?? key}]` : '';
}

export function ResultsPage() {
  const { state, setCurrentRound, resetState } = useApp();
  const hkTeam = state.hkTeam!;
  const oppTeam = state.oppTeam!;
  const matches = state.allMatches;

  // Get matrix scores for a pairing (both directions)
  const getMatrixScore = (hkIdx: number, oppIdx: number): number | undefined => {
    const hk = hkTeam.players[hkIdx];
    const opp = oppTeam.players[oppIdx];
    return opp.scores[hk.name];
  };
  const getHKScore = (hkIdx: number, oppIdx: number): number | undefined => {
    const hk = hkTeam.players[hkIdx];
    const opp = oppTeam.players[oppIdx];
    return hk.scores[opp.name];
  };

  // Averages from actual matched pairings only
  const hkScores = matches.map(m => getHKScore(m.hk, m.opp)).filter(s => s !== undefined) as number[];
  const hkAvg = hkScores.length > 0
    ? (hkScores.reduce((a, b) => a + b, 0) / hkScores.length).toFixed(2)
    : '-';

  const oppScores = matches.map(m => getMatrixScore(m.hk, m.opp)).filter(s => s !== undefined) as number[];
  const oppAvg = oppScores.length > 0
    ? (oppScores.reduce((a, b) => a + b, 0) / oppScores.length).toFixed(2)
    : '-';

  const getScoreColor = (s: number | undefined): string => {
    if (s === undefined) return '#888';
    return s >= 4 ? '#4ade80' : s <= 2 ? '#ef4444' : '#fbbf24';
  };

  const exportCSV = () => {
    const header = 'Table,HK Player,HK Army,Score,Opp Army,Opp Player';
    const rows = matches.map((m, i) => {
      const hk = hkTeam.players[m.hk];
      const opp = oppTeam.players[m.opp];
      const s = getMatrixScore(m.hk, m.opp);
      return `${i + 1},"${hk?.name || '-'}","${hk?.army || '-'}",${s !== undefined ? s.toFixed(1) : '-'},"${opp?.army || '-'}","${opp?.name || '-'}"`;
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
    const text = matches.map((m, i) => {
      const hk = hkTeam.players[m.hk];
      const opp = oppTeam.players[m.opp];
      const s = getMatrixScore(m.hk, m.opp);
      return `Table ${i + 1}: 🇭🇰 ${hk?.name} (${hk?.army}) vs ${opp?.name} (${opp?.army}) 🌐 — Score: ${s !== undefined ? s.toFixed(1) : '-'}`;
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
            <div className="label">Matched Avg</div>
          </div>
          <div className="result-box opp">
            <h3>🌐 {oppTeam.name}</h3>
            <div className="score">{oppAvg}</div>
            <div className="label">Matched Avg</div>
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
                <th>Score</th>
                <th>Opp FD</th>
                <th>Opp Army</th>
                <th>🌐 Opp Player</th>
                <th>🎯 Mission</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => {
                const hk = hkTeam.players[m.hk];
                const opp = oppTeam.players[m.opp];
                const hkFd = fdLabel(hk?.forceDisposition);
                const oppFd = fdLabel(opp?.forceDisposition);
                const score = getMatrixScore(m.hk, m.opp);
                const mission = (hk?.forceDisposition && opp?.forceDisposition)
                  ? getMission(hk.forceDisposition, opp.forceDisposition) : null;
                return (
                  <tr key={i}>
                    <td><span className="table-no">{m.tableNo || i + 1}</span></td>
                    <td className="hk-side">
                      <div>🇭🇰 {hk?.name}</div>
                    </td>
                    <td>{hk?.army}</td>
                    <td style={{ fontSize: '0.75rem', color: '#8892b0' }}>{hkFd || '-'}</td>
                    <td style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
                      {score !== undefined ? score.toFixed(1) : ''}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#8892b0' }}>{oppFd || '-'}</td>
                    <td>{opp?.army}</td>
                    <td className="opp-side">
                      <div>🌐 {opp?.name}</div>
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
