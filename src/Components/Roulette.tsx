import React, { useEffect, useRef, useState } from "react";
import RestaurantPool from "./RestaurantPool";
import AccountManager from "./AccountManager";

type Segment = {
  name: string;
  p: number;
  start: number;
  end: number;
  color: string;
};

const CENTER_RADIUS = 24;
const LABEL_SIZE_MIN = 14;
const LABEL_SIZE_MAX = 20;
const pointerOffset = -Math.PI / 2;

export default function Roulette() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [debug, setDebug] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [bonusMessage, setBonusMessage] = useState<string>("");
  const rotationRef = useRef<number>(0);

  // MODE NORMAL
  const today: number = new Date().getDay();
  //MODE TEST DATE 
  //const today: number = 2; // for testing Tuesday

  // Pool des restaurants (gère probs, boost, historique)
  const pool = new RestaurantPool();
  const [boosted, setBoosted] = useState<string | null>(null);
  const skipNextHistorySegUpdate = useRef(false);

  // ---------------------------
  // MESSAGE BONUS
  // ---------------------------
  useEffect(() => {
    if (today === 2) {
      setBonusMessage("Aujourd’hui c’est Mardi : Bonus KFC 🔥");
    } else if (today === 3) {
      setBonusMessage("Aujourd’hui c’est Mercredi : Bonus BurgerKing 🔥");
    } else {
      setBonusMessage("");
    }
  }, [today]);

  // ---------------------------
  //  HISTORIQUE — CHARGEMENT JSON
  // ---------------------------

  useEffect(() => {
    const saved = localStorage.getItem("roulette_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // ---------------------------
  //  HISTORIQUE — SAUVEGARDE JSON
  // ---------------------------

  useEffect(() => {
    localStorage.setItem("roulette_history", JSON.stringify(history));
  }, [history]);

  // --------------------------------------
  // NOTE: l'adaptation des probabilités et la normalisation
  // sont maintenant gérées par `RestaurantPool`.

  // deterministic color per name so colors don't change on each rerender
  function colorFor(name: string) {
    // simple hash to hue
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) | 0;
    }
    const hue = Math.abs(h) % 360;
    return `hsl(${hue}, 68%, 72%)`;
  }

  // ---------------------------
  // CONVERSION SEGMENTS
  // ---------------------------

  function setSegmentsFromProbs(probs: Record<string, number>) {
    const out: Segment[] = [];
    let acc = 0;

    for (const [name, p] of Object.entries(probs)) {
      out.push({
        name,
        p,
        start: acc,
        end: acc + p,
        color: colorFor(name),
      });
      acc += p;
    }
    setSegments(out);
  }

  // (La sélection pondérée est effectuée par `RestaurantPool.weightedPick`)

  // ---------------------------
  // DESSIN DE LA ROUE
  // ---------------------------

  function drawWheel(rotation: number = 0) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const R = canvas.width / 2;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(rotation);
    ctx.translate(-R, -R);

    segments.forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(R, R);

      // Glow sur segment boosté
      if (s.name === boosted) {
        ctx.shadowColor = "gold";
        ctx.shadowBlur = 25;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = s.color;
      ctx.arc(
        R,
        R,
        radius,
        pointerOffset + 2 * Math.PI * s.start,
        pointerOffset + 2 * Math.PI * s.end
      );
      ctx.fill();

      const mid = (s.start + s.end) / 2;
      const angle = pointerOffset + 2 * Math.PI * mid;

      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(angle);
      ctx.textAlign = "right";
      ctx.fillStyle = s.name === boosted ? "#b8860b" : "#222";
      ctx.font = `${Math.round(
        LABEL_SIZE_MIN + (LABEL_SIZE_MAX - LABEL_SIZE_MIN) * s.p
      )}px 'Segoe UI', sans-serif`;
      ctx.fillText(s.name, radius - 10, 5);
      ctx.restore();
    });

    ctx.restore();

    // CENTRE
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(R, R, CENTER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // CURSEUR "\/"
    const triSize = 18;
    const marginTop = 8;
    const circleTop = R - radius;
    const baseY = circleTop - marginTop;
    const tipY = baseY + triSize;

    ctx.beginPath();
    ctx.moveTo(R, tipY);
    ctx.lineTo(R - triSize, baseY);
    ctx.lineTo(R + triSize, baseY);
    ctx.closePath();

    ctx.fillStyle = "#333";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  // ---------------------------
  // ANIMATION
  // ---------------------------

  function animateTo(angleFinal: number, callback: () => void) {
    const duration = 3500;
    const start = performance.now();

    function frame(t: number) {
      const dt = Math.min(1, (t - start) / duration);
      const ease = 1 - Math.pow(1 - dt, 3);
      const angle = ease * angleFinal;

      // update current rotation ref so redraws after segments change keep the position
      rotationRef.current = angle;
      drawWheel(angle);

      if (dt < 1) requestAnimationFrame(frame);
      else {
        rotationRef.current = angleFinal;
        drawWheel(angleFinal);
        setTimeout(callback, 80);
      }
    }

    requestAnimationFrame(frame);
  }

  // ---------------------------
  // SPIN
  // ---------------------------

  function spin() {
    if (isSpinning) return;
    // restriction: if anyone (guest or user) has spun today, block non-admins
    try {
      const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const lastGlobal = localStorage.getItem("roulette_last_spin_date");
      const am = new AccountManager();
      const cur = am.getCurrentUser();
      // if current is admin => allow always
      const isAdmin = cur && (cur as any).role === "admin";
      if (!isAdmin) {
        if (lastGlobal === todayStr) {
          window.alert("La roue a déjà été tournée aujourd'hui. Seul l'admin peut la relancer.");
          return;
        }
      }
    } catch (e) {
      // ignore errors and allow spin as fallback
    }
    setIsSpinning(true);
    setDebug("");

    // recalculer les probabilités actuelles (tient compte de l'historique)
    const { probs } = pool.getProbs(today, history);
    // ensure UI segments reflect the probs used for selection
    setSegmentsFromProbs(probs);

    const selected = pool.weightedPick(probs);

    // build a local cumulative mapping from probs to find the selected segment
    let acc = 0;
    type LocalSeg = { name: string; start: number; end: number };
    const localSegs: LocalSeg[] = [];
    for (const [name, p] of Object.entries(probs)) {
      localSegs.push({ name, start: acc, end: acc + p });
      acc += p;
    }

    const seg = localSegs.find((s) => s.name === selected);
    if (!seg) {
      setIsSpinning(false);
      return;
    }

    const mid = (seg.start + seg.end) / 2;
    const turns = 6;
    const angleFinal = 2 * Math.PI * turns - 2 * Math.PI * mid;

    // mark that the upcoming history update should NOT trigger a segments recalculation
    skipNextHistorySegUpdate.current = true;
    animateTo(angleFinal, () => {
      setHistory((h) => [
        `${selected} (${new Date().toLocaleString()})`,
        ...h,
      ]);

      // after a successful spin, mark globally that the wheel was spun today
      try {
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        localStorage.setItem("roulette_last_spin_date", todayStr);
      } catch (e) {
        // ignore storage errors
      }

      setIsSpinning(false);
      setDebug(`🎉 ${selected} a été choisi !`);
    });
  }

  // ---------------------------
  // INIT
  // ---------------------------

  useEffect(() => {
    // when history changes normally, update segments; but if the change
    // was caused by the spin we just finished, skip one update so the
    // wheel visual doesn't re-partition while showing the result.
    if (skipNextHistorySegUpdate.current) {
      skipNextHistorySegUpdate.current = false;
      return;
    }
    const { probs, boosted: b } = pool.getProbs(today, history);
    setSegmentsFromProbs(probs);
    setBoosted(b);
  }, [history, today]);

  useEffect(() => {
    // draw using last known rotation to avoid resetting to 0 when segments update
    drawWheel(rotationRef.current || 0);
  }, [segments]);

  // ---------------------------
  // UI
  // ---------------------------

  return (
    <div className="roulette-app" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="wheel-column">

        {bonusMessage && (
          <div
            style={{
              marginBottom: "20px",
              fontSize: "20px",
              color: "#d4a017",
              fontWeight: "600",
            }}
          >
            {bonusMessage}
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          className="wheel-canvas"
        />

        <button onClick={spin} disabled={isSpinning} className="spin-button">
          🎡 SPIN
        </button>

        {!isSpinning && debug && <div className="debug-text">{debug}</div>}
      </div>

      {/* HISTORIQUE */}
      <div className="history-card">
        <h2 style={{ marginTop: 0 }}>Historique</h2>

        <div
          style={{
            maxHeight: "350px",
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
          {history.map((h, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              {h}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
