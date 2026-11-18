import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Tigrinho do Azar — componente React (React 18+)
 * Uso: importe App.jsx em um projeto Vite/React e renderize <App />.
 * Não requer bibliotecas adicionais. Sons usam Web Audio API.
 */

const SYMBOLS = [
  { id: "orange", label: "Laranja", icon: "🍊", weight: 26, pay: 2 },
  { id: "firecracker", label: "Petardo", icon: "🧨", weight: 23, pay: 3 },
  { id: "bag", label: "Saco de moedas", icon: "💰", weight: 20, pay: 5 },
  { id: "lantern", label: "Lanterna", icon: "🏮", weight: 17, pay: 8 },
  { id: "coin", label: "Moeda dourada", icon: "🪙", weight: 13, pay: 15 },
  { id: "tiger", label: "Tigre (curinga)", icon: "🐯", weight: 1, pay: 30 },
];
const PAYLINES = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[6,4,2]];
const BETS = [1, 2, 5, 10, 25, 50];
const STORAGE_KEY = "tigrinho_sorte_react_v1";
const BONUS_SPINS = 8;
const FURY_CHANCE = 0.0025;
const AUTO_FURY_EARLY_CHANCE = 0.05; // chance experimental maior nos 3 primeiros giros de cada Auto
const RTP_REFERENCE = "não calibrado";

function secureInt(max) {
  if (!Number.isSafeInteger(max) || max < 1) throw new Error("Limite aleatório inválido.");
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const data = new Uint32Array(1);
  do { window.crypto.getRandomValues(data); } while (data[0] >= limit);
  return data[0] % max;
}
function pickSymbol() {
  // Cada carretel possui sua própria tabela de pesos.
  const weights = SYMBOLS.map((s) => s.weight);
  const total = weights.reduce((a,b) => a+b, 0);
  let n = secureInt(total);
  for (let i=0; i<weights.length; i++) {
    if (n < weights[i]) return SYMBOLS[i].id;
    n -= weights[i];
  }
  return SYMBOLS[0].id;
}
function randomGrid() {
  return Array.from({ length: 9 }, () => pickSymbol());
}
function evaluate(grid, bet) {
  const lineBet = bet / PAYLINES.length;
  let payout = 0;
  const winners = new Set();
  const lines = [];
  PAYLINES.forEach((line) => {
    const values = line.map((i) => grid[i]);
    const target = values.find((v) => v !== "tiger") || "tiger";
    if (values.every((v) => v === "tiger" || v === target)) {
      const symbol = SYMBOLS.find((s) => s.id === target);
      const amount = Math.floor(lineBet * symbol.pay);
      payout += amount;
      line.forEach((i) => winners.add(i));
      lines.push({ line, amount, symbol: target });
    }
  });
  return { payout, winners, lines };
}
function makeSpin(bet, multiplier = 1, allowFury = true, furyChance = FURY_CHANCE) {
  const grid = randomGrid();
  let furyColumn = -1;
  // Sorteio de chance especial também usa o RNG criptográfico.
  if (allowFury && secureInt(100000) < Math.round(furyChance * 100000)) {
    furyColumn = secureInt(3);
    for (let row=0; row<3; row++) grid[row*3+furyColumn] = "tiger";
  }
  const result = evaluate(grid, bet);
  return {
    grid,
    payout: result.payout * multiplier,
    winners: result.winners,
    lines: result.lines,
    bonus: grid.filter((s) => s === "tiger").length >= 3,
    furyColumn,
  };
}

function TigerMascot({ mode }) {
  return (
    <svg className={`mascot ${mode}`} viewBox="0 0 160 145" role="img" aria-label="Mascote original de tigre sorridente">
      <defs><linearGradient id="tigerFur" x2="0" y2="1"><stop stopColor="#ffbd45"/><stop offset="1" stopColor="#e97820"/></linearGradient></defs>
      <path d="M28 43 18 12 53 29Q80 13 107 29L142 12 132 48Q145 82 126 111Q105 137 80 137Q52 137 32 111Q14 81 28 43Z" fill="url(#tigerFur)" stroke="#6b1b10" strokeWidth="5"/>
      <path d="M33 37 26 23 47 34M127 37 135 23 114 34" fill="#f58a54" stroke="#6b1b10" strokeWidth="4"/>
      <path d="M55 31 64 48 76 35M105 31 96 48 84 35M24 65 48 69 34 83M136 65 112 69 126 83" fill="#351015"/>
      <path d="M52 68Q62 58 72 69M88 69Q99 58 109 68" fill="none" stroke="#401016" strokeWidth="5" strokeLinecap="round"/>
      <ellipse cx="62" cy="76" rx="5" ry="7" fill="#241016"/><ellipse cx="98" cy="76" rx="5" ry="7" fill="#241016"/>
      <ellipse cx="80" cy="94" rx="24" ry="18" fill="#ffe1ad"/><path d="M72 89Q80 82 88 89Q80 99 72 89" fill="#4c1115"/>
      <path d="M80 98Q78 112 65 108M80 98Q82 112 95 108" fill="none" stroke="#7b241a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M42 105 56 113 47 122M118 105 104 113 113 122" stroke="#401016" strokeWidth="5" fill="none"/>
      <g fill="#fff1a7"><path d="M14 54 18 43 22 54 33 58 22 62 18 73 14 62 3 58Z"/><path d="M135 94 139 83 143 94 154 98 143 102 139 113 135 102 124 98Z"/></g>
    </svg>
  );
}

export default function App() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(5);
  const [grid, setGrid] = useState(["orange","firecracker","coin","lantern","tiger","orange","bag","lantern","firecracker"]);
  const [busy, setBusy] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [modal, setModal] = useState("");
  const [status, setStatus] = useState("Pronto para girar?");
  const [banner, setBanner] = useState("");
  const [lastWin, setLastWin] = useState(0);
  const [wins, setWins] = useState([]);
  const [spins, setSpins] = useState(0);
  const [maxWin, setMaxWin] = useState(0);
  const [initialBalance] = useState(1000);
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeIndex, setFreeIndex] = useState(0);
  const [pauseUntil, setPauseUntil] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [lastBreak, setLastBreak] = useState(Date.now());
  const [breakVisible, setBreakVisible] = useState(false);
  const [history, setHistory] = useState([]);
  const [autoRemaining, setAutoRemaining] = useState(0);
  const [autoStopWin] = useState(100);
  const [effects, setEffects] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const audioRef = useRef(null);
  const storageReady = useRef(false);
  const spinLock = useRef(false);
  const freeRef = useRef({ freeSpins: 0, freeIndex: 0 });
  const autoRef = useRef(0);
  const autoFuryEarlySpins = useRef(0);
  const reducedMotion = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, []);

  useEffect(() => { freeRef.current = { freeSpins, freeIndex }; }, [freeSpins, freeIndex]);
  useEffect(() => { autoRef.current = autoRemaining; }, [autoRemaining]);

  // Restaura preferências e saldo; concede bônus diário gratuito.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        if (Number.isFinite(saved.balance)) setBalance(Math.max(0, saved.balance));
        if (BETS.includes(saved.bet)) setBet(saved.bet);
        setTurbo(!!saved.turbo);
        setMuted(!!saved.muted);
        const today = new Date().toLocaleDateString("en-CA");
        if (saved.giftDate !== today) {
          setBalance((v) => v + 500);
          setStatus("🎁 Crédito diário fictício de R$ 500,00 adicionado!");
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, giftDate: today }));
        }
      } else {
        const today = new Date().toLocaleDateString("en-CA");
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance: 1500, bet: 5, giftDate: today, turbo: false, muted: false }));
        setBalance(1500);
      }
    } catch (error) { console.warn("Não foi possível restaurar o jogo.", error); }
    finally { storageReady.current = true; }
  }, []);

  useEffect(() => {
    if (!storageReady.current) return;
    try {
      const giftDate = new Date().toLocaleDateString("en-CA");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, bet, turbo, muted, giftDate }));
    } catch (error) { console.warn("Não foi possível salvar o jogo.", error); }
  }, [balance, bet, turbo, muted]);

  useEffect(() => {
    const nodes = Array.from({ length: 28 }, (_, i) => ({ id: i, left: Math.random()*100, delay: Math.random()*-12, duration: 5+Math.random()*9 }));
    setEffects(nodes);
  }, []);

  const playSound = useCallback((type) => {
    if (muted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const sounds = { click:[520,.055], spin:[160,.2], stop:[330,.08], win:[660,.32], bonus:[880,.55], fury:[110,.6] };
      const [freq,duration] = sounds[type] || sounds.click;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type === "fury" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      if (type === "spin") oscillator.frequency.exponentialRampToValueAtTime(70, ctx.currentTime+duration);
      if (type === "win" || type === "bonus") oscillator.frequency.exponentialRampToValueAtTime(freq*1.7, ctx.currentTime+duration);
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.12, ctx.currentTime+.015);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+duration);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(); oscillator.stop(ctx.currentTime+duration+.02);
    } catch { /* áudio é opcional */ }
  }, [muted]);

  const cells = useMemo(() => SYMBOLS.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}), []);
  const money = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const spin = useCallback(async () => {
    if (spinLock.current || Date.now() < pauseUntil) return;
    const free = freeRef.current.freeSpins > 0;
    if (!free && balance < bet) { setModal("empty"); setAutoRemaining(0); return; }
    spinLock.current = true;
    setBusy(true); setBanner(""); setLastWin(0);
    if (!free) setBalance((v) => v - bet);
    const multiplier = free ? freeRef.current.freeIndex + 1 : 1;
    setStatus(free ? `GIRO GRÁTIS · MULTIPLICADOR x${multiplier}` : "Os rolos estão girando...");
    playSound("spin");
    const duration = reducedMotion ? 40 : (turbo ? 260 : 780);
    const start = performance.now();
    await new Promise((resolve) => {
      const animate = (now) => {
        if (now-start >= duration*.78) return resolve();
        setGrid(randomGrid());
        window.setTimeout(() => requestAnimationFrame(animate), 55);
      };
      requestAnimationFrame(animate);
    });
    const autoActive = autoRef.current > 0;
    const earlyAutoFury = autoActive && autoFuryEarlySpins.current > 0;
    const result = makeSpin(bet, multiplier, !free, earlyAutoFury ? AUTO_FURY_EARLY_CHANCE : FURY_CHANCE);
    if (autoActive && autoFuryEarlySpins.current > 0) autoFuryEarlySpins.current -= 1;
    for (let col=0; col<3; col++) {
      await new Promise((r) => window.setTimeout(r, turbo ? 25 : 85));
      setGrid((old) => {
        const next = [...old];
        for (let row=0; row<3; row++) next[row*3+col] = result.grid[row*3+col];
        return next;
      });
      playSound("stop");
    }
    if (result.furyColumn >= 0) {
      setStatus("🐯 TIGRE FURIOSO! Uma coluna virou curinga!");
      playSound("fury");
      await new Promise((r) => window.setTimeout(r, turbo ? 60 : 220));
    }
    setGrid(result.grid);
    const prize = Math.floor(result.payout);
    setBalance((v) => v + prize);
    setLastWin(prize);
    setSpins((v) => v+1);
    setMaxWin((v) => Math.max(v, prize));
    if (prize > 0) {
      const level = prize >= bet*30 ? "MEGA VITÓRIA!" : prize >= bet*10 ? "INCRÍVEL!" : "Boa!";
      setBanner(level); setStatus(`Você ganhou ${money(prize)} (saldo fictício)!`);
      playSound("win");
      if (navigator.vibrate) { try { navigator.vibrate(prize >= bet*10 ? [100,50,150] : 70); } catch {} }
    } else setStatus(result.bonus ? "🐯 TRÊS TIGRES! BÔNUS ATIVADO!" : "Tente novamente!");
    if (result.bonus && !free) {
      setFreeSpins(BONUS_SPINS); setFreeIndex(0);
      setStatus("🎉 8 GIROS GRÁTIS ATIVADOS! Multiplicador crescente!");
      playSound("bonus");
    }
    if (free) {
      setFreeSpins((v) => Math.max(0, v-1));
      setFreeIndex((v) => v+1);
      if (freeRef.current.freeSpins <= 1) setFreeIndex(0);
    }
    setHistory((old) => [{ n: spins+1, symbols: result.grid.map((s) => cells[s].icon).join(" "), prize }, ...old].slice(0,20));
    spinLock.current = false;
    setBusy(false);
    if (balance - (free ? 0 : bet) + prize <= 0 && !result.bonus && freeRef.current.freeSpins <= 0) setModal("empty");
    const nextAuto = autoRef.current;
    if (nextAuto > 0) {
      const left = nextAuto - 1;
      autoRef.current = left;
      setAutoRemaining(left);
      if (prize >= autoStopWin) { autoRef.current = 0; setAutoRemaining(0); setStatus("Automático parou após um prêmio grande."); }
      else if (left > 0) window.setTimeout(() => spin(), turbo ? 100 : 330);
    }
  }, [pauseUntil, balance, bet, turbo, reducedMotion, playSound, money, spins, cells, autoStopWin]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntil) return;
      if (Date.now()-lastBreak >= 30*60*1000 && !breakVisible) {
        setBreakVisible(true);
        setStatus(`Lembrete: você está jogando há ${Math.floor((Date.now()-sessionStart)/60000)} minutos.`);
        setAutoRemaining(0);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [pauseUntil, lastBreak, breakVisible, sessionStart]);

  const startAuto = (count) => {
    autoRef.current = count;
    autoFuryEarlySpins.current = 3;
    setAutoRemaining(count); setModal(""); window.setTimeout(() => spin(), 0);
  };
  const pauseFive = () => {
    setPauseUntil(Date.now()+5*60*1000);
    autoRef.current = 0; setAutoRemaining(0); setModal(""); setStatus("⏸ Pausa de 5 minutos iniciada.");
  };
  const runSimulation = () => {
    // Simulação isolada: não altera saldo, histórico ou estado da sessão.
    const rounds = 100000;
    let totalBet = 0, totalPaid = 0, highest = 0, paidSpins = 0, allSpins = 0, bonusCount = 0;
    for (let i=0; i<rounds; i++) {
      totalBet += 5; allSpins++;
      const r = makeSpin(5, 1, true);
      totalPaid += r.payout; highest = Math.max(highest, r.payout);
      if (r.payout > 0) paidSpins++;
      if (r.bonus) {
        bonusCount++;
        for (let j=0; j<BONUS_SPINS; j++) {
          allSpins++;
          const b = makeSpin(5, j+1, false);
          totalPaid += b.payout; highest = Math.max(highest, b.payout);
          if (b.payout > 0) paidSpins++;
          // Giros grátis não acrescentam aposta ao denominador do RTP.
        }
      }
    }
    setSimResult({ rtp: totalPaid/totalBet*100, frequency: paidSpins/allSpins*100, highest, totalBet, totalPaid, bonusCount, allSpins });
  };

  const changeBet = (direction) => {
    const index = BETS.indexOf(bet);
    setBet(BETS[Math.max(0, Math.min(BETS.length-1, index+direction))]);
    playSound("click");
  };

  return (
    <div className="tiger-app">
      <style>{styles}</style>
      <div className="particles" aria-hidden="true">
        {effects.map((p) => <i key={p.id} style={{ left:`${p.left}%`, animationDelay:`${p.delay}s`, animationDuration:`${p.duration}s` }} />)}
      </div>
      <main className="game-shell">
        <header className="game-header">
          <div className="kicker">✦ FESTIVAL DA FORTUNA ✦</div>
          <h1>Tigrinho do Azar</h1>
          <p>Simulação de caça-níquel com valores fictícios em reais 🐯</p>
        </header>
        <section className="machine" aria-label="Máquina de caça-níquel virtual">
          <div className="lights" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
          <div className="mascot-wrap"><TigerMascot mode={busy ? "spin" : banner ? "win" : ""}/><span className="speech">{banner || (busy ? "Girando!" : "Boa sorte!")}</span></div>
          <div className="balances">
            <div><small>Saldo simulado</small><strong>{money(balance)}</strong></div>
            <div><small>Prêmio simulado</small><strong>{money(lastWin)}</strong></div>
          </div>
          <div className="reel-frame">
            <div className="reels" aria-label="Grade de símbolos 3 por 3">
              {grid.map((id, i) => <div className={`cell ${!busy && lastWin>0 ? "winner" : ""}`} key={i} aria-label={cells[id].label}><span>{cells[id].icon}</span></div>)}
            </div>
          </div>
          <div className="status" aria-live="polite">{status}</div>
          <div className="banner">{banner}</div>
          <div className="bet-control">
            <button aria-label="Diminuir aposta" disabled={busy || bet===BETS[0]} onClick={()=>changeBet(-1)}>−</button>
            <div><strong>{money(bet)}</strong><small>VALOR SIMULADO</small></div>
            <button aria-label="Aumentar aposta" disabled={busy || bet===BETS[BETS.length-1]} onClick={()=>changeBet(1)}>+</button>
          </div>
          <div className="controls">
            <button className="secondary" onClick={()=>setModal("auto")} disabled={busy}>AUTO</button>
            <button className="primary" onClick={spin} disabled={busy || (balance<bet && freeSpins===0) || Date.now()<pauseUntil}>🐯 GIRAR</button>
            <button className={`secondary ${turbo?"selected":""}`} aria-pressed={turbo} onClick={()=>setTurbo(v=>!v)}>⚡ TURBO</button>
          </div>
          <div className="controls extra">
            <button className="secondary" onClick={()=>setModal("rules")}>📜 Regras</button>
            <button className="secondary" onClick={()=>setModal("settings")}>⚙ Configurações</button>
          </div>
        </section>

        <section className="panel">
          <h2>📊 ESTATÍSTICAS DA SESSÃO</h2>
          <div className="stats">
            <div><small>Giros</small><strong>{spins}</strong></div>
            <div><small>Maior prêmio</small><strong>{money(maxWin)}</strong></div>
            <div><small>Saldo inicial</small><strong>{money(initialBalance)}</strong></div>
          </div>
          <div className="current-stat"><small>Saldo atual simulado</small><strong>{money(balance)}</strong></div>
        </section>
        <section className="panel">
          <h2>🧾 HISTÓRICO — ÚLTIMOS 20 GIROS</h2>
          <div className="history">{history.length ? history.map((h,i)=><div className="history-row" key={`${h.n}-${i}`}><span>#{h.n} · {h.symbols}</span><b>{h.prize ? `+${money(h.prize)}` : "—"}</b></div>) : <div className="history-row">Aguardando primeira rodada</div>}</div>
        </section>
        <div className="footer-actions">
          <button onClick={()=>setMuted(v=>!v)}>{muted?"🔇 Som desligado":"🔊 Som ligado"}</button>
          <button onClick={pauseFive}>⏸ Pausa de 5 minutos</button>
        </div>
      </main>
      <div className="responsible">SIMULAÇÃO: valores fictícios em R$. Sem depósitos, apostas reais ou saques. Não representa dinheiro ou ganhos reais.</div>

      {modal && <div className="modal" role="presentation" onMouseDown={(e)=>e.target===e.currentTarget && setModal("")}>
        <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <button className="close" aria-label="Fechar" onClick={()=>setModal("")}>×</button>
          {modal==="rules" && <>
            <h2 id="dialog-title">📜 Regras do Tigrinho</h2>
            <p>Combine três símbolos iguais em uma das cinco linhas (três horizontais e duas diagonais). O tigre é curinga. A aposta total é dividida igualmente entre as cinco linhas.</p>
            <table><thead><tr><th>Símbolo</th><th>Multiplicador por linha</th></tr></thead><tbody>{SYMBOLS.map(s=><tr key={s.id}><td>{s.icon} {s.label}</td><td>x{s.pay}</td></tr>)}</tbody></table>
            <p><b>Bônus:</b> três tigres na tela ativam 8 giros grátis, com multiplicador crescente de x1 a x8. O Tigre Furioso tem chance de 0,25% por giro normal e transforma uma coluna inteira em curinga.</p>
            <p><b>RTP: {RTP_REFERENCE}.</b> As probabilidades são experimentais e não foram calibradas para uma taxa de retorno específica.</p>
            <p>Os valores exibidos em reais são fictícios. Não há pagamentos, depósitos ou conversão em dinheiro.</p>
          </>}
          {modal==="auto" && <>
            <h2 id="dialog-title">Giro automático</h2><p>Escolha a quantidade de giros. O modo para quando um prêmio simulado atingir {money(autoStopWin)}.</p>
            <div className="modal-buttons">{[10,25,50].map(n=><button className="gold-button" key={n} onClick={()=>startAuto(n)}>{n} giros</button>)}</div>
            {autoRemaining>0 && <button className="gold-button" onClick={()=>{autoRef.current=0;setAutoRemaining(0);}}>Parar automático</button>}
          </>}
          {modal==="settings" && <>
            <h2 id="dialog-title">⚙ Configurações e simulador</h2>
            <p>RTP: {RTP_REFERENCE} · Tigre Furioso: {(FURY_CHANCE*100).toFixed(2)}% por giro normal.</p>
            <button className="gold-button" onClick={runSimulation}>🧪 Testar 100 mil giros</button>
            {simResult && <div className="simulation">
              <h3>Resultado observado</h3>
              <p><b>RTP observado:</b> {simResult.rtp.toFixed(2)}%</p>
              <p><b>Frequência de vitórias:</b> {simResult.frequency.toFixed(2)}%</p>
              <p><b>Maior prêmio:</b> {money(simResult.highest)}</p>
              <p><b>Giros contabilizados:</b> {simResult.allSpins.toLocaleString("pt-BR")} (inclui bônus)</p>
              <p><b>Bônus ativados:</b> {simResult.bonusCount.toLocaleString("pt-BR")}</p>
              <p><b>Total simulado:</b> {money(simResult.totalBet)} · <b>Total distribuído:</b> {money(simResult.totalPaid)}</p>
            </div>}
            <p className="muted">A simulação estatística não altera seu saldo. Os giros grátis não acrescentam valor apostado ao denominador.</p>
          </>}
          {modal==="empty" && <>
            <h2 id="dialog-title">Saldo simulado esgotado</h2><p>Adicione créditos fictícios para continuar testando. Nenhum dinheiro real é movimentado.</p>
            <div className="big-prize">+R$ 1.000,00 fictícios</div>
            <button className="gold-button" onClick={()=>{setBalance(v=>v+1000);setModal("");setStatus("Crédito fictício de R$ 1.000,00 adicionado!");}}>Adicionar saldo fictício</button>
          </>}
        </section>
      </div>}
      {breakVisible && <div className="modal"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="break-title">
        <h2 id="break-title">⏰ Hora de uma pausa</h2>
        <p>Você está nesta sessão há {Math.floor((Date.now()-sessionStart)/60000)} minutos. Que tal descansar um pouco?</p>
        <div className="modal-buttons"><button className="gold-button" onClick={()=>{setBreakVisible(false);pauseFive();}}>Pausar por 5 minutos</button><button className="gold-button" onClick={()=>{setBreakVisible(false);setLastBreak(Date.now());}}>Continuar</button></div>
      </section></div>}
    </div>
  );
}

const styles = `
:root{--cream:#fff1c7;--gold:#ffd76a}
*{box-sizing:border-box}
.tiger-app{min-height:100vh;padding:14px 14px 86px;background:radial-gradient(ellipse at 50% 0%,#a62c27 0,#4a0a13 48%,#1c060b 100%);color:var(--cream);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;position:relative;overflow:hidden}
.game-shell{position:relative;z-index:1;width:min(100%,560px);margin:auto}
.game-header{text-align:center;padding:8px 0 12px}.kicker{font-size:.7rem;letter-spacing:.22em;color:#ffdf9b;font-weight:800}
.game-header h1{margin:2px 0;font: bold clamp(2rem,8vw,3.2rem)/1.05 Georgia,serif;color:#ffe18a;text-shadow:0 3px 0 #8b3b0b,0 0 22px #ffb62e}
.game-header p{font-size:.82rem;color:#ffdca0;margin:5px 0}
.machine{border:3px solid #f6c65b;border-radius:28px;padding:13px;background:linear-gradient(145deg,#9a2025,#500b15 55%,#2c0710);box-shadow:0 0 0 5px #6f2a16,0 0 0 8px #d79c35,0 18px 55px #090206,inset 0 0 25px #ffb72b33}
.lights{display:flex;justify-content:space-around;margin:0 8px 8px}.lights i{width:8px;height:8px;border-radius:50%;background:#ffe08a;box-shadow:0 0 10px #ffbd42;animation:blink 1s infinite alternate}.lights i:nth-child(2n){animation-delay:.4s}
@keyframes blink{to{opacity:.25;transform:scale(.75)}}
.mascot-wrap{height:116px;display:flex;justify-content:center;align-items:center;position:relative}.mascot{width:124px;height:116px;filter:drop-shadow(0 5px 5px #18030788)}.mascot.spin{animation:bob .28s infinite alternate}.mascot.win{animation:celebrate .5s ease-in-out 3}
@keyframes bob{to{transform:translateY(-6px) rotate(3deg)}}@keyframes celebrate{0%,100%{transform:rotate(0) scale(1)}35%{transform:rotate(-9deg) scale(1.1)}70%{transform:rotate(9deg) scale(1.12)}}
.speech{position:absolute;right:4px;top:9px;background:#ffe7a7;color:#5c1013;padding:6px 10px;border-radius:12px;font-size:.72rem;font-weight:900}
.balances{display:flex;gap:8px;margin:5px 0 10px}.balances>div{flex:1;min-width:0;background:#29070eaa;border:1px solid #d99b39;border-radius:12px;padding:8px 11px}.balances small,.stats small,.current-stat small{display:block;color:#f2c77d;font-size:.65rem;text-transform:uppercase;letter-spacing:.08em}.balances strong{font-size:1.1rem;color:#ffe08a;font-variant-numeric:tabular-nums}
.reel-frame{background:linear-gradient(#24070d,#4b1017);border:2px solid #d69b37;border-radius:17px;padding:8px;box-shadow:inset 0 0 20px #0009}.reels{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.cell{aspect-ratio:1.06;display:grid;place-items:center;border-radius:12px;background:linear-gradient(145deg,#fff6dc,#e8c77e);border:2px solid #b67b2c;box-shadow:inset 0 2px 7px #fff,0 2px 3px #17060a;color:#321013;font-size:clamp(2.4rem,11vw,3.65rem);overflow:hidden}.cell span{filter:drop-shadow(0 2px 1px #7c4b1c44)}.cell.winner{background:linear-gradient(145deg,#fff5a8,#ffc34b);border-color:#fff0a0;box-shadow:0 0 17px #ffdc58,inset 0 0 10px #fff}
.status{min-height:30px;text-align:center;padding:7px 0 2px;font-weight:800;color:#ffe08a;font-size:.9rem}.banner{height:29px;text-align:center;color:#fff1a5;font-size:1.02rem;font-weight:1000;letter-spacing:.08em;text-shadow:0 2px #9a3912}
.bet-control{display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0 3px}.bet-control button{width:35px;height:35px;border-radius:50%;border:1px solid #ffdf89;background:#7e1820;color:#ffe7a7;font-weight:1000;font-size:1.15rem}.bet-control button:disabled{opacity:.4}.bet-control div{text-align:center;min-width:110px;font-weight:900;color:#ffe18a}.bet-control small{display:block;color:#f1c785;font-size:.65rem}
.controls{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:8px;margin-top:10px}.controls.extra{grid-template-columns:1fr 1fr}
.controls button,.gold-button{border:1px solid #ffd979;border-radius:12px;padding:10px 8px;font-weight:900;color:#4c1012;background:linear-gradient(#ffe69a,#d99a35);box-shadow:0 4px #87440f,0 6px 12px #17040977}.controls button:disabled{opacity:.45;cursor:not-allowed}.controls .primary{font-size:1.08rem;background:linear-gradient(#fff0a6,#f0a928)}.controls .secondary{font-size:.83rem;background:linear-gradient(#ffdca0,#c27a28)}.controls .selected{outline:2px solid #fff1a3}
.panel{margin-top:12px;padding:12px;border:1px solid #c88b35;border-radius:15px;background:#29070ebd;box-shadow:inset 0 0 16px #0005}.panel h2{font-size:.88rem;color:#ffe09a;margin:0 0 9px;letter-spacing:.06em}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.stats>div,.current-stat{background:#5d141d;border-radius:9px;padding:7px;text-align:center}.stats strong,.current-stat strong{font-size:.94rem;color:#ffe6a0;font-variant-numeric:tabular-nums}.current-stat{margin-top:7px}.history{display:flex;flex-direction:column;gap:5px;max-height:170px;overflow:auto}.history-row{display:flex;justify-content:space-between;font-size:.75rem;padding:5px 7px;background:#55121b;border-radius:7px}.history-row b{color:#ffe18a}
.footer-actions{display:flex;justify-content:center;gap:8px;margin-top:12px}.footer-actions button{background:transparent;border:1px solid #d69b56;color:#ffdfa0;border-radius:20px;padding:6px 12px;font-size:.74rem}
.responsible{position:fixed;z-index:4;bottom:0;left:0;right:0;text-align:center;padding:8px 5px;background:#26060cf2;border-top:1px solid #d99b39;color:#ffe0a0;font-size:.72rem;font-weight:800}
.particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}.particles i{position:absolute;bottom:-10px;width:4px;height:4px;border-radius:50%;background:#ffdf83;box-shadow:0 0 10px #ffba38;opacity:.7;animation:float linear infinite}
@keyframes float{from{transform:translateY(0);opacity:0}15%{opacity:.8}to{transform:translateY(-110vh) translateX(35px);opacity:0}}
.modal{position:fixed;z-index:10;inset:0;background:#100207dc;display:flex;align-items:center;justify-content:center;padding:16px}.dialog{width:min(100%,480px);max-height:86vh;overflow:auto;background:linear-gradient(145deg,#821a23,#350911);border:2px solid #e7b84e;border-radius:18px;padding:18px;box-shadow:0 20px 60px #000b}.dialog h2{margin:0 0 10px;color:#ffe18a;font-family:Georgia,serif}.dialog h3{color:#ffe18a}.dialog p,.dialog li{font-size:.84rem;line-height:1.45;color:#ffe9c0}.dialog table{width:100%;border-collapse:collapse;font-size:.8rem}.dialog td,.dialog th{padding:7px;border-bottom:1px solid #d9a34c66;text-align:left}.dialog th{color:#ffdf8e}.close{float:right;border:0;background:transparent;color:#ffe6a2;font-size:1.4rem}.modal-buttons{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.modal-buttons>*{flex:1}.gold-button{margin:5px 0}.big-prize{font-size:2rem;font-weight:1000;color:#ffe28b;text-align:center;margin:12px}.simulation{margin-top:12px;padding:10px;border-radius:10px;background:#5d141d}.muted{opacity:.7}
@media(min-width:600px){.game-shell{padding-top:10px}.cell{font-size:3.6rem}}
@media(prefers-reduced-motion:reduce){.tiger-app *, .tiger-app *:before,.tiger-app *:after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition:none!important}}
`;
