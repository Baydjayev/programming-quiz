const questions = [
  {
    question: "Python dasturlash tilida print() nima vazifani bajaradi?",
    options: ["Matn chiqaradi", "Sonlarni qo‘shadi", "Fayl ochadi", "Funksiya yaratadi"],
    answer: "Matn chiqaradi"
  },
  {
    question: "HTML ning to‘liq nomi nima?",
    options: ["HyperText Markup Language", "HighText Markup Language", "HyperText Markdown Language", "HyperTool Markup Language"],
    answer: "HyperText Markup Language"
  },
  {
    question: "JavaScript qanday turdagi til hisoblanadi?",
    options: ["Interpreted", "Compiled", "Markup", "Style"],
    answer: "Interpreted"
  }
];

const startBtn = document.getElementById('start-btn');
const quizDiv = document.getElementById('quiz');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const timerDiv = document.getElementById('timer');

let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft = 15; // 15 soniya har savol

startBtn.addEventListener('click', startQuiz);

function startQuiz() {
  startBtn.style.display = 'none';
  progressContainer.style.display = 'block';
  showQuestion();
  startTimer();
}

function startTimer() {
  timeLeft = 15;
  timerDiv.textContent = `Vaqt: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = `Vaqt: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

function showQuestion() {
  quizDiv.innerHTML = `<h2>${questions[currentQuestion].question}</h2>`;
  questions[currentQuestion].options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.addEventListener('click', checkAnswer);
    quizDiv.appendChild(btn);
  });
}

function checkAnswer(e) {
  clearInterval(timer);
  const selected = e.target.textContent;
  const buttons = quizDiv.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);

  if (selected === questions[currentQuestion].answer) {
    score++;
    e.target.classList.add('correct');
  } else {
    e.target.classList.add('wrong');
    // To‘g‘ri javobni ko‘rsatish
    buttons.forEach(btn => {
      if (btn.textContent === questions[currentQuestion].answer) btn.classList.add('correct');
    });
  }

  setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
  currentQuestion++;
  updateProgress();
  if (currentQuestion < questions.length) {
    showQuestion();
    startTimer();
  } else {
    showScore();
  }
}

function updateProgress() {
  const percent = ((currentQuestion) / questions.length) * 100;
  progressBar.style.width = percent + "%";
}

function showScore() {
  quizDiv.innerHTML = `<h2>Quiz tugadi! Siz ${score} / ${questions.length} to‘g‘ri javob berdingiz.</h2>
                       <button onclick="location.reload()">Qayta urinish</button>`;
  progressBar.style.width = "100%";
  timerDiv.textContent = "";
}
