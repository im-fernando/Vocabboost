document.addEventListener('DOMContentLoaded', function() {
    // Seu código JavaScript aqui
    console.log('Extensão carregada!');
    
    // Adiciona evento de clique ao botão de processamento
    const processButton = document.getElementById('processButton');
    const wordListTextarea = document.getElementById('wordList');
    
    if (processButton) {
      processButton.addEventListener('click', async function() {
        const wordListText = wordListTextarea.value.trim();
        if (!wordListText) {
          showStatus('Por favor, insira algumas palavras para processar.', 'warning');
          return;
        }
        
        await processWordList(wordListText);
      });
    }
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
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Se for uma mensagem temporária (sucesso ou erro), esconde após alguns segundos
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 5000);
    }
  }
}

// Função para processar a lista de palavras
async function processWordList(wordListText) {
  // Extrair palavras da lista (remove números e espaços extra)
  const words = wordListText
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^\d+\.\s*/, '')) // Remove numeração como "1. "
    .filter(word => word.length > 0);  // Remove linhas vazias
  
  if (words.length === 0) {
    showStatus('Nenhuma palavra válida encontrada.', 'warning');
    return;
  }
  
  // Configura o progresso
  const progressBar = document.getElementById('progressBar');
  const progress = document.getElementById('progress');
  const processButton = document.getElementById('processButton');
  
  progress.style.display = 'block';
  processButton.disabled = true;
  
  showStatus(`Processando ${words.length} palavras...`, 'warning');
  
  // Obtém configurações necessárias
  const selectedLanguage = await getSelectedLanguage();
  const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
  
  if (!geminiApiKey) {
    showStatus('API key não configurada. Configure nas opções da extensão.', 'error');
    progress.style.display = 'none';
    processButton.disabled = false;
    return;
  }
  
  // Determina o deck correto baseado no idioma
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
  
  // Garantir que o deck existe
  try {
    await ensureDeckExists(deckName);
  } catch (error) {
    showStatus(`Erro ao verificar/criar o deck: ${error.message}`, 'error');
    progress.style.display = 'none';
    processButton.disabled = false;
    return;
  }
  
  // Processa cada palavra
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Atualiza a barra de progresso
    const percent = Math.round(((i + 1) / words.length) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}% (${i + 1}/${words.length})`;
    
    try {
      // Mostra a palavra atual que está sendo processada
      showStatus(`Processando: ${word} (${i + 1}/${words.length})`, 'warning');
      
      // Obtém tradução e exemplos para a palavra
      const result = await getTranslationForWord(word, selectedLanguage, geminiApiKey);
      
      // Cria e salva o card no Anki
      await addCardToAnki(word, result, selectedLanguage, deckName);
      
      successCount++;
      console.log(`Palavra processada com sucesso: ${word}`);
    } catch (error) {
      console.error(`Erro ao processar palavra "${word}":`, error);
      errorCount++;
    }
    
    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Atualiza a interface após concluir
  progress.style.display = 'none';
  processButton.disabled = false;
  
  if (errorCount === 0) {
    showStatus(`Sucesso! ${successCount} cards foram adicionados ao Anki.`, 'success');
  } else {
    showStatus(`Concluído com ${successCount} cards criados e ${errorCount} erros.`, 
      errorCount > successCount ? 'error' : 'warning');
  }
}

// Função para obter tradução e exemplos para uma palavra
async function getTranslationForWord(word, language, apiKey) {
  // Define o prompt baseado no idioma
  let prompt;
  switch(language) {
    case 'ja':
      prompt = `Para o texto em japonês "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
    case 'es':
      prompt = `Para o texto em espanhol "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
    case 'ru':
      prompt = `Para o texto em russo "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
    case 'fr':
      prompt = `Para o texto em francês "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
    case 'de':
      prompt = `Para o texto em alemão "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
    case 'zh':
      prompt = `Para o texto em mandarim (chinês) "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
    case 'en':
    default:
      prompt = `Para o texto em inglês "${word}", forneça:
      1. A tradução em português
      2. 3 frases de exemplo SIMPLES E COMUNS usando ${word.split(/\s+/).length > 1 ? 'esta expressão' : 'esta palavra'}`;
      break;
  }

  prompt += `
  
  Responda EXATAMENTE neste formato:
  Tradução: [tradução em português]
  
  Exemplos:
  1. [frase no idioma original] (tradução em português)
  2. [frase no idioma original] (tradução em português)
  3. [frase no idioma original] (tradução em português)
  
  IMPORTANTE: 
  - Sempre inclua a tradução em português entre parênteses após cada exemplo
  - Os exemplos DEVEM ser frases SIMPLES, CURTAS e de uso COMUM no dia-a-dia
  - Use vocabulário básico e estruturas gramaticais simples para que um iniciante possa entender`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${apiKey}`, {
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
    throw error;
  }
}

// Função para adicionar um card ao Anki
async function addCardToAnki(word, translationResult, language, deckName) {
  try {
    // Processar o resultado
    const lines = translationResult.split('\n').filter(line => line.trim());
    
    // Procurar a tradução
    let translation = lines.find(line => line.startsWith('Tradução:'));
    if (!translation) {
      // Tenta encontrar a primeira linha que não é um exemplo
      translation = lines.find(line => !line.match(/^\d\./));
    }
    
    // Remove o prefixo "Tradução:" se existir
    translation = translation ? translation.replace(/^Tradução:\s*/, '').trim() : '(Tradução não encontrada)';
    
    // Filtra os exemplos (linhas que começam com número e ponto)
    const examples = lines.filter(line => /^\d\./.test(line));
    
    // Obter configuração de tema do usuário
    const { darkMode } = await chrome.storage.sync.get(['darkMode']);
    const theme = getTheme(darkMode);
    
    // Verifica os campos disponíveis no modelo
    const modelFields = await invokeAnkiConnect('modelFieldNames', {
      modelName: "Básico"
    });
    console.log('Campos do modelo Básico:', modelFields);
    
    // Gerar áudio da palavra principal
    let mainAudioBase64 = null;
    try {
      showStatus(`Gerando áudio para: ${word}...`, 'warning');
      const { elevenLabsApiKey } = await chrome.storage.sync.get('elevenLabsApiKey');
      if (elevenLabsApiKey) {
        mainAudioBase64 = await generateAudio(word, language, elevenLabsApiKey);
      }
    } catch (error) {
      console.warn('Erro ao gerar áudio principal:', error);
    }
    
    // Gerar áudio para os exemplos
    const exampleAudios = [];
    
    for (let i = 0; i < examples.length; i++) {
      try {
        const parts = examples[i].split(/\(([^)]+)\)/);
        const originalText = parts[0].trim().replace(/^\d+\.\s*/, ''); // Remove o número e espaços
        
        showStatus(`Gerando áudio para exemplo ${i + 1} de ${examples.length}...`, 'warning');
        
        const { elevenLabsApiKey } = await chrome.storage.sync.get('elevenLabsApiKey');
        if (elevenLabsApiKey) {
          const audioBase64 = await generateAudio(originalText, language, elevenLabsApiKey);
          if (audioBase64) {
            exampleAudios.push({
              text: originalText,
              audio: audioBase64
            });
          }
        }
      } catch (error) {
        console.warn(`Erro ao gerar áudio do exemplo ${i + 1}:`, error);
      }
    }
    
    // Armazenar áudios no Anki
    if (mainAudioBase64) {
      await invokeAnkiConnect('storeMediaFile', {
        filename: word + '.mp3',
        data: mainAudioBase64
      });
    }
    
    // Armazenar áudios dos exemplos
    for (let i = 0; i < exampleAudios.length; i++) {
      const { text, audio } = exampleAudios[i];
      const filename = `${word}_example${i + 1}.mp3`;
      await invokeAnkiConnect('storeMediaFile', {
        filename: filename,
        data: audio
      });
    }
    
    // Formatar o conteúdo do verso com HTML e áudios (igual ao content.js)
    const versoContent = `<div style="text-align: left; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: ${theme.text};">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: ${theme.text};">${word}</div>
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
    </div>`;
    
    // Preparar a nota
    let fields = {};
    
    // Verifica se os campos da nota correspondem aos campos do modelo
    if (modelFields.includes('Frente') && modelFields.includes('Verso')) {
      fields = {
        Frente: word,
        Verso: versoContent
      };
    } else {
      // Tenta adaptar ao nome dos campos em inglês
      fields = {
        Front: word,
        Back: versoContent
      };
      console.log('Adaptando para campos em inglês (Front/Back)');
    }
    
    const note = {
      deckName: deckName,
      modelName: "Básico",
      fields: fields,
      options: {
        allowDuplicate: false,
        duplicateScope: "deck"
      },
      tags: [language]
    };
    
    // Adicionar a nota via AnkiConnect
    const result = await invokeAnkiConnect('addNote', { note });
    
    // Força uma sincronização
    await invokeAnkiConnect('sync');
    
    return result;
  } catch (error) {
    console.error('Erro ao adicionar card ao Anki:', error);
    throw error;
  }
}

// Função para obter configurações de tema
function getTheme(isDark) {
  return {
    bg: isDark ? '#1a1a1a' : 'white',
    text: isDark ? '#e0e0e0' : '#333',
    border: isDark ? '#404040' : '#ddd',
    highlight: isDark ? '#2980b9' : '#3498db',
    secondary: isDark ? '#2d2d2d' : '#f9f9f9',
    boxBg: isDark ? '#2d2d2d' : '#f8f9fa',
    exampleBg: isDark ? '#262626' : '#f9f9f9',
    exampleBorder: isDark ? '#404040' : '#ddd',
    exampleText: isDark ? '#e0e0e0' : '#2c3e50',
    translationText: isDark ? '#b0b0b0' : '#7f8c8d'
  };
}

// Função para gerar áudio usando ElevenLabs API
async function generateAudio(text, language, apiKey) {
  try {
    // Lista de vozes para diferentes idiomas
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
        voiceId = 'kgF5UZYTYKw2W1SfEbTX'; // Alice (russo)
        break;
      case 'zh':
        voiceId = 'zhiAM6ThQpJAXvZkXjXQ'; // Chinese voice
        break;
      case 'en':
      default:
        voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel (inglês)
        break;
    }

    // Configurações para melhor qualidade
    const stability = 0.5;
    const similarity_boost = 0.75;

    console.log(`Gerando áudio para: ${text} (${language})`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
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

// Função para invocar AnkiConnect
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