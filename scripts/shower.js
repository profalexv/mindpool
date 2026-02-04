const socket = io("https://mindpool-backend.onrender.com", {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
const sessionCode = new URLSearchParams(window.location.search).get('session');

const sessionCodeDisplay = document.getElementById('session-code');
if (sessionCodeDisplay) sessionCodeDisplay.innerText = sessionCode;

let sessionDeadline = null;

// Entra na sala da sessão
socket.emit('joinAdminSession', { sessionCode, role: 'controller' }, (response) => {
    if (!response.success) {
        alert(response.message);
        window.location.href = `/pages/admin.html?role=controller`;
        return;
    }
    sessionDeadline = response.deadline;

    // Exibe os códigos de acesso se eles forem fornecidos na resposta
    if (response.presenterPassword && response.showerPassword) {
        const presenterPassEl = document.getElementById('presenter-password');
        const showerPassEl = document.getElementById('shower-password');
        const accessCodesEl = document.querySelector('.access-codes');

        if (presenterPassEl) presenterPassEl.innerText = response.presenterPassword;
        if (showerPassEl) showerPassEl.innerText = response.showerPassword;
        if (accessCodesEl) accessCodesEl.style.display = 'block';
    }

    if (sessionDeadline) {
        const deadlineAlertEl = document.createElement('div');
        deadlineAlertEl.id = 'deadline-alert';
        deadlineAlertEl.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: #d9534f; color: white; padding: 10px; text-align: center; font-weight: bold; display: none; z-index: 1000;';
        deadlineAlertEl.innerText = 'TEMPO ESGOTADO';
        document.body.insertBefore(deadlineAlertEl, document.body.firstChild);

        setInterval(() => {
            if (Date.now() > sessionDeadline) {
                deadlineAlertEl.style.display = 'block';
            }
        }, 5000);
    }
});

const questionTypeSelect = document.getElementById('question-type');
const optionsConfig = document.getElementById('options-config');
const textConfig = document.getElementById('text-config');
const timerEnabledCheckbox = document.getElementById('timer-enabled');
const timerOptionsDiv = document.getElementById('timer-options');

timerEnabledCheckbox?.addEventListener('change', (e) => {
    if (timerOptionsDiv) {
        timerOptionsDiv.style.display = e.target.checked ? 'block' : 'none';
    }
});

questionTypeSelect?.addEventListener('change', (e) => {
    const type = e.target.value;
    if (optionsConfig) optionsConfig.style.display = type === 'options' ? 'block' : 'none';
    if (textConfig) textConfig.style.display = ['short_text', 'long_text'].includes(type) ? 'block' : 'none';
});

const createBtn = document.getElementById('create-question-btn');
createBtn?.addEventListener('click', () => {
    const questionTextInput = document.getElementById('question-text');
    const imageUrlInput = document.getElementById('question-image');
    const optionsTextInput = document.getElementById('question-options');
    const charLimitInput = document.getElementById('char-limit');

    const questionText = questionTextInput.value;
    const imageUrl = imageUrlInput.value;
    const questionType = questionTypeSelect.value;

    if (!questionText) {
        alert('O texto da pergunta é obrigatório.');
        return;
    }

    const question = {
        text: questionText,
        imageUrl: imageUrl || null,
        questionType: questionType,
        options: null,
        charLimit: null,
        timer: null
    };

    if (questionType === 'options') {
        const optionsText = optionsTextInput.value;
        if (!optionsText) return alert('As opções são obrigatórias para este tipo de pergunta.');
        question.options = optionsText.split(',').map((opt, index) => ({ id: `opt${index}`, text: opt.trim() }));
    } else if (['short_text', 'long_text'].includes(questionType)) {
        question.charLimit = parseInt(charLimitInput.value) || (questionType === 'short_text' ? 50 : 280);
    }

    if (timerEnabledCheckbox.checked) {
        const durationInMinutes = parseInt(document.getElementById('timer-duration').value);
        if (durationInMinutes > 0) {
            question.timer = {
                duration: durationInMinutes * 60, // Convert to seconds
                showToAudience: document.getElementById('timer-show-audience').checked
            };
        }
    }

    socket.emit('createQuestion', { sessionCode, question });

    // Limpa os campos
    questionTextInput.value = '';
    optionsTextInput.value = '';
    imageUrlInput.value = '';
    charLimitInput.value = '';
    timerEnabledCheckbox.checked = false;
    document.getElementById('timer-duration').value = '';
    document.getElementById('timer-show-audience').checked = false;
    timerOptionsDiv.style.display = 'none';
});

socket.on('questionsUpdated', (questions) => {
    const container = document.getElementById('questions-container');
    if (!container) return;
    container.innerHTML = '';
    questions.forEach(q => {
        let isWarning = false;
        if (sessionDeadline && q.timer && q.timer.duration) {
            const predictedEndTime = Date.now() + (q.timer.duration * 1000);
            if (predictedEndTime > sessionDeadline) {
                isWarning = true;
            }
        }

        const div = document.createElement('div');
        div.className = `question-item ${isWarning ? 'warning' : ''}`;
        div.id = `question-item-${q.id}`;
        div.innerHTML = `
            <p><strong>${q.text}</strong></p>
            <div id="question-controls-${q.id}">
                <button onclick="startQuestion(${q.id})">Iniciar Pergunta</button>
            </div>
        `;
        container.appendChild(div);
    });
});

function startQuestion(questionId) {
    socket.emit('startQuestion', { sessionCode, questionId });
}

function stopVoting(questionId) {
    socket.emit('stopVoting', { sessionCode, questionId });
}

socket.on('newQuestion', (question) => {
    // Reseta os controles de todas as outras perguntas
    document.querySelectorAll('.question-item [id^="question-controls-"]').forEach(controls => {
        const id = controls.id.split('-')[2];
        controls.innerHTML = `<button onclick="startQuestion(${id})">Iniciar Pergunta</button>`;
    });

    // Define o controle da pergunta ativa
    const activeControls = document.getElementById(`question-controls-${question.id}`);
    if (activeControls) {
        activeControls.innerHTML = `<button onclick="stopVoting(${question.id})" style="background-color: #f0ad4e;">Parar Respostas</button>`;
    }
});

socket.on('votingEnded', ({ questionId }) => {
    const controls = document.getElementById(`question-controls-${questionId}`);
    if (controls) {
        controls.innerHTML = `<p style="color: green;">Votação encerrada.</p>`;
    }
});

document.getElementById('end-session-btn')?.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja encerrar esta sessão para todos os participantes?')) {
        socket.emit('endSession', { sessionCode });
    }
});

socket.on('sessionEnded', (message) => {
    alert(message);
    window.location.href = '/';
});