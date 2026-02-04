const socket = io("https://mindpool-backend.onrender.com", {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
const sessionCode = new URLSearchParams(window.location.search).get('session');

const waitingScreen = document.getElementById('waiting-screen');
const questionScreen = document.getElementById('question-screen');
const resultsContainer = document.getElementById('results-container');
const wordCloudContainer = document.getElementById('word-cloud-container');
const presenterTimerEl = document.getElementById('presenter-timer');
let currentTimer = null;
let sessionDeadline = null;

// 1. Configuração Inicial
const sessionCodeDisplay = document.getElementById('session-code-display');
if (sessionCodeDisplay) sessionCodeDisplay.innerText = sessionCode;

const audienceUrl = `${window.location.origin}/pages/audience.html?session=${sessionCode}`;
const qrcodeContainer = document.getElementById("qrcode");
if (qrcodeContainer) {
    new QRCode(qrcodeContainer, {
        text: audienceUrl,
        width: 256,
        height: 256,
    });
}

// A autenticação agora é feita na página admin.html
socket.emit('joinAdminSession', { sessionCode, role: 'presenter' }, (response) => {
    if (!response.success) {
        alert(response.message);
        window.location.href = `/pages/admin.html?role=presenter`;
        return;
    }
    sessionDeadline = response.deadline;
    if (sessionDeadline) {
        const deadlineAlertEl = document.getElementById('deadline-alert');
        if (deadlineAlertEl) {
            setInterval(() => {
                if (Date.now() > sessionDeadline) {
                    deadlineAlertEl.style.display = 'block';
                }
            }, 5000);
        }
    }

});

// 2. Ouvir por novas perguntas
socket.on('newQuestion', (question) => {
    // Para e limpa qualquer cronômetro anterior
    if (currentTimer) {
        currentTimer.stop();
        currentTimer = null;
    }
    if (presenterTimerEl) presenterTimerEl.style.display = 'none';

    if (waitingScreen) waitingScreen.style.display = 'none';
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
    // Esta função precisa das opções da pergunta, que não vêm no 'updateResults'.
    // Uma melhoria seria o servidor enviar o objeto da pergunta completo.
    // Por enquanto, vamos exibir de forma simples.
    if (!resultsContainer) return;
    let html = '';
    for (const [option, count] of Object.entries(results)) {
        html += `<p>${option}: ${count}</p>`;
    }
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

socket.on('error', (message) => alert(message));
socket.on('sessionEnded', (message) => {
    alert(message);
    window.location.href = '/';
});