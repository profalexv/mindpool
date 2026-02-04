const socket = io("https://mindpool-backend.onrender.com", {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
const sessionCode = new URLSearchParams(window.location.search).get('session');
let currentQuestionId = null;
let currentTimer = null;
const audienceTimerEl = document.getElementById('audience-timer');

if (sessionCode) {
    socket.emit('joinAudienceSession', { sessionCode });
} else {
    const questionTitle = document.getElementById('question-title');
    if (questionTitle) {
        questionTitle.innerText = "Erro: Código da sessão não encontrado na URL.";
    }
}

socket.on('newQuestion', (question) => {
    // Para e limpa qualquer cronômetro anterior
    if (currentTimer) {
        currentTimer.stop();
        currentTimer = null;
    }
    if (audienceTimerEl) audienceTimerEl.style.display = 'none';

    currentQuestionId = question.id;
    const questionTitle = document.getElementById('question-title');
    if (questionTitle) questionTitle.innerText = question.text;
    
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';

    switch (question.questionType) {
        case 'options':
            question.options.forEach(opt => {
                optionsContainer.innerHTML += `<button onclick="submitAnswer('${opt.id}')">${opt.text}</button>`;
            });
            break;
        case 'yes_no':
            optionsContainer.innerHTML = `
                <button onclick="submitAnswer('yes')">Sim</button>
                <button onclick="submitAnswer('no')">Não</button>
            `;
            break;
        default: // number, integer, short_text, long_text
            let inputHtml = '';
            if (question.questionType === 'number') {
                inputHtml = `<input type="number" id="text-answer" placeholder="Digite um número">`;
            } else if (question.questionType === 'integer') {
                inputHtml = `<input type="number" step="1" id="text-answer" placeholder="Digite um número inteiro">`;
            } else { // short_text or long_text
                const limit = question.charLimit || 280;
                inputHtml = `<input type="text" id="text-answer" maxlength="${limit}" placeholder="Sua resposta (max ${limit} caracteres)">`;
            }
            optionsContainer.innerHTML = `
                ${inputHtml}
                <button id="submit-text-answer">Enviar</button>
            `;
            document.getElementById('submit-text-answer')?.addEventListener('click', () => {
                const answerInput = document.getElementById('text-answer');
                const answer = answerInput ? answerInput.value : '';
                if (answer && answer.trim()) {
                    submitAnswer(answer);
                }
            });
            break;
    }
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.innerText = '';

    // Inicia um novo cronômetro se a pergunta tiver um e for para exibir
    if (question.endTime && question.timer?.showToAudience) {
        if (audienceTimerEl) {
            audienceTimerEl.style.display = 'block';
            currentTimer = new Cronometro(question.endTime, audienceTimerEl, () => {
                // Quando o tempo acaba, bloqueia as respostas
                const optionsContainer = document.getElementById('options-container');
                if (optionsContainer) {
                    optionsContainer.innerHTML = '<p>Tempo esgotado!</p>';
                }
            });
            currentTimer.start();
        }
    }
});

function submitAnswer(answer) {
    if (currentQuestionId === null) return;
    if (currentTimer) {
        currentTimer.stop(); // Para o cronômetro do usuário ao responder
    }
    socket.emit('submitAnswer', { sessionCode, questionId: currentQuestionId, answer });
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.innerText = 'Sua resposta foi enviada! Obrigado.';
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) optionsContainer.innerHTML = ''; // Limpa a área de resposta
}

socket.on('sessionEnded', (message) => {
    alert(message);
    window.location.href = '/';
});

socket.on('votingEnded', ({ questionId }) => {
    if (currentQuestionId === questionId) {
        const optionsContainer = document.getElementById('options-container');
        if (optionsContainer) {
            optionsContainer.innerHTML = '<p>Votação encerrada pelo apresentador.</p>';
        }
    }
});