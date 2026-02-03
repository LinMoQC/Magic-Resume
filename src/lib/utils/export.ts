export const oklchToRgb = (l: number, c: number, h: number) => {
    l /= 100;
    c /= 100;

    const a = c * Math.cos(h * Math.PI / 180);
    const b = c * Math.sin(h * Math.PI / 180);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;

    const L = l_ * l_ * l_;
    const M = m_ * m_ * m_;
    const S = s_ * s_ * s_;

    let r = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
    let g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
    let bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    bl = Math.max(0, Math.min(1, bl));

    return [r * 255, g * 255, bl * 255];
  }