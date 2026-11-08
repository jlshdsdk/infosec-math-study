/** Exact integer arithmetic for checking examples from the courseware. */
export function integer(value, label = '整数') {
  if (typeof value === 'bigint') return value;
  const text = String(value).trim();
  if (!/^[+-]?\d+$/.test(text) || text.replace(/^[+-]/, '').length > 500) throw new Error(`${label}请输入不超过 500 位的整数`);
  return BigInt(text);
}
export function mod(a, m) {
  a = integer(a); m = integer(m, '模');
  if (m <= 0n) throw new Error('模必须是正整数');
  return ((a % m) + m) % m;
}
export function gcd(a, b) {
  a = integer(a); b = integer(b);
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
export function extendedGcd(a, b) {
  a = integer(a, 'a'); b = integer(b, 'b');
  if (a === 0n && b === 0n) throw new Error('课件未定义 (0,0)，请至少输入一个非零整数');
  let oldR = a < 0n ? -a : a, r = b < 0n ? -b : b;
  let oldS = 1n, s = 0n, oldT = 0n, t = 1n;
  const steps = [];
  while (r !== 0n) {
    const q = oldR / r, remainder = oldR - q * r;
    steps.push({ a: oldR, b: r, q, r: remainder });
    [oldR, r] = [r, remainder];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { gcd: oldR, x: a < 0n ? -oldS : oldS, y: b < 0n ? -oldT : oldT, steps };
}
export function modPow(a, exponent, modulus) {
  a = integer(a, '底数'); exponent = integer(exponent, '指数'); modulus = integer(modulus, '模');
  if (modulus <= 0n) throw new Error('模必须是正整数');
  if (exponent < 0n) throw new Error('重复平方练习的指数必须为非负整数');
  let base = mod(a, modulus), power = exponent, result = 1n % modulus;
  const steps = [];
  let position = 0;
  while (power > 0n) {
    const bit = power & 1n, before = result;
    if (bit) result = mod(result * base, modulus);
    steps.push({ position, bit, base, before, result });
    base = mod(base * base, modulus); power >>= 1n; position++;
  }
  return { value: result, steps, base: a, exponent, modulus };
}
export function solveLinear(a, b, modulus) {
  a = integer(a, 'a'); b = integer(b, 'b'); modulus = integer(modulus, '模');
  if (modulus <= 0n) throw new Error('模必须是正整数');
  const d = gcd(a, modulus);
  if (b % d !== 0n) return { solvable: false, gcd: d, modulus, reason: '最大公因数不整除右端常数，因此无解' };
  const reducedModulus = modulus / d;
  let base = 0n;
  if (reducedModulus > 1n) base = mod(extendedGcd(a / d, reducedModulus).x * (b / d), reducedModulus);
  const solutions = [];
  const limit = d < 1000n ? d : 1000n;
  for (let k = 0n; k < limit; k++) solutions.push(base + k * reducedModulus);
  return { solvable: true, gcd: d, modulus, reducedModulus, base, count: d, solutions, truncated: d > limit };
}
export function crt(equations) {
  if (!Array.isArray(equations) || equations.length < 1 || equations.length > 12) throw new Error('请输入 1 至 12 条同余条件');
  let remainder = 0n, modulus = 1n;
  const steps = [];
  for (const eq of equations) {
    const n = integer(eq.modulus, '模'), a = integer(eq.remainder, '余数');
    if (n <= 0n) throw new Error('每个模都必须是正整数');
    const { gcd: d, x } = extendedGcd(modulus, n);
    const delta = a - remainder;
    if (delta % d !== 0n) return { solvable: false, steps, gcd: d, reason: '同余条件不相容：模的最大公因数不整除余数之差' };
    const t = mod((delta / d) * x, n / d);
    const newModulus = (modulus / d) * n;
    const newRemainder = mod(remainder + modulus * t, newModulus);
    steps.push({ remainder, modulus, nextRemainder: mod(a, n), nextModulus: n, gcd: d, t, result: newRemainder, period: newModulus });
    remainder = newRemainder; modulus = newModulus;
  }
  return { solvable: true, remainder, modulus, steps };
}
export function jacobi(a, n) {
  a = integer(a, '分子'); n = integer(n, '分母');
  if (n <= 0n || n % 2n === 0n) throw new Error('Jacobi 符号分母必须为正奇数');
  a = mod(a, n);
  let sign = 1;
  const steps = [];
  while (a !== 0n) {
    let twos = 0;
    while (a % 2n === 0n) {
      a /= 2n; twos++;
      if (n % 8n === 3n || n % 8n === 5n) sign = -sign;
    }
    if (twos) steps.push({ operation: '拆出因子 2', a, n, sign, twos });
    if (a % 4n === 3n && n % 4n === 3n) sign = -sign;
    [a, n] = [n % a, a];
    steps.push({ operation: '互反与取余', a, n, sign });
  }
  return { value: n === 1n ? sign : 0, steps };
}
export function isPrime(value) {
  const n = integer(value);
  if (n < 2n) return false;
  if (n >= 18446744073709551616n) throw new Error('素数核对仅支持小于 2⁶⁴ 的整数');
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n, s = 0;
  while (d % 2n === 0n) { d /= 2n; s++; }
  // This base set deterministically covers all unsigned 64-bit integers.
  for (const base of [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n]) {
    if (base % n === 0n) continue;
    let x = modPow(base, d, n).value;
    if (x === 1n || x === n - 1n) continue;
    let passed = false;
    for (let r = 1; r < s; r++) { x = (x * x) % n; if (x === n - 1n) { passed = true; break; } }
    if (!passed) return false;
  }
  return true;
}
export function quadraticRootsBounded(a, modulus) {
  a = integer(a, 'a'); modulus = integer(modulus, '模');
  if (modulus < 1n || modulus > 20000n) throw new Error('逐类核对支持 1 至 20000 的模；较大模请按课件使用提升与 CRT');
  const roots = [], reducedA = mod(a, modulus);
  for (let x = 0n; x < modulus; x++) if ((x * x) % modulus === reducedA) roots.push(x);
  return { roots, modulus, reducedA, count: roots.length };
}
