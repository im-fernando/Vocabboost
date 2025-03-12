document.addEventListener('mouseover', function(e) {
    // Verifica se temos um elemento válido e se ele tem conteúdo
    if (!e.target || !e.target.textContent) return;

    // Verifica se o elemento tem texto em japonês ou chinês
    if (isJapaneseText(e.target.textContent) || isChineseText(e.target.textContent)) {
        // Adiciona listener para o shift
        document.addEventListener('keydown', async function(keyEvent) {
            if (keyEvent.key === 'Shift' && e.target) {
                try {
                    const text = e.target.textContent;
                    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    if (!range) return;

                    let startPos = range.startOffset;
                    let endPos = range.startOffset;
                    
                    const isJapanese = isJapaneseText(text);
                    const isChinese = isChineseText(text);
                    
                    // Determina se o caractere atual é japonês ou chinês
                    const isTargetChar = isJapanese 
                        ? (char) => isJapaneseChar(char) 
                        : (char) => isChineseChar(char);
                    
                    while (startPos > 0 && isTargetChar(text[startPos - 1])) {
                        startPos--;
                    }
                    
                    while (endPos < text.length && isTargetChar(text[endPos])) {
                        endPos++;
                    }

                    // Obtém a palavra selecionada
                    const selectedWord = text.substring(startPos, endPos);
                    
                    // Verifica se há kanji/hanzi na palavra
                    if ((isJapanese && hasKanji(selectedWord)) || (isChinese && hasChineseChars(selectedWord))) {
                        // Cria um elemento temporário
                        const temp = document.createElement('div');
                        temp.style.position = 'absolute';
                        temp.style.left = `${e.clientX}px`;
                        temp.style.top = `${e.clientY - 20}px`;
                        temp.style.fontSize = '12px';
                        temp.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        temp.style.padding = '2px';
                        temp.style.borderRadius = '3px';
                        temp.style.zIndex = '10000';
                        
                        // Adiciona a palavra com furigana ou pinyin
                        const reading = isJapanese 
                            ? await getKanjiReading(selectedWord) 
                            : await getChineseReading(selectedWord);
                        temp.innerHTML = `<ruby>${selectedWord}<rt>${reading}</rt></ruby>`;
                        
                        document.body.appendChild(temp);
                        
                        // Remove o elemento após 3 segundos
                        setTimeout(() => {
                            temp.remove();
                        }, 3000);
                    }

                    // Seleciona a palavra
                    const wordRange = document.createRange();
                    wordRange.setStart(e.target.firstChild, startPos);
                    wordRange.setEnd(e.target.firstChild, endPos);

                    const selection = window.getSelection();
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(wordRange);
                    }
                    
                    keyEvent.preventDefault();
                } catch (error) {
                    console.error('Erro ao selecionar texto:', error);
                }
            }
        }, { once: true });
    }
});

// Função auxiliar para verificar se o texto contém caracteres japoneses
function isJapaneseText(text) {
    if (!text) return false;
    return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

// Função para verificar se um caractere específico é japonês
function isJapaneseChar(char) {
    return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
}

// Função para verificar se há kanji no texto
function hasKanji(text) {
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

// Função para verificar se o texto contém caracteres chineses
function isChineseText(text) {
    if (!text) return false;
    // Verifica se tem caracteres chineses
    const chineseCount = [...text].filter(char => isChineseChar(char)).length;
    return chineseCount / text.length > 0.4; // Se mais de 40% dos caracteres são chineses
}

// Função para verificar se um caractere específico é chinês
function isChineseChar(char) {
    return char && (
        (char >= '\u4e00' && char <= '\u9fff') || // CJK Unified Ideographs
        (char >= '\u3400' && char <= '\u4dbf') || // CJK Unified Ideographs Extension A
        (char >= '\u3000' && char <= '\u303f') || // CJK Symbols and Punctuation
        (char >= '\uf900' && char <= '\ufaff') || // CJK Compatibility Ideographs
        (char >= '\uff00' && char <= '\uffef')    // Halfwidth and Fullwidth Forms
    );
}

// Função para verificar se há caracteres chineses no texto
function hasChineseChars(text) {
    return [...text].some(char => isChineseChar(char));
}

// Função para obter a leitura do kanji usando o Gemini
async function getKanjiReading(text) {
    try {
        // Obtém a API key das configurações
        const { apiKey } = await chrome.storage.sync.get('apiKey');
        if (!apiKey) {
            console.error('API Key não configurada');
            return '';
        }

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Forneça apenas a leitura em hiragana do seguinte texto japonês (apenas a leitura, sem explicações): ${text}`
                    }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text.trim();
        }
        return '';
    } catch (error) {
        console.error('Erro ao obter leitura:', error);
        return '';
    }
}

// Função para obter a leitura em pinyin do texto chinês usando o Gemini
async function getChineseReading(text) {
    try {
        // Obtém a API key das configurações
        const { apiKey } = await chrome.storage.sync.get('apiKey');
        if (!apiKey) {
            console.error('API Key não configurada');
            return '';
        }

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Forneça apenas a leitura em pinyin do seguinte texto chinês (apenas a leitura em pinyin, sem explicações): ${text}`
                    }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text.trim();
        }
        return '';
    } catch (error) {
        console.error('Erro ao obter leitura em pinyin:', error);
        return '';
    }
} 