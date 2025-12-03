import React from 'react';

type Account = { username: string; createdAt: string };

export default function AccountList({ accounts, visible, className, onClose, onDelete }:
  { accounts: Account[]; visible: boolean; className?: string; onClose?: () => void; onDelete?: (username: string) => void }) {
  if (!visible) return null;

  return (
    <div className={`account-list ${className ?? ''}`} role="menu">
      {accounts.length ? (
        accounts.map(a => (
          <div key={a.username} className="account-list-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>{a.username} — {new Date(a.createdAt).toLocaleString()}</div>
            {onDelete && a.username !== 'admin' && (
              <button
                className="btn small danger"
                aria-label={`Supprimer ${a.username}`}
                onClick={() => onDelete(a.username)}
                title="Supprimer ce compte"
              >Supprimer</button>
            )}
          </div>
        ))
      ) : (
        <div className="account-list-item">(aucun)</div>
      )}
    </div>
  );
}
