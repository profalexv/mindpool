const socket = io("https://mindpool-backend.onrender.com", {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
const params = new URLSearchParams(window.location.search);
const role = params.get('role');

// --- Seleção de Elementos do DOM ---
const pageTitle = document.getElementById('page-title');
const errorMsg = document.getElementById('error-message');

// Botões de ação principal
const actionButtonsDiv = document.getElementById('action-buttons');
const createSessionMainBtn = document.getElementById('create-session-main-btn');
const joinSessionMainBtn = document.getElementById('join-session-main-btn');

// Formulário de Nova Sessão
const newSessionForm = document.getElementById('new-session-form');
const createSessionBtn = document.getElementById('create-session-btn');
const newControllerPassInput = document.getElementById('new-controller-pass');
const newPresenterPassInput = document.getElementById('new-presenter-pass');
const deadlineInput = document.getElementById('session-deadline');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

// Formulário de Entrar em Sessão
const joinSessionForm = document.getElementById('join-session-form');
const joinSessionBtn = document.getElementById('join-session-btn');
const joinSessionCodeInput = document.getElementById('join-session-code');
const joinSessionPassInput = document.getElementById('join-session-pass');
const backToMenuBtn2 = document.getElementById('back-to-menu-btn2');

// --- Função auxiliar para limpar mensagens de erro ---
function clearError() {
    errorMsg.innerText = '';
}

// --- Função para mostrar menu principal ---
function showMainMenu() {
    actionButtonsDiv.classList.add('active');
    newSessionForm.classList.remove('active');
    joinSessionForm.classList.remove('active');
    clearError();
    // Limpa os campos
    newControllerPassInput.value = '';
    newPresenterPassInput.value = '';
    deadlineInput.value = '';
    joinSessionCodeInput.value = '';
    joinSessionPassInput.value = '';
}

// --- Validação e Configuração Inicial da UI ---
if (!role || role === 'controller') {
    // Ponto de entrada principal para o painel administrativo.
    pageTitle.innerText = 'Acesso Administrativo';
    // Mostra o menu principal
    actionButtonsDiv.classList.add('active');
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

// --- Event Listeners para os botões do menu ---
createSessionMainBtn?.addEventListener('click', () => {
    actionButtonsDiv.classList.remove('active');
    newSessionForm.classList.add('active');
    clearError();
    newControllerPassInput.focus();
});

joinSessionMainBtn?.addEventListener('click', () => {
    actionButtonsDiv.classList.remove('active');
    joinSessionForm.classList.add('active');
    clearError();
    joinSessionCodeInput.focus();
});

backToMenuBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showMainMenu();
});

backToMenuBtn2?.addEventListener('click', (e) => {
    e.preventDefault();
    showMainMenu();
});

// Lógica de Criação de Sessão (Botão "Criar e Entrar")
createSessionBtn?.addEventListener('click', () => {
    const controllerPassword = newControllerPassInput.value.trim();
    const presenterPassword = newPresenterPassInput.value.trim();
    const deadlineValue = deadlineInput.value;
    const deadline = deadlineValue ? new Date(deadlineValue).getTime() : null;

    if (!controllerPassword || !presenterPassword) {
        errorMsg.innerText = 'Por favor, preencha ambas as senhas.';
        return;
    }

    if (controllerPassword.length < 4) {
        errorMsg.innerText = 'A senha do Controller deve ter pelo menos 4 caracteres.';
        return;
    }

    if (presenterPassword.length < 4) {
        errorMsg.innerText = 'A senha do Presenter deve ter pelo menos 4 caracteres.';
        return;
    }

    if (controllerPassword === presenterPassword) {
        errorMsg.innerText = 'As senhas do Controller e Presenter devem ser diferentes.';
        return;
    }

    // Desabilita o botão durante o envio
    createSessionBtn.disabled = true;
    createSessionBtn.innerText = 'Criando...';

    socket.emit('createSession', { controllerPassword, presenterPassword, deadline }, (response) => {
        createSessionBtn.disabled = false;
        createSessionBtn.innerText = 'Criar e Entrar';
        
        if (response.success) {
            window.location.href = `/pages/controller.html?session=${response.sessionCode}`;
        } else {
            errorMsg.innerText = response.message || 'Ocorreu um erro ao criar a sessão.';
        }
    });
});

// Lógica para Entrar em Sessão (Botão "Entrar")
joinSessionBtn?.addEventListener('click', () => {
    const sessionCode = joinSessionCodeInput.value.toUpperCase().trim();
    const password = joinSessionPassInput.value.trim();

    if (!sessionCode || !password) {
        errorMsg.innerText = 'Código e senha são obrigatórios.';
        return;
    }

    // Desabilita o botão durante o envio
    joinSessionBtn.disabled = true;
    joinSessionBtn.innerText = 'Entrando...';

    // Se 'role' não estiver na URL, assume-se que é o 'controller' (administrador) tentando entrar.
    const roleToJoin = role || 'controller';
    socket.emit('joinAdminSession', { sessionCode, password, role: roleToJoin }, (response) => {
        joinSessionBtn.disabled = false;
        joinSessionBtn.innerText = 'Entrar';
        
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
