# 📚 API e Exemplos - MindPool v1.17

## 🌐 REST API

### Health Check
```bash
GET /health
```
**Resposta:**
```json
{
  "status": "ok",
  "environment": "local",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "activeSessions": 3
}
```

### Export Resultados (JSON)
```bash
GET /api/export/{sessionCode}/json
```
**Resposta:** Arquivo JSON com completa da sessão
```json
{
  "code": "ABC123",
  "controllerPassword": "$2a$10$...",
  "deadline": null,
  "questions": [
    {
      "id": 0,
      "text": "Qual é sua idade?",
      "questionType": "options",
      "options": [
        { "id": "opt1", "text": "18-25" },
        { "id": "opt2", "text": "26-35" }
      ],
      "results": {
        "opt1": 15,
        "opt2": 8
      }
    }
  ],
  "activeQuestion": null,
  "audienceCount": 0,
  "createdAt": 1705318245123
}
```

### Export Resultados (CSV)
```bash
GET /api/export/{sessionCode}/csv
```
**Resposta:** Arquivo CSV
```
ID,Pergunta,Tipo,Total Respostas,Resultados
0,"Qual é sua idade?",options,23,{"opt1":15,"opt2":8}
1,"Você está satisfeito?",yes_no,20,{"yes":18,"no":2}
```

---

## 🔌 Socket.IO Events

### Cliente → Servidor

#### 1. Criar Sessão
```javascript
socket.emit('createSession', {
    controllerPassword: 'senha123',
    presenterPassword: 'outro456',
    deadline: null  // ou timestamp
}, (response) => {
    console.log(response);
    // { success: true, sessionCode: 'ABC123' }
    // ou
    // { success: false, message: 'Erro...' }
});
```

#### 2. Entrar em Sessão
```javascript
socket.emit('joinAdminSession', {
    sessionCode: 'ABC123',
    password: 'senha123',
    role: 'controller'  // 'controller' ou 'presenter'
}, (response) => {
    if (response.success) {
        console.log('Conectado');
        console.log('Deadline:', response.deadline);
    }
});
```

#### 3. Entrar como Plateia
```javascript
socket.emit('joinAudienceSession', {
    sessionCode: 'ABC123'
});
```

#### 4. Criar Pergunta
```javascript
socket.emit('createQuestion', {
    sessionCode: 'ABC123',
    question: {
        text: 'O que você acha?',
        imageUrl: 'https://...',
        questionType: 'options',  // 'options', 'yes_no', 'text'
        options: [
            { id: 'opt1', text: 'Sim' },
            { id: 'opt2', text: 'Não' }
        ],
        charLimit: 280,
        timer: {
            enabled: true,
            duration: 30  // segundos
        }
    }
});
```

#### 5. Editar Pergunta (NOVO v1.17)
```javascript
socket.emit('editQuestion', {
    sessionCode: 'ABC123',
    questionId: 0,
    updatedQuestion: {
        text: 'Nova pergunta',
        options: [
            { id: 'opt1', text: 'Opção 1' },
            { id: 'opt2', text: 'Opção 2' }
        ]
    }
});
```

#### 6. Duplicar Pergunta (NOVO v1.17)
```javascript
socket.emit('duplicateQuestion', {
    sessionCode: 'ABC123',
    questionId: 0  // Duplica pergunta ID 0
});
// Resultado: Nova pergunta ID 1 com mesmos dados
```

#### 7. Deletar Pergunta (NOVO v1.17)
```javascript
socket.emit('deleteQuestion', {
    sessionCode: 'ABC123',
    questionId: 0
});
```

#### 8. Iniciar Votação
```javascript
socket.emit('startQuestion', {
    sessionCode: 'ABC123',
    questionId: 0
});
```

#### 9. Parar Votação (NOVO v1.17)
```javascript
socket.emit('stopQuestion', {
    sessionCode: 'ABC123',
    questionId: 0
});
```

#### 10. Submeter Resposta (Plateia)
```javascript
socket.emit('submitAnswer', {
    sessionCode: 'ABC123',
    questionId: 0,
    answer: 'opt1'  // Para options
    // ou
    // answer: 'yes'  // Para yes_no
    // ou
    // answer: 'Minha resposta texto...'  // Para text
});
```

#### 11. Encerrar Sessão (NOVO v1.17)
```javascript
socket.emit('endSession', {
    sessionCode: 'ABC123'
});
```

#### 12. Logout (NOVO v1.17)
```javascript
socket.emit('logout');
// Desconecta e limpa sessão
```

---

### Servidor → Cliente

#### 1. Nova Pergunta
```javascript
socket.on('newQuestion', (question) => {
    console.log('Pergunta iniciada:', question);
    // {
    //   id: 0,
    //   text: '...',
    //   questionType: 'options',
    //   options: [...],
    //   results: {},
    //   acceptingAnswers: true,
    //   endTime: 1705318305123
    // }
});
```

#### 2. Atualizar Lista de Perguntas
```javascript
socket.on('questionsUpdated', (questions) => {
    console.log('Perguntas atualizadas:', questions);
    // Array com todas as perguntas
});
```

#### 3. Atualizar Resultados
```javascript
socket.on('updateResults', (data) => {
    console.log('Novos resultados:', data);
    // {
    //   results: { opt1: 5, opt2: 3 },
    //   questionType: 'options'
    // }
});
```

#### 4. Votação Encerrada
```javascript
socket.on('votingEnded', (data) => {
    console.log('Votação encerrada:', data);
    // { questionId: 0 }
});
```

#### 5. Sessão Encerrada
```javascript
socket.on('sessionEnded', (data) => {
    console.log('Sessão encerrada:', data);
    // { message: 'Sessão encerrada pelo controller' }
    // Redirecionar para home ou login
});
```

#### 6. Erro
```javascript
socket.on('error', (message) => {
    console.error('Erro:', message);
});
```

#### 7. Controller Desconectado (NOVO v1.17)
```javascript
socket.on('controllerDisplaced', (data) => {
    console.log('Novo controller conectado:', data);
    // Sessão foi transferida para outro controller
});
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Criar e Iniciar Sessão

```javascript
// 1. Conectar ao servidor
const socket = io('http://localhost:3000');

// 2. Criar nova sessão
socket.emit('createSession', {
    controllerPassword: 'admin123',
    presenterPassword: 'presenter456',
    deadline: null
}, (response) => {
    if (response.success) {
        const sessionCode = response.sessionCode;
        console.log('✅ Sessão criada:', sessionCode);
        
        // 3. Entrar como controller
        socket.emit('joinAdminSession', {
            sessionCode,
            password: 'admin123',
            role: 'controller'
        }, (res) => {
            if (res.success) {
                console.log('✅ Controller conectado');
                
                // 4. Criar pergunta
                socket.emit('createQuestion', {
                    sessionCode,
                    question: {
                        text: 'Você gostou?',
                        questionType: 'yes_no'
                    }
                });
                
                // 5. Iniciar votação
                setTimeout(() => {
                    socket.emit('startQuestion', {
                        sessionCode,
                        questionId: 0
                    });
                    console.log('✅ Votação iniciada');
                }, 500);
            }
        });
    }
});
```

### Exemplo 2: Plateia Votando

```javascript
// 1. Conectar e entrar na sessão
const socket = io('http://localhost:3000');

socket.emit('joinAudienceSession', {
    sessionCode: 'ABC123'
});

// 2. Escutar por novas perguntas
socket.on('newQuestion', (question) => {
    if (question.questionType === 'yes_no') {
        // Apresentar opções de votação
        // Botão "Sim" → submitAnswer('yes')
        // Botão "Não" → submitAnswer('no')
    }
});

// 3. Plateia clica em "Sim"
socket.emit('submitAnswer', {
    sessionCode: 'ABC123',
    questionId: 0,
    answer: 'yes'
});

// 4. Escutar resultados atualizados
socket.on('updateResults', (data) => {
    console.log('Resultados:', data.results);
    // { yes: 15, no: 3 }
});
```

### Exemplo 3: Editar e Duplicar Pergunta

```javascript
// Scenario: Controller cria pergunta e depois duplica

// 1. Criar pergunta
socket.emit('createQuestion', {
    sessionCode: 'ABC123',
    question: {
        text: 'Pergunta importante?',
        questionType: 'options',
        options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
            { id: 'c', text: 'C' }
        ]
    }
});

// 2. Editar pergunta (antes de iniciar)
socket.emit('editQuestion', {
    sessionCode: 'ABC123',
    questionId: 0,
    updatedQuestion: {
        text: 'Pergunta mais importante?',  // Mudou texto
        options: [
            { id: 'a', text: 'A - Correto' },
            { id: 'b', text: 'B - Incorreto' },
            { id: 'c', text: 'C - Incorreto' }
        ]
    }
});

// 3. Duplicar para usar similar
socket.emit('duplicateQuestion', {
    sessionCode: 'ABC123',
    questionId: 0  // Cria pergunta 1 com mesmos dados
});

// 4. Escutar atualização
socket.on('questionsUpdated', (questions) => {
    console.log('Total de perguntas:', questions.length);  // 2
});
```

### Exemplo 4: Export de Resultados

```javascript
// JavaScript
async function exportResults(sessionCode, format) {
    const url = `http://localhost:3000/api/export/${sessionCode}/${format}`;
    
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Criar link para download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sessao-${sessionCode}.${format === 'json' ? 'json' : 'csv'}`;
        a.click();
        
        console.log('✅ Arquivo exportado');
    } catch (error) {
        console.error('❌ Erro ao exportar:', error);
    }
}

// Usar:
exportResults('ABC123', 'json');  // Exporta JSON
exportResults('ABC123', 'csv');   // Exporta CSV
```

---

## 🔒 Segurança

### Hash de Senhas (ATIVO)

Quando `ENABLE_PASSWORD_HASHING=true`:

```javascript
// Envio (Cliente)
socket.emit('createSession', {
    controllerPassword: 'minhaSenha123',  // Plaintext na transmissão
    presenterPassword: 'outraSenha456'
});

// Servidor:
// 1. Recebe plaintext
// 2. Hash com bcryptjs
// 3. Armazena hash
// 4. Ao conectar: compara plaintext com hash usando bcryptjs.compare()
```

**Aviso**: Senhas são enviadas em plaintext via WebSocket. Use **HTTPS/WSS em produção**!

### Rate Limiting

Quando `ENABLE_RATE_LIMITING=true`:

```javascript
// Tentativa 1-5: Aceita
socket.emit('joinAdminSession', { sessionCode, password: 'errada' });
// ✅ Conectado

// Tentativa 6 dentro de 60s:
socket.emit('joinAdminSession', { sessionCode, password: 'errada' });
// ❌ { success: false, message: 'Muitas tentativas. Aguarde alguns segundos.' }

// Depois de 60s: Reset, pode tentar novamente
```

---

## 📊 Monitoramento

### Verificar Saúde do Servidor

```bash
# Terminal
curl http://localhost:3000/health

# Ou no navegador
# http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "environment": "local",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "activeSessions": 3
}
```

### Ver Logs em Real-time

```bash
# Se iniciado com:
NODE_ENV=local PORT=3000 node server-v2.js

# Saída:
# [INFO] 2024-01-15T10:30:45.123Z - [SESSION: ABC123] CRIADA
# [INFO] 2024-01-15T10:30:46.456Z - [SESSION: ABC123] CONTROLLER conectado
# [WARN] 2024-01-15T10:30:47.789Z - Rate limit atingido para IP: 127.0.0.1
```

---

## 🧪 Testes com cURL

```bash
# 1. Health Check
curl http://localhost:3000/health | json_pp

# 2. Export JSON
curl http://localhost:3000/api/export/ABC123/json > sessao.json

# 3. Export CSV
curl http://localhost:3000/api/export/ABC123/csv > sessao.csv

# 4. Ver Headers
curl -i http://localhost:3000/health
```

---

## 📱 Cliente JavaScript Completo

```javascript
class MindPoolClient {
    constructor(backendUrl = 'http://localhost:3000') {
        this.socket = io(backendUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true
        });
        this.sessionCode = null;
        this.role = null;
        
        this.socket.on('connect', () => console.log('✅ Conectado'));
        this.socket.on('disconnect', () => console.log('❌ Desconectado'));
    }
    
    createSession(controllerPass, presenterPass, deadline = null) {
        return new Promise((resolve, reject) => {
            this.socket.emit('createSession', 
                { controllerPassword: controllerPass, presenterPassword: presenterPass, deadline },
                (response) => {
                    if (response.success) {
                        this.sessionCode = response.sessionCode;
                        resolve(response.sessionCode);
                    } else {
                        reject(new Error(response.message));
                    }
                }
            );
        });
    }
    
    joinSession(sessionCode, password, role = 'controller') {
        return new Promise((resolve, reject) => {
            this.socket.emit('joinAdminSession', 
                { sessionCode, password, role },
                (response) => {
                    if (response.success) {
                        this.sessionCode = sessionCode;
                        this.role = role;
                        resolve();
                    } else {
                        reject(new Error(response.message));
                    }
                }
            );
        });
    }
    
    createQuestion(text, questionType = 'yes_no', options = null) {
        this.socket.emit('createQuestion', {
            sessionCode: this.sessionCode,
            question: { text, questionType, options }
        });
    }
    
    startQuestion(questionId) {
        this.socket.emit('startQuestion', {
            sessionCode: this.sessionCode,
            questionId
        });
    }
    
    submitAnswer(questionId, answer) {
        this.socket.emit('submitAnswer', {
            sessionCode: this.sessionCode,
            questionId,
            answer
        });
    }
    
    onNewQuestion(callback) {
        this.socket.on('newQuestion', callback);
    }
    
    onUpdateResults(callback) {
        this.socket.on('updateResults', callback);
    }
    
    logout() {
        this.socket.emit('logout');
    }
}

// Uso:
const client = new MindPoolClient();
await client.createSession('pass1', 'pass2');
client.createQuestion('Você gostou?', 'yes_no');
client.onNewQuestion((q) => console.log('Nova pergunta:', q.text));
```

---

## 📚 Referências

- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [bcryptjs GitHub](https://github.com/dcodeIO/bcryptjs)

---

**Versão**: 1.17  
**Atualizado**: 2024
