const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*-_+?';
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function generatePassword(length = 16): string {
  const chars = [LOWER, UPPER, DIGITS, SYMBOLS].map((set) => set[randomIndex(set.length)]);
  while (chars.length < length) {
    chars.push(ALL[randomIndex(ALL.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

export function ratePassword(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: '' };
  if (password.length < 8) return { score: 1, label: 'Túl rövid' };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 14 && classes >= 3) return { score: 4, label: 'Erős' };
  if (password.length >= 10 && classes >= 2) return { score: 3, label: 'Jó' };
  return { score: 2, label: 'Gyenge' };
}
