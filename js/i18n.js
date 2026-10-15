// --- js/i18n.js ---
/**
 * Scientific Calculator Pro — Internationalization Engine (6 Languages)
 */
const TRANSLATIONS = {
  "en": {
    "appTitle": "Scientific Calculator Pro",
    "appSubtitle": "Multi-Mode Mathematical & Engineering Suite",
    "modes": {
      "simple": "Simple",
      "intermediate": "Intermediate",
      "expert": "Expert"
    },
    "themes": {
      "light": "Light",
      "dark": "Dark",
      "auto": "System Auto",
      "graphite": "Graphite",
      "ocean": "Ocean Blue",
      "purple": "Royal Purple",
      "emerald": "Emerald Green",
      "high-contrast": "High Contrast"
    },
    "angles": {
      "DEG": "Degrees (DEG)",
      "RAD": "Radians (RAD)",
      "GRAD": "Gradians (GRAD)"
    },
    "labels": {
      "expression": "Current Expression",
      "result": "Result",
      "memory": "Memory",
      "ans": "Last Answer",
      "fraction": "Fraction",
      "scientific": "Sci Notation",
      "history": "History",
      "expertTools": "Expert Lab",
      "tests": "Automated Tests",
      "masterPrompt": "Master Prompt",
      "settings": "Settings",
      "help": "Shortcuts & Help",
      "clearHistory": "Clear History",
      "confirmClearHistory": "Confirm Clear All",
      "searchHistory": "Filter calculations...",
      "emptyHistory": "No calculations recorded yet.",
      "copyExpr": "Copy expression",
      "copyRes": "Copy result",
      "reuse": "Load",
      "delete": "Delete",
      "copied": "Copied to clipboard!",
      "calculate": "Calculate",
      "reset": "Reset Defaults",
      "close": "Close",
      "runTests": "Run All 30 Automated Tests",
      "allPassed": "All tests passed!",
      "approxNotice": "Numerical approximation (within configured tolerance).",
      "trigSin": "sin",
      "trigCos": "cos",
      "trigTan": "tan",
      "trigAsin": "asin",
      "trigAcos": "acos",
      "trigAtan": "atan"
    },
    "expertTabs": {
      "complex": "Complex (a+bi)",
      "matrices": "Matrices",
      "statistics": "Statistics",
      "solver": "Equation Solver",
      "calculus": "Calculus (d/dx, ∫)",
      "units": "Unit Converter",
      "numberTheory": "Primes & Bases"
    },
    "unitCategories": {
      "length": "Length",
      "area": "Area",
      "volume": "Volume",
      "mass": "Mass",
      "time": "Time",
      "speed": "Speed",
      "acceleration": "Acceleration",
      "temperature": "Temperature",
      "pressure": "Pressure",
      "energy": "Energy",
      "power": "Power",
      "frequency": "Frequency",
      "angle": "Angle"
    },
    "errors": {
      "ERR_EMPTY": "Enter an expression to calculate.",
      "ERR_SYNTAX": "Malformed mathematical expression.",
      "ERR_DIV_ZERO": "Division by zero is undefined.",
      "ERR_NEG_SQRT": "Real root of a negative number is undefined (use Expert Complex tab).",
      "ERR_LOG_DOMAIN": "Logarithm argument must be strictly positive (x > 0).",
      "ERR_FACT_DOMAIN": "Factorial requires a non-negative integer (n ≥ 0).",
      "ERR_TRIG_DOMAIN": "Value is outside the valid domain of this trigonometric function.",
      "ERR_OVERFLOW": "Numerical overflow: result exceeds IEEE 754 limits.",
      "ERR_UNCLOSED_PAREN": "Unbalanced or unclosed parentheses in expression.",
      "ERR_UNKNOWN_FUNC": "Unknown function or identifier.",
      "ERR_INVALID_CHAR": "Invalid character detected in expression.",
      "ERR_INVALID_ARG": "Invalid numerical argument for this operation.",
      "ERR_COMB_DOMAIN": "Permutations/combinations require integers with 0 ≤ r ≤ n.",
      "ERR_DIM_MISMATCH": "Incompatible matrix dimensions for this operation.",
      "ERR_NOT_SQUARE_MATRIX": "Operation requires a square matrix (n × n).",
      "ERR_SINGULAR_MATRIX": "Singular matrix (determinant = 0): inverse or unique solution does not exist.",
      "ERR_STAT_EMPTY": "Enter at least one valid numerical observation.",
      "ERR_SOLVER_INTERVAL": "Invalid interval: lower bound a must be less than upper bound b.",
      "ERR_BISECTION_SIGN": "Bisection requires f(a) and f(b) to have opposite signs.",
      "ERR_ZERO_DERIVATIVE": "Derivative vanished near current estimate; try another starting value.",
      "ERR_MAX_ITER": "Maximum iterations reached before meeting convergence tolerance.",
      "ERR_DIVERGED": "Numerical iteration diverged.",
      "ERR_CALC_DISCONTINUITY": "Function is undefined or discontinuous in the specified interval.",
      "ERR_COMPLEX_ZERO_ARG": "Argument of 0 + 0i is undefined.",
      "ERR_LIMIT_EXCEEDED": "Input exceeds safety bound (10¹²) to prevent UI blocking.",
      "ERR_INVALID_BASE_DIGIT": "Number contains digits invalid for the selected base.",
      "ERR_ABS_ZERO": "Temperature cannot be below absolute zero (0 K / -273.15 °C)."
    }
  },
  "es": {
    "appTitle": "Scientific Calculator Pro",
    "appSubtitle": "Suite Matemática y Científica Multimodo",
    "modes": {
      "simple": "Simple",
      "intermediate": "Intermedio",
      "expert": "Experto"
    },
    "themes": {
      "light": "Claro",
      "dark": "Oscuro",
      "auto": "Automático",
      "graphite": "Grafito",
      "ocean": "Azul Océano",
      "purple": "Púrpura",
      "emerald": "Verde Esmeralda",
      "high-contrast": "Alto Contraste"
    },
    "angles": {
      "DEG": "Grados (DEG)",
      "RAD": "Radianes (RAD)",
      "GRAD": "Gradianes (GRAD)"
    },
    "labels": {
      "expression": "Expresión Actual",
      "result": "Resultado",
      "memory": "Memoria",
      "ans": "Último Resultado",
      "fraction": "Fracción",
      "scientific": "Notación Cient.",
      "history": "Historial",
      "expertTools": "Panel Experto",
      "tests": "Pruebas Autom.",
      "masterPrompt": "Prompt Maestro",
      "settings": "Ajustes",
      "help": "Atajos y Ayuda",
      "clearHistory": "Borrar Historial",
      "confirmClearHistory": "Confirmar Borrado",
      "searchHistory": "Buscar en el historial...",
      "emptyHistory": "Aún no hay cálculos registrados.",
      "copyExpr": "Copiar expresión",
      "copyRes": "Copiar resultado",
      "reuse": "Usar",
      "delete": "Eliminar",
      "copied": "¡Copiado al portapapeles!",
      "calculate": "Calcular",
      "reset": "Restaurar Valores",
      "close": "Cerrar",
      "runTests": "Ejecutar 30 Pruebas Automatizadas",
      "allPassed": "¡Todas las pruebas aprobadas!",
      "approxNotice": "Aproximación numérica (dentro de la tolerancia configurada).",
      "trigSin": "sen",
      "trigCos": "cos",
      "trigTan": "tan",
      "trigAsin": "arcsen",
      "trigAcos": "arccos",
      "trigAtan": "arctan"
    },
    "expertTabs": {
      "complex": "Complejos (a+bi)",
      "matrices": "Matrices",
      "statistics": "Estadística",
      "solver": "Ecuaciones",
      "calculus": "Cálculo (d/dx, ∫)",
      "units": "Unidades",
      "numberTheory": "Primos y Bases"
    },
    "unitCategories": {
      "length": "Longitud",
      "area": "Área",
      "volume": "Volumen",
      "mass": "Masa",
      "time": "Tiempo",
      "speed": "Velocidad",
      "acceleration": "Aceleración",
      "temperature": "Temperatura",
      "pressure": "Presión",
      "energy": "Energía",
      "power": "Potencia",
      "frequency": "Frecuencia",
      "angle": "Ángulo"
    },
    "errors": {
      "ERR_EMPTY": "Ingrese una expresión para calcular.",
      "ERR_SYNTAX": "Expresión matemática mal formada.",
      "ERR_DIV_ZERO": "No es posible dividir entre cero.",
      "ERR_NEG_SQRT": "Raíz real de número negativo indefinida (use el módulo Complejos).",
      "ERR_LOG_DOMAIN": "El argumento del logaritmo debe ser mayor que cero (x > 0).",
      "ERR_FACT_DOMAIN": "El factorial requiere un entero no negativo (n ≥ 0).",
      "ERR_TRIG_DOMAIN": "Valor fuera del dominio válido de la función trigonométrica.",
      "ERR_OVERFLOW": "Desbordamiento numérico: el resultado supera el límite IEEE 754.",
      "ERR_UNCLOSED_PAREN": "Paréntesis incompletos o sin cerrar en la expresión.",
      "ERR_UNKNOWN_FUNC": "Función o identificador desconocido.",
      "ERR_INVALID_CHAR": "Carácter no permitido en la expresión.",
      "ERR_INVALID_ARG": "Argumento numérico inválido para esta operación.",
      "ERR_COMB_DOMAIN": "Permutaciones y combinaciones requieren enteros con 0 ≤ r ≤ n.",
      "ERR_DIM_MISMATCH": "Dimensiones de matriz incompatibles para esta operación.",
      "ERR_NOT_SQUARE_MATRIX": "La operación requiere una matriz cuadrada (n × n).",
      "ERR_SINGULAR_MATRIX": "Matriz singular (determinante = 0): no tiene inversa ni solución única.",
      "ERR_STAT_EMPTY": "Ingrese al menos un dato numérico válido.",
      "ERR_SOLVER_INTERVAL": "Intervalo inválido: el límite inferior a debe ser menor que b.",
      "ERR_BISECTION_SIGN": "El método de bisección requiere que f(a) y f(b) tengan signos opuestos.",
      "ERR_ZERO_DERIVATIVE": "Derivada nula cerca de la estimación; pruebe otro valor inicial.",
      "ERR_MAX_ITER": "Se alcanzó el máximo de iteraciones sin converger.",
      "ERR_DIVERGED": "La iteración numérica divergió.",
      "ERR_CALC_DISCONTINUITY": "Función indefinida o discontinua en el intervalo indicado.",
      "ERR_COMPLEX_ZERO_ARG": "El argumento de 0 + 0i es indefinido.",
      "ERR_LIMIT_EXCEEDED": "El valor supera el límite de seguridad (10¹²).",
      "ERR_INVALID_BASE_DIGIT": "El número contiene dígitos inválidos para la base seleccionada.",
      "ERR_ABS_ZERO": "La temperatura no puede ser inferior al cero absoluto (0 K)."
    }
  },
  "pt-BR": {
    "appTitle": "Scientific Calculator Pro",
    "appSubtitle": "Suíte Matemática e Científica Multimodo",
    "modes": {
      "simple": "Simples",
      "intermediate": "Intermediário",
      "expert": "Expert"
    },
    "themes": {
      "light": "Claro",
      "dark": "Escuro",
      "auto": "Automático",
      "graphite": "Grafite",
      "ocean": "Azul Oceano",
      "purple": "Roxo",
      "emerald": "Verde Esmeralda",
      "high-contrast": "Alto Contraste"
    },
    "angles": {
      "DEG": "Graus (DEG)",
      "RAD": "Radianos (RAD)",
      "GRAD": "Grados (GRAD)"
    },
    "labels": {
      "expression": "Expressão Atual",
      "result": "Resultado",
      "memory": "Memória",
      "ans": "Último Resultado",
      "fraction": "Fração",
      "scientific": "Notação Cient.",
      "history": "Histórico",
      "expertTools": "Painel Expert",
      "tests": "Testes Autom.",
      "masterPrompt": "Prompt Mestre",
      "settings": "Configurações",
      "help": "Atalhos e Ajuda",
      "clearHistory": "Limpar Histórico",
      "confirmClearHistory": "Confirmar Exclusão",
      "searchHistory": "Pesquisar no histórico...",
      "emptyHistory": "Nenhum cálculo registrado até o momento.",
      "copyExpr": "Copiar expressão",
      "copyRes": "Copiar resultado",
      "reuse": "Recuperar",
      "delete": "Excluir",
      "copied": "Copiado para a área de transferência!",
      "calculate": "Calcular",
      "reset": "Redefinir Preferências",
      "close": "Fechar",
      "runTests": "Executar 30 Testes Automatizados",
      "allPassed": "Todos os testes foram aprovados!",
      "approxNotice": "Aproximação numérica (dentro da tolerância configurada).",
      "trigSin": "sen",
      "trigCos": "cos",
      "trigTan": "tan",
      "trigAsin": "arcsen",
      "trigAcos": "arccos",
      "trigAtan": "arctan"
    },
    "expertTabs": {
      "complex": "Complexos (a+bi)",
      "matrices": "Matrizes",
      "statistics": "Estatística",
      "solver": "Equações",
      "calculus": "Cálculo (d/dx, ∫)",
      "units": "Unidades",
      "numberTheory": "Primos e Bases"
    },
    "unitCategories": {
      "length": "Comprimento",
      "area": "Área",
      "volume": "Volume",
      "mass": "Massa",
      "time": "Tempo",
      "speed": "Velocidade",
      "acceleration": "Aceleração",
      "temperature": "Temperatura",
      "pressure": "Pressão",
      "energy": "Energia",
      "power": "Potência",
      "frequency": "Frequência",
      "angle": "Ângulo"
    },
    "errors": {
      "ERR_EMPTY": "Digite uma expressão para calcular.",
      "ERR_SYNTAX": "Expressão matemática malformada.",
      "ERR_DIV_ZERO": "Divisão por zero não é definida.",
      "ERR_NEG_SQRT": "Raiz real de número negativo indefinida (use a aba Complexos no modo Expert).",
      "ERR_LOG_DOMAIN": "O argumento do logaritmo deve ser estritamente positivo (x > 0).",
      "ERR_FACT_DOMAIN": "Fatorial requer um número inteiro não negativo (n ≥ 0).",
      "ERR_TRIG_DOMAIN": "Valor fora do domínio válido para esta função trigonométrica.",
      "ERR_OVERFLOW": "Overflow numérico: o resultado excede os limites IEEE 754.",
      "ERR_UNCLOSED_PAREN": "Parênteses incompletos ou não fechados na expressão.",
      "ERR_UNKNOWN_FUNC": "Função ou identificador desconhecido.",
      "ERR_INVALID_CHAR": "Caractere não permitido detectado na expressão.",
      "ERR_INVALID_ARG": "Argumento numérico inválido para esta operação.",
      "ERR_COMB_DOMAIN": "Permutações e combinações exigem inteiros com 0 ≤ r ≤ n.",
      "ERR_DIM_MISMATCH": "Dimensões de matrizes incompatíveis para esta operação.",
      "ERR_NOT_SQUARE_MATRIX": "Esta operação exige uma matriz quadrada (n × n).",
      "ERR_SINGULAR_MATRIX": "Matriz singular (determinante = 0): não possui inversa nem solução única.",
      "ERR_STAT_EMPTY": "Insira pelo menos uma observação numérica válida.",
      "ERR_SOLVER_INTERVAL": "Intervalo inválido: o limite inferior a deve ser menor que b.",
      "ERR_BISECTION_SIGN": "O método da bisseção exige que f(a) e f(b) tenham sinais opostos.",
      "ERR_ZERO_DERIVATIVE": "Derivada nula próxima à estimativa; tente outro valor inicial.",
      "ERR_MAX_ITER": "Número máximo de iterações atingido sem convergência.",
      "ERR_DIVERGED": "A iteração numérica divergiu.",
      "ERR_CALC_DISCONTINUITY": "Função indefinida ou descontínua no intervalo informado.",
      "ERR_COMPLEX_ZERO_ARG": "O argumento de 0 + 0i é indefinido.",
      "ERR_LIMIT_EXCEEDED": "O valor excede o limite de segurança (10¹²) para preservar a fluidez.",
      "ERR_INVALID_BASE_DIGIT": "O valor contém dígitos inválidos para a base numérica selecionada.",
      "ERR_ABS_ZERO": "A temperatura não pode ser inferior ao zero absoluto (0 K / -273,15 °C)."
    }
  },
  "it": {
    "appTitle": "Scientific Calculator Pro",
    "appSubtitle": "Suite Matematica e Scientifica Multimodale",
    "modes": {
      "simple": "Semplice",
      "intermediate": "Intermedio",
      "expert": "Esperto"
    },
    "themes": {
      "light": "Chiaro",
      "dark": "Scuro",
      "auto": "Automatico",
      "graphite": "Grafite",
      "ocean": "Blu Oceano",
      "purple": "Viola",
      "emerald": "Verde Smeraldo",
      "high-contrast": "Alto Contrasto"
    },
    "angles": {
      "DEG": "Gradi (DEG)",
      "RAD": "Radianti (RAD)",
      "GRAD": "Gradi Cent. (GRAD)"
    },
    "labels": {
      "expression": "Espressione Corrente",
      "result": "Risultato",
      "memory": "Memoria",
      "ans": "Ultimo Risultato",
      "fraction": "Frazione",
      "scientific": "Notazione Scient.",
      "history": "Cronologia",
      "expertTools": "Strumenti Esperto",
      "tests": "Test Automatici",
      "masterPrompt": "Prompt Master",
      "settings": "Impostazioni",
      "help": "Scorciatoie e Guida",
      "clearHistory": "Cancella Cronologia",
      "confirmClearHistory": "Conferma Cancellazione",
      "searchHistory": "Cerca nella cronologia...",
      "emptyHistory": "Nessun calcolo registrato.",
      "copyExpr": "Copia espressione",
      "copyRes": "Copia risultato",
      "reuse": "Usa",
      "delete": "Elimina",
      "copied": "Copiato negli appunti!",
      "calculate": "Calcola",
      "reset": "Ripristina Predefiniti",
      "close": "Chiudi",
      "runTests": "Esegui 30 Test Automatici",
      "allPassed": "Tutti i test sono stati superati!",
      "approxNotice": "Approssimazione numerica (entro la tolleranza configurata).",
      "trigSin": "sen",
      "trigCos": "cos",
      "trigTan": "tan",
      "trigAsin": "arcsen",
      "trigAcos": "arccos",
      "trigAtan": "arctan"
    },
    "expertTabs": {
      "complex": "Complessi (a+bi)",
      "matrices": "Matrici",
      "statistics": "Statistica",
      "solver": "Equazioni",
      "calculus": "Calcolo (d/dx, ∫)",
      "units": "Unità",
      "numberTheory": "Primi e Basi"
    },
    "unitCategories": {
      "length": "Lunghezza",
      "area": "Area",
      "volume": "Volume",
      "mass": "Massa",
      "time": "Tempo",
      "speed": "Velocità",
      "acceleration": "Accelerazione",
      "temperature": "Temperatura",
      "pressure": "Pressione",
      "energy": "Energia",
      "power": "Potenza",
      "frequency": "Frequenza",
      "angle": "Angolo"
    },
    "errors": {
      "ERR_EMPTY": "Inserisci un'espressione da calcolare.",
      "ERR_SYNTAX": "Espressione matematica non valida.",
      "ERR_DIV_ZERO": "La divisione per zero non è definita.",
      "ERR_NEG_SQRT": "Radice reale di un numero negativo non definita (usa Complessi).",
      "ERR_LOG_DOMAIN": "L'argomento del logaritmo deve essere positivo (x > 0).",
      "ERR_FACT_DOMAIN": "Il fattoriale richiede un intero non negativo (n ≥ 0).",
      "ERR_TRIG_DOMAIN": "Valore fuori dal dominio valido per la funzione trigonometrica.",
      "ERR_OVERFLOW": "Overflow numerico: il risultato supera i limiti IEEE 754.",
      "ERR_UNCLOSED_PAREN": "Parentesi non bilanciate o non chiuse nell'espressione.",
      "ERR_UNKNOWN_FUNC": "Funzione o identificatore sconosciuto.",
      "ERR_INVALID_CHAR": "Carattere non consentito nell'espressione.",
      "ERR_INVALID_ARG": "Argomento numerico non valido per questa operazione.",
      "ERR_COMB_DOMAIN": "Permutazioni e combinazioni richiedono interi con 0 ≤ r ≤ n.",
      "ERR_DIM_MISMATCH": "Dimensioni delle matrici incompatibili per questa operazione.",
      "ERR_NOT_SQUARE_MATRIX": "L'operazione richiede una matrice quadrata (n × n).",
      "ERR_SINGULAR_MATRIX": "Matrice singolare (determinante = 0): inversa non esistente.",
      "ERR_STAT_EMPTY": "Inserisci almeno un valore numerico valido.",
      "ERR_SOLVER_INTERVAL": "Intervallo non valido: il limite inferiore a deve essere minore di b.",
      "ERR_BISECTION_SIGN": "Il metodo di bisezione richiede che f(a) e f(b) abbiano segni opposti.",
      "ERR_ZERO_DERIVATIVE": "Derivata nulla vicino alla stima; prova un altro valore iniziale.",
      "ERR_MAX_ITER": "Numero massimo di iterazioni raggiunto senza convergenza.",
      "ERR_DIVERGED": "L'iterazione numerica è divergente.",
      "ERR_CALC_DISCONTINUITY": "Funzione non definita o discontinua nell'intervallo specificato.",
      "ERR_COMPLEX_ZERO_ARG": "L'argomento di 0 + 0i non è definito.",
      "ERR_LIMIT_EXCEEDED": "Il valore supera il limite di sicurezza (10¹²).",
      "ERR_INVALID_BASE_DIGIT": "Il numero contiene cifre non valide per la base selezionata.",
      "ERR_ABS_ZERO": "La temperatura non può essere inferiore allo zero assoluto (0 K)."
    }
  },
  "fr": {
    "appTitle": "Scientific Calculator Pro",
    "appSubtitle": "Suite Mathématique et Scientifique Multimode",
    "modes": {
      "simple": "Simple",
      "intermediate": "Intermédiaire",
      "expert": "Expert"
    },
    "themes": {
      "light": "Clair",
      "dark": "Sombre",
      "auto": "Automatique",
      "graphite": "Graphite",
      "ocean": "Bleu Océan",
      "purple": "Violet",
      "emerald": "Vert Émeraude",
      "high-contrast": "Contraste Élevé"
    },
    "angles": {
      "DEG": "Degrés (DEG)",
      "RAD": "Radians (RAD)",
      "GRAD": "Grades (GRAD)"
    },
    "labels": {
      "expression": "Expression Actuelle",
      "result": "Résultat",
      "memory": "Mémoire",
      "ans": "Dernier Résultat",
      "fraction": "Fraction",
      "scientific": "Notation Scient.",
      "history": "Historique",
      "expertTools": "Outils Expert",
      "tests": "Tests Auto.",
      "masterPrompt": "Prompt Maître",
      "settings": "Paramètres",
      "help": "Raccourcis et Aide",
      "clearHistory": "Vider l'historique",
      "confirmClearHistory": "Confirmer la suppression",
      "searchHistory": "Rechercher dans l'historique...",
      "emptyHistory": "Aucun calcul enregistré pour le moment.",
      "copyExpr": "Copier l'expression",
      "copyRes": "Copier le résultat",
      "reuse": "Utiliser",
      "delete": "Supprimer",
      "copied": "Copié dans le presse-papiers !",
      "calculate": "Calculer",
      "reset": "Réinitialiser",
      "close": "Fermer",
      "runTests": "Exécuter les 30 Tests Automatisés",
      "allPassed": "Tous les tests ont réussi !",
      "approxNotice": "Approximation numérique (dans la tolérance configurée).",
      "trigSin": "sin",
      "trigCos": "cos",
      "trigTan": "tan",
      "trigAsin": "arcsin",
      "trigAcos": "arccos",
      "trigAtan": "arctan"
    },
    "expertTabs": {
      "complex": "Complexes (a+bi)",
      "matrices": "Matrices",
      "statistics": "Statistiques",
      "solver": "Équations",
      "calculus": "Calcul (d/dx, ∫)",
      "units": "Unités",
      "numberTheory": "Premiers et Bases"
    },
    "unitCategories": {
      "length": "Longueur",
      "area": "Surface",
      "volume": "Volume",
      "mass": "Masse",
      "time": "Temps",
      "speed": "Vitesse",
      "acceleration": "Accélération",
      "temperature": "Température",
      "pressure": "Pression",
      "energy": "Énergie",
      "power": "Puissance",
      "frequency": "Fréquence",
      "angle": "Angle"
    },
    "errors": {
      "ERR_EMPTY": "Saisissez une expression à calculer.",
      "ERR_SYNTAX": "Expression mathématique mal formée.",
      "ERR_DIV_ZERO": "La division par zéro n'est pas définie.",
      "ERR_NEG_SQRT": "Racine réelle d'un nombre négatif non définie (utilisez Complexes).",
      "ERR_LOG_DOMAIN": "L'argument du logarithme doit être strictement positif (x > 0).",
      "ERR_FACT_DOMAIN": "La factorielle requiert un entier naturel (n ≥ 0).",
      "ERR_TRIG_DOMAIN": "Valeur hors du domaine de définition de la fonction trigonométrique.",
      "ERR_OVERFLOW": "Dépassement numérique : le résultat excède les limites IEEE 754.",
      "ERR_UNCLOSED_PAREN": "Parenthèses non équilibrées ou non fermées dans l'expression.",
      "ERR_UNKNOWN_FUNC": "Fonction ou identifiant inconnu.",
      "ERR_INVALID_CHAR": "Caractère non autorisé dans l'expression.",
      "ERR_INVALID_ARG": "Argument numérique invalide pour cette opération.",
      "ERR_COMB_DOMAIN": "Permutations et combinaisons exigent des entiers avec 0 ≤ r ≤ n.",
      "ERR_DIM_MISMATCH": "Dimensions de matrices incompatibles pour cette opération.",
      "ERR_NOT_SQUARE_MATRIX": "Cette opération requiert une matrice carrée (n × n).",
      "ERR_SINGULAR_MATRIX": "Matrice singulière (déterminant = 0) : pas d'inverse ni de solution unique.",
      "ERR_STAT_EMPTY": "Veuillez saisir au moins une valeur numérique valide.",
      "ERR_SOLVER_INTERVAL": "Intervalle invalide : la borne inférieure a doit être inférieure à b.",
      "ERR_BISECTION_SIGN": "La dichotomie exige que f(a) et f(b) soient de signes opposés.",
      "ERR_ZERO_DERIVATIVE": "Dérivée nulle près de l'estimation ; essayez une autre valeur initiale.",
      "ERR_MAX_ITER": "Nombre maximal d'itérations atteint sans convergence.",
      "ERR_DIVERGED": "L'itération numérique a divergé.",
      "ERR_CALC_DISCONTINUITY": "Fonction non définie ou discontinue sur l'intervalle indiqué.",
      "ERR_COMPLEX_ZERO_ARG": "L'argument de 0 + 0i n'est pas défini.",
      "ERR_LIMIT_EXCEEDED": "La valeur dépasse la limite de sécurité (10¹²).",
      "ERR_INVALID_BASE_DIGIT": "Le nombre contient des chiffres invalides pour la base choisie.",
      "ERR_ABS_ZERO": "La température ne peut pas être inférieure au zéro absolu (0 K)."
    }
  },
  "de": {
    "appTitle": "Scientific Calculator Pro",
    "appSubtitle": "Multimodale Mathematik- & Wissenschafts-Suite",
    "modes": {
      "simple": "Einfach",
      "intermediate": "Mittel",
      "expert": "Experte"
    },
    "themes": {
      "light": "Hell",
      "dark": "Dunkel",
      "auto": "Systemstandard",
      "graphite": "Graphit",
      "ocean": "Ozeanblau",
      "purple": "Violett",
      "emerald": "Smaragdgrün",
      "high-contrast": "Hoher Kontrast"
    },
    "angles": {
      "DEG": "Grad (DEG)",
      "RAD": "Bogenmaß (RAD)",
      "GRAD": "Gon (GRAD)"
    },
    "labels": {
      "expression": "Aktueller Ausdruck",
      "result": "Ergebnis",
      "memory": "Speicher",
      "ans": "Letztes Ergebnis",
      "fraction": "Bruch",
      "scientific": "Wiss. Notation",
      "history": "Verlauf",
      "expertTools": "Experten-Labor",
      "tests": "Auto-Tests",
      "masterPrompt": "Master-Prompt",
      "settings": "Einstellungen",
      "help": "Tastatur & Hilfe",
      "clearHistory": "Verlauf löschen",
      "confirmClearHistory": "Löschen bestätigen",
      "searchHistory": "Verlauf durchsuchen...",
      "emptyHistory": "Noch keine Berechnungen im Verlauf.",
      "copyExpr": "Ausdruck kopieren",
      "copyRes": "Ergebnis kopieren",
      "reuse": "Laden",
      "delete": "Löschen",
      "copied": "In die Zwischenablage kopiert!",
      "calculate": "Berechnen",
      "reset": "Zurücksetzen",
      "close": "Schließen",
      "runTests": "Alle 30 automatisierten Tests starten",
      "allPassed": "Alle Tests erfolgreich bestanden!",
      "approxNotice": "Numerische Näherung (innerhalb der konfigurierten Toleranz).",
      "trigSin": "sin",
      "trigCos": "cos",
      "trigTan": "tan",
      "trigAsin": "arcsin",
      "trigAcos": "arccos",
      "trigAtan": "arctan"
    },
    "expertTabs": {
      "complex": "Komplex (a+bi)",
      "matrices": "Matrizen",
      "statistics": "Statistik",
      "solver": "Gleichungen",
      "calculus": "Analysis (d/dx, ∫)",
      "units": "Einheiten",
      "numberTheory": "Primzahlen & Basen"
    },
    "unitCategories": {
      "length": "Länge",
      "area": "Fläche",
      "volume": "Volumen",
      "mass": "Masse",
      "time": "Zeit",
      "speed": "Geschwindigkeit",
      "acceleration": "Beschleunigung",
      "temperature": "Temperatur",
      "pressure": "Druck",
      "energy": "Energie",
      "power": "Leistung",
      "frequency": "Frequenz",
      "angle": "Winkel"
    },
    "errors": {
      "ERR_EMPTY": "Bitte geben Sie einen mathematischen Ausdruck ein.",
      "ERR_SYNTAX": "Ungültiger mathematischer Ausdruck.",
      "ERR_DIV_ZERO": "Division durch Null ist nicht definiert.",
      "ERR_NEG_SQRT": "Reelle Wurzel einer negativen Zahl ist nicht definiert (siehe Komplex).",
      "ERR_LOG_DOMAIN": "Das Argument des Logarithmus muss strikt positiv sein (x > 0).",
      "ERR_FACT_DOMAIN": "Fakultät erfordert eine nichtnegative ganze Zahl (n ≥ 0).",
      "ERR_TRIG_DOMAIN": "Wert liegt außerhalb des gültigen Definitionsbereichs.",
      "ERR_OVERFLOW": "Numerischer Überlauf: Ergebnis überschreitet IEEE-754-Grenzen.",
      "ERR_UNCLOSED_PAREN": "Unvollständige oder nicht geschlossene Klammern im Ausdruck.",
      "ERR_UNKNOWN_FUNC": "Unbekannte Funktion oder Variable.",
      "ERR_INVALID_CHAR": "Ungültiges Zeichen im Ausdruck erkannt.",
      "ERR_INVALID_ARG": "Ungültiges numerisches Argument für diese Operation.",
      "ERR_COMB_DOMAIN": "Permutationen/Kombinationen erfordern ganze Zahlen mit 0 ≤ r ≤ n.",
      "ERR_DIM_MISMATCH": "Inkompatible Matrixdimensionen für diese Operation.",
      "ERR_NOT_SQUARE_MATRIX": "Diese Operation erfordert eine quadratische Matrix (n × n).",
      "ERR_SINGULAR_MATRIX": "Singuläre Matrix (Determinante = 0): keine Inverse vorhanden.",
      "ERR_STAT_EMPTY": "Bitte mindestens einen gültigen Zahlenwert eingeben.",
      "ERR_SOLVER_INTERVAL": "Ungültiges Intervall: untere Grenze a muss kleiner als b sein.",
      "ERR_BISECTION_SIGN": "Bisektionsverfahren erfordert unterschiedliche Vorzeichen für f(a) und f(b).",
      "ERR_ZERO_DERIVATIVE": "Ableitung nahe Null; bitte anderen Startwert wählen.",
      "ERR_MAX_ITER": "Maximale Iterationsanzahl ohne Konvergenz erreicht.",
      "ERR_DIVERGED": "Numerische Iteration divergiert.",
      "ERR_CALC_DISCONTINUITY": "Funktion ist im angegebenen Intervall unstetig oder nicht definiert.",
      "ERR_COMPLEX_ZERO_ARG": "Das Argument von 0 + 0i ist nicht definiert.",
      "ERR_LIMIT_EXCEEDED": "Eingabe überschreitet Sicherheitsgrenze (10¹²).",
      "ERR_INVALID_BASE_DIGIT": "Zahl enthält ungültige Ziffern für die gewählte Basis.",
      "ERR_ABS_ZERO": "Temperatur kann nicht unter dem absoluten Nullpunkt (0 K) liegen."
    }
  }
};

class I18nManager {
  constructor(initialLocale = 'pt-BR') {
    this.locale = TRANSLATIONS[initialLocale] ? initialLocale : 'en';
  }

  setLocale(locale) {
    if (TRANSLATIONS[locale]) {
      this.locale = locale;
    } else {
      const short = String(locale || '').split('-')[0];
      if (short === 'pt') this.locale = 'pt-BR';
      else if (TRANSLATIONS[short]) this.locale = short;
      else this.locale = 'en';
    }
    return this.locale;
  }

  t(path, fallback = '') {
    const parts = String(path).split('.');
    let curr = TRANSLATIONS[this.locale] || TRANSLATIONS.en;
    for (const p of parts) {
      if (curr && Object.prototype.hasOwnProperty.call(curr, p)) {
        curr = curr[p];
      } else {
        curr = null;
        break;
      }
    }
    if (curr !== null && curr !== undefined) return curr;
    // Fallback to English
    let enCurr = TRANSLATIONS.en;
    for (const p of parts) {
      if (enCurr && Object.prototype.hasOwnProperty.call(enCurr, p)) {
        enCurr = enCurr[p];
      } else {
        return fallback || path;
      }
    }
    return enCurr || fallback || path;
  }

  translateError(err) {
    const code = err && err.code ? err.code : 'ERR_SYNTAX';
    return this.t(`errors.${code}`, this.t('errors.ERR_SYNTAX'));
  }
}

export {
  TRANSLATIONS,
  I18nManager
};
