# Commit Wizard

Commit Wizard is a Visual Studio Code extension designed to streamline your Git workflow by automating the commit process with AI-generated messages. Powered by the Gemini API, Commit Wizard ensures your commit messages are concise, meaningful, and follow the Conventional Commit standard.

## Features

- **AI-Generated Commit Messages**: Automatically generate commit messages with Conventional Commit prefixes (e.g., `feat`, `fix`, `docs`, `style`, etc.).
- **Streamlined Git Workflow**: Automates staging, generating a commit message, and committing files in one seamless process.
- **Customization**: Easily configure your Gemini API key and default commit prefix via VS Code settings.

## Requirements

To use Commit Wizard, ensure the following prerequisites are met:

- **Git**: Installed and properly configured on your system.
- **Gemini API Key**: Obtain your API key from the Gemini API Portal.
- **Node.js**: Installed and available for running the extension.

## Extension Settings

Commit Wizard introduces the following settings to VS Code:

- `commitWizard.apiKey`: Your Gemini API key for generating AI-powered commit messages. This key is required for the extension to work.
- `commitWizard.defaultPrefix`: The fallback Conventional Commit prefix to use if the AI response is missing or invalid. Default: `refactor`.

## Installation

1. Install Commit Wizard from the VS Code Marketplace.
2. Alternatively, download the `.vsix` package and manually install it in VS Code:
   - Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
   - Click the `...` (More Actions) menu and select **Install from VSIX**.
   - Choose the downloaded `.vsix` file.

## Usage

1. Open a project with a Git repository in VS Code.
2. Go to Settings and configure your `commitWizard.apiKey` with your Gemini API key.
3. Run the command **Commit Wizard: Run Auto-Commit Script** from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

### The extension will:

- Detect all changed files in your repository.
- Group files by their top-level directory.
- Automatically generate AI-powered commit messages for each group.
- Commit the changes.

## Workflow Example

1. **Change Files**: Make changes to your codebase.
2. **Run Command**: Run the **Commit Wizard: Run Auto-Commit Script**.
3. **AI-Generated Commit**: Let the AI handle your commit messages:

   ```plaintext
   Committed directory 'src' with: "feat: Added support for AI-based commit messages."
   ```

## Commands

| Command                             | Description                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- |
| **Set Gemini API Key**              | Set your Gemini API key for generating commit messages.                   |
| **Commit All Changes Individually** | Commit each changed file individually with a unique AI-generated message. |
| **Commit Staged Changes**           | Commit all staged changes with a single AI-generated message.             |

## Contributing

Contributions are welcome! If you'd like to contribute to Commit Wizard, follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.

## Acknowledgments

- **Gemini API**: For providing the AI-powered text generation capabilities.
- **VS Code**: For the extensible platform that makes this extension possible.

Enjoy using Commit Wizard to simplify your Git workflow! 🚀
