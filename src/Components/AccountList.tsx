import React from 'react';

type Account = { username: string; createdAt: string };

export default function AccountList({ accounts, visible, className, onClose }:
  { accounts: Account[]; visible: boolean; className?: string; onClose?: () => void }) {
  if (!visible) return null;

  return (
    <div className={`account-list ${className ?? ''}`} role="menu">
      {accounts.length ? (
        accounts.map(a => (
          <div key={a.username} className="account-list-item">{a.username} — {new Date(a.createdAt).toLocaleString()}</div>
        ))
      ) : (
        <div className="account-list-item">(aucun)</div>
      )}
    </div>
  );
}
