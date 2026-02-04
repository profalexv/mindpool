/**
 * questions.js
 * 
 * Módulo responsável por registrar e gerenciar todos os eventos
 * de Socket.IO relacionados a perguntas (criar, editar, deletar, etc.).
 */

function registerQuestionHandlers(io, socket, sessions, logger) {

    const logAction = (sessionCode, action, details = '') => {
        logger.info(`[SESSION: ${sessionCode}] ${action} ${details}`);
    };

    // CRIAR UMA NOVA PERGUNTA
    socket.on('createQuestion', ({ sessionCode, question }) => {
        const session = sessions[sessionCode];
        if (!session) return;

        session.questions.push({
            id: session.questions.length,
            text: question.text,
            imageUrl: question.imageUrl,
            questionType: question.questionType,
            options: question.options,
            charLimit: question.charLimit,
            timer: question.timer,
            results: {},
            createdAt: Date.now(),
            canEdit: true // Nova propriedade para permitir edição
        });

        logAction(sessionCode, `PERGUNTA #${session.questions.length - 1} criada`);
        io.to(sessionCode).emit('questionsUpdated', session.questions);
    });

    // EDITAR UMA PERGUNTA
    socket.on('editQuestion', ({ sessionCode, questionId, updatedQuestion }) => {
        const session = sessions[sessionCode];
        if (!session || !session.questions[questionId]) return;

        const question = session.questions[questionId];
        
        if (session.activeQuestion === questionId) {
            socket.emit('error', 'Não pode editar pergunta ativa');
            return;
        }

        question.text = updatedQuestion.text || question.text;
        question.imageUrl = updatedQuestion.imageUrl || question.imageUrl;
        question.options = updatedQuestion.options || question.options;
        question.charLimit = updatedQuestion.charLimit || question.charLimit;
        question.timer = updatedQuestion.timer || question.timer;

        logAction(sessionCode, `PERGUNTA #${questionId} editada`);
        io.to(sessionCode).emit('questionsUpdated', session.questions);
    });

    // DUPLICAR UMA PERGUNTA
    socket.on('duplicateQuestion', ({ sessionCode, questionId }) => {
        const session = sessions[sessionCode];
        if (!session || !session.questions[questionId]) return;

        const originalQuestion = session.questions[questionId];
        const newQuestion = JSON.parse(JSON.stringify(originalQuestion));
        newQuestion.id = session.questions.length;
        newQuestion.results = {};
        newQuestion.createdAt = Date.now();

        session.questions.push(newQuestion);

        logAction(sessionCode, `PERGUNTA #${questionId} duplicada para #${newQuestion.id}`);
        io.to(sessionCode).emit('questionsUpdated', session.questions);
    });

    // DELETAR UMA PERGUNTA
    socket.on('deleteQuestion', ({ sessionCode, questionId }) => {
        const session = sessions[sessionCode];
        if (!session || !session.questions[questionId]) return;

        if (session.activeQuestion === questionId) {
            socket.emit('error', 'Não pode deletar pergunta ativa');
            return;
        }

        session.questions[questionId] = null;
        logAction(sessionCode, `PERGUNTA #${questionId} deletada`);
        io.to(sessionCode).emit('questionsUpdated', session.questions);
    });

    // INICIAR UMA PERGUNTA
    socket.on('startQuestion', ({ sessionCode, questionId }) => {
        const session = sessions[sessionCode];
        if (session && session.questions[questionId]) {
            session.activeQuestion = questionId;
            const question = session.questions[questionId];
            question.results = {};
            question.acceptingAnswers = true;
            question.endTime = null;
            
            if (question.timer && question.timer.duration > 0) {
                question.endTime = Date.now() + (question.timer.duration * 1000);
            }
            
            if (question.questionType === 'options' && question.options) {
                question.options.forEach(opt => question.results[opt.id] = 0);
            } else if (question.questionType === 'yes_no') {
                question.results['yes'] = 0;
                question.results['no'] = 0;
            }
            
            logAction(sessionCode, `PERGUNTA #${questionId} iniciada`);
            logger.info(`EMITTING 'newQuestion' to room ${sessionCode}`);
            io.to(sessionCode).emit('newQuestion', { ...question });
        }
    });

    // PARAR UMA PERGUNTA
    socket.on('stopQuestion', ({ sessionCode, questionId }) => {
        const session = sessions[sessionCode];
        if (session && session.questions[questionId]) {
            const question = session.questions[questionId];
            question.acceptingAnswers = false;
            
            logAction(sessionCode, `PERGUNTA #${questionId} parada`);
            io.to(sessionCode).emit('votingEnded', { questionId });
        }
    });
}

module.exports = { registerQuestionHandlers };