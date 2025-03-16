chrome.runtime.onInstalled.addListener(() => {
    console.log('Extensão instalada!');
  });
  
  // Listener para mensagens
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captureScreen') {
        try {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (!tabs || tabs.length === 0) {
                    sendResponse({ success: false, error: 'Nenhuma aba ativa encontrada' });
                    return;
                }

                chrome.tabs.captureVisibleTab(
                    tabs[0].windowId,
                    { format: 'png' },
                    function(dataUrl) {
                        if (chrome.runtime.lastError) {
                            sendResponse({
                                success: false,
                                error: chrome.runtime.lastError.message
                            });
                        } else {
                            sendResponse({
                                success: true,
                                imageData: dataUrl
                            });
                        }
                    }
                );
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
        return true; // Mantém a conexão aberta para resposta assíncrona
    }
    
    if (request.action === 'ankiConnect') {
        fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: request.ankiAction,
                version: 6,
                params: request.params,
                key: null
            })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data.result });
        })
        .catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        
        return true; // Mantém a conexão aberta para resposta assíncrona
    }

    // Manipulador para solicitações de áudio do Google Translate
    if (request.action === 'fetchAudio') {
        fetch(request.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar áudio: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Converter o blob para base64
                const reader = new FileReader();
                reader.onloadend = function() {
                    // Extrair a parte base64 da string de dados
                    const base64data = reader.result.split(',')[1];
                    sendResponse({ audioBase64: base64data });
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Erro ao buscar áudio:', error);
                sendResponse({ error: error.message });
            });
            
        return true; // Mantém a conexão aberta para resposta assíncrona
    }

    if (request.action === 'openOptions') {
        chrome.runtime.openOptionsPage();
    }
  });