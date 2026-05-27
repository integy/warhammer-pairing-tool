import { useState } from 'react';
import { useApp } from '../store';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useApp();
  const [pwd, setPwd] = useState(settings.password);
  const [enabled, setEnabled] = useState(settings.passwordEnabled);

  const save = () => {
    updateSettings({ password: pwd || '0821', passwordEnabled: enabled });
    onClose();
  };

  const logout = () => {
    sessionStorage.removeItem('wtc-authed');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>⚙️ Settings</h3>

        <label className="setting-row">
          <span>Password Protection</span>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        </label>

        {enabled && (
          <div className="setting-row">
            <label>Password</label>
            <input
              type="text" value={pwd}
              onChange={e => setPwd(e.target.value)}
              className="setting-input"
            />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={save}>Save</button>
          <button className="btn btn-secondary" onClick={logout}>🔒 Lock</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
