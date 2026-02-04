const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://mindpool.alexandre.pro.br", "http://mindpool.alexandre.pro.br", "https://www.mindpool.alexandre.pro.br", "http://www.mindpool.alexandre.pro.br"],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true // Adicione isso para maior compatibilidade
});
// A porta é fornecida pela plataforma de hospedagem (como a Render) através de uma variável de ambiente.
const PORT = process.env.PORT || 3000;

// Objeto para armazenar todas as sessões ativas. A chave será o código da sessão.
const sessions = {};

// Função para gerar um código de sessão simples e único
function generateSessionCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (sessions[code]); // Garante que o código seja único
    return code;
}

// Servir arquivos estáticos da raiz do projeto.
// Isso permite que o servidor entregue os arquivos HTML, CSS e JS a partir da pasta raiz do projeto.
app.use(express.static(path.join(__dirname, '..')));

io.on('connection', (socket) => {
    console.log('Um usuário se conectou');

    // 1. CRIAR UMA NOVA SESSÃO (com senhas)
    socket.on('createSession', ({ controllerPassword, presenterPassword, deadline }, callback) => {
        const sessionCode = generateSessionCode();
        sessions[sessionCode] = {
            controllerPassword,
            presenterPassword,
            controllerSocketId: null, // Garante que apenas um controller esteja conectado
            deadline: deadline || null,
            questions: [],
            activeQuestion: null,
            audienceCount: 0,
        };
        console.log(`Sessão criada: ${sessionCode}`);
        // Retorna sucesso e o código para o cliente
        callback({ success: true, sessionCode });
    });

    // 2. ENTRAR EM UMA SESSÃO (ADMIN: Controller ou Presenter)
    socket.on('joinAdminSession', ({ sessionCode, password, role }, callback) => {
        if (!sessions[sessionCode]) {
            return callback({ success: false, message: 'Sessão não encontrada.' });
        }

        const session = sessions[sessionCode];
        const expectedPassword = (role === 'controller') ? session.controllerPassword : session.presenterPassword;

        if (password !== expectedPassword) {
            return callback({ success: false, message: 'Senha incorreta.' });
        }

        if (role === 'controller' && session.controllerSocketId && session.controllerSocketId !== socket.id) {
            return callback({ success: false, message: 'Já existe um Controller ativo nesta sessão.' });
        }

        socket.join(sessionCode);
        socket.sessionCode = sessionCode; // Armazena o código no socket para o disconnect
        socket.role = role;

        if (role === 'controller') {
            session.controllerSocketId = socket.id;
        }

        console.log(`Usuário com role '${role}' entrou na sessão ${sessionCode}`);
        callback({ success: true, deadline: session.deadline });

        // Envia o estado atual da sessão para quem acabou de entrar
        socket.emit('questionsUpdated', session.questions);
        if (session.activeQuestion) {
            socket.emit('newQuestion', session.questions[session.activeQuestion]);
        }
    });

    // 3. ENTRAR EM UMA SESSÃO (PLATEIA)
    socket.on('joinAudienceSession', ({ sessionCode }) => {
        if (!sessions[sessionCode]) {
            socket.emit('error', 'Sessão não encontrada.');
            return;
        }
        socket.join(sessionCode);
        socket.sessionCode = sessionCode;
        socket.role = 'audience';
        sessions[sessionCode].audienceCount++;
        console.log(`Plateia entrou na sessão ${sessionCode}. Total: ${sessions[sessionCode].audienceCount}`);

        const session = sessions[sessionCode];
        if (session.activeQuestion !== null) {
            socket.emit('newQuestion', session.questions[session.activeQuestion]);
        }
    });

    // 4. CRIAR UMA NOVA PERGUNTA (vindo do controller.html)
    socket.on('createQuestion', ({ sessionCode, question }) => {
        const session = sessions[sessionCode];
        if (session) {
            session.questions.push({
                id: session.questions.length,
                text: question.text,
                imageUrl: question.imageUrl,
                questionType: question.questionType,
                options: question.options,
                charLimit: question.charLimit,
                timer: question.timer,
                results: {} });
            // Notifica todos os admins (controller/presenter) que a lista de perguntas foi atualizada
            io.to(sessionCode).emit('questionsUpdated', session.questions);
        }
    });

    // 5. INICIAR UMA PERGUNTA (vindo do controller.html)
    socket.on('startQuestion', ({ sessionCode, questionId }) => {
        const session = sessions[sessionCode];
        if (session && session.questions[questionId]) {
            session.activeQuestion = questionId;
            const question = session.questions[questionId];
            question.results = {}; // Reseta os resultados para a nova pergunta
            question.acceptingAnswers = true;
            question.endTime = null;
            if (question.timer && question.timer.duration > 0) {
                // Calcula o horário de término com base no relógio do servidor
                question.endTime = Date.now() + (question.timer.duration * 1000);
            }
            
            if (question.questionType === 'options' && question.options) {
                question.options.forEach(opt => question.results[opt.id] = 0);
            } else if (question.questionType === 'yes_no') {
                question.results['yes'] = 0;
                question.results['no'] = 0;
            }
            
            // Envia a pergunta para a plateia e para o telão
            io.to(sessionCode).emit('newQuestion', { ...question });
            console.log(`Sessão ${sessionCode}: iniciando pergunta ${questionId}`);
        }
    });

    // 6. RECEBER RESPOSTA DA PLATEIA
    socket.on('submitAnswer', ({ sessionCode, questionId, answer }) => {
        const session = sessions[sessionCode];
        if (!session || session.activeQuestion !== questionId) return;

        const question = session.questions[questionId];
        
        if (!question.acceptingAnswers) {
            console.log(`Resposta rejeitada para a pergunta ${questionId}: votação encerrada.`);
            return;
        }
        if (question.endTime && Date.now() > question.endTime) {
            console.log(`Resposta rejeitada para a pergunta ${questionId}: tempo esgotado.`);
            if (question.acceptingAnswers) {
                question.acceptingAnswers = false;
                io.to(sessionCode).emit('votingEnded', { questionId });
            }
            return;
        }
        const { questionType } = question;

        if (questionType === 'options' || questionType === 'yes_no') {
            if (question.results.hasOwnProperty(answer)) {
                question.results[answer]++;
            }
        } else { // Para texto, número, etc.
            const sanitizedAnswer = String(answer).trim().slice(0, question.charLimit || 280);
            if (sanitizedAnswer) {
                question.results[sanitizedAnswer] = (question.results[sanitizedAnswer] || 0) + 1;
            }
        }

        if (session.questions[questionId]) {
            // Envia os resultados atualizados para o telão e para o painel do apresentador
            io.to(sessionCode).emit('updateResults', { results: question.results, questionType: question.questionType });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Usuário (role: ${socket.role}) desconectado`);
        const { sessionCode, role, id } = socket;
        if (sessionCode && sessions[sessionCode]) {
            const session = sessions[sessionCode];
            if (role === 'audience') {
                session.audienceCount--;
            } else if (role === 'controller' && session.controllerSocketId === id) {
                // Libera o slot de controller se o controller principal se desconectar
                session.controllerSocketId = null;
                console.log(`Controller da sessão ${sessionCode} desconectou. O slot está livre.`);
            }
        }
    });

    // 7. ENCERRAR SESSÃO (vindo do controller.html)
    socket.on('endSession', ({ sessionCode }) => {
        if (sessions[sessionCode]) {
            console.log(`Encerrando sessão ${sessionCode} a pedido do Controller.`);
            // Notifica todos na sala que a sessão terminou
            io.to(sessionCode).emit('sessionEnded', 'Esta sessão foi encerrada pelo apresentador.');
            // Remove a sessão do objeto
            delete sessions[sessionCode];
        }
    });

    // 8. PARAR VOTAÇÃO (vindo do controller.html)
    socket.on('stopVoting', ({ sessionCode, questionId }) => {
        const session = sessions[sessionCode];
        if (session && session.questions[questionId]) {
            session.questions[questionId].acceptingAnswers = false;
            console.log(`Votação encerrada manualmente para a pergunta ${questionId} na sessão ${sessionCode}`);
            io.to(sessionCode).emit('votingEnded', { questionId });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse o ponto de entrada em http://localhost:${PORT}/`);
});
