# VocabBoost - Tradutor e Anki

Uma extensão do Chrome que ajuda você a aprender inglês enquanto navega! Traduza palavras instantaneamente e crie flashcards no Anki com exemplos e imagens do contexto.

## 🎯 Objetivo
Nosso objetivo com o VocabBoost é tornar o aprendizado de idiomas acessível para todos. Acreditamos que aprender uma nova língua deve ser algo prático, intuitivo e integrado ao dia a dia. Com essa extensão, queremos facilitar a imersão no inglês e ajudar usuários a expandirem seu vocabulário de forma eficiente.

## 🚀 Funcionalidades

- Tradução instantânea de palavras durante a navegação
- Criação automática de flashcards no Anki
- Exemplos de uso em contexto
- Suporte a imagens nos flashcards
- Interface intuitiva e fácil de usar
- Integração com o Anki através do AnkiConnect

## 📋 Pré-requisitos

- Google Chrome
- Anki instalado no seu computador
- AnkiConnect instalado no Anki
- Chave de API do Google Cloud (para tradução)
- Chave de API do ElevenLabs (opcional, para síntese de voz)

## 🛠️ Instalação

1. Clone este repositório ou baixe os arquivos
2. Abra o Chrome e vá para `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação" e selecione a pasta do projeto
5. Configure suas chaves de API nas opções da extensão

## ⚙️ Configuração

1. Clique no ícone da extensão na barra de ferramentas do Chrome
2. Vá para as opções da extensão
3. Configure suas chaves de API:
   - Chave de API do Google Cloud
   - Chave de API do ElevenLabs (opcional)
4. Configure a URL do AnkiConnect (padrão: http://localhost:8765)

## 💡 Como Usar

1. Durante a navegação, selecione qualquer texto em inglês
2. A tradução aparecerá instantaneamente
3. Para criar flashcards em massa:
   - Clique no ícone da extensão
   - Cole sua lista de palavras
   - Clique em "Processar Palavras"
4. Os flashcards serão criados automaticamente no Anki

## 🔧 Estrutura do Projeto

- `manifest.json`: Configuração da extensão
- `popup.html/js/css`: Interface do usuário
- `content.js`: Script de conteúdo para interação com páginas web
- `background.js`: Service worker para processamento em segundo plano
- `options.html/js`: Página de configurações
- `config.js`: Configurações globais
- `locales/`: Arquivos de tradução
- `icons/`: Ícones da extensão

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some feature'`)
4. Push para a branch (`git push origin feature/feature`)
5. Abrir um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor abra uma issue no GitHub.

## 🙏 Agradecimentos

- Anki por fornecer uma plataforma incrível para aprendizado
- Google Cloud por fornecer serviços de tradução
- ElevenLabs por fornecer serviços de síntese de voz