# 🚀 Guia de Instalação - MindPool v1.17

## Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** (vem com Node.js)
- **Git** (para versionamento)

## Instalação Local (Desenvolvimento)

### 1. Clonar o repositório

```bash
cd /home/alexandre/Documents/GitHub
git clone https://github.com/seu-usuario/mindpool.git
cd mindpool/scripts
```

### 2. Instalar dependências

```bash
npm install
```

Isso vai instalar:
- `express` - Framework web
- `socket.io` - Comunicação real-time
- `bcryptjs` - Hash de senhas
- `dotenv` - Variáveis de ambiente
- `rate-limiter-flexible` - Proteção contra brute force

### 3. Configurar arquivo .env

```bash
# Copiar arquivo de exemplo (ou usar o que já existe)
cat .env

# O arquivo já deve conter:
# NODE_ENV=local
# PORT=3000
# ENABLE_PASSWORD_HASHING=true
# ENABLE_RATE_LIMITING=true
```

### 4. Iniciar o servidor local

```bash
# Opção 1: Com script (recomendado)
./start.sh local

# Opção 2: Comando direto
NODE_ENV=local PORT=3000 node server-v2.js

# Opção 3: Com nodemon (auto-reload quando mudar código)
npm install -g nodemon
./start.sh dev
```

### 5. Acessar a aplicação

Abrir no navegador: **http://localhost:3000**

## Configuração para Produção (Render/GitHub)

### 1. Deploy no Render

1. Conectar repositório GitHub no [Render.com](https://render.com)
2. Criar novo Web Service
3. Configurações:
   - **Build Command**: `npm install`
   - **Start Command**: `node server-v2.js`
   - **Environment**: Production
   - **PORT**: 3000 (Render vai usar porta própria)

### 2. Variáveis de Ambiente (Render Dashboard)

```
NODE_ENV=production
PORT=3000
ENABLE_PASSWORD_HASHING=true
ENABLE_RATE_LIMITING=true
SESSION_TIMEOUT=1440
LOG_LEVEL=INFO
```

### 3. GitHub Pages (Frontend)

A configuração de frontend já existe em:
- `index.html` - Página inicial
- `pages/admin.html` - Interface de admin
- `pages/controller.html` - Interface de controller
- `pages/presenter.html` - Interface de presenter
- `pages/audience.html` - Interface de plateia
- `scripts/admin.js` - Lógica de admin
- `styles/mindpool.css` - Estilos

## Estrutura do Projeto

```
mindpool/
├── scripts/
│   ├── server-v2.js        # ✨ Novo servidor melhorado (v1.17)
│   ├── server.js           # Servidor original (backup)
│   ├── package.json        # Dependências (atualizado)
│   ├── .env               # Configuração local
│   ├── .env.example       # Exemplo de configuração
│   ├── start.sh           # Script para iniciar
│   ├── admin.js           # Lógica de admin (frontend)
│   ├── controller.js      # Lógica de controller (frontend)
│   ├── presenter.js       # Lógica de presenter (frontend)
│   ├── audience.js        # Lógica de plateia (frontend)
│   ├── index.js           # Lógica geral (frontend)
│   ├── shower.js          # Efeitos e animações
│   └── cronometro.js      # Gerenciamento de timer
├── pages/
│   ├── admin.html         # Interface de admin
│   ├── controller.html    # Interface de controller
│   ├── presenter.html     # Interface de presenter
│   └── audience.html      # Interface de plateia
├── styles/
│   └── mindpool.css       # Estilos globais
├── index.html             # Página inicial
└── CHANGELOG.md           # Histórico de versões
```

## Melhorias Implementadas (v1.17)

### ✅ Segurança
- [x] **Hash de senhas** com bcryptjs
- [x] **Rate limiting** contra brute force
- [x] **Limpeza automática** de sessões expiradas
- [x] **Logs estruturados** de todas as ações

### ✅ Funcionalidades
- [x] **Editar perguntas** antes de iniciar
- [x] **Duplicar perguntas** para reutilizar
- [x] **Deletar perguntas** antes de iniciar
- [x] **Encerrar sessão** pelo controller
- [x] **Múltiplos presenters** na mesma sessão
- [x] **Parar votação** manualmente
- [x] **Export de resultados** (JSON/CSV)
- [x] **Histórico de sessões** (localStorage)

### ✅ Experiência do Usuário
- [x] **Confirmação visual** ao responder
- [x] **Mensagens de erro** mais claras
- [x] **Validações** aprimoradas
- [x] **Health check** para monitorar servidor

## Troubleshooting

### Erro: "Cannot find module 'bcryptjs'"

```bash
# Solução:
npm install bcryptjs
```

### Erro: "Port 3000 já está em uso"

```bash
# Solução 1: Usar outra porta
PORT=3001 node server-v2.js

# Solução 2: Ver qual processo está usando (Linux/Mac)
lsof -i :3000
kill -9 <PID>
```

### Conexão refused em produção

1. Verificar se Render está rodando: https://mindpool-backend.onrender.com/health
2. Checar variáveis de ambiente no Render dashboard
3. Ver logs no Render: Deploy → Logs

### CORS error no navegador

Se ver "Access to XMLHttpRequest blocked by CORS", verificar:
1. Variável `GITHUB_PAGES_URL` está correta em `.env`
2. Origem no navegador está na lista de `getOrigins()` em server-v2.js

## Comandos Úteis

```bash
# Instalação de dependências
npm install

# Iniciar desenvolvimento
npm run dev
# ou
./start.sh dev

# Listar processos Node
ps aux | grep node

# Ver logs em real-time (Render)
render logs <web-service-id>

# Teste de health check
curl http://localhost:3000/health

# Teste de export (JSON)
curl http://localhost:3000/api/export/ABC123/json

# Teste de export (CSV)
curl http://localhost:3000/api/export/ABC123/csv
```

## Proximas Melhorias

- [ ] Banco de dados para persistência
- [ ] Autenticação de usuários
- [ ] Dashboard com estatísticas
- [ ] Histórico de todas as sessões
- [ ] Customização de temas
- [ ] API RESTful completa
- [ ] Documentação Swagger

## Contato & Suporte

- 📧 Email: seu-email@gmail.com
- 🐛 Issues: https://github.com/seu-usuario/mindpool/issues
- 📚 Wiki: https://github.com/seu-usuario/mindpool/wiki

---

**Versão**: 1.17  
**Última atualização**: 2024  
**Licença**: GPL-3.0
