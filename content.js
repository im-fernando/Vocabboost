let isShiftPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        isShiftPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        isShiftPressed = false;
    }
});

document.addEventListener('mouseover', (e) => {
    if (!isShiftPressed) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    
    try {
        // Tenta selecionar o texto sob o cursor
        range.setStart(e.target, 0);
        range.setEnd(e.target, e.target.textContent.length);
        
        // Obtém a palavra sob o cursor
        const text = e.target.textContent;
        const rect = e.target.getBoundingClientRect();
        
        // Calcula a posição relativa do mouse dentro do elemento
        const x = e.clientX - rect.left;
        const words = text.split(/\s+/);
        let currentPosition = 0;
        
        // Encontra a palavra específica sob o cursor
        for (let word of words) {
            const wordStart = text.indexOf(word, currentPosition);
            const wordEnd = wordStart + word.length;
            const wordRect = getTextWidth(text.substring(0, wordStart));
            
            if (x >= wordRect && x <= wordRect + getTextWidth(word)) {
                showPopup(word, e.clientX, e.clientY);
                break;
            }
            
            currentPosition = wordEnd;
        }
    } catch (error) {
        // Ignora erros de seleção
    }
});

function createInitialPopup() {
    const popup = document.createElement('div');
    popup.id = 'extension-word-popup';
    popup.innerHTML = `
        <button class="translate-button">
            <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Traduzir" width="24" height="24">
        </button>
    `;
    
    // Estilos para o popup inicial
    popup.style.position = 'fixed';
    popup.style.zIndex = '10000';
    
    // Adiciona evento de clique no botão de tradução
    const translateButton = popup.querySelector('.translate-button');
    translateButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const word = popup.dataset.selectedWord;
        expandPopup(popup, word);
    });
    
    return popup;
}

function expandPopup(popup, word) {
    // Substitui o conteúdo do popup pelo completo
    popup.innerHTML = `
        <div class="popup-header">
            <span class="word"></span>
            <button class="close-button">×</button>
            <div class="loading-spinner" style="display: none;"></div>
        </div>
        <div class="translation"></div>
        <div class="examples"></div>
        <div class="anki-controls">
            <button class="test-anki">Testar Conexão Anki</button>
            <button class="add-to-anki">Adicionar ao Anki</button>
            <span class="anki-status"></span>
        </div>
    `;
    
    // Adiciona os eventos e estilos do popup completo
    setupExpandedPopup(popup);
    
    // Inicia o carregamento da tradução
    showTranslation(popup, word);
}

// Função para configurar o popup expandido
function setupExpandedPopup(popup) {
    // Adiciona estilos ao popup expandido
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid #ccc';
    popup.style.padding = '12px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    popup.style.maxWidth = '300px';
    popup.style.fontSize = '14px';
    
    // Adiciona os event listeners (código existente do createPopupContent)
    const closeButton = popup.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        popup.style.display = 'none';
    });
    
    // Adiciona evento de clique no botão do Anki
    const ankiButton = popup.querySelector('.add-to-anki');
    ankiButton.addEventListener('click', async (e) => {
        // Previne qualquer comportamento padrão
        e.preventDefault();
        e.stopPropagation();
        
        const word = popup.querySelector('.word').textContent;
        const translation = popup.querySelector('.translation').textContent;
        const examplesHtml = popup.querySelector('.examples').innerHTML;
        const examples = examplesHtml.split('<br>')
            .map(example => example.trim())
            .filter(example => example && !example.includes('Exemplos não encontrados'));
        
        if (!translation || translation === 'Carregando...' || translation.includes('Erro')) {
            const statusElement = popup.querySelector('.anki-status');
            statusElement.textContent = 'Erro: Aguarde a tradução carregar';
            statusElement.style.color = '#e74c3c';
            return;
        }
        
        // Desabilita o botão enquanto adiciona
        ankiButton.disabled = true;
        ankiButton.style.opacity = '0.5';
        
        try {
            await addToAnki(word, translation, examples, popup);
        } finally {
            // Reabilita o botão após terminar
            ankiButton.disabled = false;
            ankiButton.style.opacity = '1';
        }
    });
    
    // Adiciona evento para testar conexão
    const testButton = popup.querySelector('.test-anki');
    testButton.addEventListener('click', async () => {
        const statusElement = popup.querySelector('.anki-status');
        statusElement.textContent = 'Testando conexão...';
        statusElement.style.color = '#7f8c8d';
        
        try {
            const version = await invokeAnkiConnect('version');
            statusElement.textContent = `Conexão OK! Versão AnkiConnect: ${version}`;
            statusElement.style.color = '#27ae60';
        } catch (error) {
            statusElement.textContent = error.message;
            statusElement.style.color = '#e74c3c';
            statusElement.style.whiteSpace = 'pre-line';
        }
    });
}

// Modifica a função showPopup
function showPopup(word, x, y) {
    // Remove o popup existente se houver
    const existingPopup = document.getElementById('extension-word-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Cria um novo popup inicial
    const popup = createInitialPopup();
    document.body.appendChild(popup);
    
    // Armazena a palavra selecionada
    popup.dataset.selectedWord = word;
    
    // Posiciona o popup
    popup.style.left = `${x + 10}px`;
    popup.style.top = `${y}px`;
    popup.style.display = 'block';
}

// Adiciona CSS para o spinner de carregamento
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        position: relative;
    }
    
    .word {
        font-weight: bold;
        font-size: 16px;
    }
    
    .translation {
        margin-bottom: 8px;
        color: #2c3e50;
    }
    
    .examples {
        font-size: 13px;
        color: #7f8c8d;
        line-height: 1.4;
    }
    
    .close-button {
        position: absolute;
        right: -8px;
        top: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        background-color: #e74c3c;
        color: white;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
    }
    
    .close-button:hover {
        background-color: #c0392b;
    }
    
    .anki-controls {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
        text-align: center;
    }
    
    .add-to-anki {
        background-color: #2ecc71;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }
    
    .add-to-anki:hover {
        background-color: #27ae60;
    }
    
    .anki-status {
        display: block;
        margin-top: 8px;
        font-size: 12px;
        color: #7f8c8d;
    }
    
    .test-anki {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
        margin-right: 8px;
    }
    
    .test-anki:hover {
        background-color: #2980b9;
    }
    
    .add-to-anki:disabled {
        cursor: not-allowed;
    }
    
    .translate-button {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 50%;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .translate-button:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    
    .translate-button img {
        width: 24px;
        height: 24px;
    }
`;
document.head.appendChild(style);

// Substitui os event listeners antigos por um novo que só fecha com o botão
document.addEventListener('mouseup', (e) => {
    const popup = document.getElementById('extension-word-popup');
    
    // Se o clique foi dentro do popup, não faz nada
    if (popup && popup.contains(e.target)) {
        return;
    }
    
    const selectedText = window.getSelection().toString().trim();
    
    // Se não há texto selecionado, remove o popup
    if (!selectedText && popup) {
        popup.remove();
        return;
    }
    
    // Se há texto selecionado, mostra o novo popup
    if (selectedText) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        showPopup(selectedText, rect.right, rect.top);
    }
});

// Função auxiliar para calcular a largura do texto
function getTextWidth(text) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    const metrics = context.measureText(text);
    return metrics.width;
}

async function addToAnki(word, translation, examples, popup) {
    const statusElement = popup.querySelector('.anki-status');
    
    try {
        // Verifica a conexão com o Anki
        const version = await invokeAnkiConnect('version');
        console.log('Versão do AnkiConnect:', version);
        
        // Formata o conteúdo do verso com HTML
        const versoContent = `<div style="text-align: left; font-family: Arial;">
<b>${word}</b><br><br>

${translation}<br><br>

<b>Exemplos:</b><br><br>
${examples.map(example => {
    // Destaca a palavra nos exemplos
    const highlightedExample = example.replace(
        new RegExp(word, 'gi'),
        match => `<b>${match}</b>`
    );
    return `${highlightedExample}`;
}).join('<br><br>')}
</div>`;
        
        // Prepara a nota
        const note = {
            deckName: "Vocabulário Inglês",
            modelName: "Básico",
            fields: {
                Frente: word,
                Verso: versoContent
            },
            options: {
                allowDuplicate: false,
                duplicateScope: "deck"
            },
            tags: ["chrome_extension"]
        };

        console.log('Nota a ser adicionada:', note);

        // Verifica se o deck existe
        const decks = await invokeAnkiConnect('deckNames');
        if (!decks.includes("Vocabulário Inglês")) {
            console.log('Criando deck...');
            await invokeAnkiConnect('createDeck', {
                deck: "Vocabulário Inglês"
            });
        }

        // Verifica os modelos disponíveis
        const models = await invokeAnkiConnect('modelNames');
        console.log('Modelos disponíveis:', models);

        // Verifica os campos do modelo
        const modelFields = await invokeAnkiConnect('modelFieldNames', {
            modelName: "Básico"
        });
        console.log('Campos do modelo:', modelFields);

        // Adiciona a nota
        statusElement.textContent = 'Adicionando ao Anki...';
        statusElement.style.color = '#7f8c8d';
        
        const result = await invokeAnkiConnect('addNote', { note });
        console.log('Resultado da adição:', result);

        if (result === null) {
            throw new Error('Não foi possível adicionar a nota. Verifique se:\n' +
                '1. O card já existe no deck\n' +
                '2. O modelo "Básico" existe\n' +
                '3. Os campos do modelo estão corretos');
        }

        // Mostra sucesso
        statusElement.textContent = 'Adicionado com sucesso!';
        statusElement.style.color = '#27ae60';
        
        setTimeout(() => {
            statusElement.textContent = '';
        }, 3000);

    } catch (error) {
        console.error('Erro ao adicionar ao Anki:', error);
        statusElement.textContent = error.message;
        statusElement.style.color = '#e74c3c';
        statusElement.style.whiteSpace = 'pre-line';
    }
}

async function invokeAnkiConnect(action, params = {}) {
    try {
        console.log('Tentando conectar ao AnkiConnect...');
        console.log('Action:', action);
        console.log('Params:', params);

        const response = await chrome.runtime.sendMessage({
            action: 'ankiConnect',
            ankiAction: action,
            params: params
        });

        console.log('Response:', response);

        if (!response.success) {
            throw new Error(response.error);
        }

        return response.data;
    } catch (error) {
        console.error('Erro detalhado:', error);
        if (error.message === "Failed to fetch" || error.message.includes("Could not establish connection")) {
            throw new Error(
                "Não foi possível conectar ao Anki. Verifique se:\n" +
                "1. O Anki está aberto\n" +
                "2. O AnkiConnect está instalado\n" +
                "3. Você reiniciou o Anki após instalar o AnkiConnect\n" +
                "4. A configuração do AnkiConnect está correta"
            );
        }
        throw error;
    }
}

async function getTranslationAndExamples(word) {
    const prompt = `Para a palavra em inglês "${word}", forneça:
1. A tradução em português
2. 3 frases de exemplo em inglês usando esta palavra
Responda no seguinte formato:
Tradução: [tradução]
Exemplos:
1. [exemplo 1]
2. [exemplo 2]
3. [exemplo 3]`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error('Formato de resposta inválido da API');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Erro ao obter tradução:', error);
        return `Erro: ${error.message}`;
    }
}

function showTranslation(popup, word) {
    // Mostra a palavra imediatamente
    popup.querySelector('.word').textContent = word;
    
    // Mostra o spinner de carregamento
    const spinner = popup.querySelector('.loading-spinner');
    spinner.style.display = 'block';
    
    // Limpa conteúdo anterior
    popup.querySelector('.translation').textContent = 'Carregando...';
    popup.querySelector('.examples').innerHTML = '';
    
    // Desabilita o botão do Anki até carregar a tradução
    const ankiButton = popup.querySelector('.add-to-anki');
    ankiButton.disabled = true;
    ankiButton.style.opacity = '0.5';
    
    // Busca a tradução e exemplos
    getTranslationAndExamples(word).then(result => {
        spinner.style.display = 'none';
        
        if (result.startsWith('Erro:')) {
            popup.querySelector('.translation').textContent = result;
            return;
        }
        
        try {
            // Processa o resultado
            const lines = result.split('\n').filter(line => line.trim());
            
            // Procura a tradução de forma mais flexível
            let translation = lines.find(line => line.startsWith('Tradução:'));
            if (!translation) {
                // Tenta encontrar a primeira linha que não é um exemplo
                translation = lines.find(line => !line.match(/^\d\./));
            }
            
            // Remove o prefixo "Tradução:" se existir
            translation = translation.replace(/^Tradução:\s*/, '').trim();
            
            // Filtra os exemplos (linhas que começam com número e ponto)
            const examples = lines.filter(line => /^\d\./.test(line));
            
            // Verifica se temos conteúdo válido
            if (!translation) {
                popup.querySelector('.translation').textContent = 'Tradução não encontrada';
            } else {
                popup.querySelector('.translation').textContent = translation;
            }
            
            if (examples.length === 0) {
                popup.querySelector('.examples').innerHTML = 'Exemplos não encontrados';
            } else {
                popup.querySelector('.examples').innerHTML = examples.join('<br>');
            }
            
            // Habilita o botão do Anki apenas se tivermos uma tradução válida
            if (translation && translation !== 'Tradução não encontrada') {
                ankiButton.disabled = false;
                ankiButton.style.opacity = '1';
            }
            
            // Log para debug
            console.log('Resposta processada:', {
                original: result,
                lines: lines,
                translation: translation,
                examples: examples
            });
            
        } catch (error) {
            console.error('Erro ao processar resposta:', error);
            popup.querySelector('.translation').textContent = 'Erro ao processar resposta';
            popup.querySelector('.examples').innerHTML = '';
        }
    });
} 