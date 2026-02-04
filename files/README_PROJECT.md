# MindPool - Plataforma Interativa de Apresentações com Votação em Tempo Real

![Version](https://img.shields.io/badge/version-1.16-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![Node](https://img.shields.io/badge/node-14%2B-green)

## 📋 Sumário

**MindPool** é uma plataforma moderna e intuitiva que permite criar sessões interativas de apresentações com votação em tempo real. Perfeita para:

- 👨‍🏫 Educadores e Professores
- 👔 Apresentadores e Palestrantes  
- 📊 Facilitadores de Workshops
- 🎯 Moderadores de Eventos
- 📱 Qualquer pessoa que queira engajar sua audiência

---

## ✨ Características Principais

### 🎯 Fácil de Usar
- Interface intuitiva e responsiva
- Menu principal claro (v1.16)
- Navegação com um clique
- Sem necessidade de instalação complexa

### 🔐 Seguro
- Senhas configuráveis para controller e presenter
- Validação robusta de entrada
- Telas separadas por role (Controller, Presenter, Audience)
- Sessões únicas com código de acesso

### ⚡ Tempo Real
- Votação instantânea
- Resultados em tempo real
- Sincronização via Socket.IO
- Tela de apresentação dinâmica

### 📱 Responsivo
- Funciona em desktop, tablet e mobile
- Design moderno e profissional
- QR Code automático para entrada
- Otimizado para apresentações

### 🎨 Interativo
- Suporta múltiplos tipos de perguntas:
  - Opções (múltipla escolha)
  - Sim/Não
  - Texto curto/longo
  - Números
- Cronômetro configurável
- Resultados em tempo real com gráficos

---

## 🚀 Quick Start (5 Minutos)

### Pré-requisitos
- Node.js 14+
- npm ou yarn

### Instalação Local
```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/mindpool.git
cd mindpool

# 2. Instale dependências
cd scripts
npm install

# 3. Inicie o servidor
node server.js

# 4. Abra em seu navegador
# http://localhost:3000
```

### Usando em Produção
```bash
# O servidor está configurado para rodar em:
# https://mindpool-backend.onrender.com

# Frontend em:
# https://mindpool.alexandre.pro.br
```

---

## 📖 Guia de Uso

### 1️⃣ **Criar uma Sessão** (Controller)

```
Home → "Painel de Controle" → "CRIAR SESSÃO"

Preencha:
├─ Senha do Controller (4+ caracteres)
├─ Senha do Presenter (diferente)
└─ Prazo (opcional)

Resultado:
└─ Código da sessão (ex: ABC123)
```

### 2️⃣ **Adicionar Perguntas**

```
Painel de Controle → "Criar Nova Pergunta"

Configure:
├─ Texto da pergunta
├─ Tipo de resposta (Opções, Sim/Não, Texto, etc)
├─ Opções (se aplicável)
└─ Cronômetro (opcional)

Clique: "Criar Pergunta"
```

### 3️⃣ **Iniciar Apresentação**

```
Painel de Controle → Clique em "Iniciar" na pergunta

Resultado:
├─ Tela de Apresentação exibe a pergunta
├─ QR Code aparece para audiência escanear
├─ Plateia vota em tempo real
└─ Resultados atualizam automaticamente
```

### 4️⃣ **Audiência Responde**

```
Home → Insira código da sessão
       Clique: "Entrar"

Resultado:
├─ Vê a pergunta atual
├─ Clica em uma opção para responder
└─ Recebe confirmação
```

---

## 📁 Estrutura do Projeto

```
mindpool/
│
├── 📄 index.html              # Página inicial
├── 📄 CNAME                   # Configuração DNS (GitHub Pages)
│
├── pages/                     # Páginas da aplicação
│  ├── admin.html              # Acesso (Controller/Presenter)
│  ├── controller.html         # Painel de controle
│  ├── presenter.html          # Tela de apresentação
│  └── audience.html           # Tela de resposta
│
├── scripts/                   # JavaScript
│  ├── server.js               # Backend (Node.js + Express + Socket.IO)
│  ├── admin.js                # Lógica do admin
│  ├── controller.js           # Lógica do painel
│  ├── presenter.js            # Lógica da tela
│  ├── audience.js             # Lógica da plateia
│  ├── cronometro.js           # Timer compartilhado
│  ├── shower.js               # Utilidades
│  ├── index.js                # Lógica da home
│  ├── qrcode.min.js           # Geração de QR Code
│  └── package.json            # Dependências npm
│
├── styles/                    # CSS
│  └── mindpool.css            # Estilos principais
│
├── pictures/                  # Imagens/Assets
│
└── files/                     # Arquivos (unused)
```

---

## 🔧 Configuração Dupla: Local + Produção

### 🏠 Ambiente Local (Desenvolvimento)

```bash
# Inicie o servidor
cd scripts
npm install
node server.js

# Acesse
http://localhost:3000
```

**Benefícios:**
- Sem custo
- Testes rápidos
- Desenvolvimento offline
- Debugging fácil

### ☁️ Ambiente Produção (Render)

```bash
# Frontend hospedado em:
https://mindpool.alexandre.pro.br

# Backend hospedado em:
https://mindpool-backend.onrender.com

# Socket.IO conecta automaticamente ao Render em produção
```

**Scripts/server.js detecta automaticamente:**
```javascript
const RENDER_URL = "https://mindpool-backend.onrender.com";
const LOCAL_URL = "http://localhost:3000";

// Usa o correto baseado no ambiente
```

### 🔄 Como Funciona a Dupla Abordagem

```
┌─────────────────────────────────────┐
│      DESENVOLVIMENTO LOCAL          │
├─────────────────────────────────────┤
│  node server.js                     │
│  http://localhost:3000              │
│  ✓ Rápido                           │
│  ✓ Sem conexão internet             │
│  ✓ Debugging fácil                  │
└─────────────────────────────────────┘
           vs
┌─────────────────────────────────────┐
│       PRODUÇÃO (RENDER/GITHUB)       │
├─────────────────────────────────────┤
│  Render + GitHub Pages              │
│  https://mindpool.pro.br            │
│  ✓ Sempre disponível                │
│  ✓ Escalável                        │
│  ✓ Backups automáticos              │
└─────────────────────────────────────┘
```

### ⚙️ Configuração Automática

O arquivo `scripts/server.js` detecta o ambiente:

```javascript
// Produção (Render)
const io = new Server(server, {
  cors: {
    origin: [
      "https://mindpool.alexandre.pro.br",
      "https://www.mindpool.alexandre.pro.br",
      "http://localhost:3000"  // ← Também suporta local!
    ]
  }
});

// Frontend se conecta automaticamente ao backend correto
const socket = io(
  window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://mindpool-backend.onrender.com'
);
```

---

## 🔐 Segurança

### Implementado (v1.16)
✅ Validação de senhas (4+ caracteres)
✅ Senhas diferentes (Controller vs Presenter)
✅ Trimming de entrada
✅ Validação em cliente e servidor
✅ Tratamento de erros
✅ Socket.IO com CORS configurado

### Recomendado para Futuro
🔜 Hash de senhas (bcrypt)
🔜 Rate limiting
🔜 HTTPS obrigatório
🔜 JWT para autenticação
🔜 Validação CSRF
🔜 Logs de segurança

---

## 📊 Tipos de Perguntas Suportadas

### 1. **Múltipla Escolha (Opções)**
```javascript
{
  type: 'options',
  text: 'Qual é sua opinião?',
  options: [
    { id: 'opt0', text: 'Concordo' },
    { id: 'opt1', text: 'Discordo' },
    { id: 'opt2', text: 'Não sei' }
  ]
}
```

### 2. **Sim / Não**
```javascript
{
  type: 'yes_no',
  text: 'Gostou da apresentação?'
}
```

### 3. **Texto Curto**
```javascript
{
  type: 'short_text',
  text: 'Qual é seu nome?',
  charLimit: 50
}
```

### 4. **Texto Longo**
```javascript
{
  type: 'long_text',
  text: 'O que achou? Deixe seu feedback',
  charLimit: 280
}
```

### 5. **Número**
```javascript
{
  type: 'number',
  text: 'De 1 a 10, qual sua nota?'
}
```

### 6. **Inteiro**
```javascript
{
  type: 'integer',
  text: 'Quantas pessoas vieram?'
}
```

---

## ⏱️ Cronômetro

Configure tempo para cada pergunta:

```javascript
{
  timer: {
    duration: 60,  // segundos
    showToAudience: true  // exibir para plateia
  }
}
```

**Recurso:**
- ⏲️ Conta regressiva automática
- 📱 Visible para audience se configurado
- 🔔 Notificação ao encerrar tempo
- ⚡ Sincronizado com servidor

---

## 🌐 URLs Principais

| Página | URL | Acesso |
|--------|-----|--------|
| **Home** | `/` | Público |
| **Admin (Criar/Entrar)** | `/pages/admin.html` | Controller |
| **Admin (Presenter)** | `/pages/admin.html?role=presenter` | Presenter |
| **Painel de Controle** | `/pages/controller.html?session=ABC123` | Controller |
| **Tela Apresentação** | `/pages/presenter.html?session=ABC123` | Presenter |
| **Responder** | `/pages/audience.html?session=ABC123` | Público |

---

## 📚 Documentação Completa

Documentação detalhada em Markdown:

- **[COMECE_AQUI.md](COMECE_AQUI.md)** - Quick start (5 min)
- **[GUIA_USO.md](GUIA_USO.md)** - Manual visual completo
- **[CHANGELOG.md](CHANGELOG.md)** - Mudanças técnicas
- **[MELHORIAS.md](MELHORIAS.md)** - Roadmap futuro
- **[TESTES.md](TESTES.md)** - 20 testes funcionais

---

## 🤝 Como Contribuir

Contribuições são bem-vindas! Por favor:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Código
- Use camelCase para variáveis
- Adicione comentários para lógica complexa
- Teste em mobile antes de PR
- Siga a estrutura existente

---

## 🐛 Problemas e Suporte

### Relatar um Bug
Abra uma [Issue](https://github.com/seu-usuario/mindpool/issues) com:
- Descrição do problema
- Passos para reproduzir
- Navegador e dispositivo
- Screenshot se possível

### Fazer uma Pergunta
Use [Discussions](https://github.com/seu-usuario/mindpool/discussions)

---

## 📈 Roadmap

### v1.16 ✅ (Atual)
- ✅ Botão "CRIAR SESSÃO"
- ✅ Validações de segurança
- ✅ Menu intuitivo
- ✅ Documentação completa

### v1.17 🔄 (Próxima)
- 🔜 Hash de senhas (bcrypt)
- 🔜 Rate limiting
- 🔜 Histórico de sessões
- 🔜 Export CSV/JSON

### v2.0 📋 (Futuro)
- 🔜 Banco de dados (MongoDB)
- 🔜 Autenticação JWT
- 🔜 Dashboard analytics
- 🔜 Dark mode
- 🔜 Temas customizáveis

---

## 📝 Licença

Este projeto é licenciado sob a **Licença Pública Geral GNU v3.0** - veja o arquivo [LICENSE](LICENSE) para detalhes.

**Resumo GPLv3:**
- ✅ Use livremente
- ✅ Modifique o código
- ✅ Distribua cópias
- ✅ Compartilhe melhorias
- ❌ Feche o código-fonte (se distribuir, deve ser GPL)

---

## 👥 Autores

- **GitHub Copilot** - Implementação v1.16, Documentação, Melhorias

---

## 🎯 Objetivo do Projeto

Criar uma plataforma de código aberto, intuitiva e segura para engajar audiências em apresentações, educação e eventos.

**Missão:** Tornar apresentações interativas acessíveis para todos.

---

## 📞 Contato

- 📧 Email: seu-email@example.com
- 🐦 Twitter: @seu-twitter
- 💬 GitHub Discussions: [Link]

---

## 🙏 Agradecimentos

- Comunidade open-source
- Socket.IO por real-time
- Node.js/Express por backend
- Render por hospedagem

---

**Made with ❤️ for presenters worldwide**

Last updated: 4 de fevereiro de 2026  
Version: 1.16  
Status: Production Ready ✅
