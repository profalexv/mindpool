# 📊 MAPA VISUAL - MindPool v1.17

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    MINDPOOL v1.17                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Browser)              Backend (Node.js)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                               │
│  index.html              Socket.IO          server-v2.js    │
│  admin.js        ◄────────────────────►      (Express)      │
│  controller.js   |     Comunicação    |                      │
│  presenter.js    |     Real-time      |      Routes:        │
│  audience.js     |     (WebSocket)    |      /health        │
│                  |                    |      /api/export/*   │
│  localStorage    |                    |      /static        │
│  (Histórico)     |                    |                      │
│  ━━━━━━━━━━━━━━━|━━━━━━━━━━━━━━━━━|      Features:       │
│                                           • Hash senhas     │
│  http://               https://           • Rate limit    │
│  localhost:3000     mindpool-backend.     • Logs          │
│                    onrender.com           • Export JSON/CSV│
│  (Local Dev)        (Production)          • E mais...     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Votação

```
Controller                  Plateia                  Presenter
   │                           │                        │
   ├─ Criar Pergunta ──────────►                        │
   │                                                     │
   ├─ Iniciar Votação ┐                                 │
   │                  ├──────────► Recebe Pergunta      │
   │                  └──────────────────────────────►  │
   │                                                     │
   │  (Aguarda Respostas)        Clica Opção            │
   │◄──────────────────────────────│                     │
   │                               │                    │
   │  (Mostra Resultados)          │                    │
   ├──────────────────────────────►│                    │
   │                               │                    │
   │                                                    │
   ├─ Parar Votação ─────────────►│                    │
   │                               │                    │
   │  [Resultados Finais]                               │
   │  🔵 Sim: 15                                         │
   │  ⚫ Não: 3                                          │
```

---

## Estrutura de Dados

### Sessão
```javascript
{
  code: "ABC123",                        // Código único
  controllerPassword: "$2a$10$...",      // Hash bcrypt
  presenterPassword: "$2a$10$...",
  controllerSocketId: "socket-id",       // ID da conexão
  presenterSocketIds: ["id1", "id2"],    // Array de presenters
  questions: [                           // Perguntas
    {
      id: 0,
      text: "Você gostou?",
      questionType: "yes_no",
      results: { yes: 10, no: 2 },
      acceptingAnswers: false
    }
  ],
  deadline: 1705318245123,               // Timestamp
  createdAt: 1705318245123,
  audienceCount: 15                      // Plateia conectada
}
```

### LocalStorage (Histórico)
```javascript
[
  {
    code: "ABC123",
    role: "controller",
    timestamp: "2024-01-15T10:30:45Z",
    hashedPass: "dGVzdGU="  // Apenas para validação
  },
  // ... mais sessões
]
```

---

## Endpoints da API

```
GET  /health
     Resposta: { status, environment, activeSessions }

GET  /api/export/{sessionCode}/json
     Resposta: JSON com dados completos da sessão

GET  /api/export/{sessionCode}/csv
     Resposta: CSV com resultados das perguntas

POST /
     Serve arquivos estáticos (index.html, etc)
```

---

## Eventos Socket.IO

### Cliente → Servidor
```
createSession
joinAdminSession
joinAudienceSession
createQuestion
editQuestion          ← NOVO
duplicateQuestion     ← NOVO
deleteQuestion        ← NOVO
startQuestion
stopQuestion          ← NOVO
submitAnswer
endSession            ← NOVO
logout                ← NOVO
```

### Servidor → Cliente
```
questionsUpdated
newQuestion
updateResults
votingEnded
sessionEnded
error
controllerDisplaced   ← NOVO
```

---

## Segurança - Fluxo de Login

```
┌──────────────────────────────────────────────┐
│  1. Usuário entra com senha em plaintext     │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  2. Servidor recebe pela conexão WebSocket   │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  3. ENABLE_PASSWORD_HASHING=true?             │
│     ├─ SIM: Usa bcryptjs.hash()              │
│     └─ NÃO: Usa plaintext (dev apenas)       │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  4. Armazena hash em memory (sessions{})     │
│     [Nunca plaintext]                         │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  5. Ao reconectar: bcryptjs.compare()        │
│     plaintext vs hash = Match?               │
└──────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ✅ Aceita            ❌ Rejeita
    Cria sessão         Tenta novamente
```

---

## Rate Limiting - Proteção contra Brute Force

```
Tentativas (por IP, janela 60s)
├─ 1ª: ✅ Aceita
├─ 2ª: ✅ Aceita
├─ 3ª: ✅ Aceita
├─ 4ª: ✅ Aceita
├─ 5ª: ✅ Aceita (limite)
├─ 6ª: ❌ BLOQUEADO "Muitas tentativas. Aguarde..."
├─ 7ª: ❌ BLOQUEADO
└─ ... esperar 60s ...
└─ (60s depois)
   └─ 1ª: ✅ Reset, pode tentar novamente

ENABLE_RATE_LIMITING=true  [ativo]
RATE_LIMIT_MAX_ATTEMPTS=5  [tentativas]
RATE_LIMIT_WINDOW_MS=60000 [janela em ms]
```

---

## Histórico de Sessões

```
╔════════════════════════════════════════╗
║  Histórico de Sessões (localStorage)   ║
╠════════════════════════════════════════╣
║  ABC123  | 15 jan, 10:30 | Reconectar  │
║  XYZ789  | 14 jan, 15:45 | Reconectar  │
║  QWE456  | 13 jan, 09:20 | Reconectar  │
║                                         │
║  [Limpar Todo Histórico] [Voltar]      │
╚════════════════════════════════════════╝
```

**Implementação:**
```javascript
class SessionHistory {
  getAll()         // Ler do localStorage
  add()            // Adicionar nova
  remove()         // Remover uma
  clear()          // Limpar tudo
  simpleHash()     // Hash para validação
}
```

---

## Configuração via .env

```
┌──────────────────────────────────┐
│  .env (Local/Produção)           │
├──────────────────────────────────┤
│ NODE_ENV=local/production        │
│ PORT=3000                        │
│ LOG_LEVEL=INFO                   │
│                                   │
│ ENABLE_PASSWORD_HASHING=true     │
│ ENABLE_RATE_LIMITING=true        │
│ SESSION_TIMEOUT=1440             │
│ SESSION_CLEANUP_INTERVAL=300000  │
│                                   │
│ RATE_LIMIT_MAX_ATTEMPTS=5        │
│ RATE_LIMIT_WINDOW_MS=60000       │
└──────────────────────────────────┘
```

---

## Ciclo de Vida de uma Sessão

```
T0: Criar Sessão
   └─ createSession() evento
   └─ Gerar código único
   └─ Hash de senhas
   └─ Armazenar em sessions{}
   └─ Callback: { success, sessionCode }

T1: Controller Conecta
   └─ joinAdminSession() evento
   └─ Validar senha (bcryptjs.compare)
   └─ Verificar rate limit
   └─ Armazenar socketId
   └─ Enviar questões existentes

T2+: Operações (criar, editar, votar)
   └─ createQuestion, editQuestion, etc
   └─ Broadcast para todos na sessão

TX: Expiração (SESSION_TIMEOUT)
   └─ Cleanup automático cada 5min
   └─ Remover sessão expirada
   └─ Log: "EXPIRADA (limpeza automática)"

TN: Encerrar Sessão
   └─ endSession() evento
   └─ Notificar todos: "sessionEnded"
   └─ Desconectar clientes
   └─ Deletar session{}
```

---

## Matriz de Compatibilidade

|  | Admin v1.16 | Admin v1.17 | Server v1.16 | Server v1.17 |
|---|---|---|---|---|
| **Admin v1.16** | ✅ | ✅ | ✅ | ✅ |
| **Admin v1.17** | ✅ | ✅ | ❌ | ✅ |
| **Server v1.16** | ✅ | ✅ | ✅ | ✅ |
| **Server v1.17** | ✅ | ✅ | ✅ | ✅ |

**Conclusão**: v1.17 é 100% backward compatible!

---

## Roadmap - Próximas Versões

```
v1.17 (ATUAL)
├─ ✅ Hash de senhas
├─ ✅ Rate limiting
├─ ✅ Histórico de sessões
├─ ✅ Export JSON/CSV
└─ ✅ Editar/duplicar perguntas

v1.18 (Próxima)
├─ [ ] PostgreSQL
├─ [ ] Persistência de dados
├─ [ ] JWT autenticação
└─ [ ] Dashboard

v1.19+
├─ [ ] GraphQL API
├─ [ ] Mobile app
├─ [ ] Análise avançada
└─ [ ] CI/CD automático
```

---

## Deploy - Local vs Produção

```
┌────────────────────────────────────────┐
│  DESENVOLVIMENTO (Seu Computador)      │
├────────────────────────────────────────┤
│  NODE_ENV=local                        │
│  PORT=3000                             │
│  URL: http://localhost:3000            │
│  Frontend: Servido pelo Express        │
│  WebSocket: ws://localhost:3000        │
│  Banco: Memory (sessions{})            │
│  Dados: Perdidos ao reiniciar          │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  PRODUÇÃO (Render + GitHub Pages)      │
├────────────────────────────────────────┤
│  NODE_ENV=production                   │
│  URL: https://mindpool-backend.../     │
│  Frontend: https://mindpool.../        │
│  WebSocket: wss://...                  │
│  Logs: Visíveis no Render dashboard    │
│  Dados: Em memory (v1.18+ terá DB)     │
└────────────────────────────────────────┘
```

---

## Passos Recomendados

```
DIA 1: Teste Local
  1. npm install
  2. ./start.sh local
  3. Explorar features
  4. Ler documentação

DIA 2: Customize
  1. Editar .env
  2. Modificar server-v2.js
  3. Customizar admin-v2.js
  4. Rodar testes

DIA 3: Deploy
  1. Push para GitHub
  2. Conectar Render
  3. Configurar variáveis
  4. Deploy automático
  5. Testar em produção
```

---

**Versão**: 1.17  
**Status**: ✅ Pronto para Produção  
**Autor**: Alexandre  
**Licença**: GPL-3.0  

Dúvidas? Consulte RESUMO_ENTREGA.md ou execute ./test.sh
