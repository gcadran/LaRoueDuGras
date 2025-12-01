export type User = {
  username: string;
  passwordHash: string;
  createdAt: string;
  role?: "admin" | "user";
};

const ACCOUNTS_KEY = "roulette_accounts";
const CURRENT_KEY = "roulette_current_user";

export class AccountManager {
  private accounts: User[] = [];
  private _ready: Promise<void> | null = null;

  constructor() {
    this.load();
    // créer un compte admin par défaut si absent (non-bloquant)
    // stocke la promesse d'initialisation pour que les consommateurs
    // puissent attendre que l'admin par défaut soit créé.
    this._ready = this.ensureDefaultAdmin();
  }

  private async ensureDefaultAdmin() {
    try {
      // si aucun compte 'admin' présent, le créer avec mot de passe 'admin'
      const existing = this.accounts.find((a) => a.username === "admin");
      if (!existing) {
        // createAccount gère le hachage et la sauvegarde
        await this.createAccount("admin", "admin", "admin");
      } else if (existing.role !== "admin") {
        // corrige le rôle si un compte admin sans rôle correcte existe
        existing.role = "admin";
        this.save();
        // si l'utilisateur courant est 'admin' mais sa session contient encore role 'user', mettre à jour
        try {
          const curRaw = localStorage.getItem(CURRENT_KEY);
          if (curRaw) {
            const cur = JSON.parse(curRaw);
            if (cur && cur.username === "admin" && cur.role !== "admin") {
              localStorage.setItem(CURRENT_KEY, JSON.stringify({ username: "admin", role: "admin", authenticatedAt: new Date().toISOString() }));
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ne pas bloquer l'initialisation si l'opération échoue
      // (par ex. si localStorage est verrouillé)
    }
  }

  /**
   * Retourne une promesse résolue lorsque l'initialisation (création admin)
   * est terminée. Toujours résolue (ne rejette pas).
   */
  waitReady(): Promise<void> {
    if (!this._ready) return Promise.resolve();
    return this._ready.catch(() => undefined);
  }

  private load() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      this.accounts = raw ? JSON.parse(raw) : [];
      // normaliser les rôles pour les données existantes : s'assurer que chaque compte a un rôle
      let changed = false;
      for (const a of this.accounts) {
        if (!a.role) { a.role = "user"; changed = true; }
        if (a.username === "admin" && a.role !== "admin") { a.role = "admin"; changed = true; }
      }
      if (changed) this.save();
    } catch (e) {
      this.accounts = [];
    }
  }

  private save() {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this.accounts));
  }

  private async hash(password: string) {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const enc = new TextEncoder().encode(password);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // fallback (weak) if crypto.subtle not available
    let h = 0;
    for (let i = 0; i < password.length; i++) {
      h = (h << 5) - h + password.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  /**
   * Retourne la liste des comptes visibles pour l'utilisateur courant.
   * - si l'utilisateur courant est admin => retourne tous les comptes
   * - si utilisateur non-admin ou non connecté => retourne seulement son propre compte (si connecté)
   */
  listAccounts() {
    const cur = this.getCurrentUser();
    if (cur && (cur as any).role === "admin") {
      return this.accounts.map((a) => ({ username: a.username, createdAt: a.createdAt }));
    }
    if (cur) {
      const found = this.accounts.find((a) => a.username === (cur as any).username);
      return found ? [{ username: found.username, createdAt: found.createdAt }] : [];
    }
    return [];
  }

  /**
   * Pour debug : retourne les objets utilisateurs complets (incluant passwordHash).
   * Ne pas exposer en production.
   */
  getAllAccounts() {
    return this.accounts.map((a) => ({ ...a }));
  }

  async createAccount(username: string, password: string, role: "admin" | "user" = "user") {
    username = username.trim();
    if (!username || !password) throw new Error("Nom d'utilisateur et mot de passe requis");
    if (this.accounts.find((a) => a.username === username)) throw new Error("Compte déjà existant");
    const passwordHash = await this.hash(password);
    const user: User = { username, passwordHash, createdAt: new Date().toISOString(), role };
    this.accounts.push(user);
    this.save();
    return user;
  }

  async authenticate(username: string, password: string) {
    const passwordHash = await this.hash(password);
    const found = this.accounts.find((a) => a.username === username && a.passwordHash === passwordHash);
    if (!found) return false;
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ username: found.username, role: found.role || "user", authenticatedAt: new Date().toISOString() }));
    return true;
  }

  logout() {
    localStorage.removeItem(CURRENT_KEY);
  }

  getCurrentUser(): { username: string; role?: string; authenticatedAt: string } | null {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  deleteAccount(username: string) {
    const idx = this.accounts.findIndex((a) => a.username === username);
    if (idx === -1) throw new Error("Compte introuvable");
    this.accounts.splice(idx, 1);
    this.save();
    // if deleted user was current, log out
    const cur = this.getCurrentUser();
    if (cur && cur.username === username) this.logout();
  }
}

export default AccountManager;
