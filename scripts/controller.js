// --- 1. CONFIGURAÇÃO E INICIALIZAÇÃO ---
// Detecta ambiente (local ou produção) para conectar ao backend correto
const getBackendUrl = () => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDevelopment ? 'http://localhost:3000' : 'https://mindpool-backend.onrender.com';
};

const socket = io(getBackendUrl(), {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});
let sessionDeadline = null;

// --- 2. MÓDULO DE UI ---
// Gerencia todas as interações com o DOM e os event listeners.
const ui = {
    elements: {
        sessionCodeDisplay: document.getElementById('session-code'),
        questionTypeSelect: document.getElementById('question-type'),
        optionsConfig: document.getElementById('options-config'),
        textConfig: document.getElementById('text-config'),
        timerEnabledCheckbox: document.getElementById('timer-enabled'),
        timerOptionsDiv: document.getElementById('timer-options'),
        createBtn: document.getElementById('create-question-btn'),
        openPresenterBtn: document.getElementById('open-presenter-btn'),
        endSessionBtn: document.getElementById('end-session-btn'),
        questionsContainer: document.getElementById('questions-container'),
        sessionThemeSwitcher: document.getElementById('session-theme-switcher'),
        // Inputs do formulário
        questionTextInput: document.getElementById('question-text'),
        imageUrlInput: document.getElementById('question-image'),
        optionsTextInput: document.getElementById('question-options'),
        charLimitInput: document.getElementById('char-limit'),
        timerDurationInput: document.getElementById('timer-duration'),
        timerShowAudienceCheckbox: document.getElementById('timer-show-audience'),
    },

    init(socketHandler) {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        const presenterPassword = sessionStorage.getItem('mindpool_presenter_pass');

        if (this.elements.sessionCodeDisplay) {
            this.elements.sessionCodeDisplay.innerText = sessionCode;
        }

        this.elements.timerEnabledCheckbox?.addEventListener('change', (e) => this.toggleTimerOptions(e.target.checked));
        this.elements.questionTypeSelect?.addEventListener('change', (e) => this.toggleQuestionTypeOptions(e.target.value));

        this.elements.createBtn?.addEventListener('click', () => {
            const questionData = this.getQuestionData();
            if (questionData) {
                socketHandler.createQuestion(questionData);
                this.clearForm();
            }
        });

        if (this.elements.openPresenterBtn) {
            if (presenterPassword) {
                this.elements.openPresenterBtn.addEventListener('click', () => {
                    // Usa localStorage para passar a senha para a nova aba de forma segura
                    localStorage.setItem('mindpool_temp_pass', presenterPassword);
                    window.open(`/pages/presenter.html?session=${sessionCode}`, '_blank');
                });
            } else {
                this.elements.openPresenterBtn.disabled = true;
                this.elements.openPresenterBtn.title = 'Disponível apenas para sessões criadas neste navegador.';
            }
        }

        this.elements.endSessionBtn?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja encerrar esta sessão para todos os participantes?')) {
                socketHandler.endSession();
            }
        });

        this.elements.sessionThemeSwitcher?.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            socketHandler.changeTheme(newTheme);
        });
    },

    getQuestionData() {
        const questionText = this.elements.questionTextInput.value;
        if (!questionText) {
            alert('O texto da pergunta é obrigatório.');
            return null;
        }

        const question = {
            text: questionText,
            imageUrl: this.elements.imageUrlInput.value || null,
            questionType: this.elements.questionTypeSelect.value,
            options: null,
            charLimit: null,
            timer: null
        };

        if (question.questionType === 'options') {
            const optionsText = this.elements.optionsTextInput.value;
            if (!optionsText) {
                alert('As opções são obrigatórias para este tipo de pergunta.');
                return null;
            }
            question.options = optionsText.split(',').map((opt, index) => ({ id: `opt${index}`, text: opt.trim() }));
        } else if (['short_text', 'long_text'].includes(question.questionType)) {
            question.charLimit = parseInt(this.elements.charLimitInput.value) || (question.questionType === 'short_text' ? 50 : 280);
        }

        if (this.elements.timerEnabledCheckbox.checked) {
            const durationInMinutes = parseInt(this.elements.timerDurationInput.value);
            if (durationInMinutes > 0) {
                question.timer = {
                    duration: durationInMinutes * 60, // Converte para segundos
                    showToAudience: this.elements.timerShowAudienceCheckbox.checked
                };
            }
        }
        return question;
    },

    clearForm() {
        this.elements.questionTextInput.value = '';
        this.elements.optionsTextInput.value = '';
        this.elements.imageUrlInput.value = '';
        this.elements.charLimitInput.value = '';
        this.elements.timerEnabledCheckbox.checked = false;
        this.elements.timerDurationInput.value = '';
        this.elements.timerShowAudienceCheckbox.checked = false;
        this.toggleTimerOptions(false);
    },

    toggleTimerOptions: (isEnabled) => ui.elements.timerOptionsDiv && (ui.elements.timerOptionsDiv.style.display = isEnabled ? 'block' : 'none'),

    toggleQuestionTypeOptions(type) {
        if (this.elements.optionsConfig) this.elements.optionsConfig.style.display = type === 'options' ? 'block' : 'none';
        if (this.elements.textConfig) this.elements.textConfig.style.display = ['short_text', 'long_text'].includes(type) ? 'block' : 'none';
    },

    renderQuestions(questions, socketHandler) {
        const container = this.elements.questionsContainer;
        if (!container) return;
        container.innerHTML = '';

        const validQuestions = questions.filter(q => q !== null);
        if (validQuestions.length === 0) {
            container.innerHTML = '<p>Nenhuma pergunta criada ainda.</p>';
            return;
        }

        validQuestions.forEach(q => {
            let isWarning = false;
            if (sessionDeadline && q.timer && q.timer.duration) {
                if ((Date.now() + q.timer.duration * 1000) > sessionDeadline) isWarning = true;
            }

            const div = document.createElement('div');
            div.className = `question-item ${isWarning ? 'warning' : ''}`;
            div.id = `question-item-${q.id}`;
            div.innerHTML = `<p><strong>${q.text}</strong></p><div id="question-controls-${q.id}"></div>`;
            container.appendChild(div);

            const controlsDiv = div.querySelector(`#question-controls-${q.id}`);
            const startBtn = document.createElement('button');
            startBtn.innerText = 'Iniciar Pergunta';
            startBtn.onclick = () => socketHandler.startQuestion(q.id);
            controlsDiv.appendChild(startBtn);
        });
    },

    setActiveQuestion(questionId, socketHandler) {
        document.querySelectorAll('.question-item [id^="question-controls-"]').forEach(controls => {
            const id = controls.id.split('-')[2];
            controls.innerHTML = '';
            const startBtn = document.createElement('button');
            startBtn.innerText = 'Iniciar Pergunta';
            startBtn.onclick = () => socketHandler.startQuestion(id);
            controls.appendChild(startBtn);
        });

        const activeControls = document.getElementById(`question-controls-${questionId}`);
        if (activeControls) {
            activeControls.innerHTML = '';
            const stopBtn = document.createElement('button');
            stopBtn.innerText = 'Parar Respostas';
            stopBtn.style.backgroundColor = '#f0ad4e';
            stopBtn.onclick = () => socketHandler.stopVoting(questionId);
            activeControls.appendChild(stopBtn);
        }
    },

    setVotingEnded(questionId) {
        const controls = document.getElementById(`question-controls-${questionId}`);
        if (controls) controls.innerHTML = `<p style="color: green;">Votação encerrada.</p>`;
    },

    handleSessionEnded: (message) => { alert(message); window.location.href = '/'; },

    handleJoinResponse(response) {
        if (!response.success) {
            alert(response.message);
            window.location.href = `/pages/admin.html?role=controller`;
            return;
        }
        sessionDeadline = response.deadline;
        if (sessionDeadline) this.showDeadlineWarning();
    },

    handleThemeChanged(theme) {
        // Atualiza o seletor para refletir o estado atual (caso outro controller mude)
        if (this.elements.sessionThemeSwitcher) {
            this.elements.sessionThemeSwitcher.value = theme;
            console.log(`INFO: Tema da sessão alterado para '${theme}'.`);
        }
    },

    showDeadlineWarning() {
        const deadlineAlertEl = document.createElement('div');
        deadlineAlertEl.id = 'deadline-alert';
        deadlineAlertEl.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: #d9534f; color: white; padding: 10px; text-align: center; font-weight: bold; display: none; z-index: 1000;';
        deadlineAlertEl.innerText = 'TEMPO ESGOTADO';
        document.body.insertBefore(deadlineAlertEl, document.body.firstChild);

        const remainingTime = sessionDeadline - Date.now();
        if (remainingTime <= 0) {
            // Se o prazo já passou, exibe a mensagem imediatamente.
            deadlineAlertEl.style.display = 'block';
        } else {
            // Agenda a exibição da mensagem para quando o prazo for atingido.
            setTimeout(() => {
                deadlineAlertEl.style.display = 'block';
            }, remainingTime);
        }
    }
};

// --- 3. MÓDULO DE SOCKET ---
// Gerencia toda a comunicação com o servidor via Socket.IO.
const socketHandler = {
    init() {
        socket.on('questionsUpdated', (questions) => ui.renderQuestions(questions, this));
        socket.on('newQuestion', (question) => ui.setActiveQuestion(question.id, this));
        socket.on('votingEnded', ({ questionId }) => ui.setVotingEnded(questionId));
        socket.on('sessionEnded', ({ message }) => ui.handleSessionEnded(message));
        socket.on('themeChanged', ({ theme }) => ui.handleThemeChanged(theme));

        socket.on('connect', () => {
            console.log('✅ Conectado ao servidor. Autenticando controller...');
            this.joinSession();
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Erro de conexão com o Controller:', error);
        });

        socket.on('disconnect', (reason) => {
            console.warn('⚠️ Controller desconectado do servidor:', reason);
        });
    },

    joinSession: () => {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        const sessionPassword = sessionStorage.getItem('mindpool_session_pass');
        if (!sessionPassword) {
            alert('Erro de autenticação. Por favor, volte e entre na sessão novamente.');
            window.location.href = `/pages/admin.html?role=controller`;
            return;
        }
        socket.emit('joinAdminSession', { sessionCode, password: sessionPassword, role: 'controller' }, (response) => {
            // Não remover a senha do sessionStorage para permitir que a re-autenticação em 'connect' funcione.
            if (response.theme) ui.handleThemeChanged(response.theme);
            ui.handleJoinResponse(response);
        });
    },
    createQuestion: (questionData) => {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        socket.emit('createQuestion', { sessionCode, question: questionData });
    },
    startQuestion: (questionId) => {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        socket.emit('startQuestion', { sessionCode, questionId });
    },
    stopVoting: (questionId) => {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        socket.emit('stopQuestion', { sessionCode, questionId });
    },
    endSession: () => {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        socket.emit('endSession', { sessionCode });
    },
    changeTheme: (theme) => {
        const sessionCode = new URLSearchParams(window.location.search).get('session');
        socket.emit('changeTheme', { sessionCode, theme });
    },
};

// --- 4. INÍCIO DA APLICAÇÃO ---
ui.init(socketHandler);
socketHandler.init();