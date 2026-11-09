CHAPTERS = [(1,'整数的可除性','从整除到素数，建立数论的第一层工具。'),(2,'同余','把大整数变成可计算的余数。'),(3,'同余式','从一次方程走向中国剩余定理与高次方程。'),(4,'二次同余式与平方剩余','判断有没有平方根，再一步步求出全部解。'),(8,'群、环、域','现有课件实际覆盖代数系统、群、置换、子群与陪集。')]
SECTIONS = {
'1.0':'课程导学与课件说明','1.1':'整除的概念与欧几里得除法','1.2':'整数的表示','1.3':'最大公因数与广义欧几里得除法','1.4':'整除的进一步性质及最小公倍数','1.5':'整数分解','1.6':'素数的算术基本定理','1.7':'素数定理与补充应用',
'2.0':'本章课件说明','2.1':'同余的概念及基本性质','2.2':'剩余类及完全剩余系','2.3':'简化剩余系与欧拉函数','2.4':'欧拉定理、费马小定理和 Wilson 定理','2.5':'模重复平方计算法',
'3.0':'本章课件说明','3.1':'基本概念及一次同余式','3.2':'中国剩余定理','3.3':'高次同余式的解数及解法','3.4':'素数模的同余式',
'4.0':'本章课件说明','4.1':'一般二次同余式','4.2':'奇素数模的平方剩余与平方非剩余','4.3':'Legendre 符号','4.4':'二次互反律','4.5':'Jacobi 符号','4.6':'模平方根','4.7':'两个平方之和',
'8.0':'本章课件说明','8.1':'群：运算、置换、子群与循环群','8.2':'陪集、正规子群与 Lagrange 定理'}

TOPICS = [
('1-intro','1.0','课程导学与学习方法'),
('div','1.1','整除的定义、因数与整除性质'),('division','1.1','最小非负余数与整数部分'),('remainder','1.1','一般余数与绝对值最小余数'),('prime','1.1','素数、试除、筛法与无穷性'),('prime-form','1.1','素数的形式与整除思考题'),
('base','1.2','b 进制表示与唯一性'),
('gcd','1.3','最大公因数与互素'),('euclid','1.3','辗转相除法与两种余数'),('bezout','1.3','Bézout 等式'),('extended','1.3','扩展欧几里得法与系数递推'),('gcd-props','1.3','最大公因数的等价描述与变换'),('multi-gcd','1.3','多个整数的最大公因数'),('power-gcd','1.3','形如 kⁿ−1 的最大公因数'),
('euclid-lemma','1.4','互素消去与素数整除积'),('lcm','1.4','最小公倍数及其与最大公因数的关系'),
('factor','1.5','平方同余与整数分解'),('fta','1.6','算术基本定理与标准分解'),('factor-app','1.6','因数个数、最大公因数和最小公倍数'),('prime-dist','1.7','素数分布、素数定理与阶乘指数'),
('2-intro','2.0','本章导航与原页说明'),('congruence','2.1','同余的定义、等价关系与密码例子'),('congruence-test','2.1','同余运算与十进制整除判别'),('congruence-props','2.1','同余消去、模的改变与最大公因数'),
('classes','2.2','剩余类、代表元与剩余类运算'),('complete','2.2','完全剩余系及仿射遍历'),('multi-residue','2.2','多个模的完全剩余系'),
('phi','2.3','欧拉函数与素数幂'),('reduced','2.3','简化剩余系与模逆元'),('phi-props','2.3','欧拉函数的乘法性与因数和'),
('euler','2.4','欧拉定理及其应用'),('fermat','2.4','Fermat 小定理'),('wilson','2.4','Wilson 定理与阶乘同余'),('fast-power','2.5','模重复平方计算法'),
('3-intro','3.0','本章导航与原页说明'),('equation','3.1','同余式、解与解数的含义'),('linear','3.1','一次同余式的判定与全部解'),('crt-story','3.2','物不知数与构造思路'),('crt-two','3.2','两个方程的中国剩余定理'),('crt-general','3.2','一般形式的中国剩余定理'),('crt-iterate','3.2','一次同余式组的迭代求解'),('crt-opt','3.2','中国剩余定理的算法优化'),('crt-traverse','3.2','中国剩余定理与剩余系遍历'),
('root-count','3.3','合数模分解与高次同余式的解数'),('hensel','3.3','高次同余式的提升与应用'),('poly-div','3.4','多项式的欧几里得除法'),('poly-reduce','3.4','素数模同余式的化简'),('poly-factor','3.4','一次因式分解与多项式的根'),('poly-count','3.4','素数模的根数估计与单位根'),
('4-intro','4.0','本章导航与原页说明'),('quadratic','4.1','一般二次同余式的配方'),('qr-def','4.1','平方剩余定义与模 7 的例子'),('qr-euler','4.2','欧拉判别条件与剩余个数'),('legendre','4.3','Legendre 符号及运算性质'),('gauss','4.3','Gauss 引理与补充公式'),('reciprocity','4.4','二次互反律与符号计算'),('reciprocity-app','4.4','同余式有解、素数形状与练习'),('jacobi','4.5','Jacobi 符号与判断的局限'),('sqrt-special','4.6','p≡3 (mod 4) 时的模平方根'),('sqrt-general','4.6','一般奇素数模平方根的迭代法'),('sqrt-odd-power','4.6','奇素数幂模的平方根与提升'),('sqrt-two','4.6','2 的幂模平方根'),('sqrt-composite','4.6','合数模的全部平方根与解数'),('sum-squares','4.7','x²+y²=p 与下降法'),
('8-intro','8.0','抽象代数导学与课件编号'),('binary','8.1','二元代数运算与封闭性'),('laws','8.1','运算律、单位元、零元与幂等元'),('semigroup','8.1','半群与含幺半群'),('group','8.1','群、Abel 群与典型例子'),('group-props','8.1','单位元、逆元、消去与方程'),('group-tests','8.1','群的三类判定方法'),('group-examples','8.1','新运算、模加法与商集合例题'),('group-power','8.1','群中幂运算与乘积逆元'),('permutation','8.1','置换、复合与对称群'),('cycles','8.1','轮换、不相交轮换与计算'),('cycle-decomp','8.1','不相交轮换分解与置换周期'),('parity','8.1','对换、奇偶性与交错群'),('group-table','8.1','群的运算表与拉丁方性质'),('subgroup','8.1','子群、平凡子群与中心化子'),('subgroup-tests','8.1','子群判别、交与集合乘积'),('generated','8.1','由一个元素生成的子群'),('cyclic','8.1','循环群与生成元'),('order','8.1','元素的周期及其性质'),('generators','8.1','循环群生成元与同构'),('cyclic-subgroup','8.1','循环群的子群仍是循环群'),
('cosets','8.2','合同关系、陪集与陪集性质'),('normal','8.2','正规子群与左右陪集'),('lagrange','8.2','Lagrange 定理及素数阶群'),('cyclic-subgroups','8.2','循环群的所有子群'),('small-groups','8.2','四元群、六元群与元素周期'),('order-criterion','8.2','用素因数判定元素的周期')]

# Boundaries refer to the local PDF page sequence, including every animation frame.
# Cross-chapter material is assigned by the heading on the slide, not the PDF folder.
RANGES = {
'lesson-33847191':[(1,'1-intro'),(10,'div'),(79,'division'),(122,'remainder'),(192,'prime'),(239,'prime-form'),(265,'base'),(321,'gcd'),(410,'euclid'),(456,'bezout'),(475,'extended'),(595,'gcd-props'),(661,'multi-gcd'),(672,'power-gcd')],
'lesson-33907436':[(1,'1-intro'),(3,'gcd'),(92,'euclid'),(138,'bezout'),(157,'extended'),(277,'gcd-props'),(343,'multi-gcd'),(354,'power-gcd'),(371,'euclid-lemma'),(398,'lcm'),(476,'factor'),(495,'fta'),(526,'factor-app'),(582,'prime-dist'),(596,'congruence'),(654,'congruence-test'),(755,'congruence-props')],
'lesson-34019852':[(1,'1-intro'),(3,'gcd'),(92,'euclid'),(138,'bezout'),(157,'extended'),(277,'gcd-props'),(343,'multi-gcd'),(354,'power-gcd'),(372,'congruence'),(429,'congruence-test'),(530,'congruence-props'),(644,'classes'),(696,'complete'),(728,'multi-residue')],
'lesson-34093915':[(1,'2-intro'),(4,'classes'),(56,'complete'),(88,'multi-residue'),(129,'phi'),(163,'reduced'),(291,'phi-props'),(363,'euler'),(438,'fermat'),(465,'wilson')],
'lesson-34268933':[(1,'2-intro'),(4,'euler'),(79,'fermat'),(106,'wilson'),(157,'fast-power'),(286,'equation'),(327,'linear'),(443,'crt-story'),(474,'crt-two'),(545,'crt-general'),(638,'crt-iterate'),(681,'crt-opt'),(719,'crt-traverse')],
'lesson-34580288':[(1,'3-intro'),(4,'root-count'),(41,'hensel'),(202,'poly-div'),(242,'poly-reduce'),(330,'poly-factor'),(428,'poly-count')],
'lesson-34607112':[(1,'3-intro'),(4,'poly-div'),(44,'poly-reduce'),(134,'poly-factor'),(232,'poly-count')],
'section2':[(1,'3-intro'),(4,'crt-story'),(35,'crt-two'),(106,'crt-general'),(199,'crt-iterate'),(242,'crt-opt'),(280,'crt-traverse')],
'section3':[(1,'3-intro'),(4,'root-count'),(41,'hensel')],
'lesson-34677074':[(1,'4-intro'),(4,'quadratic'),(48,'qr-def'),(74,'qr-euler'),(159,'legendre'),(238,'gauss'),(254,'reciprocity'),(303,'reciprocity-app')],
'lesson-34767597':[(1,'qr-def'),(4,'jacobi'),(126,'legendre'),(205,'gauss'),(221,'reciprocity'),(270,'reciprocity-app'),(346,'sqrt-special'),(393,'sqrt-general'),(637,'sqrt-odd-power'),(663,'sqrt-two'),(748,'sqrt-composite'),(766,'sum-squares')],
'lesson-34927552':[(1,'4-intro'),(4,'sqrt-special'),(51,'sqrt-general'),(295,'sqrt-odd-power'),(321,'sqrt-two'),(406,'sqrt-composite'),(424,'sum-squares'),(460,'binary'),(509,'laws'),(547,'semigroup'),(554,'group'),(599,'group-props'),(629,'group-tests'),(674,'group-examples'),(731,'group-power')],
'lesson-35006615':[(1,'8-intro'),(13,'binary'),(62,'laws'),(100,'semigroup'),(107,'group'),(152,'group-props'),(182,'group-tests'),(227,'group-examples'),(284,'group-power')],
'lesson-35159940':[(1,'8-intro'),(13,'binary'),(62,'laws'),(100,'semigroup'),(107,'group'),(152,'group-props'),(182,'group-tests'),(227,'group-examples'),(284,'group-power'),(311,'permutation'),(342,'cycles'),(435,'cycle-decomp')],
'lesson-35239721':[(1,'permutation'),(32,'cycles'),(125,'cycle-decomp'),(189,'parity'),(287,'group-table')],
'lesson-35387870':[(1,'parity'),(94,'cycle-decomp'),(100,'group-table'),(108,'subgroup'),(151,'subgroup-tests'),(228,'generated'),(243,'cyclic'),(264,'order'),(374,'generators'),(408,'cyclic-subgroup')],
'chapter8-4':[(1,'subgroup'),(45,'subgroup-tests'),(122,'generated'),(137,'cyclic'),(158,'order'),(243,'generators'),(302,'cyclic-subgroup'),(321,'cosets'),(484,'normal'),(510,'lagrange'),(549,'cyclic-subgroups'),(585,'small-groups'),(619,'order-criterion')]
}
