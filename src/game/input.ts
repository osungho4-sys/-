import type { InputState, MobileInputState } from './types';

export class InputController {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private mobileState: MobileInputState = {
    joystick: { x: 0, y: 0 },
    sprint: false,
    pass: false,
    shoot: false,
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  setMobileState(state: MobileInputState) {
    this.mobileState = state;
  }

  getState(): InputState {
    const left = this.keys.has('a') || this.keys.has('arrowleft');
    const right = this.keys.has('d') || this.keys.has('arrowright');
    const up = this.keys.has('w') || this.keys.has('arrowup');
    const down = this.keys.has('s') || this.keys.has('arrowdown');

    const kx = (right ? 1 : 0) - (left ? 1 : 0);
    const ky = (down ? 1 : 0) - (up ? 1 : 0);

    const passPressed = this.consumePressed('j') || this.mobileState.pass;
    const shootPressed = this.consumePressed(' ') || this.mobileState.shoot;

    return {
      moveX: Math.abs(kx) > Math.abs(this.mobileState.joystick.x) ? kx : this.mobileState.joystick.x,
      moveY: Math.abs(ky) > Math.abs(this.mobileState.joystick.y) ? ky : this.mobileState.joystick.y,
      sprint: this.keys.has('shift') || this.mobileState.sprint,
      pass: passPressed,
      shoot: shootPressed,
    };
  }

  private consumePressed(key: string): boolean {
    if (!this.pressed.has(key)) return false;
    this.pressed.delete(key);
    return true;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys.add(key);
    this.pressed.add(key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
}
