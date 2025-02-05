document.addEventListener('mouseover', function(e) {
    // Verifica se temos um elemento válido e se ele tem conteúdo
    if (!e.target || !e.target.textContent) return;

    // Verifica se o elemento tem texto em japonês
    if (isJapaneseText(e.target.textContent)) {
        // Adiciona listener para o shift
        document.addEventListener('keydown', function(keyEvent) {
            if (keyEvent.key === 'Shift' && e.target) {
                try {
                    // Seleciona a palavra japonesa
                    const range = document.createRange();
                    range.selectNodeContents(e.target);
                    const selection = window.getSelection();
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    
                    // Previne comportamento padrão
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