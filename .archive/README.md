# 📦 Arquivo de Versões Legadas

Esta pasta contém versões antigas do MindPool que foram consolidadas.

## 📋 Conteúdo

- `server-v1.16.js` - Backend legado (v1.16) - **DESCONTINUADO**
- `admin-v1.16.js` - Interface legada (v1.16) - **DESCONTINUADO**

## ✅ Status Atual

**v1.17** é agora a versão padrão:
- `scripts/server.js` ← server-v1.17 promovido
- `scripts/admin.js` ← admin-v1.17 promovido

## 🔄 Mudanças em v1.17

### Backend (server.js)
- ✅ Hash de senhas com bcryptjs
- ✅ Rate limiting contra brute force
- ✅ Logs estruturados (DEBUG/INFO/WARN/ERROR)
- ✅ Editar/Duplicar/Deletar perguntas
- ✅ Export JSON/CSV de resultados
- ✅ Múltiplos presenters suportados
- ✅ Limpeza automática de sessões

### Frontend (admin.js)
- ✅ Histórico de sessões (localStorage)
- ✅ Detecção automática de ambiente (local/produção)
- ✅ Toast notifications
- ✅ Reconexão automática

## 📖 Se precisar usar v1.16

Restaure os arquivos com:
```bash
cd /home/alexandre/Documents/GitHub/mindpool/scripts
cp ../.archive/server-v1.16.js server.js
cp ../.archive/admin-v1.16.js admin.js
```

Depois reinicie o servidor:
```bash
npm start
```

## 🚀 Recomendação

Mantenha v1.17 como padrão. As versões v1.16 ficam aqui apenas para referência histórica.
