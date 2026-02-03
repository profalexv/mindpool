const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// A porta é fornecida pela plataforma de hospedagem (como a Render) através de uma variável de ambiente.
const PORT = process.env.PORT || 3000;

// Simples "banco de dados" em memória para os resultados
const results = {
    'optionA': 0,
    'optionB': 0,
    'optionC': 0,
};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Um usuário se conectou');

    // Envia os resultados atuais para o novo usuário conectado (a tela de projeção)
    socket.emit('updateResults', results);

    // Ouve por um evento 'submitAnswer' vindo da plateia
    socket.on('submitAnswer', (option) => {
        if (results.hasOwnProperty(option)) {
            results[option]++;
            // Envia os resultados atualizados para TODOS os clientes conectados
            io.emit('updateResults', results);
            console.log('Resultados atualizados:', results);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse a tela de projeção em http://localhost:${PORT}/`);
    console.log(`Acesse a tela da plateia em http://localhost:${PORT}/audience.html`);
});