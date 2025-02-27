document.addEventListener('DOMContentLoaded', async () => {
    // Carrega as configurações salvas
    chrome.storage.sync.get(['geminiApiKey', 'elevenLabsApiKey', 'darkMode'], (result) => {
        if (result.geminiApiKey) {
            document.getElementById('apiKey').value = result.geminiApiKey;
        }
        if (result.elevenLabsApiKey) {
            document.getElementById('elevenLabsApiKey').value = result.elevenLabsApiKey;
        }
        if (result.darkMode) {
            document.getElementById('darkMode').checked = result.darkMode;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    });

    // Carregar a configuração de idioma salva
    const languageSelect = document.getElementById('language-select');
    const savedLanguage = await chrome.storage.sync.get('selectedLanguage');
    if (savedLanguage.selectedLanguage) {
        languageSelect.value = savedLanguage.selectedLanguage;
    }

    // Salva as configurações quando o botão for clicado
    document.getElementById('save').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        const elevenLabsApiKey = document.getElementById('elevenLabsApiKey').value.trim();
        const darkMode = document.getElementById('darkMode').checked;
        const status = document.getElementById('status');
        
        if (!apiKey) {
            showStatus('Por favor, insira uma API key válida do Gemini', 'error');
            return;
        }

        if (!elevenLabsApiKey) {
            showStatus('Por favor, insira uma API key válida da ElevenLabs', 'error');
            return;
        }

        chrome.storage.sync.set({ 
            geminiApiKey: apiKey,
            elevenLabsApiKey: elevenLabsApiKey,
            darkMode: darkMode
        }, () => {
            showStatus('Configurações salvas com sucesso!', 'success');
        });
    });
    
    // Atualiza o tema quando o toggle é alterado
    document.getElementById('darkMode').addEventListener('change', (e) => {
        const isDark = e.target.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    });

    // Salvar a configuração quando alterada
    languageSelect.addEventListener('change', async (e) => {
        await chrome.storage.sync.set({
            selectedLanguage: e.target.value
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