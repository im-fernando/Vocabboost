# VocabBoost - Translator and Anki

A Chrome extension that helps you learn English while browsing! Translate words instantly and create flashcards on Anki with examples and images from context.

## 🚀 Features

- Instant translation of words during browsing
- Automatic flashcard creation on Anki
- Contextual usage examples
- Support for images in flashcards
- Intuitive and easy-to-use interface
- Integration with Anki through AnkiConnect

## 📋 Prerequisites

- Google Chrome
- Anki installed on your computer
- AnkiConnect installed on Anki
- Google Cloud API Key (for translation)
- ElevenLabs API Key (optional, for text-to-speech)

## 🛠️ Installation

1. Clone this repository or download the files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click on "Load unpacked" and select the project folder
5. Configure your API keys in the extension options

## ⚙️ Configuration

1. Click on the extension icon in Chrome's toolbar
2. Go to the extension options
3. Configure your API keys:
   - Google Cloud API Key
   - ElevenLabs API Key (optional)
4. Configure the AnkiConnect URL (default: http://localhost:8765)

## 💡 How to Use

1. During browsing, select any English text
2. The translation will appear instantly
3. To create a flashcard:
   - Click on the extension icon
   - Paste your word list
   - Click on "Process Words"
4. The flashcards will be created automatically on Anki

## �� Project Structure

- `manifest.json`: Extension configuration
- `popup.html/js/css`: User interface
- `content.js`: Content script for web page interaction
- `background.js`: Service worker for background processing
- `options.html/js`: Settings page
- `config.js`: Global settings
- `locales/`: Translation files
- `icons/`: Extension icons

## 🤝 Contributing

Contributions are welcome! Please feel free to:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 📞 Support

If you encounter any issues or have suggestions, please open an issue on GitHub.

## 🙏 Acknowledgments

- Anki for providing an amazing platform for learning
- Google Cloud for providing translation services
- ElevenLabs for providing text-to-speech services