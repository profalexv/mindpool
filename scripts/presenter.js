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
    
    // Limpa ambos os containers de resultado
    if (resultsContainer) resultsContainer.innerHTML = '';
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
            renderBarResults(results);
            break;
        case 'yes_no':
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-around; align-items: center; font-size: 10vw;">
                        <div><span style="font-size: 0.5em; display: block;">Sim</span>👍<br>${results.yes || 0}</div>
                        <div><span style="font-size: 0.5em; display: block;">Não</span>👎<br>${results.no || 0}</div>
                    </div>
                `;
            }
            break;
        default: // Word cloud
            renderWordCloud(results);
            break;
    }
});

function renderBarResults(results) {
    if (!resultsContainer || !currentQuestion || !currentQuestion.options) return;

    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

    let html = '';
    currentQuestion.options.forEach(option => {
        const count = results[option.id] || 0;
        const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : 0;
        
        html += `
            <div class="result-bar-container">
                <span>${option.text} (${count})</span>
                <div class="result-bar" style="width: ${percentage}%;">
                    ${percentage > 10 ? percentage + '%' : ''}
                </div>
            </div>`;
    });
    resultsContainer.innerHTML = html;
}

function renderWordCloud(results) {
    if (!wordCloudContainer) return;
    const answers = Object.keys(results);
    const counts = Object.values(results);
    const maxCount = Math.max(...counts, 1);

    answers.forEach(answer => {
        const count = results[answer];
        const elementId = 'word-' + btoa(answer).replace(/=/g, '');
        let element = document.getElementById(elementId);

        if (!element) {
            element = document.createElement('span');
            element.id = elementId;
            element.className = 'word-cloud-item';
            element.innerText = answer;
            element.style.top = `${Math.random() * 90}%`;
            element.style.left = `${Math.random() * 80}%`;
            element.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
            element.style.color = `hsl(${Math.random() * 360}, 90%, 70%)`;
            wordCloudContainer.appendChild(element);
            setTimeout(() => element.style.opacity = 1, 100);
        }

        const baseFontSize = 1.5; // em vw
        const fontSize = baseFontSize + (count / maxCount) * 6; // Escala até 6vw extra
        element.style.fontSize = `${fontSize}vw`;
    });
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