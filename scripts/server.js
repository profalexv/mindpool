const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem. Para produção, é mais seguro restringir a URL do seu frontend.
    methods: ["GET", "POST"]
  }
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
// Isso permite que /pages/audience.html acesse /styles/audience.css e /scripts/audience.js
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('Um usuário se conectou');

    // 1. CRIAR UMA NOVA SESSÃO (com senhas)
    socket.on('createSession', ({ showerPassword, presenterPassword, deadline }, callback) => {
        const sessionCode = generateSessionCode();
        sessions[sessionCode] = {
            showerPassword,
            presenterPassword,
            showerSocketId: null, // Garante que apenas um shower esteja conectado
            deadline: deadline || null,
            questions: [],
            activeQuestion: null,
            audienceCount: 0,
        };
        console.log(`Sessão criada: ${sessionCode}`);
        // Retorna sucesso e o código para o cliente
        callback({ success: true, sessionCode });
    });

    // 2. ENTRAR EM UMA SESSÃO (ADMIN: Shower ou Presenter)
    socket.on('joinAdminSession', ({ sessionCode, password, role }, callback) => {
        if (!sessions[sessionCode]) {
            return callback({ success: false, message: 'Sessão não encontrada.' });
        }

        const session = sessions[sessionCode];
        const expectedPassword = (role === 'shower') ? session.showerPassword : session.presenterPassword;

        if (password !== expectedPassword) {
            return callback({ success: false, message: 'Senha incorreta.' });
        }

        if (role === 'shower' && session.showerSocketId && session.showerSocketId !== socket.id) {
            return callback({ success: false, message: 'Já existe um Shower ativo nesta sessão.' });
        }

        socket.join(sessionCode);
        socket.sessionCode = sessionCode; // Armazena o código no socket para o disconnect
        socket.role = role;

        if (role === 'shower') {
            session.showerSocketId = socket.id;
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

    // 4. CRIAR UMA NOVA PERGUNTA (vindo do shower.html)
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
            // Notifica todos os admins (shower/presenter) que a lista de perguntas foi atualizada
            io.to(sessionCode).emit('questionsUpdated', session.questions);
        }
    });

    // 5. INICIAR UMA PERGUNTA (vindo do shower.html)
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
            } else if (role === 'shower' && session.showerSocketId === id) {
                // Libera o slot de shower se o shower principal se desconectar
                session.showerSocketId = null;
                console.log(`Shower da sessão ${sessionCode} desconectou. O slot está livre.`);
            }
        }
    });

    // 7. ENCERRAR SESSÃO (vindo do shower.html)
    socket.on('endSession', ({ sessionCode }) => {
        if (sessions[sessionCode]) {
            console.log(`Encerrando sessão ${sessionCode} a pedido do Shower.`);
            // Notifica todos na sala que a sessão terminou
            io.to(sessionCode).emit('sessionEnded', 'Esta sessão foi encerrada pelo apresentador.');
            // Remove a sessão do objeto
            delete sessions[sessionCode];
        }
    });

    // 8. PARAR VOTAÇÃO (vindo do shower.html)
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
