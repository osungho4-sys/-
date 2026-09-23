import { useEffect, useMemo, useRef, useState } from 'react';
import MobileControls from './components/MobileControls';
import { Game } from './game/Game';
import { InputController } from './game/input';
import type { Difficulty, MobileInputState, PlayerArchetype } from './game/types';

const archetypes: PlayerArchetype[] = [
  { id: 'sprinter', name: 'Sprinter', number: 11, stats: { speed: 2.5, shotPower: 10, passAccuracy: 0.7 } },
  { id: 'playmaker', name: 'Playmaker', number: 8, stats: { speed: 2.1, shotPower: 8.5, passAccuracy: 0.95 } },
  { id: 'striker', name: 'Striker', number: 9, stats: { speed: 2.2, shotPower: 12, passAccuracy: 0.75 } },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState<PlayerArchetype>(archetypes[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ scoreA: 0, scoreB: 0, time: 120, over: false, winner: '', countdown: 3 });

  useEffect(() => {
    if (!started || !canvasRef.current) return;
    const game = new Game(canvasRef.current, selected, difficulty);
    const input = new InputController();

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let hudAccumulator = 0;
    const step = 1 / 60;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      accumulator += dt;
      hudAccumulator += dt;

      while (accumulator >= step) {
        game.update(step, input.getState());
        accumulator -= step;
      }

      game.draw();

      if (hudAccumulator >= 0.1) {
        setHud({ scoreA: game.score.A, scoreB: game.score.B, time: game.timeLeft, over: game.over, winner: game.winnerText, countdown: game.kickoffCountdown });
        hudAccumulator = 0;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    (window as any).__setMobileState = (state: MobileInputState) => input.setMobileState(state);
    return () => {
      cancelAnimationFrame(raf);
      input.dispose();
      delete (window as any).__setMobileState;
    };
  }, [started, selected, difficulty]);

  const playerCard = useMemo(
    () => (
      <div className="selector-grid">
        {archetypes.map((a) => (
          <button key={a.id} className={selected.id === a.id ? 'sel active' : 'sel'} onClick={() => setSelected(a)}>
            {a.name}
            <br />
            Speed {a.stats.speed} / Shot {a.stats.shotPower} / Pass {a.stats.passAccuracy}
          </button>
        ))}
      </div>
    ),
    [selected],
  );

  if (!started)
    return (
      <div className="app">
        <h1>Original Mini Football</h1>
        {playerCard}
        <div className="difficulty">
          <button onClick={() => setDifficulty('easy')}>Easy</button>
          <button onClick={() => setDifficulty('normal')}>Normal</button>
          <button onClick={() => setDifficulty('hard')}>Hard</button>
        </div>
        <button className="start" onClick={() => setStarted(true)}>
          Start Match
        </button>
      </div>
    );

  return (
    <div className="app">
      <h1>Original Mini Football</h1>
      <div className="hud">
        <span>Blue {hud.scoreA} - {hud.scoreB} Red</span>
        <span>Time: {Math.ceil(hud.time)}s</span>
        <span>Difficulty: {difficulty}</span>
        {hud.countdown > 0 && <span>Kickoff: {Math.ceil(hud.countdown)}</span>}
      </div>
      <canvas ref={canvasRef} />
      <div className="help">WASD/방향키 · Shift · J 패스 · Space 슛</div>
      {hud.over && <div className="result">경기 종료: {hud.winner}</div>}
      <MobileControls onChange={(state) => (window as any).__setMobileState?.(state)} />
    </div>
  );
}
