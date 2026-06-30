const cjkCharacterRegex = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

export const magicPdfHyphenationCallback = (word: string): string[] => {
  if (word === ' ') return ['\u200c '];
  if (!cjkCharacterRegex.test(word)) return [word];

  // Empty fragments expose character-level break opportunities without
  // asking textkit to paint a hyphen at the end of the wrapped line.
  return Array.from(word).flatMap((character) => [character, '']);
};
