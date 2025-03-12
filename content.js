let isShiftPressed = false;
let debounceTimer;

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

// Função que lida com o mouseover
function handleMouseOver(e) {
    if (!isShiftPressed) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    
    try {
        // Tenta selecionar o texto sob o cursor
        range.setStart(e.target, 0);
        range.setEnd(e.target, e.target.textContent.length);
        
        // Obtém o texto sob o cursor
        const text = e.target.textContent;
        const rect = e.target.getBoundingClientRect();
        
        // Calcula a posição relativa do mouse dentro do elemento
        const x = e.clientX - rect.left;
        
        // Modificação para suportar frases
        const phrases = text.split(/[.!?]+/).map(phrase => phrase.trim()).filter(Boolean);
        const words = text.split(/\s+/);
        
        // Tenta encontrar primeiro uma frase, depois uma palavra
        let selectedText = '';
        let found = false;
        
        // Procura por frases
        for (let phrase of phrases) {
            const phraseStart = text.indexOf(phrase);
            const phraseWidth = getTextWidth(phrase);
            const phraseRect = getTextWidth(text.substring(0, phraseStart));
            
            if (x >= phraseRect && x <= phraseRect + phraseWidth) {
                selectedText = phrase;
                found = true;
                break;
            }
        }
        
        // Se não encontrou frase, procura por palavras
        if (!found) {
            let currentPosition = 0;
            for (let word of words) {
                const wordStart = text.indexOf(word, currentPosition);
                const wordEnd = wordStart + word.length;
                const wordRect = getTextWidth(text.substring(0, wordStart));
                
                if (x >= wordRect && x <= wordRect + getTextWidth(word)) {
                    selectedText = word;
                    found = true;
                    break;
                }
                
                currentPosition = wordEnd;
            }
        }
        
        if (found && selectedText) {
            showPopup(selectedText.trim(), e.clientX, e.clientY);
        }
    } catch (error) {
        // Ignora erros de seleção
    }
}

// Adiciona o evento mouseover com debounce
document.addEventListener('mouseover', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        handleMouseOver(e);
    }, 100); // 100ms de delay
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
    popup.style.zIndex = '2147483647'; // Valor máximo para z-index, acima de qualquer elemento
    
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
        <div class="api-key-error" style="display: none;">
            <p style="color: #e74c3c; margin-bottom: 10px;">API key não configurada!</p>
            <button class="open-options" style="background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                Configurar API Key
            </button>
        </div>
    `;
    
    // Adiciona os eventos e estilos do popup completo
    setupExpandedPopup(popup);
    
    // Garante que o popup continue com posição fixed e z-index máximo
    popup.style.position = 'fixed';
    popup.style.zIndex = '2147483647'; // Valor máximo de z-index
    
    // Aguarda um instante para que o layout seja atualizado e então ajusta a posição
    setTimeout(() => {
        adjustExpandedPopupPosition(popup);
    }, 100);
    
    // Inicia o carregamento da tradução
    showTranslation(popup, word);
}

// Nova função para ajustar a posição do popup expandido
function adjustExpandedPopupPosition(popup) {
    // Garante que o popup está com posição fixed
    popup.style.position = 'fixed';
    
    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = popup.getBoundingClientRect();
    
    let newLeft = rect.left;
    let newTop = rect.top;
    
    // Se o popup ultrapassar a direita, ajusta para a esquerda
    if (rect.right > viewportWidth - margin) {
        newLeft = viewportWidth - rect.width - margin;
    }
    // Se o popup ultrapassar a esquerda, posiciona no margin
    if (rect.left < margin) {
        newLeft = margin;
    }
    
    // Se o popup ultrapassar a parte inferior, ajusta para cima
    if (rect.bottom > viewportHeight - margin) {
        newTop = viewportHeight - rect.height - margin;
    }
    // Se o popup ultrapassar o topo, posiciona com margem mínima
    if (rect.top < margin) {
        newTop = margin;
    }
    
    popup.style.left = newLeft + "px";
    popup.style.top = newTop + "px";
}

// Função para obter o tema atual
function getTheme(isDark) {
    return {
        bg: isDark ? '#1a1a1a' : 'white',
        text: isDark ? '#e0e0e0' : '#333',
        border: isDark ? '#404040' : '#ddd',
        highlight: isDark ? '#2980b9' : '#3498db',
        secondary: isDark ? '#2d2d2d' : '#f9f9f9',
        boxBg: isDark ? '#2d2d2d' : '#f9f9f9',
        exampleBg: isDark ? '#262626' : '#fafafa',
        exampleBorder: isDark ? '#404040' : '#ececec',
        exampleText: isDark ? '#e0e0e0' : '#2c3e50',
        translationText: isDark ? '#b0b0b0' : '#555'
    };
}

// Função para configurar o popup expandido
function setupExpandedPopup(popup) {
    // Obtém a configuração do tema
    chrome.storage.sync.get(['darkMode'], (result) => {
        const isDark = result.darkMode;
        const theme = getTheme(isDark);
        
        // Estilos base do popup
        Object.assign(popup.style, {
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            padding: '15px',
            borderRadius: '10px',
            boxShadow: '0 3px 15px rgba(0,0,0,0.2)',
            maxWidth: '350px',
            fontSize: '14px',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            color: theme.text
        });

        // Estilos do cabeçalho
        const header = popup.querySelector('.popup-header');
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px'
        });

        // Estilos da palavra
        const word = popup.querySelector('.word');
        Object.assign(word.style, {
            fontSize: '18px',
            fontWeight: 'bold',
            color: theme.text,
            flexGrow: '1'
        });

        // Estilos do botão fechar
        const closeButton = popup.querySelector('.close-button');
        Object.assign(closeButton.style, {
            marginLeft: 'auto',
            fontSize: '20px',
            color: isDark ? '#666' : '#aaa',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
        });

        // Estilos da tradução
        const translation = popup.querySelector('.translation');
        Object.assign(translation.style, {
            backgroundColor: theme.boxBg,
            borderLeft: `4px solid ${theme.highlight}`,
            padding: '10px',
            marginBottom: '15px',
            color: theme.text
        });

        // Estilos dos exemplos
        const examples = popup.querySelector('.examples');
        Object.assign(examples.style, {
            marginBottom: '15px',
            color: theme.text
        });

        // Estilos dos controles do Anki
        const ankiControls = popup.querySelector('.anki-controls');
        Object.assign(ankiControls.style, {
            textAlign: 'center',
            marginTop: '15px',
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '15px'
        });

        // Estilos dos botões do Anki
        const buttons = ankiControls.querySelectorAll('button');
        buttons.forEach(button => {
            Object.assign(button.style, {
                margin: '0 5px',
                backgroundColor: theme.highlight,
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
            });
        });

        // Adiciona os event listeners (código existente do createPopupContent)
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
            
            // Nova forma de obter os exemplos
            const exampleDivs = popup.querySelectorAll('.examples > div');
            const examples = Array.from(exampleDivs).map(div => {
                const originalText = div.querySelector('div:first-child').textContent.trim();
                const translationText = div.querySelector('div:last-child')?.textContent.trim() || '';
                return `${originalText} (${translationText})`;
            }).filter(example => example && !example.includes('Exemplos não encontrados'));
            
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

        // Adiciona evento ao botão de configuração
        const openOptionsButton = popup.querySelector('.open-options');
        openOptionsButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openOptions' });
        });
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
    
    #extension-word-popup {
        z-index: 2147483647 !important; /* Garante que fique acima de qualquer outro elemento */
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

async function captureScreenshot() {
    try {
        // Guarda o popup e sua posição atual
        const popup = document.getElementById('extension-word-popup');
        const wasVisible = popup.style.display !== 'none';
        const originalDisplay = popup.style.display;
        
        // Esconde o popup temporariamente
        popup.style.display = 'none';
        
        // Pequeno delay para garantir que o popup sumiu da tela
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Captura a screenshot
        const screenshot = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'captureScreen' }, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                if (!response) {
                    reject(new Error('Nenhuma resposta recebida'));
                    return;
                }
                
                if (!response.success) {
                    reject(new Error(response.error || 'Falha ao capturar screenshot'));
                    return;
                }
                
                resolve(response.imageData);
            });
        });
        
        // Restaura a visibilidade do popup
        if (wasVisible) {
            popup.style.display = originalDisplay;
        }
        
        return screenshot;
    } catch (error) {
        console.error('Erro ao capturar screenshot:', error);
        // Garante que o popup será restaurado mesmo em caso de erro
        const popup = document.getElementById('extension-word-popup');
        if (popup) {
            popup.style.display = 'block';
        }
        return null;
    }
}

// Função para gerar áudio usando a ElevenLabs API
async function generateAudio(text, language) {
    try {
        const { elevenLabsApiKey } = await chrome.storage.sync.get('elevenLabsApiKey');
        if (!elevenLabsApiKey) {
            throw new Error('API key da ElevenLabs não configurada');
        }

        // Lista de vozes russas definida no escopo correto
        const russianVoices = [
            'kgF5UZYTYKw2W1SfEbTX', // Alice (russo)
            'bVMeCyTHy58xNoL34h3p', // Sasha (russo)
            'ThT5KcBeYPX3keUQqHPh', // Ivan (russo)
            '0wkEYGF8lPXZKZHXmxZK'  // Natasha (russo)
        ];

        // Seleciona a voz apropriada baseado no idioma
        let voiceId;
        switch(language) {
            case 'ja':
                voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam (japonês)
                break;
            case 'es':
                voiceId = '29vD33N1CtxCmqQRPOHJ'; // Pedro (espanhol)
                break;
            case 'fr':
                voiceId = 'XB0fDUnXU5powFXDhCwa'; // Charlotte (francês)
                break;
            case 'de':
                voiceId = 'pqHfZKP75CvOlQylNhV4'; // Hans (alemão)
                break;
            case 'ru':
                voiceId = russianVoices[0]; // Começa com a primeira voz
                break;
            case 'en':
            default:
                voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel (inglês)
                break;
        }

        // Configurações específicas para cada idioma
        let stability = 0.5;
        let similarity_boost = 0.75;

        // Ajustes específicos para russo
        if (language === 'ru') {
            stability = 0.7; // Aumenta a estabilidade para melhor pronúncia
            similarity_boost = 0.85; // Aumenta a similaridade para manter o sotaque
        }

        console.log('Gerando áudio para:', {
            text,
            language,
            voiceId,
            stability,
            similarity_boost
        });

        // Tenta gerar o áudio com a primeira voz
        let response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsApiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability,
                    similarity_boost
                }
            })
        });

        // Se a primeira voz falhar e for russo, tenta as outras vozes
        if (!response.ok && language === 'ru') {
            console.log('Primeira voz falhou, tentando vozes alternativas...');
            
            for (let i = 1; i < russianVoices.length; i++) {
                voiceId = russianVoices[i];
                console.log('Tentando voz alternativa:', voiceId);
                
                response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': elevenLabsApiKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability,
                            similarity_boost
                        }
                    })
                });

                if (response.ok) {
                    console.log('Voz alternativa funcionou:', voiceId);
                    break;
                } else {
                    const errorData = await response.text();
                    console.log(`Erro com voz ${voiceId}:`, errorData);
                }
            }
        }

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Erro detalhado da API ElevenLabs:', errorData);
            throw new Error(`Erro ao gerar áudio (${response.status}): ${errorData}`);
        }

        const audioBlob = await response.blob();
        const audioBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(audioBlob);
        });

        return audioBase64;
    } catch (error) {
        console.error('Erro ao gerar áudio:', error);
        throw error;
    }
}

// Modifica a função addToAnki para incluir áudio
async function addToAnki(word, translation, examples, popup) {
    const statusElement = popup.querySelector('.anki-status');
    
    try {
        // Obtém a configuração do tema
        const { darkMode } = await chrome.storage.sync.get(['darkMode']);
        const theme = getTheme(darkMode);
        
        // Verifica a conexão com o Anki
        const version = await invokeAnkiConnect('version');
        console.log('Versão do AnkiConnect:', version);

        // Verifica os modelos disponíveis
        const models = await invokeAnkiConnect('modelNames');
        console.log('Modelos disponíveis:', models);

        // Verifica os campos do modelo Básico
        const modelFields = await invokeAnkiConnect('modelFieldNames', {
            modelName: "Básico"
        });
        console.log('Campos do modelo Básico:', modelFields);
        
        // Captura a screenshot
        statusElement.textContent = 'Capturando screenshot...';
        let screenshot = null;
        try {
            screenshot = await captureScreenshot();
            console.log('Screenshot capturada:', screenshot ? 'Sucesso' : 'Falha');
        } catch (error) {
            console.warn('Erro ao capturar screenshot:', error);
        }

        // Gera o áudio da palavra e dos exemplos
        statusElement.textContent = 'Gerando áudios...';
        const { selectedLanguage = 'en' } = await chrome.storage.sync.get('selectedLanguage');
        
        // Gera áudio da palavra principal
        let mainAudioBase64 = null;
        try {
            mainAudioBase64 = await generateAudio(word, selectedLanguage);
            console.log('Áudio da palavra gerado com sucesso');
        } catch (error) {
            console.warn('Erro ao gerar áudio da palavra:', error);
        }

        // Gera áudio dos exemplos
        const exampleAudios = [];
        for (let i = 0; i < examples.length; i++) {
            try {
                // Processa o exemplo da mesma forma que o popup
                const parts = examples[i].split(/\(([^)]+)\)/);
                const originalText = parts[0].trim().replace(/^\d+\.\s*/, ''); // Remove o número e espaços
                
                statusElement.textContent = `Gerando áudio para exemplo ${i + 1} de ${examples.length}...`;
                console.log(`Gerando áudio para exemplo ${i + 1}:`, originalText);
                
                const audioBase64 = await generateAudio(originalText, selectedLanguage);
                if (audioBase64) {
                    exampleAudios.push({
                        text: originalText,
                        audio: audioBase64
                    });
                    console.log(`Áudio do exemplo ${i + 1} gerado com sucesso:`, originalText);
                }
            } catch (error) {
                console.warn(`Erro ao gerar áudio do exemplo ${i + 1}:`, error);
            }
        }
        
        // Define o nome do deck baseado no idioma
        let deckName;
        switch(selectedLanguage) {
            case 'ja':
                deckName = 'Vocabulário Japonês';
                break;
            case 'es':
                deckName = 'Vocabulário Espanhol';
                break;
            case 'ru':
                deckName = 'Vocabulário Russo';
                break;
            case 'fr':
                deckName = 'Vocabulário Francês';
                break;
            case 'de':
                deckName = 'Vocabulário Alemão';
                break;
            case 'zh':
                deckName = 'Vocabulário Mandarim';
                break;
            case 'en':
            default:
                deckName = 'Vocabulário Inglês';
                break;
        }
        
        console.log('Deck selecionado:', deckName);
        
        // Verifica se o deck existe e cria se necessário
        const existingDecks = await invokeAnkiConnect('deckNames');
        console.log('Decks existentes:', existingDecks);
        
        if (!existingDecks.includes(deckName)) {
            console.log('Criando deck:', deckName);
            await invokeAnkiConnect('createDeck', {
                deck: deckName
            });
        }

        // Pega o elemento word com o furigana se existir
        const wordElement = popup.querySelector('.word');
        const wordHtml = wordElement.innerHTML;

        // Armazena os arquivos de áudio no Anki
        if (mainAudioBase64) {
            await invokeAnkiConnect('storeMediaFile', {
                filename: word + '.mp3',
                data: mainAudioBase64
            });
            console.log('Áudio principal armazenado');
        }

        // Armazena os áudios dos exemplos
        for (let i = 0; i < exampleAudios.length; i++) {
            const { text, audio } = exampleAudios[i];
            const filename = `${word}_example${i + 1}.mp3`;
            await invokeAnkiConnect('storeMediaFile', {
                filename: filename,
                data: audio
            });
            console.log(`Áudio do exemplo ${i + 1} armazenado:`, text);
        }
        
        // Formata o conteúdo do verso com HTML e áudios
        const versoContent = `<div style="text-align: left; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: ${theme.text};">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: ${theme.text};">${wordHtml}</div>
            ${mainAudioBase64 ? '[sound:' + word + '.mp3]<br>' : ''}
            
            <div style="background-color: ${theme.boxBg}; border-left: 4px solid ${theme.highlight}; padding: 10px; margin: 15px 0; color: ${theme.text};">
                ${translation}
            </div>

            <div style="margin-top: 20px;">
                <b style="font-size: 16px; color: ${theme.text};">Exemplos:</b><br><br>
                ${examples.map((example, index) => {
                    const parts = example.split(/\(([^)]+)\)/);
                    const originalText = parts[0].trim();
                    const translatedText = parts[1] ? parts[1].trim() : '';
                    const highlightedExample = originalText.replace(
                        new RegExp(word, 'gi'),
                        match => `<b style="color: ${theme.highlight};">${match}</b>`
                    );
                    
                    return `
                        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid ${theme.border}; border-radius: 8px; background-color: ${theme.exampleBg};">
                            <div style="font-weight: bold; color: ${theme.text}; margin-bottom: 5px;">
                                ${highlightedExample}
                                ${exampleAudios[index] ? `<br>[sound:${word}_example${index + 1}.mp3]` : ''}
                            </div>
                            ${translatedText ? `
                                <div style="color: ${theme.translationText}; margin-top: 5px; padding-left: 10px; border-left: 2px solid ${theme.border}; font-size: 13px;">
                                    ${translatedText}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('\n')}
            </div>

            ${screenshot ? `
                <div style="margin-top: 20px;">
                    <b style="font-size: 16px; color: ${theme.text};">Contexto:</b><br>
                    <img src="${screenshot}" style="max-width: 100%; height: auto; border: 1px solid ${theme.border}; border-radius: 8px; margin-top: 10px;">
                </div>
            ` : ''}
        </div>`;
        
        // Prepara a nota
        const note = {
            deckName: deckName,
            modelName: "Básico",
            fields: {
                Frente: word,
                Verso: versoContent
            },
            options: {
                allowDuplicate: false,
                duplicateScope: "deck"
            },
            tags: [selectedLanguage]
        };

        // Verifica se os campos da nota correspondem aos campos do modelo
        if (!modelFields.includes('Frente') || !modelFields.includes('Verso')) {
            // Tenta adaptar ao nome dos campos em português
            note.fields = {
                Front: word,
                Back: versoContent
            };
            console.log('Adaptando para campos em inglês (Front/Back)');
        }

        console.log('Nota a ser adicionada:', note);

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

        // Força uma sincronização
        await invokeAnkiConnect('sync');
        console.log('Sincronização iniciada');

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

async function getTranslationAndExamples(text) {
    // Obtém a API key e o idioma selecionado das configurações
    const result = await chrome.storage.sync.get(['geminiApiKey', 'selectedLanguage']);
    if (!result.geminiApiKey) {
        return 'Erro: API key não configurada. Por favor, configure nas opções da extensão.';
    }

    // Define o prompt baseado no idioma
    let prompt;
    switch(result.selectedLanguage) {
        case 'ja':
            prompt = `Para o texto em japonês "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
        case 'es':
            prompt = `Para o texto em espanhol "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
        case 'ru':
            prompt = `Para o texto em russo "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
        case 'fr':
            prompt = `Para o texto em francês "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
        case 'de':
            prompt = `Para o texto em alemão "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
        case 'zh':
            prompt = `Para o texto em mandarim (chinês) "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
        case 'en':
        default:
            prompt = `Para o texto em inglês "${text}", forneça:
            1. A tradução em português
            2. 3 frases de exemplo usando ${text.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
            break;
    }

    prompt += `
    
    Responda EXATAMENTE neste formato:
    Tradução: [tradução em português]
    
    Exemplos:
    1. [frase no idioma original] (tradução em português)
    2. [frase no idioma original] (tradução em português)
    3. [frase no idioma original] (tradução em português)
    
    Importante: Sempre inclua a tradução em português entre parênteses após cada exemplo.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${result.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 1024,
                    frequencyPenalty: 0.5,
                    presencePenalty: 0.5
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Erro da API Gemini:', errorData);
            throw new Error(`Erro na API (${response.status}): ${errorData}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            console.error('Resposta inesperada da API:', data);
            throw new Error('Formato de resposta inválido da API');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Erro ao obter tradução:', error);
        if (error.message.includes('API key not valid')) {
            return 'Erro: Chave API inválida. Por favor, verifique sua chave API nas configurações.';
        }
        return `Erro: ${error.message}`;
    }
}

// Cache de traduções
const translationCache = new Map();

// Função para obter tradução com cache
async function getTranslationWithCache(text) {
    // Verifica se já existe no cache
    const result = await chrome.storage.local.get(['translationCache']);
    const cache = result.translationCache || {};
    
    if (cache[text]) {
        console.log('Usando tradução em cache para:', text);
        return cache[text];
    }
    
    // Se não existe, busca nova tradução
    const translation = await getTranslationAndExamples(text);
    
    // Salva no cache
    if (!translation.startsWith('Erro:')) {
        console.log('Salvando tradução no cache para:', text);
        cache[text] = translation;
        await chrome.storage.local.set({ translationCache: cache });
    }
    
    return translation;
}

async function showTranslation(popup, word) {
    // Mostra a palavra imediatamente
    const wordElement = popup.querySelector('.word');
    wordElement.textContent = word;
    
    // Verifica se é japonês e tem kanji
    const selectedLanguage = await chrome.storage.sync.get('selectedLanguage').then(result => result.selectedLanguage || 'en');
    if (selectedLanguage === 'ja' && hasKanji(word)) {
        try {
            const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
            if (geminiApiKey) {
                const reading = await getKanjiReading(word, geminiApiKey);
                if (reading) {
                    // Processa cada caractere individualmente
                    const chars = Array.from(word);
                    const readings = Array.from(reading);
                    let rubyHtml = '';
                    let readingIndex = 0;

                    for (let char of chars) {
                        if (isKanji(char)) {
                            // Se for kanji, adiciona com ruby
                            rubyHtml += `<ruby>${char}<rt style="font-size: 0.7em;">${readings[readingIndex] || ''}</rt></ruby>`;
                            readingIndex++;
                        } else {
                            // Se não for kanji, adiciona sem ruby
                            rubyHtml += char;
                        }
                    }
                    wordElement.innerHTML = rubyHtml;
                }
            }
        } catch (error) {
            console.error('Erro ao obter leitura do kanji:', error);
        }
    }
    
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
    
    // Busca a tradução e exemplos (usando cache)
    getTranslationWithCache(word).then(result => {
        // Obtém o tema atual
        chrome.storage.sync.get(['darkMode'], (themeResult) => {
            const theme = getTheme(themeResult.darkMode);
            
            spinner.style.display = 'none';
            
            // Se for erro de API key não configurada
            if (result === 'Erro: API key não configurada. Por favor, configure nas opções da extensão.') {
                // Esconde os elementos normais
                popup.querySelector('.translation').textContent = '';
                popup.querySelector('.examples').innerHTML = '';
                popup.querySelector('.anki-controls').style.display = 'none';
                
                // Mostra o erro de API key
                const apiKeyError = popup.querySelector('.api-key-error');
                apiKeyError.style.display = 'block';
                
                // Adiciona evento ao botão de configuração
                popup.querySelector('.open-options').addEventListener('click', () => {
                    chrome.tabs.create({
                        url: 'chrome-extension://' + chrome.runtime.id + '/options.html'
                    });
                });
                
                return;
            }

            if (result.startsWith('Erro:')) {
                popup.querySelector('.translation').textContent = result;
                // Reposiciona o popup mesmo em caso de erro
                adjustExpandedPopupPosition(popup);
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
                    popup.querySelector('.examples').innerHTML = examples.map(example => {
                        // Separa a parte em inglês da tradução (entre parênteses)
                        const parts = example.split(/\(([^)]+)\)/);
                        const englishText = parts[0].trim();
                        const portugueseText = parts[1] ? parts[1].trim() : '';

                        // Destaca a palavra/frase pesquisada
                        const highlightedEnglish = englishText.replace(
                            new RegExp(word, 'gi'),
                            match => `<span style="font-weight: bold; color: ${theme.highlight};">${match}</span>`
                        );

                        return `
                            <div style="margin-bottom: 10px; padding: 8px; border: 1px solid ${theme.exampleBorder}; border-radius: 8px; background-color: ${theme.exampleBg};">
                                <div style="font-weight: bold; color: ${theme.exampleText}; margin-bottom: 5px;">
                                    ${highlightedEnglish}
                                </div>
                                ${portugueseText ? `
                                    <div style="color: ${theme.translationText}; font-size: 13px; margin-top: 5px; padding-left: 10px; border-left: 2px solid ${theme.border};">
                                        ${portugueseText}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('');
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
            // Reposiciona o popup após a tradução (ou erro) já ter atualizado seu conteúdo
            adjustExpandedPopupPosition(popup);
        });
    });
}

// Função para verificar se há kanji no texto
function hasKanji(text) {
    return [...text].some(char => isKanji(char));
}

// Função específica para verificar se um único caractere é kanji
function isKanji(char) {
    return char && (char >= '\u4e00' && char <= '\u9faf' || char >= '\u3400' && char <= '\u4dbf');
}

// Funções para caracteres chineses
function hasChineseChars(text) {
    return [...text].some(char => isChineseChar(char));
}

function isChineseChar(char) {
    // Os intervalos Unicode incluem caracteres chineses (há sobreposição com kanji japonês)
    return char && (
        (char >= '\u4e00' && char <= '\u9fff') || // CJK Unified Ideographs
        (char >= '\u3400' && char <= '\u4dbf') || // CJK Unified Ideographs Extension A
        (char >= '\u20000' && char <= '\u2a6df') || // CJK Unified Ideographs Extension B
        (char >= '\u2a700' && char <= '\u2b73f') || // CJK Unified Ideographs Extension C
        (char >= '\u2b740' && char <= '\u2b81f') || // CJK Unified Ideographs Extension D
        (char >= '\u2b820' && char <= '\u2ceaf') || // CJK Unified Ideographs Extension E
        (char >= '\u2ceb0' && char <= '\u2ebef') || // CJK Unified Ideographs Extension F
        (char >= '\u30000' && char <= '\u3134f') || // CJK Unified Ideographs Extension G
        (char >= '\u3000' && char <= '\u303f') // CJK Symbols and Punctuation
    );
}

// Função para detectar se o texto é provavelmente chinês
function isChineseText(text) {
    // Conta o número de caracteres chineses
    const chineseCharCount = [...text].filter(char => isChineseChar(char)).length;
    // Se pelo menos 40% dos caracteres forem chineses, consideramos que o texto está em chinês
    return chineseCharCount / text.length > 0.4;
}

// Função para obter a leitura do kanji usando o Gemini
async function getKanjiReading(text, apiKey) {
    try {
        if (!apiKey) return null;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Você é um especialista em japonês. Para o texto "${text}", forneça APENAS a leitura em hiragana dos kanjis, sem nenhuma explicação ou outros caracteres. Por exemplo:
                        - Se o input for "漢字", responda apenas "かんじ"
                        - Se o input for "お金", responda apenas "かね" (apenas a leitura do kanji 金)
                        - Se o input for "すし", não responda nada (pois não há kanji)
                        Responda apenas com hiragana, sem espaços ou outros caracteres.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 100
                }
            })
        });

        if (!response.ok) {
            console.error('Erro na API:', response.status, await response.text());
            return null;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const reading = data.candidates[0].content.parts[0].text.trim();
            if (/^[\u3040-\u309f\s]+$/.test(reading)) {
                console.log('Leitura obtida:', reading);
                return reading;
            }
        }
        return null;
    } catch (error) {
        console.error('Erro ao obter leitura:', error);
        return null;
    }
} 