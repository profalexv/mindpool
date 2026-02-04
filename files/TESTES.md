# 🧪 Guia de Testes - MindPool v1.16

## 📋 Testes Funcionais

### 1. Teste do Menu Principal

**Objetivo**: Verificar se o menu principal exibe corretamente

**Passos**:
```
1. Abra /pages/admin.html
2. Verifique se vê dois botões grandes:
   ✓ ➕ CRIAR SESSÃO (verde)
   ✓ 🔗 ENTRAR EM SESSÃO (azul)
3. Verifique o título "Acesso Administrativo"
```

**Resultado Esperado**: ✅ Menu exibido com dois botões destacados

---

### 2. Teste do Botão "CRIAR SESSÃO"

**Objetivo**: Verificar se o fluxo de criação funciona

**Passos**:
```
1. Clique no botão "➕ CRIAR SESSÃO"
2. Verifique se aparecem os campos:
   ✓ Prazo Final (data picker)
   ✓ Senha do Controller
   ✓ Senha do Presenter
   ✓ Botão "Criar e Entrar"
   ✓ Botão "← Voltar"
3. Tente preencher com senhas válidas:
   - Controller: "test123"
   - Presenter: "test456"
4. Clique em "Criar e Entrar"
5. Verifique redirecionamento para controller.html
```

**Resultado Esperado**: ✅ Redireciona para painel de controle

---

### 3. Teste do Botão "ENTRAR EM SESSÃO"

**Objetivo**: Verificar fluxo de entrada

**Passos**:
```
1. Clique no botão "🔗 ENTRAR EM SESSÃO"
2. Verifique campos exibidos:
   ✓ Código da Sessão
   ✓ Senha
   ✓ Botão "Entrar"
   ✓ Botão "← Voltar"
3. Tente entrar com código inválido
4. Verifique mensagem de erro
```

**Resultado Esperado**: ✅ Exibe erro "Sessão não encontrada"

---

### 4. Teste dos Botões "Voltar"

**Objetivo**: Verificar navegação de volta

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Clique em "← Voltar"
3. Verifique se volta ao menu principal
4. Repita com "ENTRAR EM SESSÃO"
```

**Resultado Esperado**: ✅ Volta ao menu principal

---

## 🔐 Testes de Validação

### 5. Teste - Senhas Vazias

**Objetivo**: Verificar se senhas vazias são rejeitadas

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. NÃO preencha as senhas
3. Clique em "Criar e Entrar"
```

**Resultado Esperado**: 
```
⚠️ Mensagem: "Por favor, preencha ambas as senhas."
Fundo: Vermelho claro
Botão: Permanece habilitado
```

---

### 6. Teste - Senha Muito Curta

**Objetivo**: Validar comprimento mínimo

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Preencha:
   - Controller: "ab" (2 caracteres)
   - Presenter: "test"
3. Clique em "Criar e Entrar"
```

**Resultado Esperado**:
```
⚠️ Mensagem: "Senha do Controller deve ter 4+ caracteres"
```

---

### 7. Teste - Senhas Iguais

**Objetivo**: Validar se senhas são diferentes

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Preencha ambas com: "test1234"
3. Clique em "Criar e Entrar"
```

**Resultado Esperado**:
```
⚠️ Mensagem: "Senhas devem ser diferentes"
```

---

### 8. Teste - Prazo no Passado

**Objetivo**: Validar prazo futuro

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Selecione data: ontem
3. Preencha senhas válidas
4. Clique em "Criar e Entrar"
```

**Resultado Esperado**:
```
⚠️ Mensagem: "Prazo não pode ser no passado"
```

---

### 9. Teste - Campo Vazio ao Entrar

**Objetivo**: Validar campos obrigatórios

**Passos**:
```
1. Clique em "ENTRAR EM SESSÃO"
2. Preencha apenas o Código
3. Clique em "Entrar"
```

**Resultado Esperado**:
```
⚠️ Mensagem: "Código e senha são obrigatórios"
```

---

## 🎨 Testes de UI/UX

### 10. Teste - Feedback Visual ao Clicar

**Objetivo**: Verificar desabilidade do botão

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Preencha senhas válidas
3. Clique em "Criar e Entrar"
4. Observe o botão
```

**Resultado Esperado**:
```
✓ Botão fica desabilitado (cinza)
✓ Texto muda para "Criando..."
✓ Após sucesso: volta normal
```

---

### 11. Teste - Cores dos Botões

**Objetivo**: Verificar design

**Passos**:
```
1. Abra /pages/admin.html
2. Verifique cores:
   - "CRIAR SESSÃO": Verde (#27ae60)
   - "ENTRAR EM SESSÃO": Azul (#3498db)
   - "Voltar": Cinza (#95a5a6)
```

**Resultado Esperado**: ✅ Cores corretas

---

### 12. Teste - Hover Effects

**Objetivo**: Verificar interatividade

**Passos**:
```
1. Passe o mouse sobre "CRIAR SESSÃO"
2. Verifique efeito hover:
   - Cor mais escura
   - Ligeira elevação (transform)
3. Repita com outros botões
```

**Resultado Esperado**: ✅ Efeitos visuais

---

## 📱 Testes de Responsividade

### 13. Teste - Mobile (320px)

**Objetivo**: Verificar layout em celular

**Passos**:
```
1. Abra DevTools (F12)
2. Selecione "Toggle Device Toolbar"
3. Escolha "iPhone 12 mini" (320px)
4. Recarregue a página
5. Verifique:
   - Botões se ajustam
   - Texto legível
   - Sem overflow horizontal
```

**Resultado Esperado**: ✅ Layout perfeito

---

### 14. Teste - Tablet (768px)

**Objetivo**: Verificar em tablet

**Passos**:
```
1. DevTools → Tablet (768px)
2. Verifique tamanho dos botões
3. Verifique espaçamento
```

**Resultado Esperado**: ✅ Layout correto

---

### 15. Teste - Desktop (1024px+)

**Objetivo**: Verificar em computador

**Passos**:
```
1. DevTools → Desktop
2. Verifique alinhamento central
3. Verifique tamanho de botões
```

**Resultado Esperado**: ✅ Layout correto

---

## 🔄 Testes de Fluxo Completo

### 16. Teste - Criar e Usar Sessão

**Objetivo**: Fluxo completo de criar e usar

**Passos**:
```
1. Acesse /pages/admin.html
2. Clique em "CRIAR SESSÃO"
3. Preencha:
   - Prazo: (deixe vazio ou escolha futuro)
   - Controller: "senha123"
   - Presenter: "senha456"
4. Clique em "Criar e Entrar"
5. Verifique redirecionamento para /pages/controller.html
6. Verifique código de sessão na URL
7. Volte (botão voltar do navegador)
8. Teste "ENTRAR EM SESSÃO" com mesmo código
```

**Resultado Esperado**: ✅ Fluxo completo funciona

---

### 17. Teste - Presenter Flow

**Objetivo**: Verificar fluxo do presenter

**Passos**:
```
1. Acesse /pages/admin.html?role=presenter
2. Verifique:
   - Título: "Acesso: Presenter"
   - Menu criação oculto
   - Apenas "ENTRAR EM SESSÃO" visível
3. Tente entrar com código/senha válida
4. Verifique redirecionamento para presenter.html
```

**Resultado Esperado**: ✅ Presenter vê apenas opção de entrar

---

## 🐛 Testes de Edge Cases

### 18. Teste - Espaços em Branco

**Objetivo**: Verificar trimming

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Preencha senhas com espaços:
   - " test123 "
   - " test456 "
3. Clique em "Criar e Entrar"
```

**Resultado Esperado**: ✅ Espaços removidos, criação bem-sucedida

---

### 19. Teste - Caracteres Especiais

**Objetivo**: Verificar segurança

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Preencha com caracteres especiais:
   - "test@123#$%"
   - "pass&*()()"
3. Clique em "Criar e Entrar"
```

**Resultado Esperado**: ✅ Aceita caracteres especiais

---

### 20. Teste - Muito Longo

**Objetivo**: Verificar senhas longas

**Passos**:
```
1. Clique em "CRIAR SESSÃO"
2. Preencha com senhas longas (50+ caracteres)
3. Clique em "Criar e Entrar"
```

**Resultado Esperado**: ✅ Aceita (sem limite documentado)

---

## ✅ Checklist de Testes

### Testes Funcionais
- [ ] Menu principal exibe
- [ ] Botão "CRIAR SESSÃO" funciona
- [ ] Botão "ENTRAR EM SESSÃO" funciona
- [ ] Botões "Voltar" funcionam
- [ ] Redireciona após criar/entrar
- [ ] Mensagens de erro aparecem

### Testes de Validação
- [ ] Senhas vazias - rejeitadas
- [ ] Senhas curtas - rejeitadas
- [ ] Senhas iguais - rejeitadas
- [ ] Prazo no passado - rejeitado
- [ ] Campos vazios - rejeitados

### Testes de UI
- [ ] Cores corretas
- [ ] Hover effects funcionam
- [ ] Botões desabilitam ao clicar
- [ ] Mensagens têm cor de erro
- [ ] Focus automático em campos

### Testes de Responsividade
- [ ] Mobile (320px) - OK
- [ ] Tablet (768px) - OK
- [ ] Desktop (1024px+) - OK
- [ ] Sem scroll horizontal
- [ ] Texto legível

### Testes de Fluxo
- [ ] Criar sessão completo
- [ ] Entrar em sessão completo
- [ ] Presenter flow
- [ ] Trocar entre opções
- [ ] Voltar do painel

---

## 📊 Resultado Final

**Total de Testes**: 20  
**Áreas Cobertas**: 6
- Funcionalidades
- Validações
- UI/UX
- Responsividade
- Fluxos Completos
- Edge Cases

---

## 🚀 Como Executar Testes

### Terminal
```bash
# Iniciar servidor
cd /home/alexandre/Documents/GitHub/mindpool/scripts
npm install
node server.js

# Em outro terminal
# Abrir browser em http://localhost:3000/pages/admin.html
```

### Browser DevTools
```
Pressionar F12 para abrir Developer Tools
- Console: Ver erros
- Network: Ver requisições
- Device Toolbar: Testar responsividade
```

---

**Versão**: 1.16  
**Data**: 4 de fevereiro de 2026
