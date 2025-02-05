document.addEventListener('DOMContentLoaded', () => {
    // Carrega a API key salva
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            document.getElementById('apiKey').value = result.geminiApiKey;
        }
    });

    // Salva a API key quando o botão for clicado
    document.getElementById('save').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        const status = document.getElementById('status');
        
        if (!apiKey) {
            showStatus('Por favor, insira uma API key válida', 'error');
            return;
        }

        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            showStatus('Configurações salvas com sucesso!', 'success');
        });
    });
});

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
} 