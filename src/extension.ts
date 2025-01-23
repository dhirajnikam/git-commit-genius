import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand("autoCommit.runScript", async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace folder found. Please open a folder to use this extension.");
            return;
        }

        const config = vscode.workspace.getConfiguration("commitWizard");
        const apiKey = config.get<string>("apiKey");

        if (!apiKey) {
            vscode.window.showErrorMessage("Gemini API key is not set. Please configure it in the extension settings.");
            return;
        }

        const scriptPath = path.join(context.extensionPath, "auto_commit.sh");

        exec(`chmod +x "${scriptPath}"`, (chmodError) => {
            if (chmodError) {
                vscode.window.showErrorMessage("Failed to make the script executable.");
                console.error(chmodError);
                return;
            }

            exec(`"${scriptPath}" "${apiKey}"`, { cwd: workspaceFolder }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage("An error occurred while running the script.");
                    console.error(error);
                    return;
                }

                if (stderr) {
                    vscode.window.showWarningMessage(`Script warning: ${stderr}`);
                }

                vscode.window.showInformationMessage("Auto-commit script executed successfully.");
                console.log(stdout);
            });
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}