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
let currentQuestion = 0;
let score = 0;

startBtn.addEventListener('click', startQuiz);

function startQuiz() {
  startBtn.style.display = 'none';
  showQuestion();
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
  const selected = e.target.textContent;
  if (selected === questions[currentQuestion].answer) {
    score++;
    alert("To'g'ri ✅");
  } else {
    alert("Noto'g'ri ❌");
  }
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showScore();
  }
}

function showScore() {
  quizDiv.innerHTML = `<h2>Quiz tugadi! Siz ${score} / ${questions.length} to‘g‘ri javob berdingiz.</h2>
                       <button onclick="location.reload()">Qayta urinish</button>`;
}
