# 📋 Guia de Atualização - MindPool v1.17

## O que foi implementado?

Esta versão (v1.17) implementa as **principais melhorias sugeridas em MELHORIAS.md** com foco em segurança, funcionalidade e experiência do usuário.

### ✅ Melhorias Implementadas

#### 🔐 Segurança
1. **Hash de Senhas com bcryptjs**
   - Senhas não são mais armazenadas em plaintext
   - Ativa com `ENABLE_PASSWORD_HASHING=true` em `.env`
   - Fallback para desenvolvimento se bcryptjs não estiver instalado

2. **Rate Limiting contra Brute Force**
   - Máximo de 5 tentativas a cada 60 segundos (configurável)
   - Ativa com `ENABLE_RATE_LIMITING=true` em `.env`
   - Rastreamento por IP do cliente

3. **Limpeza Automática de Sessões Expiradas**
   - Sessões expiram após 1440 minutos (24h) por padrão
   - Limpeza automática a cada 5 minutos
   - Configurável em `.env`

4. **Logs Estruturados**
   - Todos os eventos importantes são registrados
   - Níveis de log: DEBUG, INFO, WARN, ERROR
   - Timestamp em ISO8601

#### 🎯 Funcionalidades
5. **Editar Perguntas**
   - `socket.emit('editQuestion', ...)` - Edita pergunta antes de iniciar
   - Não pode editar pergunta ativa

6. **Duplicar Perguntas**
   - `socket.emit('duplicateQuestion', ...)` - Clona uma pergunta
   - Útil para reutilizar perguntas similares

7. **Deletar Perguntas**
   - `socket.emit('deleteQuestion', ...)` - Remove pergunta
   - Não pode deletar pergunta ativa

8. **Parar Votação Manualmente**
   - `socket.emit('stopQuestion', ...)` - Encerra votação
   - Impede novas respostas

9. **Histórico de Sessões**
   - localStorage armazena últimas 10 sessões
   - Botão "📋 Histórico" no menu
   - Reconexão rápida sem digitar código

10. **Múltiplos Presenters**
    - Array `presenterSocketIds[]` em vez de single ID
    - Permite vários presenters na mesma sessão

11. **Export de Resultados**
    - `/api/export/{sessionCode}/json` - Exporta JSON completo
    - `/api/export/{sessionCode}/csv` - Exporta CSV dos resultados

12. **Encerrar Sessão**
    - `socket.emit('endSession', ...)` - Finaliza sessão e desconecta todos

13. **Health Check**
    - `/health` - Monitora saúde do servidor
    - Retorna status, ambiente e contagem de sessões

#### 🎨 UX/UI
14. **Mensagens de Sucesso e Erro**
    - Feedback visual claro de operações
    - Toast notifications (notificações flutuantes)

15. **Validações Aprimoradas**
    - Senhas com mínimo 4 caracteres
    - Senhas diferentes para Controller/Presenter
    - Validação de prazo (não pode ser no passado)

16. **Detecção Automática de Ambiente**
    - Script detecta se é localhost ou produção
    - Conecta automaticamente ao backend correto

---

## 🚀 Como Integrar as Melhorias

### 1️⃣ Atualizar Dependências

```bash
cd /home/alexandre/Documents/GitHub/mindpool/scripts
npm install bcryptjs rate-limiter-flexible
```

### 2️⃣ Usar Novo Servidor

Você tem 2 opções:

**Opção A: Substituir server.js (recomendado)**
```bash
# Backup do servidor antigo
cp server.js server-backup-v1.16.js

# Usar novo servidor
mv server-v2.js server.js

# Se quiser reverter:
cp server-backup-v1.16.js server.js
```

**Opção B: Manter ambos (mais seguro para testes)**
```bash
# Manter server.js intacto
# Usar server-v2.js apenas em desenvolvimento

# Start com v2:
NODE_ENV=local PORT=3000 node server-v2.js

# Start com v1:
NODE_ENV=local PORT=3000 node server.js
```

### 3️⃣ Atualizar Frontend (admin.js)

**Opção A: Substituir admin.js**
```bash
cp scripts/admin.js scripts/admin-backup-v1.16.js
mv scripts/admin-v2.js scripts/admin.js
```

**Opção B: Manter ambos**
```bash
# Ainda suporta o admin.js antigo
# Novo em admin-v2.js é mais avançado
```

### 4️⃣ Configurar Ambiente

```bash
# O arquivo .env já foi criado
cat scripts/.env

# Ajuste conforme necessário:
# - NODE_ENV: local ou production
# - ENABLE_PASSWORD_HASHING: true ou false
# - LOG_LEVEL: DEBUG, INFO, WARN, ERROR
```

### 5️⃣ Iniciar Servidor

```bash
cd scripts

# Desenvolvimento com auto-reload
./start.sh dev

# Ou manualmente
NODE_ENV=local PORT=3000 node server-v2.js

# Ou com npm
npm start  # Usa server.js por padrão
```

### 6️⃣ Testar em Desenvolvimento

Abrir no navegador: **http://localhost:3000**

- Criar nova sessão
- Entrar em sessão
- Testar histórico (clique no botão "📋 Histórico")
- Testar export: `http://localhost:3000/api/export/ABC123/json`
- Testar health: `http://localhost:3000/health`

---

## ⚙️ Configuração Detalhada (.env)

```ini
# Ambiente: local ou production
NODE_ENV=local

# Porta de escuta
PORT=3000

# URLs para CORS
LOCAL_URL=http://localhost:3000
GITHUB_PAGES_URL=https://mindpool.alexandre.pro.br
RENDER_BACKEND_URL=https://mindpool-backend.onrender.com

# Logs: DEBUG, INFO, WARN, ERROR
LOG_LEVEL=INFO

# Hash de senhas (recomendado: true)
ENABLE_PASSWORD_HASHING=true

# Rate limiting (recomendado: true)
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000

# Sessões
SESSION_TIMEOUT=1440        # minutos (1440 = 24h)
SESSION_CLEANUP_INTERVAL=300000  # ms (5 minutos)
```

---

## 📊 Eventos Socket.IO Disponíveis

### ➕ Novos Eventos (v1.17)

```javascript
// Editar pergunta
socket.emit('editQuestion', {
    sessionCode: 'ABC123',
    questionId: 0,
    updatedQuestion: {
        text: 'Nova pergunta',
        options: [...],
        timer: { duration: 30 }
    }
});

// Duplicar pergunta
socket.emit('duplicateQuestion', {
    sessionCode: 'ABC123',
    questionId: 0
});

// Deletar pergunta
socket.emit('deleteQuestion', {
    sessionCode: 'ABC123',
    questionId: 0
});

// Parar votação
socket.emit('stopQuestion', {
    sessionCode: 'ABC123',
    questionId: 0
});

// Encerrar sessão
socket.emit('endSession', {
    sessionCode: 'ABC123'
});

// Logout
socket.emit('logout');
```

---

## 🧪 Testes Manuais

### Teste 1: Hash de Senhas
```bash
# Com ENABLE_PASSWORD_HASHING=true
# Criar sessão com senha "teste123"
# Conectar com mesma senha - deve funcionar
# Conectar com senha errada - deve rejeitar
```

### Teste 2: Rate Limiting
```bash
# Com ENABLE_RATE_LIMITING=true
# Tentar entrar 6 vezes com senha errada
# Deve bloquear por 60 segundos
```

### Teste 3: Histórico de Sessões
```bash
# Criar 3 sessões diferentes
# Clicar em "📋 Histórico"
# Deve listar as 3 últimas
# Clicar "Reconectar" deve pre-preencher código
```

### Teste 4: Export de Resultados
```bash
# Criar sessão ABC123
# Criar pergunta com opções
# Coletar 5 respostas
# Acessar http://localhost:3000/api/export/ABC123/json
# Deve baixar arquivo JSON
# Acessar http://localhost:3000/api/export/ABC123/csv
# Deve baixar arquivo CSV
```

### Teste 5: Ambiente Local vs Produção
```bash
# Desenvolvimento:
NODE_ENV=local PORT=3000 node server-v2.js
# http://localhost:3000 deve funcionar

# Produção (simular):
NODE_ENV=production PORT=3000 node server-v2.js
# frontend.js detecta e conecta a https://mindpool-backend.onrender.com
```

---

## 🔄 Migração de Dados Anteriores

### ⚠️ Importante
- **v1.17 não suporta banco de dados**
- Todas as sessões são perdidas ao reiniciar o servidor
- Implementar banco de dados é a próxima fase

### Salvar Sessões Importantes
```bash
# Antes de atualizar, exportar sessões ativas:
curl http://localhost:3000/api/export/{sessionCode}/json > backup-sessao.json
```

---

## 📱 Compatibilidade

| Recurso | Browser | Mobile | API |
|---------|---------|--------|-----|
| Hash de Senhas | ✅ | ✅ | ✅ |
| Rate Limiting | ✅ | ✅ | ✅ |
| Histórico | ✅ | ✅ | localStorage |
| Export JSON | ✅ | ✅ | ✅ |
| Export CSV | ✅ | ✅ | ✅ |
| Multiple Controllers | ✅ | ✅ | ✅ |
| Logs | - | - | ✅ |

---

## 🐛 Troubleshooting

### "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs
```

### "Rate limit exceeded"
```bash
# Aguarde 60 segundos ou ajuste em .env:
RATE_LIMIT_WINDOW_MS=120000  # 2 minutos
RATE_LIMIT_MAX_ATTEMPTS=10
```

### "Cannot GET /api/export/..."
```bash
# Verificar se sessionCode está correto
# Sessão expirou? Criar nova e testar
```

### CORS error no browser
```bash
# Adicionar URL em getOrigins() em server-v2.js:
const origins = [
    "http://localhost:3000",
    "https://seu-dominio.com"
];
```

---

## 📈 Próximas Melhorias (v1.18+)

- [ ] Banco de dados (PostgreSQL)
- [ ] Persistência de sessões
- [ ] Autenticação de usuários
- [ ] Dashboard com estatísticas
- [ ] API RESTful completa
- [ ] Documentação Swagger
- [ ] Testes automatizados
- [ ] CI/CD com GitHub Actions
- [ ] Customização de temas
- [ ] Suporte a múltiplos idiomas

---

## 📞 Suporte

- 📧 Email: seu-email@gmail.com
- 🐛 Issues: https://github.com/seu-usuario/mindpool/issues
- 💬 Discussões: https://github.com/seu-usuario/mindpool/discussions

---

**Versão**: 1.17  
**Data**: 2024  
**Licença**: GPL-3.0  
**Status**: ✅ Pronto para Produção
