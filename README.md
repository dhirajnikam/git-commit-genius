# Commit Wizard

Commit Wizard is a Visual Studio Code extension designed to streamline your Git workflow by automating the commit process with AI-generated messages. Powered by the Gemini API, Commit Wizard ensures your commit messages are concise, meaningful, and follow the **Conventional Commit** standard.

---

## Features

- **AI-Generated Commit Messages**: Automatically generate commit messages with Conventional Commit prefixes (e.g., `feat`, `fix`, `docs`, `style`, etc.).
- **Streamlined Git Workflow**: Automates staging, generating a commit message, and committing files in one seamless process.
- **Customization**: Easily configure your Gemini API key and default commit prefix via VS Code settings.

---

## Requirements

To use Commit Wizard, ensure the following prerequisites are met:

1. **Git**: Installed and properly configured on your system.
2. **Gemini API Key**: Obtain your API key from the [Gemini API Portal](https://gemini.google.com/).
3. **Node.js**: Installed and available for running the extension.

---

## Extension Settings

Commit Wizard introduces the following settings to VS Code:

- **`commitWizard.apiKey`**: Your Gemini API key for generating AI-powered commit messages. This key is required for the extension to work.
- **`commitWizard.defaultPrefix`**: The fallback Conventional Commit prefix to use if the AI response is missing or invalid. Default: `"refactor"`.

---

## Installation

1. Install Commit Wizard from the [VS Code Marketplace](https://marketplace.visualstudio.com/).
2. Alternatively, download the `.vsix` package and manually install it in VS Code:
   - Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
   - Click the `...` (More Actions) menu and select **Install from VSIX**.
   - Choose the downloaded `.vsix` file.

---

## Usage

1. Open a project with a Git repository in VS Code.
2. Go to **Settings** and configure your `commitWizard.apiKey` with your Gemini API key.
3. Run the command **Commit Wizard: Run Auto-Commit Script** from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
4. The extension will:
   - Detect all changed files in your repository.
   - Group files by their top-level directory.
   - Automatically generate AI-powered commit messages for each group.
   - Commit the changes.

---

## Workflow Example

1. **Change Files**: Make changes to your codebase.
2. **Run Command**: Run the **Commit Wizard: Run Auto-Commit Script**.
3. **AI-Generated Commit**: Let the AI handle your commit messages:
   ```plaintext
   Committed directory 'src' with: "feat: Added support for AI-based commit messages."
   ```
