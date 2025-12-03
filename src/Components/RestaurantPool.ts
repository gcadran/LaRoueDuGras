export type Probs = Record<string, number>;

export class RestaurantPool {
  private base: Probs = {
    McDo: 0.2,
    BurgerKing: 0.1,
    KFC: 0.1,
    Subway: 0.15,
    Ange: 0.25,
    Kebab: 0.3,
    RU: 0.1,
    "Holly's": 0.1,
  };

  private STORAGE_KEY = "roulette_base_probs";

  constructor() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Probs;
        // validate parsed is an object of numbers
        const ok = Object.values(parsed).every((v) => typeof v === "number");
        if (ok) this.base = { ...parsed };
      }
    } catch (e) {
      // ignore and keep default
    }
  }

  /** Remplace les probabilités de base et les persiste en localStorage */
  setBaseProbs(next: Probs) {
    this.base = { ...next };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.base));
    } catch (e) {
      // ignore storage errors
    }
  }

  getBaseProbs(): Probs {
    return { ...this.base };
  }

  /**
   * Retourne les probabilités finales normalisées et le nom boosté (s'il y en a).
   */
  getProbs(today: number, history: string[] = []): { probs: Probs; boosted: string | null } {
    const probs = this.getBaseProbs();
    let boosted: string | null = null;

    // Bonus du jour
    if (today === 2) {
      probs.KFC = 0.35;
      boosted = "KFC";
    } else if (today === 3) {
      probs.BurgerKing = 0.35;
      boosted = "BurgerKing";
    }

    // Éviter les répétitions -> diminuer les 3 derniers choix
    const recent = history.slice(0, 3).map((e) => e.split(" ")[0]);
    for (const r of recent) {
      if (probs[r]) probs[r] *= 0.75;
    }

    // Normalisation
    const total = Object.values(probs).reduce((a, b) => a + b, 0) || 1;
    for (const k in probs) probs[k] = probs[k] / total;

    return { probs, boosted };
  }

  weightedPick(probs: Probs): string {
    const r = Math.random();
    let acc = 0;
    for (const [name, p] of Object.entries(probs)) {
      acc += p;
      if (r <= acc) return name;
    }
    return Object.keys(probs)[0];
  }
}

export default RestaurantPool;
