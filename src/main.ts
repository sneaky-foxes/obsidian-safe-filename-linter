import { App, Notice, Plugin, Setting, normalizePath } from 'obsidian';
import FilenameLinterSettingTab from './settings';

interface FilenameLinterSettings {
	squareBrackets: string;
	numberSign: string;
	caret: string;
	pipe: string;
	colon: string;
	asterisk: string;
	questionMark: string;
	doubleQuote: string;
	angleBrackets: string;
}

const DEFAULT_SETTINGS: FilenameLinterSettings = {
	squareBrackets: 'off',
	numberSign: 'off',
	caret: 'off',
	pipe: 'off',
	colon: 'off',
	asterisk: 'off',
	questionMark: 'off',
	doubleQuote: 'off',
	angleBrackets: 'off'
}

export default class FilenameLinter extends Plugin {
	settings: FilenameLinterSettings;

	async onload() {
		await this.loadSettings();

		// Add a command to lint the current file
		this.addCommand({
			id: 'lint-current-file-filename',
			name: 'Lint the current filename',
			checkCallback: (checking: boolean) => {
				// Get current active file if there is one
				const activeFile = this.app.workspace.getActiveFile();

				// getActiveFile can return a TFile or null
				// See https://docs.obsidian.md/Reference/TypeScript+API/Workspace/getActiveFile
				if (activeFile !== null) {

					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						this.lintFilename(activeFile);
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});


		// Add a command to lint all files in the vault
		this.addCommand({
			id: 'lint-all-filenames',
			name: 'Lint all filenames in the vault',
			callback: () => {
				this.lintAllFilenames();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FilenameLinterSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getReplacementValueFromSetting(setting: Setting): string {
		let replacement = '';
		switch(setting) {
			case 'blank':
				replacement = '';
				break;
			case 'space':
				replacement = ' ';
				break;
			case 'hyphen':
				replacement = '-';
				break;
			case 'hyphen-space':
				replacement = ' - ';
				break;
		}
		return replacement;
	}

	async lintFilename(file: TFile) {
		const oldFilename = file.basename;
		let newFilename = file.basename;

		// Handle square brackets
		if (this.settings.squareBrackets !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.squareBrackets);
				newFilename = newFilename.replaceAll(/[\[\]]/ig, replacement);
		}

		// Handle number sign
		if (this.settings.numberSign !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.numberSign);
				newFilename = newFilename.replaceAll(/#/ig, replacement);
		}

		// Handle caret
		if (this.settings.caret !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.caret);
				newFilename = newFilename.replaceAll(/\^/ig, replacement);
		}

		// Handle pipe
		if (this.settings.pipe !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.pipe);
				newFilename = newFilename.replaceAll(/\|/ig, replacement);
		}

		// Handle colon
		if (this.settings.colon !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.colon);
				newFilename = newFilename.replaceAll(/\:/ig, replacement);
		}

		// Handle asterisk
		if (this.settings.asterisk !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.asterisk);
				newFilename = newFilename.replaceAll(/\*/ig, replacement);
		}

		// Handle question mark
		if (this.settings.questionMark !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.questionMark);
				newFilename = newFilename.replaceAll(/\?/ig, replacement);
		}

		// Handle double quote
		if (this.settings.doubleQuote !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.doubleQuote);
				newFilename = newFilename.replaceAll(/\"/ig, replacement);
		}

		// Handle angle brackets
		if (this.settings.angleBrackets !== 'off') {
				const replacement = this.getReplacementValueFromSetting(this.settings.angleBrackets);
				newFilename = newFilename.replaceAll(/[\<\>]/ig, replacement);
		}

		// If there are changes to be made to the filename
		if (newFilename != oldFilename) {

			// Construct the new path
			const newFilepath = normalizePath(`${file.parent.path}/${newFilename}.${file.extension}`);

			// If a file already exists with this path, filemanager.renameFile() will throw an error. There might be other reasons it throws errors, but not as far as we can tell from the documentation.
			// See https://docs.obsidian.md/Reference/TypeScript+API/FileManager/renameFile
			try {
				await this.app.fileManager.renameFile(file, newFilepath);

				// If the file was successfully rename, alert the user
				new Notice(`"${oldFilename}" renamed to "${newFilename}"`, 0);
			} catch(error) {
				// If there was an error, alert the user.
				new Notice(`Unable to rename "${oldFilename}" to "${newFilename}". There probably already exists a file with this name`, 0);
			}
		}
	}

	async lintAllFilenames() {
		new Notice("Linting all filenames...", 0);
		await Promise.all(
			// Get all files in the current vault
			this.app.vault.getFiles().map(async (file) => {
				await this.lintFilename(file);
			})
		);
		new Notice("Linted all filenames", 0);
	}
}
