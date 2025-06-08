class Debugger {
  private prefix = '[Magic-Resume]';

  constructor() {
    this.log('欢迎使用 Magic-Resume ( ´ ∀ ` )ﾉ');
  }

  log(...args: unknown[]) {
    console.log(`%c${this.prefix}`, 'color: blue; font-weight: bold;', ...args);
  }

  warn(...args: unknown[]) {
    console.warn(`%c${this.prefix}`, 'color: yellow; font-weight: bold;', ...args);
  }

  error(...args: unknown[]) {
    console.error(`%c${this.prefix}`, 'color: red; font-weight: bold;', ...args);
  }
}

export const MagicDebugger = new Debugger();
