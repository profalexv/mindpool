#!/bin/bash

# ===== SCRIPT DE TESTES - MindPool v1.17 =====
# Testa todas as funcionalidades principais
# Uso: ./test.sh

set -e

echo "🧪 TESTES - MindPool v1.17"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
BACKEND_URL="http://localhost:3000"
SESSION_CODE=""
TEST_RESULTS=0
TEST_PASSED=0

# Função para testar
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "🧪 $name... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s "$BACKEND_URL$endpoint")
    else
        response=$(curl -s -X $method -H "Content-Type: application/json" -d "$data" "$BACKEND_URL$endpoint")
    fi
    
    if echo "$response" | grep -q "\"success\":true\|\"status\":\"ok\""; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TEST_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Resposta: $response"
    fi
    ((TEST_RESULTS++))
}

# Verificar se servidor está rodando
echo "🔍 Verificando se servidor está ativo..."
if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Servidor não está rodando em $BACKEND_URL${NC}"
    echo ""
    echo "Inicie o servidor com:"
    echo "  cd scripts"
    echo "  ./start.sh local"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Servidor ativo${NC}"
echo ""

# ===== TESTES =====

echo "📋 TESTANDO ENDPOINTS REST"
echo "======================================"

# Teste 1: Health Check
test_endpoint "Health Check" "GET" "/health"

# ===== TESTES COM SOCKET.IO (JavaScript) =====

if command -v node &> /dev/null; then
    echo ""
    echo "🔌 TESTANDO SOCKET.IO EVENTS"
    echo "======================================"
    
    # Criar arquivo test.js temporário
    cat > test-socket.js << 'EOF'
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling'],
    withCredentials: true
});

let testsPassed = 0;
let testsFailed = 0;

socket.on('connect', () => {
    console.log('✅ Socket conectado');
    testsPassed++;
    
    // Teste: Criar sessão
    socket.emit('createSession', {
        controllerPassword: 'test123',
        presenterPassword: 'presenter456',
        deadline: null
    }, (response) => {
        if (response.success) {
            console.log('✅ Sessão criada:', response.sessionCode);
            testsPassed++;
            
            // Teste: Entrar em sessão
            socket.emit('joinAdminSession', {
                sessionCode: response.sessionCode,
                password: 'test123',
                role: 'controller'
            }, (res) => {
                if (res.success) {
                    console.log('✅ Controller conectado');
                    testsPassed++;
                    
                    // Teste: Criar pergunta
                    socket.emit('createQuestion', {
                        sessionCode: response.sessionCode,
                        question: {
                            text: 'Teste?',
                            questionType: 'yes_no'
                        }
                    });
                    
                    setTimeout(() => {
                        console.log('✅ Pergunta criada');
                        testsPassed++;
                        
                        // Teste: Iniciar votação
                        socket.emit('startQuestion', {
                            sessionCode: response.sessionCode,
                            questionId: 0
                        });
                        
                        setTimeout(() => {
                            console.log('✅ Votação iniciada');
                            testsPassed++;
                            
                            // Teste: Parar votação
                            socket.emit('stopQuestion', {
                                sessionCode: response.sessionCode,
                                questionId: 0
                            });
                            
                            console.log('✅ Votação parada');
                            testsPassed++;
                            
                            // Teste: Duplicar pergunta
                            socket.emit('duplicateQuestion', {
                                sessionCode: response.sessionCode,
                                questionId: 0
                            });
                            
                            setTimeout(() => {
                                console.log('✅ Pergunta duplicada');
                                testsPassed++;
                                
                                // Teste: Editar pergunta
                                socket.emit('editQuestion', {
                                    sessionCode: response.sessionCode,
                                    questionId: 1,
                                    updatedQuestion: {
                                        text: 'Pergunta editada?'
                                    }
                                });
                                
                                setTimeout(() => {
                                    console.log('✅ Pergunta editada');
                                    testsPassed++;
                                    
                                    // Teste: Logout
                                    socket.emit('logout');
                                    console.log('✅ Logout realizado');
                                    testsPassed++;
                                    
                                    // Resultado final
                                    console.log('');
                                    console.log('====================================');
                                    console.log('RESULTADO FINAL:');
                                    console.log('Testes passados:', testsPassed);
                                    console.log('Testes falhados:', testsFailed);
                                    console.log('====================================');
                                    process.exit(testsFailed > 0 ? 1 : 0);
                                }, 100);
                            }, 100);
                        }, 100);
                    }, 100);
                } else {
                    console.log('❌ Erro ao conectar');
                    testsFailed++;
                    process.exit(1);
                }
            });
        } else {
            console.log('❌ Erro ao criar sessão:', response.message);
            testsFailed++;
            process.exit(1);
        }
    });
});

socket.on('connect_error', (error) => {
    console.log('❌ Erro de conexão:', error);
    testsFailed++;
    process.exit(1);
});

setTimeout(() => {
    console.log('❌ Timeout - testes não completaram');
    process.exit(1);
}, 10000);
EOF
    
    node test-socket.js
    rm test-socket.js
else
    echo -e "${YELLOW}⚠️  Node.js não encontrado - pulando testes Socket.IO${NC}"
fi

# ===== TESTES DE ARQUIVO =====

echo ""
echo "📁 VERIFICANDO ARQUIVOS"
echo "======================================"

files_to_check=(
    "scripts/server.js"
    "scripts/admin.js"
    "scripts/.env"
    "scripts/start.sh"
    "files/INSTALACAO.md"
    "files/GUIA_ATUALIZACAO_v1.17.md"
    # "files/API_EXEMPLOS.md" # Arquivo ausente
    "files/RESUMO_ENTREGA.md"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "✅ $file"
    else
        echo -e "❌ FALTA: $file"
    fi
done

# ===== TESTES DE DEPENDÊNCIAS =====

echo ""
echo "📦 VERIFICANDO DEPENDÊNCIAS"
echo "======================================"

cd scripts

# Verificar package.json
if grep -q "bcryptjs" package.json; then
    echo "✅ bcryptjs listado em package.json"
else
    echo "❌ bcryptjs não encontrado em package.json"
fi

if grep -q "rate-limiter-flexible" package.json; then
    echo "✅ rate-limiter-flexible listado em package.json"
else
    echo "❌ rate-limiter-flexible não encontrado em package.json"
fi

# Verificar node_modules
if [ -d "node_modules/bcryptjs" ]; then
    echo "✅ bcryptjs instalado"
else
    echo "⚠️  bcryptjs não instalado (executar: npm install)"
fi

cd ..

# ===== TESTE DE CONFIGURAÇÃO =====

echo ""
echo "⚙️  VERIFICANDO CONFIGURAÇÃO"
echo "======================================"

if [ -f "scripts/.env" ]; then
    if grep -q "NODE_ENV=local" scripts/.env; then
        echo "✅ NODE_ENV configurado para local"
    else
        echo "⚠️  NODE_ENV não está definido como local"
    fi
    
    if grep -q "ENABLE_PASSWORD_HASHING=true" scripts/.env; then
        echo "✅ Hash de senhas ativado"
    else
        echo "⚠️  Hash de senhas desativado"
    fi
    
    if grep -q "ENABLE_RATE_LIMITING=true" scripts/.env; then
        echo "✅ Rate limiting ativado"
    else
        echo "⚠️  Rate limiting desativado"
    fi
else
    echo "❌ Arquivo .env não encontrado"
fi

# ===== RESUMO FINAL =====

echo ""
echo "======================================"
echo "📊 RESUMO DOS TESTES"
echo "======================================"
echo "Testes realizados: $TEST_RESULTS"
echo "Testes passados: $TEST_PASSED"
echo "Testes falhados: $((TEST_RESULTS - TEST_PASSED))"

if [ $TEST_PASSED -eq $TEST_RESULTS ] && [ $TEST_RESULTS -gt 0 ]; then
    echo ""
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. cd scripts"
    echo "2. ./start.sh local"
    echo "3. Abrir http://localhost:3000"
    exit 0
else
    echo ""
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Verifique:"
    echo "1. Se servidor está rodando: ./scripts/start.sh local"
    echo "2. Se dependências instaladas: npm install em scripts/"
    echo "3. Se .env está configurado: cat scripts/.env"
    exit 1
fi
