const socket = io("https://mindpool-backend.onrender.com", {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
const params = new URLSearchParams(window.location.search);
const role = params.get('role');

// --- Seleção de Elementos do DOM ---
const pageTitle = document.getElementById('page-title');
const errorMsg = document.getElementById('error-message');

// Formulário de Nova Sessão
const newSessionForm = document.getElementById('new-session-form');
const createSessionBtn = document.getElementById('create-session-btn');
const newControllerPassInput = document.getElementById('new-controller-pass');
const newPresenterPassInput = document.getElementById('new-presenter-pass');
const deadlineInput = document.getElementById('session-deadline');

// Formulário de Entrar em Sessão
const joinSessionForm = document.getElementById('join-session-form');
const joinSessionBtn = document.getElementById('join-session-btn');
const joinSessionCodeInput = document.getElementById('join-session-code');
const joinSessionPassInput = document.getElementById('join-session-pass');

// --- Validação e Configuração Inicial da UI ---
if (!role || role === 'controller') {
    // Ponto de entrada principal para o painel administrativo.
    pageTitle.innerText = 'Acesso Administrativo';
    // Mostra ambos os formulários.
    newSessionForm.classList.add('active');
    joinSessionForm.classList.add('active');
} else if (role === 'presenter') {
    pageTitle.innerText = `Acesso: ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    // Para o presenter, mostra apenas o formulário de entrar em sessão.
    newSessionForm.style.display = 'none';
    joinSessionForm.classList.add('active');
} else { // Trata roles desconhecidas ou inválidas
    pageTitle.innerText = 'Erro de Acesso';
    errorMsg.innerText = `Função (role) "${role}" é inválida.`;
    // Garante que os formulários fiquem escondidos em caso de erro.
    newSessionForm.style.display = 'none';
    joinSessionForm.style.display = 'none';
}

// Lógica de Criação de Sessão (Botão "Criar e Entrar")
createSessionBtn?.addEventListener('click', () => {
    const controllerPassword = newControllerPassInput.value;
    const presenterPassword = newPresenterPassInput.value;
    const deadlineValue = deadlineInput.value;
    const deadline = deadlineValue ? new Date(deadlineValue).getTime() : null;

    if (!controllerPassword || !presenterPassword) {
        errorMsg.innerText = 'Por favor, preencha ambas as senhas.';
        return;
    }

    socket.emit('createSession', { controllerPassword, presenterPassword, deadline }, (response) => {
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

    // Se 'role' não estiver na URL, assume-se que é o 'controller' (administrador) tentando entrar.
    const roleToJoin = role || 'controller';
    socket.emit('joinAdminSession', { sessionCode, password, role: roleToJoin }, (response) => {
        if (response.success) {
            const targetPage = roleToJoin === 'controller' ? 'controller' : roleToJoin;
            window.location.href = `/pages/${targetPage}.html?session=${sessionCode}`; // Redireciona para controller.html ou presenter.html
        } else {
            errorMsg.innerText = response.message || 'Falha ao entrar na sessão.';
        }
    });
});

socket.on('connect_error', () => {
    if (errorMsg) errorMsg.innerText = 'Não foi possível conectar ao servidor.';
});
