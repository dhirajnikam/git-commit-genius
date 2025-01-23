import * as vscode from "vscode";
import * as childProcess from "child_process";

type GeminiResponse = {
    contents?: {
        parts?: {
            text?: string;
        }[];
    }[];
};

/**
 * This function is called when the extension is activated.
 */
export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        "autoCommit.commitSelectedFiles",
        async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

            if (!workspaceFolder) {
                vscode.window.showErrorMessage("No workspace folder found.");
                return;
            }

            const apiKey = await getOrSetApiKey();
            if (!apiKey) {
                vscode.window.showErrorMessage("Gemini API key is not set.");
                return;
            }

            try {
                // Get a list of changed files
                const changedFiles = getChangedFiles(workspaceFolder);
                if (changedFiles.length === 0) {
                    vscode.window.showInformationMessage("No changes to commit.");
                    return;
                }

                // Let the user select files to commit
                const selectedFiles = await vscode.window.showQuickPick(changedFiles, {
                    canPickMany: true,
                    title: "Select files to commit",
                });

                if (!selectedFiles || selectedFiles.length === 0) {
                    vscode.window.showInformationMessage("No files selected for commit.");
                    return;
                }

                // Generate a diff summary for the AI
                const diffSummary = generateDiffSummary(workspaceFolder, selectedFiles);

                // Fetch the AI-generated commit message
                const aiMessage = await getAiCommitMessage(diffSummary, apiKey);
                if (!aiMessage) {
                    vscode.window.showErrorMessage("Failed to generate commit message.");
                    return;
                }

                // Commit the selected files with the AI message
                await commitSelectedFiles(workspaceFolder, selectedFiles, aiMessage);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Auto-commit failed: ${error.message}`);
                console.error("Error in AutoCommit:", error);
            }
        }
    );

    context.subscriptions.push(disposable);
}

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}

/**
 * Retrieves or prompts for the Gemini API key.
 */
async function getOrSetApiKey(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration("autoCommit");
    const maybeKey: string | undefined = config.get<string>("apiKey");
    const apiKey: string | null = maybeKey ?? null;

    if (!apiKey) {
        const userInput = await vscode.window.showInputBox({
            prompt: "Enter your Gemini API Key",
            placeHolder: "Paste your API key here",
            ignoreFocusOut: true,
        });

        if (userInput) {
            // Save the key globally if entered
            await config.update("apiKey", userInput, vscode.ConfigurationTarget.Global);
            return userInput;
        }
    }

    return apiKey;
}

/**
 * Fetches a list of changed files using Git.
 */
function getChangedFiles(workspaceFolder: string): string[] {
    try {
        const output = childProcess
            .execSync("git status --porcelain", { cwd: workspaceFolder })
            .toString();

        return output
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => line.substring(3).trim());
    } catch (error) {
        vscode.window.showErrorMessage("Failed to fetch changed files.");
        console.error("Error fetching changed files:", error);
        return [];
    }
}

/**
 * Generates a diff summary for the selected files.
 */
function generateDiffSummary(workspaceFolder: string, files: string[]): string {
    return files
        .map(file => {
            const diff = childProcess.execSync(`git diff ${file}`, { cwd: workspaceFolder }).toString();
            return `[File: ${file}] Diff:\n${diff}`;
        })
        .join("\n\n");
}

/**
 * Fetches an AI-generated commit message from the Gemini API.
 */
async function getAiCommitMessage(diffSummary: string, apiKey: string): Promise<string | null> {
    const GEMINI_API_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

    const prompt = `Generate a concise, one-line commit message with a Conventional Commit prefix from [feat, fix, docs, style, refactor, perf, test, chore, ci] based on these file changes:
${diffSummary}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const data = (await response.json()) as GeminiResponse;
        const aiMessage = data?.contents?.[0]?.parts?.[0]?.text ?? null;
        return aiMessage ? sanitizeCommitMessage(aiMessage) : null;
    } catch (error) {
        console.error("Failed to fetch AI commit message:", error);
        return null;
    }
}

/**
 * Ensures the commit message starts with a valid Conventional Commit prefix.
 */
function sanitizeCommitMessage(message: string): string {
    const validPrefixes = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci"];
    let chosenPrefix = "refactor";

    for (const prefix of validPrefixes) {
        if (message.toLowerCase().startsWith(prefix)) {
            chosenPrefix = prefix;
            message = message.substring(prefix.length).trim();
            break;
        }
    }

    return `${chosenPrefix}: ${message}`;
}

/**
 * Stages and commits the selected files with the given commit message.
 */
async function commitSelectedFiles(workspaceFolder: string, files: string[], commitMessage: string) {
    try {
        for (const file of files) {
            childProcess.execSync(`git add "${file}"`, { cwd: workspaceFolder });
        }

        childProcess.execSync(`git commit -m "${commitMessage}"`, { cwd: workspaceFolder });
        vscode.window.showInformationMessage(`Committed files with message: "${commitMessage}"`);
    } catch (error: any) {
        vscode.window.showErrorMessage("Failed to commit selected files.");
        console.error("Error committing files:", error);
    }
}