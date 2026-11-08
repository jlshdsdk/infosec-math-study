const { test, before } = require('node:test');
const assert = require('node:assert/strict');
let m;
before(async () => { m = await import('../public/math-tools.js'); });

test('课件 Bézout 例题与负数、零边界', () => {
  for (const [a,b] of [[169n,121n],[1859n,1573n],[-68n,30n],[0n,-17n],[-12n,0n]]) {
    const r=m.extendedGcd(a,b); assert.equal(a*r.x+b*r.y,r.gcd); assert.equal(r.gcd,m.gcd(a,b)); assert.ok(r.gcd>0n);
  }
  assert.equal(m.extendedGcd(169n,121n).x,58n);
  assert.throws(()=>m.extendedGcd(0,0));
});
test('一次同余式全部解与无解均回代', () => {
  assert.equal(m.solveLinear(4,9,6).solvable,false);
  assert.deepEqual(m.solveLinear(169,9,121).solutions,[38n]);
  for (let modulus=1;modulus<35;modulus++) for(let a=-4;a<10;a++) for(let b=-3;b<8;b++) {
    const r=m.solveLinear(a,b,modulus); const direct=[];
    for(let x=0;x<modulus;x++) if(m.mod(BigInt(a*x-b),BigInt(modulus))===0n) direct.push(BigInt(x));
    assert.equal(r.solvable,direct.length>0);
    if(r.solvable)assert.deepEqual([...r.solutions].sort((x,y)=>x<y?-1:1),direct);
  }
});
test('CRT 物不知数、非互素条件、唯一模周期', () => {
  let r=m.crt([{remainder:2,modulus:3},{remainder:3,modulus:5},{remainder:2,modulus:7}]);
  assert.equal(r.remainder,23n);assert.equal(r.modulus,105n);
  r=m.crt([{remainder:2,modulus:6},{remainder:5,modulus:9}]); assert.equal(r.solvable,true);assert.equal(r.remainder,14n);assert.equal(r.modulus,18n);
  assert.equal(m.crt([{remainder:1,modulus:4},{remainder:2,modulus:6}]).solvable,false);
});
test('重复平方与直接乘法独立交叉核对', () => {
  for(let a=-8;a<=9;a++)for(let e=0;e<15;e++)for(let mod=1;mod<20;mod++)assert.equal(m.modPow(a,e,mod).value,m.mod(BigInt(a)**BigInt(e),BigInt(mod)));
  assert.throws(()=>m.modPow(2,-1,7));assert.throws(()=>m.modPow(2,5,0));
});
test('素数判断及 Legendre/Jacobi 边界', () => {
  for(let n=0;n<3000;n++){
    let direct=n>=2;
    for(let d=2;d*d<=n;d++)if(n%d===0){direct=false;break;}
    assert.equal(m.isPrime(n),direct);
  }
  assert.equal(m.jacobi(3,119).value,1);assert.equal(m.quadraticRootsBounded(3,119).count,0);
  assert.equal(m.jacobi(-1,7).value,-1);assert.equal(m.jacobi(3,9).value,0);assert.equal(m.jacobi(5,1).value,1);
  for(const p of [3,5,7,11,13,17,19,23,29,31,43])for(let a=1;a<p;a++)assert.equal(m.jacobi(a,p).value,m.modPow(a,(p-1)/2,p).value===1n?1:-1);
});
test('平方根对应课件，包含 2 的幂与合数模', () => {
  assert.deepEqual(m.quadraticRootsBounded(8,17).roots,[5n,12n]);
  assert.deepEqual(m.quadraticRootsBounded(6,25).roots,[9n,16n]);
  assert.deepEqual(m.quadraticRootsBounded(17,32).roots,[7n,9n,23n,25n]);
  assert.deepEqual(m.quadraticRootsBounded(17,64).roots,[9n,23n,41n,55n]);
  assert.equal(m.quadraticRootsBounded(2,119).count,4);assert.equal(m.quadraticRootsBounded(-1,85).count,4);
  assert.throws(()=>m.quadraticRootsBounded(2,20001));
});
test('课件模35高次式的校正答案经逐类回代',()=>{
  const f=x=>25n*x**25n+20n*x**23n-3n*x**15n-40n*x**12n+6n*x**11n+15n*x**7n+3n*x**5n+16n*x**3n-7n*x;
  const roots=[];for(let x=0n;x<35n;x++)if(m.mod(f(x),35n)===0n)roots.push(x);
  assert.deepEqual(roots,[0n,1n,14n,15n,21n,29n]);
  assert.equal(m.mod(f(4n),35n),30n);
});
