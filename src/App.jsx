import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Tigrinho do Azar — componente React (React 18+)
 * Uso: importe App.jsx em um projeto Vite/React e renderize <App />.
 * Não requer bibliotecas adicionais. Sons usam Web Audio API.
 */

const SYMBOLS = [
  { id: "orange", label: "Laranja", icon: "🍊", weight: 30, pay: 2 },
  { id: "firecracker", label: "Petardo", icon: "🧨", weight: 28, pay: 3 },
  { id: "bag", label: "Saco de moedas", icon: "💰", weight: 24, pay: 5 },
  { id: "lantern", label: "Lanterna", icon: "🏮", weight: 20, pay: 8 },
  { id: "coin", label: "Moeda dourada", icon: "🪙", weight: 16, pay: 15 },
  { id: "tiger", label: "Tigre (curinga)", icon: "🐯", weight: 4, pay: 30 },
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
  return <svg className={`mascot ${mode||""}`} viewBox="0 0 260 220" role="img" aria-label="Tigrinho sorridente apoiado na placa">
    <defs><radialGradient id="fur3d" cx="42%" cy="25%" r="75%"><stop stopColor="#ffd77b"/><stop offset=".48" stopColor="#ff9e27"/><stop offset="1" stopColor="#c94b16"/></radialGradient><linearGradient id="paw3d" x2="0" y2="1"><stop stopColor="#ffc45c"/><stop offset="1" stopColor="#e8751e"/></linearGradient><radialGradient id="muzzle3d"><stop stopColor="#fff8e8"/><stop offset="1" stopColor="#e8c8a1"/></radialGradient></defs>
    <path d="M40 87Q12 25 65 22Q93 18 103 48Q130 29 157 48Q171 16 204 28Q245 43 218 94L205 163H54Z" fill="url(#fur3d)" stroke="#713016" strokeWidth="7"/>
    <path d="M50 69Q28 25 65 34Q84 38 86 66Z" fill="#f5a0a0" stroke="#713016" strokeWidth="5"/><path d="M210 69Q232 25 195 34Q176 38 174 66Z" fill="#f5a0a0" stroke="#713016" strokeWidth="5"/>
    <path d="M62 42 79 57 67 66M198 42 181 57 193 66M100 26 112 54 126 37M160 26 148 54 134 37M33 89 70 91 48 111M227 89 190 91 212 111" fill="#572414"/>
    <ellipse cx="93" cy="104" rx="30" ry="36" fill="#fff9ed"/><ellipse cx="167" cy="104" rx="30" ry="36" fill="#fff9ed"/><ellipse cx="98" cy="108" rx="15" ry="22" fill="#a85a24"/><ellipse cx="162" cy="108" rx="15" ry="22" fill="#a85a24"/><ellipse cx="99" cy="110" rx="9" ry="15" fill="#171018"/><ellipse cx="161" cy="110" rx="9" ry="15" fill="#171018"/><circle cx="104" cy="98" r="7" fill="#fff"/><circle cx="166" cy="98" r="7" fill="#fff"/>
    <path d="M69 85Q92 64 115 82M145 82Q168 64 191 85" fill="none" stroke="#743018" strokeWidth="7" strokeLinecap="round"/>
    <ellipse cx="130" cy="145" rx="61" ry="43" fill="url(#muzzle3d)"/><ellipse cx="130" cy="126" rx="15" ry="11" fill="#ef8b8e" stroke="#813a31" strokeWidth="3"/><path d="M130 137Q124 151 111 147M130 137Q136 151 149 147" fill="none" stroke="#71372e" strokeWidth="4" strokeLinecap="round"/><path d="M111 153Q130 180 149 153Q146 190 130 190Q114 190 111 153Z" fill="#702020"/><path d="M119 164Q130 157 141 164Q138 179 130 179Q122 179 119 164Z" fill="#ff8290"/>
    <path d="M43 178Q27 144 58 142Q84 140 99 168L108 198Q79 219 48 203Z" fill="url(#paw3d)" stroke="#713016" strokeWidth="5"/><path d="M217 178Q233 144 202 142Q176 140 161 168L152 198Q181 219 212 203Z" fill="url(#paw3d)" stroke="#713016" strokeWidth="5"/><path d="M50 183 64 194M68 177 79 194M210 183 196 194M192 177 181 194" stroke="#743018" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
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
      <main className="reference-screen">
        <div className="scene-sky" aria-hidden="true"><span className="pagoda-roof roof-one"/><span className="pagoda-roof roof-two"/><span className="scene-coin coin-one">金</span><span className="scene-coin coin-two">福</span></div>
        <section className="reference-machine" aria-label="Tigrinho do Azar — demonstração">
          <div className="reference-topbar">
            <div className="reference-balance"><span className="balance-coin">＄</span><div><small>Saldo</small><strong>{money(balance)}</strong></div></div>
            <div className="reference-mascot-title"><TigerMascot mode={busy ? "spin" : banner ? "win" : ""}/><div className="reference-title-plaque"><h1>Tigrinho do Azar</h1></div></div>
            <div className="reference-bet"><div><small>Aposta</small><strong>{money(bet)}</strong></div><button aria-label="Diminuir aposta" disabled={busy||bet===BETS[0]} onClick={()=>changeBet(-1)}>−</button><button aria-label="Aumentar aposta" disabled={busy||bet===BETS[BETS.length-1]} onClick={()=>changeBet(1)}>＋</button></div>
          </div>
          <div className="reference-game-row">
            <aside className="reference-credit-panel"><h2><span>✚</span><b>Adicionar<small>Saldo</small></b></h2><div className="money-bag">💰</div><div className="credit-options">{[50,20,10,5,1].map(amount=><button key={amount} className="credit-button" onClick={()=>{setBalance(v=>v+amount);setStatus("Crédito fictício adicionado: "+money(amount));playSound("click");}}>＋ {money(amount)}</button>)}</div><button className="credit-step" disabled={balance<=0} onClick={()=>{setBalance(v=>Math.max(0,v-10));setStatus("Saldo simulado reduzido em R$ 10,00.");playSound("click");}}>− {money(10)}</button></aside>
            <section className="reference-reel-area"><div className="reference-reel-frame"><div className="reels" aria-label="Grade de símbolos 3 por 3">{grid.map((id,i)=><div className={!busy&&lastWin>0?"cell winner":"cell"} key={i} aria-label={cells[id].label}><span>{cells[id].icon}</span></div>)}</div></div><div className="reference-status" aria-live="polite">{status}{banner?" · "+banner:""}</div><div className="reference-last-win">ÚLTIMO PRÊMIO: <strong>{money(lastWin)}</strong></div></section>
            <aside className="reference-payout-panel"><h2>Payouts</h2>{SYMBOLS.map(s=><div className="reference-payout-row" key={s.id}><span>{s.icon}</span><b>{s.pay}x</b></div>)}<button className={turbo?"reference-turbo active":"reference-turbo"} aria-pressed={turbo} onClick={()=>setTurbo(v=>!v)}>Modo Turbo <i/></button></aside>
          </div>
          <nav className="reference-bottom-controls" aria-label="Controles"><button className="round-control" onClick={()=>setModal("settings")}>ℹ</button><button className="round-control" onClick={()=>setModal("rules")}>?</button><button className="reference-auto" onClick={()=>setModal("auto")} disabled={busy}>⟳ Auto</button><button className="reference-spin" onClick={spin} disabled={busy||(balance<bet&&freeSpins===0)||Date.now()<pauseUntil}>GIRAR</button><button className="reference-max" onClick={()=>setBet(BETS[BETS.length-1])}>★ <span>Aposta<br/>Máxima</span></button><button className="round-control" onClick={()=>setMuted(v=>!v)}>{muted?"🔇":"🔊"}</button></nav>
          <div className="reference-mobile-tools"><button onClick={()=>pauseFive()}>⏸ Pausa</button></div>
        </section>
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
.credit-button{display:block;width:100%;margin-top:10px;padding:13px 10px;border:2px solid #ffe69a;border-radius:13px;background:linear-gradient(180deg,#72d47c,#218b45);color:#102d15;font-size:.95rem;font-weight:1000;letter-spacing:.025em;box-shadow:0 4px #13542c,0 7px 15px #14040777}.credit-control{display:flex;flex-direction:column;gap:8px;margin-top:10px}.credit-options{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.credit-options .credit-button{padding:9px 5px;font-size:.8rem}.credit-control .credit-button{flex:1;margin-top:0}.credit-step{padding:10px;border:1px solid #ffd979;border-radius:12px;background:linear-gradient(#ffdca0,#c27a28);color:#4c1012;font-weight:900}.credit-step:disabled{opacity:.4}.credit-button:active{transform:translateY(1px);box-shadow:0 3px #13542c}
.controls button,.gold-button{border:1px solid #ffd979;border-radius:12px;padding:10px 8px;font-weight:900;color:#4c1012;background:linear-gradient(#ffe69a,#d99a35);box-shadow:0 4px #87440f,0 6px 12px #17040977}.controls button:disabled{opacity:.45;cursor:not-allowed}.controls .primary{font-size:1.08rem;background:linear-gradient(#fff0a6,#f0a928)}.controls .secondary{font-size:.83rem;background:linear-gradient(#ffdca0,#c27a28)}.controls .selected{outline:2px solid #fff1a3}
.panel{margin-top:12px;padding:12px;border:1px solid #c88b35;border-radius:15px;background:#29070ebd;box-shadow:inset 0 0 16px #0005}.panel h2{font-size:.88rem;color:#ffe09a;margin:0 0 9px;letter-spacing:.06em}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.stats>div,.current-stat{background:#5d141d;border-radius:9px;padding:7px;text-align:center}.stats strong,.current-stat strong{font-size:.94rem;color:#ffe6a0;font-variant-numeric:tabular-nums}.current-stat{margin-top:7px}.history{display:flex;flex-direction:column;gap:5px;max-height:170px;overflow:auto}.history-row{display:flex;justify-content:space-between;font-size:.75rem;padding:5px 7px;background:#55121b;border-radius:7px}.history-row b{color:#ffe18a}
.footer-actions{display:flex;justify-content:center;gap:8px;margin-top:12px}.footer-actions button{background:transparent;border:1px solid #d69b56;color:#ffdfa0;border-radius:20px;padding:6px 12px;font-size:.74rem}
.responsible{position:fixed;z-index:4;bottom:0;left:0;right:0;text-align:center;padding:8px 5px;background:#26060cf2;border-top:1px solid #d99b39;color:#ffe0a0;font-size:.72rem;font-weight:800}
.particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}.particles i{position:absolute;bottom:-10px;width:4px;height:4px;border-radius:50%;background:#ffdf83;box-shadow:0 0 10px #ffba38;opacity:.7;animation:float linear infinite}
@keyframes float{from{transform:translateY(0);opacity:0}15%{opacity:.8}to{transform:translateY(-110vh) translateX(35px);opacity:0}}
.modal{position:fixed;z-index:10;inset:0;background:#100207dc;display:flex;align-items:center;justify-content:center;padding:16px}.dialog{width:min(100%,480px);max-height:86vh;overflow:auto;background:linear-gradient(145deg,#821a23,#350911);border:2px solid #e7b84e;border-radius:18px;padding:18px;box-shadow:0 20px 60px #000b}.dialog h2{margin:0 0 10px;color:#ffe18a;font-family:Georgia,serif}.dialog h3{color:#ffe18a}.dialog p,.dialog li{font-size:.84rem;line-height:1.45;color:#ffe9c0}.dialog table{width:100%;border-collapse:collapse;font-size:.8rem}.dialog td,.dialog th{padding:7px;border-bottom:1px solid #d9a34c66;text-align:left}.dialog th{color:#ffdf8e}.close{float:right;border:0;background:transparent;color:#ffe6a2;font-size:1.4rem}.modal-buttons{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.modal-buttons>*{flex:1}.gold-button{margin:5px 0}.big-prize{font-size:2rem;font-weight:1000;color:#ffe28b;text-align:center;margin:12px}.simulation{margin-top:12px;padding:10px;border-radius:10px;background:#5d141d}.muted{opacity:.7}
@media(min-width:600px){.game-shell{padding-top:10px}.cell{font-size:3.6rem}}
@media(prefers-reduced-motion:reduce){.tiger-app *, .tiger-app *:before,.tiger-app *:after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition:none!important}}

.redesign-shell{width:min(100%,1180px);padding-top:12px}.redesign-header h1,.redesign-header p{display:none}
.redesign-machine{padding:clamp(12px,2vw,22px);border-radius:32px;background:linear-gradient(150deg,#d33b25,#8c171e 48%,#4a0914);box-shadow:0 0 0 5px #7b3015,0 0 0 9px #efc45b,0 24px 55px #090206,inset 0 0 35px #ffd35b44}
.redesign-lights{display:flex;justify-content:space-around;gap:5px;margin-bottom:9px}.redesign-lights i{width:9px;height:9px;border-radius:50%;background:#fff0a0;box-shadow:0 0 12px #ffca43;animation:blink 1s infinite alternate}.redesign-lights i:nth-child(odd){animation-delay:.3s}
.redesign-title{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:-4px auto 12px;position:relative;z-index:2}.redesign-title .mascot{width:min(26vw,210px);height:auto;max-height:165px}.redesign-title>div{border:4px solid #ffcf56;border-radius:25px;padding:8px 24px;background:linear-gradient(#e84c27,#94171b);box-shadow:0 5px #5c160d,inset 0 0 14px #ffce5b66;text-align:center}.redesign-title span{color:#ffed9c;font-size:.7rem;letter-spacing:.25em}.redesign-title h2{margin:0;color:#ffe68c;font:900 clamp(1.5rem,4vw,3rem) Georgia,serif;text-shadow:0 3px #77220e}
.machine-layout{display:grid;grid-template-columns:minmax(170px,230px) minmax(0,1fr) minmax(170px,230px);gap:14px;align-items:stretch}.side-panel{border:3px solid #eebd4c;border-radius:23px;background:linear-gradient(160deg,#64131b,#30070f);padding:14px;box-shadow:inset 0 0 20px #ffcf4222,0 5px #5e1a11;text-align:center}.side-panel h3{margin:4px 0 10px;color:#ffdf76;text-transform:uppercase;font-size:1rem}.side-balance{color:#ffe48a;font-size:1.25rem;font-weight:1000;margin-bottom:12px}.credit-side .credit-options{grid-template-columns:1fr;gap:8px}.credit-side .credit-button{margin:0;padding:10px 6px;font-size:.9rem;background:linear-gradient(#ffdf77,#d28a25);color:#4b1214;box-shadow:0 3px #7b3213}.credit-side .credit-step{width:100%;background:linear-gradient(#ff6e4b,#bb2027);color:#fff2d0;margin-top:10px}
.payout-row{display:flex;justify-content:space-between;align-items:center;padding:7px 9px;margin:5px 0;background:#5b1119;border-radius:11px;color:#ffe38b;font-size:1.15rem}.payout-row span{font-size:1.55rem}.turbo-switch{width:100%;margin-top:12px;padding:12px;border-radius:13px;border:2px solid #ffdc79;background:linear-gradient(#9b2724,#64121b);color:#ffedb0;font-weight:900}.turbo-switch.selected{background:linear-gradient(#71d577,#238543);color:#16381b}
.reel-center{min-width:0}.balance-strip{display:flex;gap:8px;margin-bottom:9px}.balance-strip>div{flex:1;border:2px solid #edbd4b;border-radius:14px;background:#3b0a12;padding:9px;text-align:center}.balance-strip small{display:block;color:#ffd977;font-weight:800;text-transform:uppercase;font-size:.7rem}.balance-strip strong{color:#ffec9c;font-size:clamp(1rem,2vw,1.5rem)}.redesign-reel-frame{padding:10px;border:4px solid #e6b54b;border-radius:23px;background:linear-gradient(#5d1119,#26070d);box-shadow:inset 0 0 25px #0009,0 4px #722311}.redesign-reel-frame .reels{gap:9px}.redesign-reel-frame .cell{aspect-ratio:1;min-height:90px;font-size:clamp(2.7rem,6vw,5rem);border-radius:16px;background:radial-gradient(#fff9e8,#f2c878);border:3px solid #b77c30;box-shadow:inset 0 4px 12px #fff,0 3px #8e4817}
.redesign-controls{display:grid;grid-template-columns:1fr 1.6fr 1fr;gap:9px;margin-top:10px}.redesign-controls button{min-height:58px;border-radius:16px;font-size:.95rem}.redesign-controls .primary{background:linear-gradient(#a5ef77,#30a443);border:3px solid #d5f29a;color:#163c17;font-size:clamp(1.2rem,3vw,2rem);font-weight:1000;box-shadow:0 5px #20521d}.redesign-controls .secondary{background:linear-gradient(#e8b857,#a95a24);color:#4b1514;border:2px solid #ffe08a}.redesign-bottom{display:flex;justify-content:center;flex-wrap:wrap;gap:9px;margin-top:14px}.redesign-bottom button{border-radius:13px;background:linear-gradient(#e6b75a,#a65325);color:#4a1014;border:2px solid #ffe08a;padding:10px 16px;font-weight:900}
@media(max-width:780px){.machine-layout{grid-template-columns:1fr}.credit-side{order:2}.reel-center{order:1}.payout-side{order:3}.credit-side .credit-options{grid-template-columns:repeat(3,1fr)}.credit-side .credit-button{font-size:.76rem;padding:8px 3px}.redesign-title .mascot{width:110px}.redesign-title>div{padding:8px 10px}.redesign-reel-frame .cell{min-height:65px}.side-panel{padding:10px}.payout-side{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.payout-side h3,.turbo-switch{grid-column:1/-1}.payout-row{margin:0;padding:5px}.redesign-controls{grid-template-columns:1fr 1.4fr 1fr}.redesign-controls button{font-size:.75rem;min-height:48px}}
@media(max-width:430px){.redesign-title{gap:3px}.redesign-title .mascot{width:88px}.redesign-title h2{font-size:1.35rem}.redesign-title>div{padding:5px}.redesign-controls{grid-template-columns:1fr 1.2fr 1fr;gap:5px}.redesign-controls button{padding:7px 3px}.redesign-reel-frame .cell{font-size:2.8rem}.credit-side .credit-options{grid-template-columns:repeat(2,1fr)}}

body{background:radial-gradient(ellipse at 50% 5%,#3d8ac2 0%,#24476c 28%,#170910 75%) fixed}
.redesign-machine{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(180deg,#b92e20 0%,#86151c 52%,#4b0913 100%);border:5px solid #f6c34e;box-shadow:0 0 0 5px #8d3516,0 0 0 9px #f9d66e,0 24px 55px #090206}
.redesign-machine:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.25;background:repeating-linear-gradient(45deg,transparent 0 18px,#ffd36b 19px 21px,transparent 22px 38px)}
.redesign-title{align-items:flex-end;gap:0;margin:0 auto 4px}.redesign-title .mascot{width:min(37vw,310px);height:auto;max-height:220px;margin-bottom:-24px;z-index:3;filter:drop-shadow(0 7px 4px #30070b99)}
.redesign-title>div{margin-left:-12px;flex:1;position:relative;z-index:2;border:5px solid #ffce55;border-radius:34px;padding:10px 18px;background:linear-gradient(180deg,#ff4a16,#b90f16 58%,#7a1017);box-shadow:0 7px 0 #67140f,inset 0 0 0 3px #ff9d28,inset 0 0 20px #ffdf7a55}
.redesign-title h2{font-family:Georgia,serif;font-weight:1000;letter-spacing:-.04em;color:#ffdf39;-webkit-text-stroke:1px #8a260c;text-shadow:0 3px 0 #8a230b,0 5px 8px #2a0508}
.redesign-lights i{width:12px;height:12px;background:radial-gradient(circle at 35% 30%,#fff9c7,#ffc63c 65%,#b95c13);border:1px solid #ffe8a0;box-shadow:0 0 12px #ffc84c}
.side-panel{background:linear-gradient(145deg,#4e0b11,#22050a);border:4px solid #eab13d;box-shadow:inset 0 0 0 2px #ffdb72,inset 0 0 20px #f8b63a33,0 5px #5e1a11}
.redesign-reel-frame{background:linear-gradient(#8c281b,#4c0b12);border:7px solid #e6a72d;box-shadow:inset 0 0 0 3px #ffdb72,0 5px #63200d}
.redesign-reel-frame .cell{background:radial-gradient(#fff9e8 0%,#f9d9a0 68%,#e6a64f 100%);border:3px solid #c66a1b;box-shadow:inset 0 4px 12px #fff,0 3px #7e3212}
@media(max-width:780px){.redesign-title .mascot{width:145px;max-height:145px;margin-bottom:-12px}}
@media(max-width:430px){.redesign-title .mascot{width:105px;max-height:110px}.redesign-title h2{font-size:1.25rem}}

/* Correspondência estrutural mais fiel à referência enviada */
.tiger-app{background:radial-gradient(ellipse at 50% 10%,#6e9bc3 0,#264b72 28%,#17070d 72%);padding:18px 16px 78px}
.redesign-shell{width:min(100%,1460px);max-width:1460px}
.redesign-machine{padding:clamp(12px,1.6vw,24px);background:linear-gradient(160deg,#d83a1f 0%,#a51d1d 42%,#610d19 100%);border:6px solid #ffcf54;border-radius:38px;box-shadow:0 0 0 5px #8e3516,0 0 0 10px #f5c95d,0 26px 65px #090206}
.reference-topbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 0 8px}.reference-balance,.reference-bet{display:flex;align-items:center;gap:12px;min-width:270px;padding:10px 18px;border:4px solid #eeb746;border-radius:22px;background:linear-gradient(150deg,#4d0a11,#230409);box-shadow:inset 0 0 0 2px #ffdc72,0 5px #57140e}.reference-balance>span{font-size:2.6rem}.reference-balance small,.reference-bet small{display:block;color:#fff1d2;font-size:.9rem;font-weight:900;text-align:center}.reference-balance strong,.reference-bet strong{display:block;color:#ffdf3d;font-size:clamp(1.5rem,3vw,2.2rem);font-weight:1000;text-shadow:0 2px #6c260d}.reference-bet{justify-content:flex-end}.reference-bet button{width:48px;height:48px;border-radius:50%;border:3px solid #ffdc75;background:linear-gradient(#ffcc4a,#b85a0e);color:#42100b;font-size:1.8rem;font-weight:1000}.reference-bet button:disabled{opacity:.4}
.redesign-title{margin:-8px auto 12px;max-width:850px}.redesign-title .mascot{width:min(31vw,285px);height:auto;max-height:210px;margin-bottom:-25px}.redesign-title>div{padding:12px 24px;border-radius:34px}.redesign-title h2{font-size:clamp(2rem,5vw,4rem)}
.machine-layout{grid-template-columns:minmax(200px,245px) minmax(0,1fr) minmax(200px,245px);gap:16px}
.reel-center{display:flex;flex-direction:column}.prize-strip{display:flex;justify-content:center;align-items:center;gap:12px;color:#ffdf80;font-size:.78rem;font-weight:900;min-height:30px}.prize-strip strong{font-size:1.15rem;color:#fff0a0}
.redesign-reel-frame .cell{min-height:clamp(100px,13vw,170px);font-size:clamp(3.5rem,7vw,6.5rem)}
.bet-control{display:none}
.redesign-controls{margin-top:auto;padding-top:12px;grid-template-columns:1fr 1.5fr 1fr}.redesign-controls .primary{min-height:82px;font-size:clamp(1.6rem,3vw,2.8rem)}
.redesign-bottom{align-items:center;justify-content:space-between;margin-top:20px;gap:12px}.redesign-bottom button{min-height:58px}.redesign-bottom .round-control{width:68px;height:68px;border-radius:50%;background:linear-gradient(#28102a,#130816);border:4px solid #e9a62e;color:#ffda50;font-size:1.8rem;box-shadow:0 4px #6c270f}.redesign-bottom .secondary{background:linear-gradient(#632050,#280b2c);color:#fff0dc;border:4px solid #e8a633;box-shadow:0 4px #6c270f;font-size:1.1rem;padding:10px 22px}.redesign-bottom .bottom-spin{flex:1;min-height:78px;border-radius:40px;background:linear-gradient(#a9f35d,#1eae35);border:6px solid #f7d35a;color:#fff;font-size:clamp(1.8rem,4vw,3rem);font-weight:1000;text-shadow:0 3px #256324;box-shadow:0 7px #7a330f}
.credit-side .credit-options{grid-template-columns:1fr}.credit-side .credit-button{font-size:clamp(.85rem,1.2vw,1.1rem);padding:13px 7px;border-radius:15px;background:linear-gradient(#ffeb35,#f3a500);border:3px solid #ffdf64;box-shadow:0 4px #9b4b0c}.credit-side .credit-step{font-size:1rem;padding:13px;border:3px solid #ff9c7c}
.payout-side .payout-row{padding:9px 12px;font-size:1.35rem}.payout-side .payout-row span{font-size:2rem}
@media(max-width:850px){.reference-topbar{gap:7px}.reference-balance,.reference-bet{min-width:0;flex:1;padding:8px}.machine-layout{grid-template-columns:1fr}.reel-center{order:1}.credit-side{order:2}.payout-side{order:3}.redesign-title .mascot{width:150px}.redesign-reel-frame .cell{min-height:85px}.redesign-bottom{flex-wrap:wrap;justify-content:center}.redesign-bottom .bottom-spin{flex-basis:100%;order:4}.credit-side .credit-options{grid-template-columns:repeat(5,1fr)}}
@media(max-width:480px){.reference-balance,.reference-bet{gap:4px;padding:6px}.reference-balance>span{font-size:1.5rem}.reference-balance strong,.reference-bet strong{font-size:1rem}.reference-bet button{width:34px;height:34px;font-size:1.2rem}.redesign-title .mascot{width:105px}.redesign-title>div{padding:8px}.redesign-title h2{font-size:1.3rem}.credit-side .credit-options{grid-template-columns:repeat(2,1fr)}.redesign-reel-frame .cell{min-height:70px;font-size:2.8rem}.redesign-controls button{min-height:50px}.redesign-bottom .round-control{width:52px;height:52px}}

/* NOVA INTERFACE COMPLETA baseada na imagem de referência */
.tiger-app{padding:0 0 28px;background:linear-gradient(180deg,#287fc5,#b7cbd0 30%,#c47a3d 72%,#3a100c);color:#fff}
.reference-screen{position:relative;isolation:isolate;min-height:100vh;overflow:hidden;padding:22px clamp(10px,2vw,32px) 30px;background:radial-gradient(ellipse at 50% 4%,#fff4b088,transparent 28%),linear-gradient(180deg,#398bd0,#9bbfc9 25%,#d48a49 70%,#54180e)}
.scene-sky{position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at 10% 18%,#e9a75b 0 5%,transparent 24%),radial-gradient(ellipse at 90% 17%,#397b45 0 8%,transparent 25%)}
.pagoda-roof{position:absolute;left:50%;top:7%;width:min(85vw,1100px);height:145px;transform:translateX(-50%);border-top:22px solid #633126;border-radius:50% 50% 0 0;filter:drop-shadow(0 8px 5px #33150c99);opacity:.7}.roof-two{top:15%;width:min(95vw,1300px);border-color:#8b3922;opacity:.55}.scene-coin{position:absolute;top:5%;color:#ffdb4e;font-size:48px;text-shadow:0 2px 4px #a94d0d}.coin-one{left:7%;transform:rotate(-22deg)}.coin-two{right:8%;transform:rotate(18deg)}
.reference-machine{width:min(100%,1500px);margin:0 auto;padding:18px clamp(10px,2vw,28px) 20px;position:relative;border:7px solid #ffca4b;border-radius:34px;background:linear-gradient(160deg,#d9411d,#a91b17 42%,#600b17);box-shadow:0 0 0 5px #873311,0 0 0 10px #f8d36b,0 28px 70px #230b0bcc,inset 0 0 40px #ffb33e66}.reference-machine:before{content:"";position:absolute;inset:8px;border:2px solid #ffdc75;border-radius:24px;pointer-events:none}
.reference-topbar{display:grid;grid-template-columns:minmax(220px,1fr) minmax(300px,1.55fr) minmax(220px,1fr);align-items:end;gap:14px;min-height:195px;position:relative;z-index:2}
.reference-balance,.reference-bet{display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 12px;min-height:105px;border:5px solid #eaa72d;border-radius:22px;background:linear-gradient(145deg,#4c0b11,#210409);box-shadow:inset 0 0 0 3px #ffdf76,0 6px #60170e}.reference-balance small,.reference-bet small{display:block;text-align:center;font-size:clamp(1rem,1.5vw,1.4rem);font-weight:900}.reference-balance strong,.reference-bet strong{display:block;color:#ffdc36;font-size:clamp(1.35rem,2.5vw,2.4rem);font-weight:1000;text-shadow:0 3px #7c260e}.balance-coin{display:grid;place-items:center;width:55px;height:55px;border-radius:50%;background:linear-gradient(#ffe783,#d88910);border:4px solid #f6b72d;font-size:2rem}
.reference-bet{justify-content:space-evenly}.reference-bet button{width:52px;height:52px;border-radius:50%;border:4px solid #eaa72d;background:linear-gradient(#ffcf55,#b95a0b);color:#4a1209;font-size:2rem;font-weight:1000}
.reference-mascot-title{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;margin-bottom:-8px;min-width:0}.reference-mascot-title .mascot{width:min(29vw,330px);max-height:205px;height:auto;z-index:3;filter:drop-shadow(0 8px 4px #3b100b99);margin-bottom:-28px}.reference-title-plaque{width:100%;padding:12px 15px 10px;position:relative;z-index:2;text-align:center;border:7px solid #ffce45;border-radius:48px 48px 24px 24px;background:linear-gradient(#f23c0e,#b80e16 58%,#781018);box-shadow:inset 0 0 0 3px #ff9f25,0 8px #67160d}.reference-title-plaque h1{margin:0;color:#ffdf36;font:1000 clamp(2rem,4.4vw,4.4rem)/1 Georgia,serif;letter-spacing:-2px;-webkit-text-stroke:1px #8c2908;text-shadow:0 3px #84200a,0 6px 4px #270608}
.reference-game-row{display:grid;grid-template-columns:minmax(190px,230px) minmax(0,1fr) minmax(190px,230px);gap:18px;align-items:stretch;margin-top:8px}.reference-credit-panel,.reference-payout-panel{padding:14px 12px;border:5px solid #efb32e;border-radius:26px;background:linear-gradient(145deg,#4d0b11,#23050a);box-shadow:inset 0 0 0 3px #ffdf75,inset 0 0 22px #f6b43c33,0 7px #66180e;display:flex;flex-direction:column}
.reference-credit-panel h2{display:flex;align-items:center;justify-content:center;gap:9px;margin:0;color:#fff;font-size:1.1rem;line-height:1}.reference-credit-panel h2 span{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:linear-gradient(#65e44c,#15922d);border:4px solid #a8ff71;font-size:2rem}.reference-credit-panel h2 small{display:block;font-size:.8rem}.money-bag{text-align:center;font-size:2.2rem;line-height:1.2}.reference-credit-panel .credit-options{display:grid;grid-template-columns:1fr;gap:7px}.reference-credit-panel .credit-button{width:100%;margin:0;padding:10px 3px;border:3px solid #ffdc50;border-radius:14px;background:linear-gradient(#ffe72f,#f2a000);color:#4b1b05;font-weight:1000;font-size:clamp(.85rem,1.2vw,1.1rem);box-shadow:0 4px #9c4b08}.reference-credit-panel .credit-step{margin-top:10px;padding:10px 3px;width:100%;border:3px solid #ff9675;border-radius:14px;background:linear-gradient(#ff4a27,#b90e18);color:#fff;font-weight:1000}
.reference-reel-area{min-width:0;display:flex;flex-direction:column;justify-content:center}.reference-reel-frame{padding:11px;border:8px solid #f4b52f;border-radius:26px;background:linear-gradient(#9c3018,#4e0b11);box-shadow:inset 0 0 0 4px #ffdf77,0 7px #641b0c}.reference-reel-frame .reels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.reference-reel-frame .cell{display:grid;place-items:center;aspect-ratio:1.12;min-height:105px;border:4px solid #c86c1e;border-radius:8px;background:radial-gradient(#fff8e8,#f9dba6 72%,#e7a34b);box-shadow:inset 0 4px 12px #fff,0 3px #7e3212;font-size:clamp(3rem,6vw,6.4rem)}.reference-status{text-align:center;min-height:25px;margin-top:7px;color:#fff1bd;font-weight:800;font-size:.9rem}.reference-last-win{text-align:center;color:#ffdc78;font-size:.78rem;font-weight:900}.reference-last-win strong{font-size:1rem;color:#fff1a1}
.reference-payout-panel h2{text-align:center;margin:0 0 8px;color:#ffdf36;font-size:1.6rem}.reference-payout-row{display:flex;align-items:center;justify-content:space-around;gap:8px;flex:1;min-height:55px;color:#ffdf39;font-size:1.6rem;font-weight:1000}.reference-payout-row span{font-size:2.4rem;filter:drop-shadow(0 3px 2px #160509)}.reference-turbo{margin-top:9px;display:flex;justify-content:space-between;align-items:center;padding:9px 11px;border:4px solid #e5a72b;border-radius:16px;background:#2d0a10;color:#ffdf48;font-weight:1000;font-size:1rem}.reference-turbo i{width:35px;height:22px;border-radius:20px;background:#999;position:relative}.reference-turbo i:after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff}.reference-turbo.active i{background:#20a93d}.reference-turbo.active i:after{transform:translateX(13px)}
.reference-bottom-controls{display:grid;grid-template-columns:68px 68px minmax(130px,1fr) minmax(180px,1.25fr) minmax(140px,1fr) 68px;gap:11px;align-items:center;margin-top:22px}.reference-bottom-controls button{cursor:pointer}.round-control{width:66px;height:66px;border-radius:50%;border:5px solid #e8a52e;background:linear-gradient(#32102d,#140814);color:#ffdb55;font-size:2rem;font-weight:1000;box-shadow:0 5px #6a250e}.reference-auto,.reference-max{min-height:74px;padding:8px 10px;border:5px solid #e7a632;border-radius:24px;background:linear-gradient(#70245b,#300b36);color:#fff1e5;font-size:clamp(1rem,1.8vw,1.7rem);font-weight:1000;box-shadow:0 6px #6a250e}.reference-max{display:flex;align-items:center;justify-content:center;gap:8px}.reference-spin{min-height:88px;border:7px solid #f4cf56;border-radius:48px;background:linear-gradient(#8df044,#18a72b);color:#fff;font-size:clamp(1.8rem,4vw,3.4rem);font-weight:1000;text-shadow:0 4px #226324;box-shadow:0 8px #74310d,inset 0 0 0 3px #c9ff7c}.reference-mobile-tools{display:none}
.responsible{max-width:900px;margin:16px auto 0;padding:0 15px;text-align:center;color:#ffe9b8;font-size:.78rem}
@media(max-width:950px){.reference-topbar{grid-template-columns:1fr 1.2fr;min-height:0}.reference-mascot-title{grid-column:1/-1;grid-row:1}.reference-balance{grid-column:1;grid-row:2}.reference-bet{grid-column:2;grid-row:2}.reference-mascot-title .mascot{width:180px;max-height:145px}.reference-game-row{grid-template-columns:1fr}.reference-reel-area{grid-row:1}.reference-credit-panel{grid-row:2}.reference-payout-panel{grid-row:3;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.reference-credit-panel .credit-options{grid-template-columns:repeat(5,1fr)}.reference-credit-panel .credit-button{font-size:.78rem}.reference-payout-panel h2,.reference-turbo{grid-column:1/-1}.reference-payout-row{min-height:44px}.reference-bottom-controls{grid-template-columns:50px 50px 1fr 1.2fr 1fr 50px;gap:5px}.round-control{width:48px;height:48px;font-size:1.3rem}.reference-auto,.reference-max{min-height:58px;font-size:.9rem}.reference-spin{min-height:66px;font-size:1.7rem}}
@media(max-width:560px){.reference-screen{padding:9px 7px 20px}.reference-machine{padding:9px 7px 12px;border-width:4px;border-radius:20px}.reference-topbar{gap:6px}.reference-balance,.reference-bet{min-height:68px;padding:5px;gap:4px;border-width:3px;border-radius:13px}.balance-coin{width:33px;height:33px;font-size:1.1rem}.reference-balance small,.reference-bet small{font-size:.7rem}.reference-balance strong,.reference-bet strong{font-size:.95rem}.reference-bet button{width:32px;height:32px;font-size:1.15rem;border-width:2px}.reference-mascot-title .mascot{width:120px;max-height:100px;margin-bottom:-15px}.reference-title-plaque{border-width:4px;padding:8px 4px;border-radius:22px 22px 14px 14px}.reference-title-plaque h1{font-size:1.5rem;letter-spacing:-1px}.reference-game-row{gap:8px}.reference-reel-frame{padding:5px;border-width:5px;border-radius:14px}.reference-reel-frame .cell{min-height:70px;font-size:2.7rem;border-width:2px}.reference-credit-panel,.reference-payout-panel{padding:8px 6px;border-width:3px;border-radius:15px}.reference-credit-panel .credit-options{grid-template-columns:repeat(2,1fr)}.reference-credit-panel .credit-button{padding:7px 2px;font-size:.78rem}.reference-payout-row{font-size:1.15rem}.reference-payout-row span{font-size:1.5rem}.reference-bottom-controls{grid-template-columns:38px 38px 1fr 1.2fr 1fr 38px;gap:3px;margin-top:13px}.reference-bottom-controls .round-control{width:37px;height:37px;border-width:3px;font-size:1rem}.reference-auto,.reference-max{min-height:44px;padding:3px;font-size:.7rem;border-width:3px;border-radius:11px}.reference-spin{min-height:51px;border-width:4px;font-size:1.25rem;border-radius:25px}}

`;
