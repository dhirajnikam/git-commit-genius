import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    // Register commands
    let commitAllChangesDisposable = vscode.commands.registerCommand('autoCommit.commitAllChanges', () => {
        commitAllChanges();
    });

    let commitStagedChangesDisposable = vscode.commands.registerCommand('autoCommit.commitStagedChanges', () => {
        commitStagedChanges();
    });

    let setGeminiKeyDisposable = vscode.commands.registerCommand('autoCommit.setGeminiKey', () => {
        setGeminiKey();
    });

    context.subscriptions.push(commitAllChangesDisposable, commitStagedChangesDisposable, setGeminiKeyDisposable);
}

function setGeminiKey() {
    vscode.window.showInputBox({
        prompt: 'Enter your Gemini API key',
        password: true,
        ignoreFocusOut: true
    }).then(key => {
        if (key) {
            const config = vscode.workspace.getConfiguration('autoCommit');
            config.update('apiKey', key, vscode.ConfigurationTarget.Global)
                .then(() => vscode.window.showInformationMessage('Gemini API key saved successfully!'),
                    error => vscode.window.showErrorMessage(`Failed to save Gemini API key: ${error}`)
                );
        } else {
            vscode.window.showErrorMessage('No API key provided.');
        }
    });
}

function getGeminiApiKey(): string | undefined {
    const config = vscode.workspace.getConfiguration('autoCommit');
    return config.get<string>('apiKey');
}

async function getCommitMessageFromGemini(diffSummary: string): Promise<string> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        vscode.window.showErrorMessage('Gemini API key is not set. Use the "Set Gemini API Key" command.');
        throw new Error('Gemini API key not set');
    }

    const geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

    const prompt = `Generate a concise, one-line GitHub commit message based on the following changes. 
    The message must start with one of these prefixes: feat, fix, docs, style, refactor, perf, test, chore, ci.
    Avoid multiple prefixes or detailed descriptions. Changes: ${diffSummary}`;

    const response = await fetch(`${geminiApiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json() as { candidates?: { content?: { parts?: { text: string }[] } }[] };
    const commitMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!commitMessage) {
        throw new Error('Failed to generate commit message from Gemini.');
    }

    return commitMessage;
}

function executeGitCommand(command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        exec(command, { cwd: workspaceRoot }, callback);
    } else {
        vscode.window.showErrorMessage('No workspace folder is open.');
    }
}

function commitAllChanges() {
    executeGitCommand('git ls-files --modified --others --deleted --exclude-standard', async (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error: ${stderr}`);
            return;
        }

        const files = stdout.split('\n').filter(file => file.trim() !== '');

        if (files.length === 0) {
            vscode.window.showInformationMessage('No changes to commit.');
            return;
        }

        for (const file of files) {
            try {
                let diffSummary = file.includes('deleted') ? `File '${file}' has been deleted.` : await getFileDiff(file);
                const commitMessage = await getCommitMessageFromGemini(diffSummary);
                executeGitCommand(`git add "${file}" && git commit -m "${commitMessage}"`, (error, stdout, stderr) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Error committing ${file}: ${stderr}`);
                    } else {
                        vscode.window.showInformationMessage(`Committed ${file}: ${commitMessage}`);
                    }
                });
            } catch (err) {
                vscode.window.showErrorMessage(`Error generating commit message for ${file}: ${err instanceof Error ? err.message : err}`);
            }
        }
    });
}

async function commitStagedChanges() {
    executeGitCommand('git diff --cached --name-only', async (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error: ${stderr}`);
            return;
        }

        const stagedFiles = stdout.split('\n').filter(file => file.trim() !== '');

        if (stagedFiles.length === 0) {
            vscode.window.showInformationMessage('No staged changes to commit.');
            return;
        }

        let diffSummary = '';
        for (const file of stagedFiles) {
            const fileDiff = await getFileDiff(file);
            diffSummary += `Changes in ${file}:\n${fileDiff}\n\n`;
        }

        try {
            const commitMessage = await getCommitMessageFromGemini(diffSummary);
            const userConfirmedMessage = await vscode.window.showInputBox({
                prompt: 'Review and edit the commit message (if needed)',
                value: commitMessage,
                ignoreFocusOut: true
            });

            if (!userConfirmedMessage) {
                vscode.window.showErrorMessage('Commit message is required.');
                return;
            }

            executeGitCommand(`git commit -m "${userConfirmedMessage}"`, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error committing staged changes: ${stderr}`);
                } else {
                    vscode.window.showInformationMessage(`Committed staged changes: ${userConfirmedMessage}`);
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage(`Error generating commit message: ${err instanceof Error ? err.message : err}`);
        }
    });
}

async function getFileDiff(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
        executeGitCommand(`git diff "${file}"`, (error, stdout, stderr) => {
            error ? reject(stderr) : resolve(stdout || `File '${file}' has changes, but no diff output.`);
        });
    });
}

async function readFileContent(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
        executeGitCommand(`cat "${file}"`, (error, stdout, stderr) => {
            error ? reject(stderr) : resolve(stdout);
        });
    });
}

export function deactivate() {}