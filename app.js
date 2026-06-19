let learnedWords = JSON.parse(localStorage.getItem('learnedWords')) || [];
let currentCardIndex = 0;
let currentQuizWord = null;
let quizCount = 1;
const totalQuizQuestions = 10;

const navButtons = document.querySelectorAll('.nav-btn');
const tabs = document.querySelectorAll('.tab-content');

// Точка входу: чекаємо завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFlashcards();
    initQuiz();
    renderDictionary();
});

// Надійна навігація через делегування подій
function initNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navMenu) {
        console.error("Блок навігації не знайдено!");
        return;
    }

    navMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-btn');
        if (!btn) return; 

        // Перемикаємо класи кнопок
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');

        // Показуємо відповідну вкладку
        const targetTabId = `${btn.dataset.tab}-tab`;
        const targetTab = document.getElementById(targetTabId);
        
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Перерендер словника при відкритті вкладки
        if (btn.dataset.tab === 'dictionary') {
            renderDictionary();
        }
    });
}

// Модуль карток
function initFlashcards() {
    const card = document.getElementById('flashcard');
    if (card) {
        card.onclick = () => card.classList.toggle('flipped');
    }

    const btnLearned = document.getElementById('btn-learned');
    const btnNotLearned = document.getElementById('btn-not-learned');

    if (btnLearned) {
        btnLearned.onclick = () => {
            const word = wordsDatabase[currentCardIndex];
            if (word && !learnedWords.includes(word.id)) {
                learnedWords.push(word.id);
                saveProgress();
            }
            nextCard();
        };
    }

    if (btnNotLearned) {
        btnNotLearned.onclick = () => nextCard();
    }

    showCard(currentCardIndex);
}

function showCard(index) {
    const card = document.getElementById('flashcard');
    if (!card || !wordsDatabase || wordsDatabase.length === 0) return;
    
    card.classList.remove('flipped');

    if (index >= wordsDatabase.length) {
        currentCardIndex = 0;
        index = 0;
    }

    const word = wordsDatabase[index];
    if (word) {
        document.getElementById('card-cat').innerText = word.category;
        document.getElementById('card-eng').innerText = word.eng;
        document.getElementById('card-trans').innerText = word.trans;
        document.getElementById('card-ukr').innerText = word.ukr;
    }
}

function nextCard() {
    currentCardIndex++;
    setTimeout(() => { showCard(currentCardIndex); }, 200);
}

// Модуль тестування
function initQuiz() {
    generateQuizQuestion();
    const nextQuizBtn = document.getElementById('btn-next-quiz');
    if (nextQuizBtn) {
        nextQuizBtn.onclick = () => {
            if (quizCount >= totalQuizQuestions) {
                quizCount = 0;
                alert('Ви пройшли тест від школи Liberty!');
            }
            quizCount++;
            generateQuizQuestion();
        };
    }
}

function generateQuizQuestion() {
    const feedback = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('btn-next-quiz');
    const quizCountEl = document.getElementById('quiz-count');
    const quizQuestionEl = document.getElementById('quiz-question');
    const optionsContainer = document.getElementById('quiz-options');

    if (!feedback || !nextBtn || !optionsContainer || !wordsDatabase || wordsDatabase.length === 0) return;

    feedback.classList.add('hidden');
    nextBtn.classList.add('hidden');
    quizCountEl.innerText = `Питання: ${quizCount}/${totalQuizQuestions}`;

    const randomIndex = Math.floor(Math.random() * wordsDatabase.length);
    currentQuizWord = wordsDatabase[randomIndex];
    quizQuestionEl.innerText = `Оберіть точний переклад для слова: "${currentQuizWord.eng}"`;

    let options = [currentQuizWord.ukr];
    while (options.length < 4 && options.length < wordsDatabase.length) {
        const rIndex = Math.floor(Math.random() * wordsDatabase.length);
        const wrongTranslation = wordsDatabase[rIndex].ukr;
        if (!options.includes(wrongTranslation)) options.push(wrongTranslation);
    }

    options.sort(() => Math.random() - 0.5);
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.addEventListener('click', () => handleQuizAnswer(btn, option));
        optionsContainer.appendChild(btn);
    });
}

function handleQuizAnswer(selectedBtn, selectedOption) {
    const allBtns = document.querySelectorAll('.option-btn');
    const feedback = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('btn-next-quiz');

    allBtns.forEach(btn => btn.disabled = true);

    if (selectedOption === currentQuizWord.ukr) {
        selectedBtn.classList.add('correct');
        feedback.innerText = "🎉 Чудово! Правильна відповідь.";
        feedback.className = "quiz-feedback success";
        
        if (!learnedWords.includes(currentQuizWord.id)) {
            learnedWords.push(currentQuizWord.id);
            saveProgress();
        }
    } else {
        selectedBtn.classList.add('wrong');
        feedback.innerText = `😢 Не зовсім. Вірна відповідь: ${currentQuizWord.ukr}`;
        feedback.className = "quiz-feedback danger";

        allBtns.forEach(btn => {
            if (btn.innerText === currentQuizWord.ukr) btn.classList.add('correct');
        });
    }

    feedback.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
}

// Модуль таблиці-словника
function renderDictionary() {
    const tbody = document.getElementById('dict-tbody');
    const searchInput = document.getElementById('dict-search');
    if (!tbody || !searchInput || !wordsDatabase || wordsDatabase.length === 0) return;

    const searchVal = searchInput.value.toLowerCase();
    tbody.innerHTML = '';

    const filteredWords = wordsDatabase.filter(word => 
        word.eng.toLowerCase().includes(searchVal) || word.ukr.toLowerCase().includes(searchVal)
    );

    filteredWords.forEach(word => {
        const isLearned = learnedWords.includes(word.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${word.eng}</strong></td>
            <td class="transcription">${word.trans}</td>
            <td>${word.ukr}</td>
            <td>${word.category}</td>
            <td><span class="status-badge ${isLearned ? 'learned' : 'learning'}">${isLearned ? 'Вивчено' : 'В процесі'}</span></td>
        `;
        tbody.appendChild(tr);
    });

    const totalWords = wordsDatabase.length;
    const learnedCount = learnedWords.filter(id => wordsDatabase.some(w => w.id === id)).length;
    
    document.getElementById('prog-text').innerText = `${learnedCount}/${totalWords}`;
    document.getElementById('prog-fill').style.width = `${totalWords > 0 ? (learnedCount / totalWords) * 100 : 0}%`;

    if (!searchInput.dataset.listened) {
        searchInput.addEventListener('input', renderDictionary);
        searchInput.dataset.listened = "true";
    }
}

function saveProgress() {
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
}