/*****  UTILITIES  *****/
const $ = (sel) => document.querySelector(sel);
const startBtn = $('#start-btn');
const quizDiv = $('#quiz');
const progressContainer = $('#progress-container');
const progressBar = $('#progress-bar');
const timerDiv = $('#timer');
const scoreDiv = $('#score');
const streakDiv = $('#streak');
const modeSel = $('#mode');
const diffSel = $('#difficulty');
const customWrap = $('#custom-wrap');
const customCountInput = $('#custom-count');

let currentQ = 0;
let score = 0;
let streak = 0;
let timer = null;
let timeLeft = 15;

let usedHashes = new Set();   // ketma-ket takrorni oldini olish
let sessionLimit = Infinity;  // infinite by default
let sessionCount = 0;

const RNG = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
const shuffle = (a)=> a.sort(()=>Math.random()-.5);
const pick = (arr)=> arr[Math.floor(Math.random()*arr.length)];
const hashObj = (o)=> JSON.stringify(o);

/*****  UI MODE + DIFFICULTY  *****/
modeSel.addEventListener('change', ()=>{
  customWrap.style.display = modeSel.value==='custom' ? 'flex' : 'none';
});
diffSel.addEventListener('change', ()=>{ /* hook here if needed */ });

/*****  STATIC POOL (SEED)  *****/
/* Siz xohlagancha ko‘paytirishingiz mumkin (200+, 1000+…) — questions.json ichida davom ettiring */
let staticPool = []; // fetch orqali yuklanadi

async function loadStaticPool(){
  try{
    const res = await fetch('questions.json', {cache:'no-store'});
    if(!res.ok) throw new Error('questions.json topilmadi');
    staticPool = await res.json();
  }catch(e){
    staticPool = []; // fallback: faqat generator ishlaydi
  }
}

/*****  QUESTION GENERATORS (Cheksiz)  *****/
/* Murakkablik bo‘yicha aralash: oson/orta/qiyin tematik generatorlar */
function genArithmetic(){
  // arifmetik ifoda va natija
  const a=RNG(1,20), b=RNG(1,20);
  const ops = ['+','-','*','//','%'];
  const op = pick(ops);
  let correct;
  switch(op){
    case '+': correct = a + b; break;
    case '-': correct = a - b; break;
    case '*': correct = a * b; break;
    case '//': correct = Math.floor(a / b); break;
    case '%': correct = a % b; break;
  }
  const q = `Python: ${a} ${op} ${b} ifodasining natijasi?`;
  const opts = shuffle([correct, correct+1, correct-1, correct+2]).map(String);
  return {question:q, options:opts, answer:String(correct)};
}

function genLenString(){
  // len() va slicing
  const words = ['python','developer','function','variable','dictionary','iteration','comprehension','framework','package','argument'];
  const s = pick(words);
  const mode = pick(['len','slice']);
  if(mode==='len'){
    const q = `Python: len("${s}") qiymati?`;
    const correct = s.length;
    const opts = shuffle([correct, correct-1, correct+1, correct+2]).map(String);
    return {question:q, options:opts, answer:String(correct)};
  }else{
    const i = RNG(0, Math.max(0, s.length-2));
    const j = RNG(i+1, s.length);
    const q = `Python: "${s}"[${i}:${j}] natijasi?`;
    const correct = s.slice(i,j);
    // noto‘g‘ri variantlar
    const wrong1 = s.slice(i, Math.min(j+1,s.length));
    const wrong2 = s.slice(Math.max(0,i-1), j);
    const wrong3 = s;
    const opts = shuffle([correct, wrong1, wrong2, wrong3]);
    return {question:q, options:opts, answer:correct};
  }
}

function genListOps(){
  const base = [RNG(1,5), RNG(6,10), RNG(11,15)];
  const mode = pick(['append', 'pop', 'extend']);
  let question, correct, wrongs=[];
  if(mode==='append'){
    const x = RNG(2,20);
    question = `Python: lst=${JSON.stringify(base)}; lst.append(${x}); lst[-1] qiymati?`;
    correct = String(x);
    wrongs = [String(x-1), String(base[base.length-1]), String(base.length)];
  }else if(mode==='pop'){
    question = `Python: lst=${JSON.stringify(base)}; v=lst.pop(); v qiymati?`;
    correct = String(base[base.length-1]);
    wrongs = [String(base[0]), String(base[1]), String(base.length)];
  }else{
    const ext = [RNG(16,20), RNG(21,25)];
    question = `Python: lst=${JSON.stringify(base)}; lst.extend(${JSON.stringify(ext)}); len(lst) ?`;
    correct = String(base.length + ext.length);
    wrongs = [String(base.length), String(ext.length), String(base.length + ext.length + 1)];
  }
  return {question, options: shuffle([correct,...wrongs]), answer: correct};
}

function genDictOps(){
  const d = {a:RNG(1,5), b:RNG(6,10)};
  const mode = pick(['get','in','keys']);
  if(mode==='get'){
    const k = pick(['a','b','c']);
    const q = `Python: d=${JSON.stringify(d)}; d.get("${k}", 0) qiymati?`;
    const correct = String(d[k] ?? 0);
    const wrongs = [String((d[k] ?? 0)+1), String((d[k] ?? 0)-1), String(Object.keys(d).length)];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }else if(mode==='in'){
    const k = pick(['a','b','c','d']);
    const q = `Python: d=${JSON.stringify(d)}; "${k}" in d natijasi?`;
    const correct = (k in d) ? 'True' : 'False';
    const wrongs = [correct==='True'?'False':'True','None','0'];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }else{
    const q = `Python: d=${JSON.stringify(d)}; len(d.keys()) qiymati?`;
    const correct = String(Object.keys(d).length);
    const wrongs = [String(+correct+1), String(+correct-1), '0'];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }
}

function genBoolLogic(){
  const a = Math.random()<.5, b = Math.random()<.5;
  const op = pick(['and','or']);
  const expr = `${a} ${op} ${b}`;
  let correct;
  if(op==='and') correct = (a && b);
  else correct = (a || b);
  const q = `Python: ${expr} natijasi?`;
  const correctS = correct ? 'True' : 'False';
  const wrongs = [correctS==='True'?'False':'True','None','0'];
  return {question:q, options:shuffle([correctS,...wrongs]), answer:correctS};
}

function genRangeSum(){
  const n = RNG(3,12);
  const q = `Python: sum(range(${n})) qiymati?`;
  const correct = (n-1)*n/2;
  const opts = shuffle([correct, correct+1, correct-1, n]).map(String);
  return {question:q, options:opts, answer:String(correct)};
}

function genJoinSplit(){
  const arr = ['py','dev','pro','code'];
  const k = RNG(2,4);
  const sample = arr.slice(0,k);
  const mode = pick(['join','split']);
  if(mode==='join'){
    const sep = pick(['-','_',' ']);
    const q = `Python: "${sep}".join(${JSON.stringify(sample)}) natijasi?`;
    const correct = sample.join(sep);
    const wrongs = [sample.join(sep+sep), sample.join(''), sample.toString()];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }else{
    const s = sample.join('-');
    const q = `Python: "${s}".split("-") natijasi?`;
    const correct = JSON.stringify(sample);
    const wrongs = [JSON.stringify(sample.reverse()), JSON.stringify([s]), JSON.stringify(sample.slice(1))];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }
}

function genSetOps(){
  const A = new Set([RNG(1,5), RNG(6,10), RNG(11,15)]);
  const B = new Set([RNG(1,5), RNG(6,10), RNG(11,15)]);
  const mode = pick(['len','intersection','issubset']);
  const arrA = [...A], arrB=[...B];
  if(mode==='len'){
    const q = `Python: A=set(${JSON.stringify(arrA)}); len(A) qiymati?`;
    const correct = String(arrA.length);
    const wrongs = [String(arrA.length+1), '0', String(Math.max(0,arrA.length-1))];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }else if(mode==='intersection'){
    const inter = arrA.filter(x=>B.has(x));
    const q = `Python: A=${JSON.stringify(arrA)}; B=${JSON.stringify(arrB)}; len(set(A)&set(B))?`;
    const correct = String(inter.length);
    const wrongs = [String(Math.max(0,inter.length-1)), String(inter.length+1), '0'];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }else{
    const q = `Python: set(${JSON.stringify(arrA)}).issubset(${JSON.stringify(arrB)}) natijasi?`;
    const subset = arrA.every(x=>B.has(x));
    const correct = subset?'True':'False';
    const wrongs = [correct==='True'?'False':'True','None','0'];
    return {question:q, options:shuffle([correct,...wrongs]), answer:correct};
  }
}

/* Generatorlar ro‘yxati (murakkablikka qarab tanlaymiz) */
const GEN_POOL = {
  easy:   [genArithmetic, genLenString, genBoolLogic],
  medium: [genListOps, genDictOps, genRangeSum, genJoinSplit],
  hard:   [genSetOps, genRangeSum, genDictOps, genJoinSplit, genLenString],
  mixed:  [] // to‘ldiramiz quyida
};
GEN_POOL.mixed = [...GEN_POOL.easy, ...GEN_POOL.medium, ...GEN_POOL.hard];

/*****  QUESTION SOURCE (STATIC + GENERATED)  *****/
function makeGeneratedQuestion(){
  const diff = diffSel.value || 'mixed';
  const pool = GEN_POOL[diff] ?? GEN_POOL.mixed;
  const gen = pick(pool);
  let q = gen();
  // ketma-ket takrorni oldini olish
  let h = hashObj(q);
  let guard = 0;
  while(usedHashes.has(h) && guard < 20){
    q = gen(); h = hashObj(q); guard++;
  }
  usedHashes.add(h);
  if(usedHashes.size > 500) { // to‘planib ketmasin
    usedHashes = new Set([...usedHashes].slice(-250));
  }
  return q;
}

function makeStaticQuestion(){
  if(staticPool.length===0) return null;
  const q = pick(staticPool);
  // variantlarni shuffle qilamiz (javobni saqlab)
  const opts = shuffle([...q.options]);
  return {question:q.question, options:opts, answer:q.answer};
}

/*****  QUIZ FLOW  *****/
startBtn.addEventListener('click', startQuiz);

async function startQuiz(){
  startBtn.style.display = 'none';
  progressContainer.style.display = 'block';
  await loadStaticPool();

  // rejim sozlash
  if(modeSel.value==='session'){
    sessionLimit = 20;
  }else if(modeSel.value==='custom'){
    sessionLimit = Math.max(5, Math.min(200, Number(customCountInput.value)||20));
  }else{
    sessionLimit = Infinity; // cheksiz
  }

  currentQ = 0;
  sessionCount = 0;
  score = 0;
  streak = 0;
  usedHashes.clear();

  nextQuestion(true);
}

function startTimer(){
  timeLeft = 15;
  timerDiv.textContent = `Vaqt: ${timeLeft}s`;
  timer = setInterval(()=>{
    timeLeft--;
    timerDiv.textContent = `Vaqt: ${timeLeft}s`;
    if(timeLeft<=0){
      clearInterval(timer);
      lockOptions();
      revealAndContinue();
    }
  },1000);
}

function renderQuestion(q){
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;
  q.options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.addEventListener('click', (e)=>checkAnswer(e, q));
    quizDiv.appendChild(btn);
  });
}

function checkAnswer(e, q){
  clearInterval(timer);
  const selected = e.target.textContent;
  const buttons = quizDiv.querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);

  if(selected === q.answer){
    e.target.classList.add('correct');
    score++; streak++;
  }else{
    e.target.classList.add('wrong');
    streak = 0;
    // to‘g‘ri javobni ko‘rsatish
    buttons.forEach(b=>{ if(b.textContent===q.answer) b.classList.add('correct'); });
  }

  updateHUD();
  setTimeout(()=> nextQuestion(false), 1000);
}

function lockOptions(){
  const buttons = quizDiv.querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);
}

function revealAndContinue(){
  const ans = quizDiv.querySelectorAll('button');
  // avtomatik to‘g‘ri javobni topib bo‘yab qo‘yish
  // (faqat timer tugasa; q aniqlash uchun button textdan foydalanamiz)
  // bu yerda topilmasa shunchaki davom etamiz
  setTimeout(()=> nextQuestion(false), 800);
}

function updateHUD(){
  scoreDiv.textContent = `Ball: ${score}`;
  streakDiv.textContent = `Streak: ${streak}`;

  if(sessionLimit === Infinity){
    // cheksiz — progress bar foiz ko‘rsatmaydi, lekin "dinamik" urinishlar bo‘yicha
    const ratio = Math.min(100, Math.round((score/(sessionCount||1))*100));
    progressBar.style.width = ratio + '%';
  }else{
    const pct = Math.min(100, Math.round((currentQ/sessionLimit)*100));
    progressBar.style.width = pct + '%';
  }
}

function nextQuestion(first=false){
  if(!first) currentQ++;
  if(sessionLimit !== Infinity && currentQ > 0 && currentQ >= sessionLimit){
    // sessiya tugadi
    showFinal();
    return;
  }

  // keyingi savol: ba’zida statikdan, ba’zida generator
  // staticPool bo‘lsa 40% ulush bilan, generatordan 60%
  let q = null;
  if(staticPool.length>0 && Math.random()<0.4){
    q = makeStaticQuestion();
  }
  if(!q) q = makeGeneratedQuestion();

  // variantlarni butunlay aralashtirib, UI ga chiqaramiz
  q.options = shuffle(q.options);
  renderQuestion(q);

  sessionCount++;
  updateHUD();
  startTimer();
}

function showFinal(){
  clearInterval(timer);
  const total = sessionLimit === Infinity ? sessionCount : sessionLimit;
  const percent = Math.round((score/(total||1))*100);
  quizDiv.innerHTML = `
    <h2>Sessiya tugadi!</h2>
    <p>Siz ${total} savoldan ${score} tasiga to‘g‘ri javob berdingiz (${percent}%).</p>
    <button onclick="location.reload()">Qayta boshlash</button>
  `;
}

/*****  PARTICLE BACKGROUND  *****/
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); addEventListener('resize', resize);

const particles = Array.from({length:140}).map(()=>({
  x: Math.random()*canvas.width,
  y: Math.random()*canvas.height,
  r: Math.random()*2+0.8,
  dx:(Math.random()-.5)*0.6,
  dy:(Math.random()-.5)*0.6,
  a: Math.random()*0.8+0.2
}));

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${p.a})`;
    ctx.fill();
    p.x+=p.dx; p.y+=p.dy;
    if(p.x<0||p.x>canvas.width) p.dx*=-1;
    if(p.y<0||p.y>canvas.height) p.dy*=-1;
  });
  requestAnimationFrame(animate);
}
animate();
