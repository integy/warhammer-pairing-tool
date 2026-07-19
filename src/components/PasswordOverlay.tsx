import { useState } from 'react';
import { useApp } from '../store';

export function PasswordOverlay() {
  const { settings } = useApp();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const check = () => {
    if (input === settings.password) {
      sessionStorage.setItem('wtc-authed', '1');
      window.location.reload();
    } else {
      setError('Incorrect password');
      setInput('');
    }
  };

  return (
    <div className="password-overlay">
      <div className="password-box">
        <h2>🔒 WTC Pairing Tool</h2>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Enter Password"
          autoFocus
        />
        <button onClick={check}>Enter</button>
        {error && <p className="password-error">{error}</p>}
      </div>
    </div>
  );
}
