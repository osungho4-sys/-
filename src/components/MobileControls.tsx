import { useEffect, useRef, useState } from 'react';
import type { MobileInputState, Vec2 } from '../game/types';

type Props = { onChange: (state: MobileInputState) => void };

export default function MobileControls({ onChange }: Props) {
  const [stick, setStick] = useState<Vec2>({ x: 0, y: 0 });
  const [sprint, setSprint] = useState(false);
  const touchId = useRef<number | null>(null);
  useEffect(() => onChange({ joystick: stick, sprint, pass: false, shoot: false }), [stick, sprint, onChange]);

  return <div className="mobile-controls"><div className="joystick" onTouchStart={(e)=>{const t=e.changedTouches[0];touchId.current=t.identifier;const r=e.currentTarget.getBoundingClientRect();const dx=t.clientX-(r.left+r.width/2);const dy=t.clientY-(r.top+r.height/2);const m=Math.max(1,Math.hypot(dx,dy));setStick({x:Math.max(-1,Math.min(1,dx/m))*Math.min(1,m/45),y:Math.max(-1,Math.min(1,dy/m))*Math.min(1,m/45)});}} onTouchMove={(e)=>{const t=[...e.changedTouches].find(x=>x.identifier===touchId.current);if(!t)return;const r=e.currentTarget.getBoundingClientRect();const dx=t.clientX-(r.left+r.width/2);const dy=t.clientY-(r.top+r.height/2);const m=Math.max(1,Math.hypot(dx,dy));setStick({x:Math.max(-1,Math.min(1,dx/m))*Math.min(1,m/45),y:Math.max(-1,Math.min(1,dy/m))*Math.min(1,m/45)});}} onTouchEnd={()=>{setStick({x:0,y:0});touchId.current=null;}}><div className="joystick-knob" style={{transform:`translate(${stick.x*28}px,${stick.y*28}px)`}}/></div><div className="mobile-buttons"><button className="btn pass" onTouchStart={()=>onChange({joystick:stick,sprint,pass:true,shoot:false})}>PASS</button><button className="btn shoot" onTouchStart={()=>onChange({joystick:stick,sprint,pass:false,shoot:true})}>SHOOT</button><button className={`btn sprint ${sprint?'active':''}`} onTouchStart={()=>setSprint(true)} onTouchEnd={()=>setSprint(false)}>RUN</button></div></div>;
}
