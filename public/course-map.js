'use strict';

// 阅读分组独立于课件节号；topic ID、原文和原页归属均沿用已有目录。
window.COURSE_PATHS = {
  '1': {
    title: '整数的可除性',
    question: '怎样用整除关系理解整数，并算出它们的公因数？',
    bridge: '从整数倍、商和余数起步，再把这些概念变成求最大公因数、分解整数的工具。',
    prerequisites: [],
    start: '1-intro',
    units: [
      {
        id: '1-foundations', title: '先看懂整除与余数',
        description: '把整除翻译成整数倍等式，学会带余除法，并理解不同余数范围。',
        topics: ['1-intro', 'div', 'division', 'remainder']
      },
      {
        id: '1-primes-and-digits', title: '认识素数与整数表示',
        description: '辨别素数和合数，再用进制表示看清整数怎样由数位组成。',
        topics: ['prime', 'prime-form', 'base']
      },
      {
        id: '1-gcd', title: '从公因数走到计算方法',
        description: '先求最大公因数，再用 Bézout 等式和扩展欧几里得法记录整数系数。',
        topics: ['gcd', 'euclid', 'bezout', 'extended', 'gcd-props', 'multi-gcd', 'power-gcd']
      },
      {
        id: '1-factor-structure', title: '用因数结构解决问题',
        description: '理解互素时的消去、最小公倍数和整数分解，最后学习标准分解与计数应用。',
        topics: ['euclid-lemma', 'lcm', 'factor', 'fta', 'factor-app', 'prime-dist']
      }
    ]
  },
  '2': {
    title: '同余',
    question: '能不能只用有限种余数，完成大整数的计算？',
    bridge: '第一章研究整除；两数之差被模整除，就得到同余。带余除法和互素将继续决定哪些变形合法。',
    prerequisites: [
      {id: 'division', label: '带余除法与最小非负余数'},
      {id: 'gcd', label: '最大公因数与互素'},
      {id: 'bezout', label: 'Bézout 等式'}
    ],
    start: '2-intro',
    units: [
      {
        id: '2-congruence', title: '从余数相同到同余运算',
        description: '先弄清同余表示什么，再区分加减乘和有条件的约分。',
        topics: ['2-intro', 'congruence', 'congruence-test', 'congruence-props']
      },
      {
        id: '2-residue-classes', title: '用剩余类整理所有整数',
        description: '分清一个剩余类和一个代表元，理解完全剩余系怎样不重不漏地遍历。',
        topics: ['classes', 'complete', 'multi-residue']
      },
      {
        id: '2-units-and-phi', title: '筛出可逆元素并数清个数',
        description: '用互素筛选简化剩余系，通过欧拉函数计算其大小，再理解模逆元。',
        topics: ['phi', 'reduced', 'phi-props']
      },
      {
        id: '2-theorems-and-power', title: '用定理和算法计算大数',
        description: '核对欧拉、费马和 Wilson 定理的条件，再用重复平方实际计算模幂。',
        topics: ['euler', 'fermat', 'wilson', 'fast-power']
      }
    ]
  },
  '3': {
    title: '同余式',
    question: '哪些未知数能使同余成立，怎样把全部解找齐？',
    bridge: '第二章计算已知整数的余数；现在把整数换成未知数。逆元帮助解一条式子，CRT 帮助合并多条条件。',
    prerequisites: [
      {id: 'extended', label: '扩展欧几里得法'},
      {id: 'congruence-props', label: '同余约分及模的改变'},
      {id: 'classes', label: '剩余类与代表元'},
      {id: 'reduced', label: '模逆元'}
    ],
    start: '3-intro',
    units: [
      {
        id: '3-linear', title: '先会解一条一次同余式',
        description: '明确解数数的是剩余类，再依次完成有解判定、求逆和还原全部解。',
        topics: ['3-intro', 'equation', 'linear']
      },
      {
        id: '3-crt', title: '把多条余数条件拼起来',
        description: '从物不知数的构造理解 CRT，再学习一般公式、迭代求解及算法应用。',
        topics: ['crt-story', 'crt-two', 'crt-general', 'crt-iterate', 'crt-opt', 'crt-traverse']
      },
      {
        id: '3-lifting', title: '拆开合数模，再逐层提升',
        description: '把合数模问题拆为素数幂模问题，理解解数的乘法与提升时的不同分支。',
        topics: ['root-count', 'hensel']
      },
      {
        id: '3-polynomials', title: '理解素数模下的多项式',
        description: '从多项式除法走到降次、因式分解和根数估计，并检查素数模的条件。',
        topics: ['poly-div', 'poly-reduce', 'poly-factor', 'poly-count']
      }
    ]
  },
  '4': {
    title: '二次同余式与平方剩余',
    question: '一个数有没有模平方根？有的话，怎样找出全部平方根？',
    bridge: '第三章的模分解、提升和 CRT 继续使用。本章将问题集中到二次式，依次区分有解判定、求根和列出全部根。',
    prerequisites: [
      {id: 'linear', label: '一次同余式及全部解'},
      {id: 'crt-general', label: '中国剩余定理'},
      {id: 'hensel', label: '素数幂模的提升方法'},
      {id: 'fast-power', label: '模重复平方计算'}
    ],
    start: '4-intro',
    units: [
      {
        id: '4-quadratic', title: '把一般二次式化成平方问题',
        description: '先核对配方与约分的条件，再通过小模枚举认识平方剩余。',
        topics: ['4-intro', 'quadratic', 'qr-def', 'qr-euler']
      },
      {
        id: '4-residuosity', title: '判断有没有平方根',
        description: '学习 Legendre 符号、Gauss 引理和二次互反律，并看清 Jacobi 符号的判断边界。',
        topics: ['legendre', 'gauss', 'reciprocity', 'reciprocity-app', 'jacobi']
      },
      {
        id: '4-square-roots', title: '从素数模走到合数模求根',
        description: '先在奇素数模下求根，再处理素数幂与二次幂模，最后用 CRT 合并全部组合。',
        topics: ['sqrt-special', 'sqrt-general', 'sqrt-odd-power', 'sqrt-two', 'sqrt-composite']
      },
      {
        id: '4-sum-squares', title: '从同余解走向整数表示',
        description: '借助模平方根理解两个平方之和，并跟着课件完成下降法。',
        topics: ['sum-squares']
      }
    ]
  },
  '8': {
    title: '群',
    question: '整数、矩阵和置换的运算，为什么能服从同一套规律？',
    bridge: '回到第二章熟悉的剩余类加法与模逆元，再抽取运算的共同规则。现有第八章资料覆盖群论，学习从群的定义起步。',
    prerequisites: [
      {id: 'classes', label: '剩余类及其运算'},
      {id: 'reduced', label: '互素与模逆元'},
      {id: 'gcd', label: '最大公因数与互素'}
    ],
    start: '8-intro',
    units: [
      {
        id: '8-groups', title: '从一种运算认识群',
        description: '按封闭性、结合律、单位元和逆元逐步检查，再学习群的性质、判别和幂运算。',
        topics: ['8-intro', 'binary', 'laws', 'semigroup', 'group', 'group-props', 'group-tests', 'group-examples', 'group-power']
      },
      {
        id: '8-permutations', title: '用置换看见具体的群',
        description: '先算复合，再做轮换分解、判断奇偶性，最后从运算表观察群的规律。',
        topics: ['permutation', 'cycles', 'cycle-decomp', 'parity', 'group-table']
      },
      {
        id: '8-subgroups-and-cycles', title: '从子群走到循环结构',
        description: '检查子群，再反复运算一个元素，理解生成、元素的阶和循环群。',
        topics: ['subgroup', 'subgroup-tests', 'generated', 'cyclic', 'order', 'generators', 'cyclic-subgroup']
      },
      {
        id: '8-cosets', title: '用陪集理解群的划分与大小',
        description: '从同余关系理解陪集，辨明正规性，再用陪集计数读懂 Lagrange 定理。',
        topics: ['cosets', 'normal', 'lagrange']
      },
      {
        id: '8-order-applications', title: '把阶与子群用于结构问题',
        description: '列举循环群的子群，比较小阶群，再用群阶的素因数检验元素的周期。',
        topics: ['cyclic-subgroups', 'small-groups', 'order-criterion']
      }
    ]
  }
};

// 仅为需要额外入口的文章提供具体先导；其他文章可使用所属阅读组和相邻文章。
window.LESSON_STARTERS = {
  div: {
    question: '“a 整除 b”究竟要求什么，为什么顺序不能换？',
    prerequisites: [],
    steps: ['把整除记号翻译成一个整数倍等式。', '由等式检验整除性质，注意零与负数的条件。', '对照课件例题，自己写出所需的整数系数。']
  },
  gcd: {
    question: '两个整数的共同因数，怎样用一个正整数概括？',
    prerequisites: [{id: 'div', label: '整除与因数'}, {id: 'division', label: '带余除法'}],
    steps: ['分清因数、公因数和最大公因数。', '用简单整数理解互素，并核对零与符号的约定。', '观察带余除法为什么不改变公因数，为辗转相除做准备。']
  },
  bezout: {
    question: '怎样把最大公因数写成两个原数的整数线性组合？',
    prerequisites: [{id: 'gcd', label: '最大公因数'}, {id: 'euclid', label: '辗转相除法'}],
    steps: ['先写出辗转相除的余数链。', '从最后一个非零余数逐行回代。', '把系数代回原数，检查所得等式。']
  },
  factor: {
    question: '两平方之差被 n 整除，怎样帮助我们找到 n 的因数？',
    prerequisites: [{id: 'gcd', label: '最大公因数'}, {id: 'euclid-lemma', label: '互素消去与素数整除积'}],
    steps: ['先把平方同余读成“n 整除两平方之差”；同余记号将在第二章系统学习。', '把两平方之差拆成两因子的乘积。', '分别求 n 与两因子的最大公因数，检查是否得到非平凡因数。']
  },
  congruence: {
    question: '余数相同、相差模的整数倍和同余，为什么是一回事？',
    prerequisites: [{id: 'div', label: '整除'}, {id: 'division', label: '最小非负余数'}],
    steps: ['从两数除以同一个正整数的余数开始。', '把“余数相同”写成“两数之差被模整除”。', '用小例子核对等价关系的性质，再读课件中的密码例子。']
  },
  'congruence-props': {
    question: '同余式什么时候可以约分，约分后模要不要改变？',
    prerequisites: [{id: 'congruence', label: '同余定义'}, {id: 'gcd', label: '最大公因数与互素'}],
    steps: ['把同余式还原为整除关系。', '求待约因子与模的最大公因数，判断能否保持原模。', '对照课件的改变模与合并模例题，逐次检查条件。']
  },
  linear: {
    question: '一次同余式有没有解？有解时怎样列出原模下的全部解？',
    prerequisites: [{id: 'bezout', label: 'Bézout 等式'}, {id: 'congruence-props', label: '同余约分与模的改变'}, {id: 'reduced', label: '模逆元'}, {id: 'equation', label: '解与解数的含义'}],
    steps: ['先求系数与模的最大公因数，判断它是否整除右侧。', '有解时同时约去公因数，再求新模下的逆元和一个解。', '还原原模下的全部剩余类，逐类代回检查。']
  },
  'crt-story': {
    question: '几条余数条件怎样合成同一个答案？',
    prerequisites: [{id: 'linear', label: '一次同余式'}, {id: 'multi-residue', label: '多个模的剩余系'}],
    steps: ['把物不知数的叙述写成几条同余条件。', '构造在一处模下等于 1、在其余模下等于 0 的整数。', '按各条件的余数相加，并逐条核对结果。']
  },
  hensel: {
    question: '已知较小素数幂模下的根，怎样逐层找到更大模下的根？',
    prerequisites: [{id: 'equation', label: '同余式与根'}, {id: 'linear', label: '一次同余式的有解条件'}, {id: 'root-count', label: '合数模分解与根数'}],
    steps: ['先读懂课件的多项式导式记号，这里只需按多项式规则计算。', '把新根写成“旧根加旧模的整数倍”，求出修正系数应满足的同余式。', '按导式是否可逆区分唯一提升、多个提升和不能提升，再将结果代回检查。']
  },
  quadratic: {
    question: '一般二次同余式怎样变成求平方根，哪些变形需要先检查条件？',
    prerequisites: [{id: 'congruence-props', label: '同余约分条件'}, {id: 'linear', label: '一次同余式'}, {id: 'root-count', label: '分解合数模'}, {id: 'hensel', label: '素数幂模提升'}],
    steps: ['先检查模、首项系数和公因数；简单的局部无解可以提前排除。', '在相应系数可逆时配方，记录新变量与原变量的关系。', '求新变量的平方根，再解一次同余式恢复原变量，核对原模下的全部解。']
  },
  jacobi: {
    question: '把 Legendre 符号推广到合数分母后，还能判断哪些事情？',
    prerequisites: [{id: 'legendre', label: 'Legendre 符号'}, {id: 'reciprocity', label: '二次互反律'}],
    steps: ['由分母的素因数分解读懂 Jacobi 符号的定义。', '用乘法性、补充公式和互反律计算。', '通过课件反例区分“符号为 1”和“确实有平方根”，再分别检查各素数幂模。']
  },
  'sqrt-general': {
    question: '奇素数不是特殊形式时，怎样一步步修正出平方根？',
    prerequisites: [{id: 'qr-euler', label: '欧拉判别条件'}, {id: 'fast-power', label: '模重复平方'}, {id: 'sqrt-special', label: '特殊奇素数模的平方根'}],
    steps: ['先确认右侧为非零平方剩余，再把 p−1 分解为奇数乘以 2 的幂。', '选择课件迭代所需的平方非剩余，按原页公式准备初值。', '这里的单位根指某次幂等于 1 的数；逐轮检测并修正，最后平方验算并写出正负两根。']
  },
  'sqrt-composite': {
    question: '各个素数幂模下的平方根，怎样组合成合数模下的全部根？',
    prerequisites: [{id: 'crt-general', label: '中国剩余定理'}, {id: 'sqrt-odd-power', label: '奇素数幂模平方根'}, {id: 'sqrt-two', label: '二次幂模平方根'}],
    steps: ['分解模，并在每个素数幂模下分别判定、求根。', '列举各处根的所有组合，逐组用 CRT 合并。', '核对不同解的个数，并将所得代表代回原式。']
  },
  group: {
    question: '给定一个集合和一种运算，怎样判断它构不构成群？',
    prerequisites: [{id: 'binary', label: '二元运算与封闭性'}, {id: 'laws', label: '结合律、单位元等运算性质'}, {id: 'semigroup', label: '半群与含幺半群'}],
    steps: ['先明确元素集合与规定的运算，检查是否对任意输入都有定义且封闭。', '检验结合律、内部单位元和每个元素的逆元。', '再单独判断是否交换，用课件的实例和反例对照条件。']
  },
  permutation: {
    question: '怎样把重新编号看成一种可逆运算，并算清置换的乘积？',
    prerequisites: [{id: 'group', label: '群与逆元'}, {id: 'group-power', label: '群中乘积与运算次序'}],
    steps: ['把置换理解成集合到自身的一一对应。', '沿用课件的复合约定：先作用右边，再作用左边。', '逐个跟踪元素的去向，并核对复合后仍是一一对应。']
  },
  cosets: {
    question: '怎样用一个子群把整个群分成互不重叠的部分？',
    prerequisites: [{id: 'classes', label: '剩余类与同余关系'}, {id: 'subgroup', label: '子群'}, {id: 'group-props', label: '逆元与消去律'}],
    steps: ['从整数同余类回顾“把等价元素放在一起”的想法，再读模子群的合同关系。', '分别按集合公式计算 aH 和 Ha；课件的左右称谓与常见教材相反，始终以公式核对。', '理解陪集为什么相等或不相交，并核查它们与子群大小相同，为 Lagrange 定理做准备。']
  },
  lagrange: {
    question: '为什么有限群的子群大小一定整除群的大小？',
    prerequisites: [{id: 'cosets', label: '陪集的划分与大小'}, {id: 'order', label: '元素的阶与周期'}],
    steps: ['用互不相交的陪集覆盖整个群。', '把每个陪集的大小相加，得到群阶与子群阶的关系。', '应用到循环子群和元素阶，并区分定理与它不保证的逆命题。']
  }
};
