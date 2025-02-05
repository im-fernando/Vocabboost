document.addEventListener('DOMContentLoaded', function() {
    // Seu código JavaScript aqui
    console.log('Extensão carregada!');
  });

async function getSelectedLanguage() {
  const result = await chrome.storage.sync.get('selectedLanguage');
  return result.selectedLanguage || 'en'; // inglês como padrão
}

async function callGeminiAPI(prompt) {
  const apiKey = await chrome.storage.sync.get('geminiApiKey');
  if (!apiKey.geminiApiKey) {
    throw new Error('API key não configurada');
  }

  // Implementação da chamada à API do Gemini
  // ... código da chamada API ...
}

async function saveToAnki(cardData) {
  try {
    // Conectar ao AnkiConnect
    const response = await fetch('http://localhost:8765', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'addNote',
        version: 6,
        params: {
          note: {
            deckName: cardData.deck,
            modelName: 'Basic',
            fields: {
              Front: cardData.front,
              Back: cardData.back
            },
            tags: [cardData.language] // Adiciona tag do idioma
          }
        }
      })
    });

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('Erro ao salvar no Anki:', error);
    throw error;
  }
}

async function ensureDeckExists(deckName) {
  try {
    // Primeiro verifica se o deck existe
    const checkDeck = await fetch('http://localhost:8765', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'deckNames',
        version: 6
      })
    });

    const deckList = await checkDeck.json();
    
    if (!deckList.result.includes(deckName)) {
      // Se o deck não existe, cria ele
      const createDeck = await fetch('http://localhost:8765', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'createDeck',
          version: 6,
          params: {
            deck: deckName
          }
        })
      });

      const result = await createDeck.json();
      if (result.error) {
        throw new Error(`Erro ao criar deck: ${result.error}`);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar/criar deck:', error);
    throw error;
  }
}

async function processText(text) {
  const selectedLanguage = await getSelectedLanguage();
  
  // Determinar o deck baseado no idioma
  let deckName;
  let prompt;
  
  switch(selectedLanguage) {
    case 'ja':
      deckName = 'Vocabulário Japonês';
      prompt = `Traduza o seguinte texto para japonês e forneça a leitura em romaji:
                "${text}"
                Formato da resposta:
                漢字/かな
                Romaji
                Significado em português`;
      break;
    case 'pt':
      deckName = 'Portuguese';
      prompt = `Traduza o seguinte texto para português:
                "${text}"`;
      break;
    case 'en':
    default:
      deckName = 'English';
      prompt = `Traduza o seguinte texto para inglês:
                "${text}"`;
      break;
  }

  // Logging de depuração para confirmar os valores
  console.log(`Idioma selecionado: ${selectedLanguage}. Deck usado: ${deckName}`);

  try {
    // Garantir que o deck existe antes de adicionar a carta
    await ensureDeckExists(deckName);
    console.log(`Salvando carta no deck: ${deckName}`);
    
    const response = await callGeminiAPI(prompt);
    
    // Salvar no Anki com o deck apropriado
    await saveToAnki({
      deck: deckName,
      front: text,
      back: response,
      language: selectedLanguage
    });

    // Mostrar feedback ao usuário
    showStatus('Card adicionado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao processar texto:', error);
    showStatus('Erro ao processar texto: ' + error.message, 'error');
  }
}

function showStatus(message, type) {
  // Implementar feedback visual para o usuário
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}