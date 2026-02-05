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

/**
 * Aplica um tema visual ao body, trocando a classe de tema.
 * @param {string} theme - O nome do tema (ex: 'light', 'dark', 'corporate').
 */
function applyTheme(theme = 'light') {
    console.log(`Aplicando tema: ${theme}`);
    const body = document.body;
    // Remove temas antigos para garantir que apenas um esteja ativo
    body.classList.remove('theme-light', 'theme-dark', 'theme-corporate');
    body.classList.add(`theme-${theme}`);
}

function getSessionPassword() {
    // 1. Tenta obter a senha do sessionStorage da aba atual.
    let password = sessionStorage.getItem('mindpool_session_pass');
    if (password) console.log('INFO: Senha encontrada no sessionStorage da aba.');

    // 2. Se não encontrar, verifica se foi passada uma senha temporária de outra aba via localStorage.
    if (!password) {
        const tempPass = localStorage.getItem('mindpool_temp_pass');
        if (tempPass) {
            console.log('INFO: Senha temporária encontrada no localStorage, movendo para sessionStorage.');
            password = tempPass;
            sessionStorage.setItem('mindpool_session_pass', tempPass); // Move para o sessionStorage desta aba
            localStorage.removeItem('mindpool_temp_pass'); // Limpa o localStorage para não ser reutilizado
        }
    }

    if (!password) console.error('ERRO CRÍTICO: Nenhuma senha encontrada para autenticação do presenter.');
    return password;
}

const sessionInfoContainer = document.getElementById('session-info-container');
const questionScreen = document.getElementById('question-screen');
const resultsContainer = document.getElementById('results-container');
const wordCloudContainer = document.getElementById('word-cloud-container');
const presenterTimerEl = document.getElementById('presenter-timer');
let currentTimer = null;
let currentQuestion = null; // Armazena a pergunta atual completa
let sessionDeadline = null;

// 1. Configuração Inicial
const sessionCodeForDisplay = new URLSearchParams(window.location.search).get('session');
const sessionCodeDisplay = document.getElementById('session-code-display');
if (sessionCodeDisplay) sessionCodeDisplay.innerText = sessionCodeForDisplay;

const audienceUrl = `${window.location.origin}/pages/audience.html?session=${sessionCodeForDisplay}`;
const qrcodeContainer = document.getElementById("qrcode");
if (qrcodeContainer) {
    new QRCode(qrcodeContainer, {
        text: audienceUrl,
        width: 256,
        height: 256,
    });
}

function joinPresenterSession() {
    const sessionCode = new URLSearchParams(window.location.search).get('session');
    const sessionPassword = getSessionPassword();

    if (!sessionPassword) {
        console.error('Falha na autenticação: senha não encontrada no sessionStorage ou localStorage.');
        alert('Erro de autenticação. A sessão pode ter expirado ou a senha não foi fornecida. Por favor, tente entrar novamente.');
        window.location.href = `/pages/admin.html?role=presenter`;
        return;
    }
    socket.emit('joinAdminSession', { sessionCode, password: sessionPassword, role: 'presenter' }, (response) => {        
        // Não remover a senha do sessionStorage para permitir que a re-autenticação em 'connect' funcione.

        if (!response.success) {
            alert(response.message);
            window.location.href = `/pages/admin.html?role=presenter`;
            return;
        }

        applyTheme(response.theme);
        sessionDeadline = response.deadline;
        if (sessionDeadline) {
            const remainingTime = sessionDeadline - Date.now();
            const deadlineAlertEl = document.getElementById('deadline-alert');

            if (remainingTime <= 0) {
                // Se o prazo já passou, exibe a mensagem imediatamente.
                if (deadlineAlertEl) deadlineAlertEl.style.display = 'block';
            } else {
                // Agenda a exibição da mensagem para quando o prazo for atingido.
                // Isso é mais eficiente que setInterval.
                setTimeout(() => {
                    if (deadlineAlertEl) deadlineAlertEl.style.display = 'block';
                }, remainingTime);
            }
        }
    });
}

// 2. Ouvir por novas perguntas
socket.on('newQuestion', (question) => {
    currentQuestion = question; // Armazena a pergunta para uso posterior (ex: renderBarResults)
    // Para e limpa qualquer cronômetro anterior
    if (currentTimer) {
        currentTimer.stop();
        currentTimer = null;
    }
    if (presenterTimerEl) presenterTimerEl.style.display = 'none';

    if (sessionInfoContainer) sessionInfoContainer.className = 'state-question';
    if (questionScreen) questionScreen.style.display = 'block';
    
    // Limpa os containers de resultado e prepara para a nova pergunta
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        resultsContainer.className = ''; // Reseta a classe para o padrão
    }
    if (wordCloudContainer) wordCloudContainer.innerHTML = '';

    const questionText = document.getElementById('question-text');
    if (questionText) questionText.innerText = question.text;

    const img = document.getElementById('question-image');
    if (img) {
        if (question.imageUrl) {
            img.src = question.imageUrl;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
    }

    // Pre-renderiza as barras para perguntas de múltipla escolha
    if (question.questionType === 'options') {
        renderInitialBarResults(question.options);
    }

    // Inicia um novo cronômetro se a pergunta tiver um horário de término
    if (question.endTime) {
        if (presenterTimerEl) {
            presenterTimerEl.style.display = 'block';
            currentTimer = new Cronometro(question.endTime, presenterTimerEl, () => {
                console.log('Cronômetro do presenter terminou.');
            });
            currentTimer.start();
        }
    }
});

// 3. Ouvir por atualização de resultados
socket.on('updateResults', ({ results, questionType }) => {
    switch (questionType) {
        case 'options':
            updateBarResults(results);
            break;
        case 'yes_no':
            renderYesNoResults(results);
            break;
        default: // Word cloud
            renderWordCloud(results);
            break;
    }
});

function renderInitialBarResults(options) {
    if (!resultsContainer) return;
    let html = '';
    options.forEach(option => {
        html += `
            <div class="result-bar-container" data-option-id="${option.id}">
                <span>${option.text}</span>
                <div class="result-bar-background">
                    <div class="result-bar" style="width: 0%;">
                        <span class="result-bar-label">0 (0%)</span>
                    </div>
                </div>
            </div>`;
    });
    resultsContainer.innerHTML = html;
}

function updateBarResults(results) {
    if (!resultsContainer) return;

    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

    const barContainers = resultsContainer.querySelectorAll('.result-bar-container');

    barContainers.forEach((container, index) => {
        const optionId = container.dataset.optionId;
        if (!optionId) return;

        const count = results[optionId] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

        const bar = container.querySelector('.result-bar');
        const label = container.querySelector('.result-bar-label');

        if (bar) {
            // Adiciona um atraso escalonado para um efeito de animação mais agradável
            bar.style.transitionDelay = `${index * 50}ms`;
            bar.style.width = `${percentage}%`;
        }
        if (label) {
            label.innerText = `${count} (${percentage}%)`;
        }
    });
}

function renderWordCloud(results) {
    if (!resultsContainer) return; // Use resultsContainer for flex layout
    resultsContainer.className = 'word-cloud-container';
    resultsContainer.innerHTML = ''; // Clear previous content

    const answers = Object.keys(results);
    const counts = Object.values(results);
    const maxCount = Math.max(...counts, 1);

    answers.forEach(answer => {
        const count = results[answer];
        
        const element = document.createElement('span');
        element.className = 'word-cloud-item';
        element.innerText = answer;

        const baseFontSize = 1.2; // em rem
        const fontSize = baseFontSize + (count / maxCount) * 2.5; // Escala até 2.5rem extra
        element.style.fontSize = `${fontSize}rem`;
        element.style.opacity = 0.5 + (count / maxCount) * 0.5;

        resultsContainer.appendChild(element);
    });
}

function renderYesNoResults(results) {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = `
        <div class="yes-no-results">
            <div class="result-option"><span class="label">Sim</span>👍<span class="count">${results.yes || 0}</span></div>
            <div class="result-option"><span class="label">Não</span>👎<span class="count">${results.no || 0}</span></div>
        </div>
    `;
}

socket.on('themeChanged', ({ theme }) => {
    console.log(`Recebido evento de mudança de tema: ${theme}`);
    applyTheme(theme);
});

socket.on('error', (message) => alert(message));
socket.on('sessionEnded', (message) => {
    alert(message);
    window.location.href = '/';
});

socket.on('connect_error', (error) => {
    console.error('❌ Erro de conexão com o Presenter:', error);
});

socket.on('disconnect', (reason) => {
    console.warn('⚠️ Presenter desconectado do servidor:', reason);
});

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor. Autenticando presenter...');
    joinPresenterSession();
});