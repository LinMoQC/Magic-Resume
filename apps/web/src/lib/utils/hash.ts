export function generateShortHash(value: string): string {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return Math.abs(hash).toString(16).substring(0, 7).padEnd(7, '0');
}
