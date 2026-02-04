// ===== CONFIGURAÇÃO DE SOCKET.IO =====
// Detecta ambiente (local ou produção)
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

const params = new URLSearchParams(window.location.search);
const role = params.get('role');

// ===== SELEÇÃO DE ELEMENTOS DO DOM =====
const pageTitle = document.getElementById('page-title');
const errorMsg = document.getElementById('error-message');

// Botões de ação principal
const actionButtonsDiv = document.getElementById('action-buttons');
const createSessionMainBtn = document.getElementById('create-session-main-btn');
const joinSessionMainBtn = document.getElementById('join-session-main-btn');
const historyBtn = document.getElementById('history-btn') || null;

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

// ===== HISTÓRICO DE SESSÕES (localStorage) =====
class SessionHistory {
    constructor() {
        this.storageKey = 'mindpool_session_history';
        this.maxSessions = 10;
    }

    add(sessionCode, role, controllerPassword) {
        let history = this.getAll();
        
        // Remove duplicatas
        history = history.filter(s => s.code !== sessionCode);
        
        // Adiciona nova sessão no início
        history.unshift({
            code: sessionCode,
            role: role,
            timestamp: new Date().toISOString(),
            hashedPass: this.simpleHash(controllerPassword) // Não armazenar senha em plaintext
        });
        
        // Mantém apenas últimas N sessões
        history = history.slice(0, this.maxSessions);
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        return history;
    }

    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }

    // Hash simples para não armazenar senhas em plaintext
    simpleHash(str) {
        return btoa(str).slice(0, 8); // Base64 truncado (apenas validação visual)
    }

    remove(sessionCode) {
        let history = this.getAll();
        history = history.filter(s => s.code !== sessionCode);
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        return history;
    }
}

const sessionHistory = new SessionHistory();

// ===== FUNÇÃO PARA LIMPAR MENSAGENS DE ERRO =====
function clearError() {
    errorMsg.innerText = '';
    errorMsg.style.display = 'none';
}

// ===== FUNÇÃO PARA MOSTRAR ERRO =====
function showError(message) {
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';
}

// ===== FUNÇÃO PARA EXIBIR SUCESSO =====
function showSuccess(message) {
    const successMsg = document.createElement('div');
    successMsg.id = 'success-message';
    successMsg.className = 'success-message';
    successMsg.innerText = '✅ ' + message;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.remove();
    }, 3000);
}

// ===== FUNÇÃO PARA MOSTRAR MENU PRINCIPAL =====
function showMainMenu() {
    actionButtonsDiv.classList.add('active');
    newSessionForm.classList.remove('active');
    joinSessionForm.classList.remove('active');
    
    // Remover abas de histórico se existirem
    const historyDiv = document.getElementById('history-div');
    if (historyDiv) historyDiv.classList.remove('active');
    
    clearError();
    
    // Limpar campos
    newControllerPassInput.value = '';
    newPresenterPassInput.value = '';
    deadlineInput.value = '';
    joinSessionCodeInput.value = '';
    joinSessionPassInput.value = '';
}

// ===== FUNÇÃO PARA CRIAR HISTÓRICO UI =====
function renderHistory() {
    const history = sessionHistory.getAll();
    let historyDiv = document.getElementById('history-div');
    
    if (!historyDiv) {
        historyDiv = document.createElement('div');
        historyDiv.id = 'history-div';
        historyDiv.className = 'form-container';
        document.body.appendChild(historyDiv);
    }
    
    if (history.length === 0) {
        historyDiv.innerHTML = `
            <div style="text-align: right; margin-bottom: 10px;">
                <button id="close-history-btn-top" style="background-color: #95a5a6; padding: 8px 16px; font-size: 0.9em;">← Voltar</button>
            </div>
            <h2>Histórico de Sessões</h2>
            <p style="text-align: center; color: #999;">Nenhuma sessão anterior</p>
            <button id="close-history-btn" class="btn btn-secondary">← Voltar</button>
        `;
    } else {
        let html = `            <div style="text-align: right; margin-bottom: 10px;">
                <button id="close-history-btn-top" style="background-color: #95a5a6; padding: 8px 16px; font-size: 0.9em;">← Voltar</button>
            </div>            <h2>Histórico de Sessões</h2>
            <div style="max-height: 400px; overflow-y: auto;">
        `;
        
        history.forEach((session, idx) => {
            const date = new Date(session.timestamp);
            const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            html += `
                <div style="padding: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${session.code}</strong>
                        <small style="color: #999; margin-left: 10px;">${dateStr}</small>
                        <br/>
                        <small style="color: #666;">Acesso: ${session.role}</small>
                    </div>
                    <div>
                        <button class="btn btn-small btn-primary reconnect-btn" data-session="${session.code}" data-role="${session.role}">
                            Reconectar
                        </button>
                        <button class="btn btn-small btn-danger delete-history-btn" data-session="${session.code}" style="margin-left: 5px;">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            <button id="clear-history-btn" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">
                Limpar Todo Histórico
            </button>
            <button id="close-history-btn" class="btn btn-secondary" style="width: 100%; margin-top: 5px;">
                ← Voltar
            </button>
        `;
        
        historyDiv.innerHTML = html;
        
        // Listeners para reconexão
        document.querySelectorAll('.reconnect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sessionCode = btn.getAttribute('data-session');
                const historyRole = btn.getAttribute('data-role');
                
                joinSessionCodeInput.value = sessionCode;
                joinSessionPassInput.value = '';
                joinSessionPassInput.focus();
                
                historyDiv.classList.remove('active');
                newSessionForm.classList.remove('active');
                actionButtonsDiv.classList.remove('active');
                joinSessionForm.classList.add('active');
                
                showSuccess(`Sessão ${sessionCode} selecionada. Digite a senha.`);
            });
        });
        
        // Listeners para deletar do histórico
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sessionCode = btn.getAttribute('data-session');
                sessionHistory.remove(sessionCode);
                renderHistory(); // Re-render
            });
        });
        
        // Limpar todo histórico
        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
                sessionHistory.clear();
                renderHistory(); // Re-render
            }
        });
    }
    
    historyDiv.classList.add('active');
    actionButtonsDiv.classList.remove('active');
    newSessionForm.classList.remove('active');
    joinSessionForm.classList.remove('active');
    
    document.getElementById('close-history-btn-top')?.addEventListener('click', showMainMenu);
    document.getElementById('close-history-btn').addEventListener('click', showMainMenu);
}

// ===== VALIDAÇÃO E CONFIGURAÇÃO INICIAL DA UI =====
if (!role || role === 'controller') {
    pageTitle.innerText = 'Acesso Administrativo';
    actionButtonsDiv.classList.add('active');
} else if (role === 'presenter') {
    pageTitle.innerText = `Acesso: ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    newSessionForm.style.display = 'none';
    joinSessionForm.classList.add('active');
} else {
    pageTitle.innerText = 'Erro de Acesso';
    showError(`Função (role) "${role}" é inválida.`);
    newSessionForm.style.display = 'none';
    joinSessionForm.style.display = 'none';
}

// ===== EVENT LISTENERS PARA OS BOTÕES DO MENU =====
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

// Botão de histórico
if (historyBtn) {
    historyBtn.addEventListener('click', renderHistory);
}

backToMenuBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showMainMenu();
});

backToMenuBtn2?.addEventListener('click', (e) => {
    e.preventDefault();
    showMainMenu();
});

// ===== LÓGICA DE CRIAÇÃO DE SESSÃO =====
createSessionBtn?.addEventListener('click', () => {
    const controllerPassword = newControllerPassInput.value.trim();
    const presenterPassword = newPresenterPassInput.value.trim();
    const deadlineValue = deadlineInput.value;
    // Converter horário para deadline (hoje + horário fornecido)
    const deadline = deadlineValue ? new Date(new Date().toDateString() + ' ' + deadlineValue).getTime() : null;

    clearError();

    if (!controllerPassword || !presenterPassword) {
        showError('Por favor, preencha ambas as senhas.');
        return;
    }

    if (controllerPassword.length < 4) {
        showError('A senha do Controller deve ter pelo menos 4 caracteres.');
        return;
    }

    if (presenterPassword.length < 4) {
        showError('A senha do Presenter deve ter pelo menos 4 caracteres.');
        return;
    }

    createSessionBtn.disabled = true;
    createSessionBtn.innerText = 'Criando...';

    socket.emit('createSession', { controllerPassword, presenterPassword, deadline }, (response) => {
        createSessionBtn.disabled = false;
        createSessionBtn.innerText = 'Criar e Entrar';
        
        if (response.success) {
            // Adicionar ao histórico
            sessionHistory.add(response.sessionCode, 'controller', controllerPassword);
            
            // Redirecionar
            window.location.href = `/pages/controller.html?session=${response.sessionCode}`;
        } else {
            showError(response.message || 'Ocorreu um erro ao criar a sessão.');
        }
    });
});

// ===== LÓGICA PARA ENTRAR EM SESSÃO =====
joinSessionBtn?.addEventListener('click', () => {
    const sessionCode = joinSessionCodeInput.value.toUpperCase().trim();
    const password = joinSessionPassInput.value.trim();

    clearError();

    if (!sessionCode || !password) {
        showError('Código e senha são obrigatórios.');
        return;
    }

    joinSessionBtn.disabled = true;
    joinSessionBtn.innerText = 'Entrando...';

    const roleToJoin = role || 'controller';
    socket.emit('joinAdminSession', { sessionCode, password, role: roleToJoin }, (response) => {
        joinSessionBtn.disabled = false;
        joinSessionBtn.innerText = 'Entrar';
        
        if (response.success) {
            // Adicionar ao histórico
            sessionHistory.add(sessionCode, roleToJoin, password);
            
            // Redirecionar
            const targetPage = roleToJoin === 'controller' ? 'controller' : roleToJoin;
            window.location.href = `/pages/${targetPage}.html?session=${sessionCode}`;
        } else {
            showError(response.message || 'Falha ao entrar na sessão.');
        }
    });
});

// ===== EVENTOS DE CONEXÃO =====
socket.on('connect', () => {
    console.log('✅ Conectado ao servidor');
    clearError();
});

socket.on('connect_error', (error) => {
    console.error('❌ Erro de conexão:', error);
    showError('Não foi possível conectar ao servidor. Verifique a internet e tente novamente.');
});

socket.on('disconnect', (reason) => {
    console.warn('⚠️  Desconectado do servidor:', reason);
});

// ===== ADICIONAR BOTÃO DE HISTÓRICO AO MENU =====
if (!historyBtn) {
    // Criar botão de histórico dinamicamente se não existir
    const historyBtnNew = document.createElement('button');
    historyBtnNew.id = 'history-btn';
    historyBtnNew.className = 'btn btn-secondary';
    historyBtnNew.innerText = '📋 Histórico';
    historyBtnNew.style.marginTop = '10px';
    historyBtnNew.style.width = '100%';
    
    const actionDiv = document.getElementById('action-buttons');
    if (actionDiv) {
        actionDiv.appendChild(historyBtnNew);
        historyBtnNew.addEventListener('click', renderHistory);
    }
}

// ===== ADICIONAR ESTILOS PARA COMPONENTES NOVOS =====
const style = document.createElement('style');
style.innerHTML = `
    .success-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-in-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .btn-small {
        padding: 5px 10px;
        font-size: 0.85rem;
    }
    
    .btn-danger {
        background-color: #f44336;
    }
    
    .btn-danger:hover {
        background-color: #d32f2f;
    }
    
    #history-div {
        display: none;
    }
    
    #history-div.active {
        display: block;
    }
`;
document.head.appendChild(style);
