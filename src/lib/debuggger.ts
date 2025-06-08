class Debugger {
  private prefix = '[Magic-Resume]';

  constructor() {
    this.log('欢迎使用 Magic-Resume ( ´ ∀ ` )ﾉ');
  }

  log(...args: any[]) {
    console.log(`%c${this.prefix}`, 'color: #DA70D6; font-weight: bold;', ...args);
  }

  warn(...args: any[]) {
    console.warn(`%c${this.prefix}`, 'color: yellow; font-weight: bold;', ...args);
  }

  error(...args: any[]) {
    console.error(`%c${this.prefix}`, 'color: red; font-weight: bold;', ...args);
  }
}

export const MagicDebugger = new Debugger();
