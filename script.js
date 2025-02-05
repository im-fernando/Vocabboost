document.addEventListener('mouseover', function(e) {
    // Verifica se temos um elemento válido e se ele tem conteúdo
    if (!e.target || !e.target.textContent) return;

    // Verifica se o elemento tem texto em japonês
    if (isJapaneseText(e.target.textContent)) {
        // Adiciona listener para o shift
        document.addEventListener('keydown', function(keyEvent) {
            if (keyEvent.key === 'Shift' && e.target) {
                try {
                    // Obtém o texto completo
                    const text = e.target.textContent;
                    // Obtém a posição do mouse relativa ao texto
                    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    if (!range) return;

                    // Encontra os limites da palavra japonesa
                    let startPos = range.startOffset;
                    let endPos = range.startOffset;
                    
                    // Expande para trás até encontrar um não-caractere japonês ou início do texto
                    while (startPos > 0 && isJapaneseChar(text[startPos - 1])) {
                        startPos--;
                    }
                    
                    // Expande para frente até encontrar um não-caractere japonês ou fim do texto
                    while (endPos < text.length && isJapaneseChar(text[endPos])) {
                        endPos++;
                    }

                    // Cria uma nova range para a palavra
                    const wordRange = document.createRange();
                    wordRange.setStart(e.target.firstChild, startPos);
                    wordRange.setEnd(e.target.firstChild, endPos);

                    // Seleciona a palavra
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