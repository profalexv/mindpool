const socket = io("https://mindpool-backend.onrender.com", {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
const params = new URLSearchParams(window.location.search);
const role = params.get('role');

// --- Seleção de Elementos do DOM ---
const pageTitle = document.getElementById('page-title');
const errorMsg = document.getElementById('error-message');

// Botões de alternância de formulário
const showNewBtn = document.getElementById('show-new-session-btn');
const showJoinBtn = document.getElementById('show-join-session-btn');

// Formulário de Nova Sessão
const newSessionForm = document.getElementById('new-session-form');
const createSessionBtn = document.getElementById('create-session-btn');
const newShowerPassInput = document.getElementById('new-shower-pass');
const newPresenterPassInput = document.getElementById('new-presenter-pass');
const deadlineInput = document.getElementById('session-deadline');

// Formulário de Entrar em Sessão
const joinSessionForm = document.getElementById('join-session-form');
const joinSessionBtn = document.getElementById('join-session-btn');
const joinSessionCodeInput = document.getElementById('join-session-code');
const joinSessionPassInput = document.getElementById('join-session-pass');

// --- Funções Auxiliares ---
function showForm(formToShow) {
    newSessionForm.classList.toggle('active', formToShow === 'new');
    joinSessionForm.classList.toggle('active', formToShow === 'join');
}

// --- Validação e Configuração Inicial da UI ---
if (!role) {
    pageTitle.innerText = 'Erro de Acesso';
    errorMsg.innerText = 'Função (role) não especificada. Por favor, volte à página inicial.';
    showNewBtn.style.display = 'none';
    showJoinBtn.style.display = 'none';
} else {
    pageTitle.innerText = `Acesso: ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    if (role !== 'shower') {
        showNewBtn.style.display = 'none';
        showForm('join');
    }
}

// --- Event Listeners ---
showNewBtn?.addEventListener('click', () => showForm('new'));
showJoinBtn?.addEventListener('click', () => showForm('join'));

// Lógica de Criação de Sessão (Botão "Criar e Entrar")
createSessionBtn?.addEventListener('click', () => {
    const showerPassword = newShowerPassInput.value;
    const presenterPassword = newPresenterPassInput.value;
    const deadlineValue = deadlineInput.value;
    const deadline = deadlineValue ? new Date(deadlineValue).getTime() : null;

    if (!showerPassword || !presenterPassword) {
        errorMsg.innerText = 'Por favor, preencha ambas as senhas.';
        return;
    }

    socket.emit('createSession', { showerPassword, presenterPassword, deadline }, (response) => {
        if (response.success) {
            window.location.href = `/pages/controller.html?session=${response.sessionCode}`;
        } else {
            errorMsg.innerText = response.message || 'Ocorreu um erro ao criar a sessão.';
        }
    });
});

// Lógica para Entrar em Sessão (Botão "Entrar")
joinSessionBtn?.addEventListener('click', () => {
    const sessionCode = joinSessionCodeInput.value.toUpperCase();
    const password = joinSessionPassInput.value;

    if (!sessionCode || !password) {
        errorMsg.innerText = 'Código e senha são obrigatórios.';
        return;
    }

    socket.emit('joinAdminSession', { sessionCode, password, role }, (response) => {
        if (response.success) {
            const targetPage = role === 'shower' ? 'controller' : role;
            window.location.href = `/pages/${targetPage}.html?session=${sessionCode}`;
        } else {
            errorMsg.innerText = response.message || 'Falha ao entrar na sessão.';
        }
    });
});

socket.on('connect_error', () => {
    if (errorMsg) errorMsg.innerText = 'Não foi possível conectar ao servidor.';
});
