import React, { useEffect, useState } from "react";
import AccountManager from "./AccountManager";
import AccountList from "./AccountList";

export default function AccountButton() {
  const [open, setOpen] = useState(false);
  const [am] = useState(() => new AccountManager());
  const [current, setCurrent] = useState(am.getCurrentUser());
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{ username: string; createdAt: string }[]>([]);
  

  

  useEffect(() => {
    // attendre l'initialisation (création éventuelle du compte admin)
    let mounted = true;
    am.waitReady().then(() => {
      if (mounted) setCurrent(am.getCurrentUser());
    });
    return () => { mounted = false };
  }, [open, am]);

  useEffect(() => {
    let mounted = true;
    am.waitReady().then(() => {
      if (mounted) setAccounts(am.listAccounts());
    });
    return () => { mounted = false };
  }, [open, am]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      // attendre que l'AccountManager ait fini son initialisation
      await am.waitReady();
      if (mode === "register") {
        await am.createAccount(username, password);
        setMessage("Compte créé — vous pouvez maintenant vous connecter.");
        setMode("login");
        setUsername("");
        setPassword("");
        setAccounts(am.listAccounts());
      } else {
        const ok = await am.authenticate(username, password);
        if (!ok) throw new Error("Identifiants invalides");
        setMessage("Connecté !");
        const cur = am.getCurrentUser();
        setCurrent(cur);
        setAccounts(am.listAccounts());
        // Si l'utilisateur est admin, garder le modal ouvert pour afficher la liste
        if (!(cur as any)?.role || (cur as any).role !== 'admin') {
          setOpen(false);
        }
      }
    } catch (err: any) {
      // si l'erreur indique que le compte existe déjà, basculer en login
      const msg = err?.message || String(err);
      if (msg.includes("Compte déjà existant")) {
        setMessage("Ce compte existe déjà — essayez de vous connecter.");
        setMode("login");
      } else {
        setMessage(msg);
      }
    }
  }

  // when current user changes, refresh visible accounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      await am.waitReady();
      if (mounted) setAccounts(am.listAccounts());
    })();
    return () => { mounted = false };
  }, [current, am]);

  function handleLogout() {
    am.logout();
    setCurrent(null);
    setMessage("Déconnecté.");
  }

  // quickAdminLogin removed (debug helper)

  return (
    <div className="account-actions" style={{ position: "relative" }}>

      <button className="account-button" onClick={() => setOpen((v) => !v)} aria-label="Compte">
        <svg className="account-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="3.2" stroke="#111827" strokeWidth="1.2" />
          <path d="M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* debug badge: shows current username and role for quick diagnosis */}
      <div className="account-badge" title={current ? `${current.username} — ${(current as any).role ?? 'user'}` : 'Non connecté'}>
        {current ? `${current.username}${(current as any).role ? ' • ' + (current as any).role : ''}` : 'Invité'}
      </div>

      {open && (
        <div className="account-modal">
          {current ? (
            <div>
              <h3>Connecté</h3>
              <div className="small">Utilisateur: {current.username}</div>
              <div className="small">Depuis: {new Date(current.authenticatedAt).toLocaleString()}</div>
              {/* If current user is admin, show visible accounts here as well */}
              {(current as any).role === 'admin' && (
                <div style={{ marginTop: 12 }}>
                  <strong>Comptes existants:</strong>
                  <AccountList accounts={accounts} visible={true} className="account-list-inline" />
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <button className="btn primary" onClick={() => { setOpen(false); }}>Fermer</button>
                <button style={{ marginTop: 8 }} className="btn" onClick={handleLogout}>Se déconnecter</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3>{mode === "login" ? "Se connecter" : "S'inscrire"}</h3>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nom d'utilisateur" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" type="password" />
              <button type="submit" className="btn primary">{mode === "login" ? "Connexion" : "S'inscrire"}</button>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}</button>
              </div>

              {/* Comptes existants: visible uniquement dans la vue 'Connecté' pour l'admin */}

              {message && <div className="small" style={{ marginTop: 8 }}>{message}</div>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
