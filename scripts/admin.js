const socket = io("https://mindpool-backend.onrender.com");
const params = new URLSearchParams(window.location.search);
const role = params.get('role');

const pageTitle = document.getElementById('page-title');
const errorMsg = document.getElementById('error-message');
const newSessionForm = document.getElementById('new-session-form');
const joinSessionForm = document.getElementById('join-session-form');
const showNewBtn = document.getElementById('show-new-session-btn');
const showJoinBtn = document.getElementById('show-join-session-btn');

// Configuração inicial da UI
if (pageTitle) {
    pageTitle.innerText = `Acesso: ${role.charAt(0).toUpperCase() + role.slice(1)}`;
}
if (role !== 'shower') {
    if (showNewBtn) showNewBtn.style.display = 'none';
    if (joinSessionForm) joinSessionForm.classList.add('active');
}

if (showNewBtn) {
    showNewBtn.addEventListener('click', () => {
        newSessionForm.classList.add('active');
        joinSessionForm.classList.remove('active');
    });
}

if (showJoinBtn) {
    showJoinBtn.addEventListener('click', () => {
        joinSessionForm.classList.add('active');
        newSessionForm.classList.remove('active');
    });
}

// Lógica de Criação de Sessão
document.getElementById('create-session-btn')?.addEventListener('click', () => {
    const showerPassword = document.getElementById('new-shower-pass').value;
    const presenterPassword = document.getElementById('new-presenter-pass').value;
    const deadlineInput = document.getElementById('session-deadline').value;
    const deadline = deadlineInput ? new Date(deadlineInput).getTime() : null;

    if (!showerPassword || !presenterPassword) {
        errorMsg.innerText = 'Por favor, preencha ambas as senhas.';
        return;
    }

    socket.emit('createSession', { showerPassword, presenterPassword, deadline }, (response) => {
        if (response.success) {
            window.location.href = `/pages/shower.html?session=${response.sessionCode}`;
        } else {
            errorMsg.innerText = response.message || 'Ocorreu um erro ao criar a sessão.';
        }
    });
});

// Lógica para Entrar em Sessão
document.getElementById('join-session-btn')?.addEventListener('click', () => {
    const sessionCode = document.getElementById('join-session-code').value.toUpperCase();
    const password = document.getElementById('join-session-pass').value;

    if (!sessionCode || !password) {
        errorMsg.innerText = 'Código e senha são obrigatórios.';
        return;
    }

    socket.emit('joinAdminSession', { sessionCode, password, role }, (response) => {
        if (response.success) {
            window.location.href = `/pages/${role}.html?session=${sessionCode}`;
        } else {
            errorMsg.innerText = response.message || 'Falha ao entrar na sessão.';
        }
    });
});

socket.on('connect_error', () => {
    if (errorMsg) errorMsg.innerText = 'Não foi possível conectar ao servidor.';
});
