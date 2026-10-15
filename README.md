# 🧮 Scientific Calculator Pro

> **Calculadora Científica e Suíte Matemática Web Multimodo**  
> Desenvolvida com **HTML5 semântico, CSS3 moderno com variáveis de tema, JavaScript modular (ES Modules), PWA e zero dependências externas em tempo de execução.**

---

## 📌 1. Visão Geral do Projeto

O **Scientific Calculator Pro** é uma aplicação matemática completa projetada para atender desde o usuário comum até estudantes de engenharia, cientistas e profissionais. Funciona perfeitamente em computadores de mesa, notebooks, tablets e smartphones (em orientação retrato e paisagem), sem exigir criação de conta, telemetria externa ou conexão com a internet após carregado.

### 🌟 Diferenciais Principais
- **3 Modos Distintos:** Simples (operações do dia a dia), Intermediário (científica clássica) e Expert (laboratório matemático avançado).
- **8 Temas Visuais Personalizáveis:** Azul Oceano (padrão), Claro, Escuro, Grafite, Roxo Real, Verde Esmeralda, Alto Contraste (acessibilidade WCAG) e Automático (sincronizado com o sistema operacional).
- **6 Idiomas Nativos:** Português Brasileiro (`pt-BR`), Inglês (`en`), Espanhol (`es`), Italiano (`it`), Francês (`fr`) e Alemão (`de`).
- **Convenções Regionais Rigorosas:** Formatação localizada de decimais e milhares (`12.345,67` vs `12,345.67`) com suporte inteligente a entradas com vírgula ou ponto decimal.
- **Segurança Absoluta (0% eval):** O motor matemático utiliza Tokenizer próprio + Shunting-Yard + Avaliador RPN em pilha. Nenhuma expressão é executada via `eval()` ou `new Function()`.
- **PWA (Progressive Web App):** Manifesto e Service Worker configurados para instalação nativa e funcionamento 100% offline.
- **Dois Modos de Distribuição:** Edição modular moderna (ES Modules) e edição *Standalone* portátil de arquivo único (basta clicar duas vezes em `standalone.html`).

---

## 🔍 2. Avaliação dos Projetos de Referência e Fusão

Neste projeto, avaliamos detalhadamente três implementações prévias:

| Critério | 🤖 Gemini Argon | 🧠 ChatGPT | ⚡ Grok | 🏆 Scientific Calculator Pro (Definitivo) |
| :--- | :--- | :--- | :--- | :--- |
| **Motor Matemático** | Excepcional: Shunting-Yard + RPN sem dependências | Bom parser próprio recursivo | Falhou: dependia de CDN `window.math` | **Motor Robusto de Alta Precisão (Zero eval, 100% nativo)** |
| **Arquitetura de Arquivos** | Monolítico (HTML único de 203 KB) | Modular com pastas `css/`, `js/`, `tests/` | Modular, mas testes quebrados no Node | **Modular limpo (ESM) + Standalone portátil para clique duplo** |
| **Ferramentas Expert** | Ultra-completo (7 abas detalhadas com GAUSS, Simpson, etc.) | Simplificado (menos categorias e métodos) | Básico e incompleto | **7 Laboratórios Expert Completos (Matrizes, Álgebra, Cálculo, etc.)** |
| **Testes Automatizados** | Modal no navegador (30 testes) | Node.js `node:test` (18 testes) | Erro imediato: `window is not defined` | **39 Testes Automatizados no Node.js (`npm test`) + Modal no App** |
| **Idiomas e Localização** | Dicionários ricos para os 6 idiomas | Chaves básicas | Mínimo | **6 Idiomas Completos em JSON (`locales/`) com Intl.NumberFormat** |
| **Acessibilidade & Temas** | 8 temas com alto contraste e reduced-motion | 8 temas básicos | CSS simples | **8 Paletas CSS Tokens + Foco WCAG + Reduced-Motion** |

---

## 📂 3. Estrutura de Arquivos do Projeto

A pasta contém apenas os arquivos essenciais de produção:

```text
calculator/git/
├── index.html                   # Ponto de entrada modular web responsivo
├── standalone.html              # Edição portátil autocontida (funciona via clique duplo com file://)
├── manifest.json                # Manifesto PWA para instalação no desktop/celular
├── service-worker.js            # Service worker para cacheamento e modo offline
├── package.json                 # Configuração do projeto e scripts npm
├── serve.js                     # Servidor HTTP estático nativo em Node.js (zero dependências)
├── start-windows.bat            # Inicializador de clique único para Windows
├── README.md                    # Documentação completa do projeto
├── .gitignore                   # Arquivos ignorados pelo controle de versão
├── assets/
│   └── icons/
│       └── calculator.svg       # Ícone vetorial nítido e responsivo
├── css/
│   ├── themes.css               # 8 temas com CSS variables e reduced-motion
│   ├── styles.css               # Estilos dos componentes, telas, teclados e modais
│   └── responsive.css           # Breakpoints para desktop, tablet, celular e paisagem
├── js/
│   ├── app.js                   # Controlador da interface do usuário (UI Controller)
│   ├── state.js                 # Gerenciamento de estado centralizado reativo
│   ├── calculator-engine.js     # Memória independente, Ans, frações e histórico
│   ├── expression-parser.js     # Tokenizer, Shunting-Yard, RPN e regras matemáticas
│   ├── formatting.js            # Formatação numérica regional (Intl.NumberFormat)
│   ├── history.js               # Gerenciador de histórico com busca e persistência
│   ├── storage.js               # Persistência segura em LocalStorage com validação de esquema
│   ├── keyboard.js              # Controlador e atalhos de teclado físico
│   ├── i18n.js                  # Motor de tradução e chaveamento de idiomas
│   ├── unit-conversions.js      # Conversões científicas em 13 categorias
│   └── tools/
│       ├── complex.js           # Módulo A: Números complexos (retangular, polar, raízes)
│       ├── matrices.js          # Módulo B: Matrizes, determinantes, inversão e sistemas lineares
│       ├── statistics.js        # Módulo C: Estatística descritiva, quartis e regressão
│       ├── equation-solver.js   # Módulo D: Resolvedor numérico (Bisseção, Newton, Secante)
│       ├── calculus.js          # Módulo E: Derivadas (5 pontos) e Integrais (Simpson adaptativo)
│       └── number-theory.js     # Módulo G: Primos, fatoração, conversão de base e bitwise
├── locales/
│   ├── en.json                  # Inglês
│   ├── es.json                  # Espanhol
│   ├── pt-BR.json               # Português do Brasil
│   ├── it.json                  # Italiano
│   ├── fr.json                  # Francês
│   └── de.json                  # Alemão
└── tests/
    ├── math-tests.test.js       # 29 testes matemáticos obrigatórios e de regressão
    ├── localization.test.js     # 6 testes de internacionalização, formato e armazenamento
    └── interface.test.js        # 4 testes de integridade da UI, PWA e segurança
```

---

## ⚙️ 4. Recursos Detalhados por Modo

### 4.1. Modo Simples
- Aritmética elementar: Adição (`+`), Subtração (`−`), Multiplicação (`×`), Divisão (`÷`).
- Porcentagem contextual e direta (`%`), inversão de sinal (`±`), parênteses, separador decimal e de milhares.
- Limpeza rápida: `C` (limpa expressão), `CE` (limpa entrada atual), `⌫` (backspace).
- Repetição da última operação aritmética ao pressionar `=` sucessivamente.
- Gerenciamento de Memória Dedicado:
  - `MC`: Limpar memória.
  - `MR`: Recuperar memória.
  - `M+`: Somar valor atual à memória.
  - `M−`: Subtrair valor atual da memória.
  - `MS`: Armazenar valor atual na memória.

### 4.2. Modo Intermediário (Científico)
- Todas as operações do Modo Simples.
- **Potenciação e Radiciação:** $x^2$, $x^3$, $x^y$, $1/x$, $\sqrt{x}$, $\sqrt[n]{x}$, $|x|$, $n!$, módulo e resto.
- **Trigonometria Completa:** $\sin$, $\cos$, $\tan$, $\arcsin$, $\arccos$, $\arctan$, $\sinh$, $\cosh$, $\tanh$, $\operatorname{arsinh}$, $\operatorname{arcosh}$, $\operatorname{artanh}$.
- **Unidade Angular Visível e Permanente:** Seletor direto na barra superior e no teclado entre **DEG (Graus)**, **RAD (Radianos)** e **GRAD (Grados)**.
- **Logaritmos e Exponenciais:** $\ln(x)$, $\log_{10}(x)$, $\log_b(x)$, $10^x$, $e^x$, $2^x$.
- **Constantes:** $\pi$ (Pi), $e$ (Euler), $\phi$ (Razão Áurea).
- **Formatos e Frações:** Alternância instantânea para fração racional reduzida ($0.75 \to 3/4$) e notação científica automática para números muito grandes ou pequenos.
- **Multiplicação Implícita Segura:** Suporte a $2\pi$, $3(4+5)$ e $(2+3)(4+5)$.

### 4.3. Modo Expert (Laboratório Avançado)
Acessível no painel lateral ou gaveta contextual:
- **A. Números Complexos:** Forma $a + bi$, módulo, argumento angular (DEG/RAD/GRAD), forma polar $r \angle \theta$, conjugado, potências e $n$ raízes complexas.
- **B. Matrizes e Sistemas Lineares:** Grades editáveis dinamicamente (1×1 até 6×6). Soma, subtração, multiplicação matricial, multiplicação por escalar, transposta, traço, determinante, matriz inversa e resolução de sistemas lineares $A x = b$ com eliminação de Gauss e pivoteamento parcial.
- **C. Estatística e Regressão:** $n$, soma, média, mediana, moda (unimodal/multimodal/amodal), mínimo, máximo, amplitude, variâncias e desvios-padrão (populacional e amostral), quartis $Q_1, Q_2, Q_3$, percentil arbitrário, média ponderada, regressão linear ($y = ax + b$) e coeficiente de correlação de Pearson $r$.
- **D. Resolvedor Numérico de Equações:** Encontra raízes de $f(x) = 0$ pelos métodos de **Bisseção**, **Newton-Raphson** e **Secante**, informando raiz aproximada, resíduo $|f(x)|$, número de iterações e aviso de convergência.
- **E. Cálculo Numérico:** Derivada numérica de 5 pontos $O(h^4)$ com estimativa de erro e segunda derivada; Integral definida numérica pelo método de Simpson adaptativo.
- **F. Conversor de Unidades (13 Categorias):** Comprimento, Área, Volume, Massa, Tempo, Velocidade, Aceleração, Temperatura (com proteção de zero absoluto e fórmulas de ${}^\circ\text{C}$, ${}^\circ\text{F}$, $\text{K}$, ${}^\circ\text{R}$), Pressão, Energia, Potência, Frequência e Ângulo.
- **G. Aritmética Inteira, Primos e Bases:** MDC/GCD, MMC/LCM, Permutações $n\text{P}r$, Combinações $n\text{C}r$, teste de primalidade, decomposição em fatores primos, conversor entre bases 2, 8, 10 e 16, e operações bit a bit (AND, OR, XOR, NOT, Shift).

---

## 🚀 5. Como Executar a Aplicação

Você pode executar a aplicação de quatro maneiras simples:

### Opção A: Executar no Windows com 1 Clique (Recomendado)
Dê um duplo clique no arquivo:
```cmd
start-windows.bat
```
O script detecta se você possui Node.js ou Python 3, inicializa o servidor local em `http://localhost:4173` e abre seu navegador padrão automaticamente. Se nenhum dos dois estiver instalado, abre a versão `standalone.html` imediatamente.

### Opção B: Via Node.js
```bash
# Iniciar o servidor HTTP nativo
npm start
# Ou diretamente:
node serve.js
```
Acesse no navegador: **`http://localhost:4173`**

### Opção C: Via Python 3
```bash
python -m http.server 4173
```
Acesse no navegador: **`http://localhost:4173`**

### Opção D: Execução Offline Portátil (Sem Servidor)
Dê um duplo clique em:
```text
standalone.html
```
Esta versão inclui todo o código empacotado para execução direta pelo protocolo `file://`, sem restrições de CORS entre módulos.

---

## 🧪 6. Testes Automatizados

O projeto conta com uma suíte de **39 testes automatizados** utilizando o test runner nativo do Node.js (`node:test`), cobrindo todos os requisitos matemáticos obrigatórios, internacionalização e interface.

### Como Executar os Testes
```bash
npm test
```
Ou execute individualmente:
```bash
node --test tests/math-tests.test.js
node --test tests/localization.test.js
node --test tests/interface.test.js
```

### Resultados da Execução
```text
✔ index.html contains all essential UI container IDs
✔ no source JS file uses eval() or new Function() to execute math expressions
✔ manifest.json and service-worker.js are valid and offline-ready
✔ all 8 theme selectors exist in css/themes.css
✔ all six locale JSON files exist and have consistent structure
✔ regional number formatting correctly formats decimals and thousands for all locales
✔ parser accepts both comma and dot decimal inputs across cultures
✔ i18n manager correctly translates keys and handles fallback
✔ storage manager saves preferences and safely handles corrupted data
✔ history manager supports adding, retrieving, searching, removing, and clearing items
✔ 1. Basic addition: 2 + 2 = 4
✔ 2. Operator precedence: 2 + 3 × 4 = 14
✔ 3. Parentheses precedence: (2 + 3) × 4 = 20
✔ 4. Exponentiation: 2^10 = 1024
✔ 5. Square root: √81 = 9
✔ 6. Base-10 logarithm: log10(1000) = 3
✔ 7. Natural logarithm: ln(e) = 1
✔ 8. Trigonometry in DEG: sin(30°) = 0.5
✔ 9. Trigonometry in DEG: cos(60°) = 0.5
✔ 10. Angle mode switching: DEG -> RAD -> GRAD
✔ 11. Percentage conversion: 25% = 0.25 and contextual 200 + 10% = 220
✔ 12. Memory operations: MS, M+, M-, MR, MC
✔ 13. Division by zero handling
✔ 14. Logarithm of negative number in real mode
✔ 15. Unclosed parentheses error handling
✔ 16. Invalid character error handling
✔ 17. Matrix multiplication with valid dimensions
✔ 18. Singular matrix inversion error handling
✔ 19. Statistics reference dataset (mean=5, popStdDev=2, median=4.5, mode=[4])
✔ 20. Linear regression computes slope, intercept, and correlation r
✔ 21. Numerical equation solver on x^2 - 9 = 0 on [0, 5] -> root 3
✔ 22. Numerical derivative of x^2 at x = 3 -> 6
✔ 23. Numerical definite integral of x^2 on [0, 3] -> 9
✔ 24. Floating point precision cleanup: 0.1 + 0.2 = 0.3 exact
✔ 25. Implicit multiplication & nested groups: 2(3 + 4(1 + 1)) = 22
✔ 26. Complex arithmetic: (3 + 2i) * (1 + 4i) = -5 + 14i
✔ 27. Unit conversion: temperature 100°C = 212°F = 373.15K
✔ 28. Number theory: prime factorization and base conversion
✔ 29. Rational fraction conversion: 0.75 -> 3/4

ℹ tests 39
ℹ pass 39
ℹ fail 0
```

Além disso, a própria interface possui o botão **"Testes Autom."** na barra superior que roda os testes interativamente em um modal!

---

## ⌨️ 7. Atalhos de Teclado Físico

| Tecla / Atalho | Ação Executada |
| :--- | :--- |
| `0` a `9` | Inserir dígito correspondente |
| `.` ou `,` | Inserir separador decimal regional |
| `+`, `-`, `*`, `/`, `^`, `%` | Operadores matemáticos e potências |
| `(` e `)` | Inserir parênteses de agrupamento |
| `Enter` ou `=` | Calcular expressão ou repetir última operação |
| `Backspace` | Apagar o último caractere digitado |
| `Delete` | Limpar entrada atual (`CE`) |
| `Escape` | Limpar tudo (`AC`) |

---

## 📤 8. Comandos para Enviar para o GitHub

Para publicar o projeto no seu repositório GitHub (`https://github.com/marceloas199/calculator.git`), abra o terminal na pasta `calculator/git` e execute:

```bash
git init
git add .
git commit -m "feat: Scientific Calculator Pro - Complete Multi-Mode Web Application"
git branch -M main
git remote add origin https://github.com/marceloasl99/calculator.git
git push -u origin main
```

*(Se o repositório no GitHub já tiver sido criado com commits divergentes, use `git push -u origin main --force` para inicializar com estes arquivos limpos).*

---

## 📄 Licença

Distribuído sob a licença **MIT**. Uso livre para estudos, engenharia e produção.
