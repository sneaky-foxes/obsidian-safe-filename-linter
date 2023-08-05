import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, normalizePath } from 'obsidian';

interface FilenameLinterSettings {
	squareBrackets: string;
	numberSign: string;
	caret: string;
	pipe: string;
	colon: string;
}

const DEFAULT_SETTINGS: FilenameLinterSettings = {
	squareBrackets: 'off',
	numberSign: 'off',
	caret: 'off',
	pipe: 'off',
	colon: 'off'
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

class FilenameLinterSettingTab extends PluginSettingTab {
	plugin: FilenameLinter;

	constructor(app: App, plugin: FilenameLinter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		this.intro();
		this.obsidianChars();
	}

	intro(): void {
		const { containerEl } = this;

		containerEl.createDiv({ cls: 'css-class' }, (wrapper) => {
			wrapper.createDiv({
				cls: 'css-class',
				text: 'Note that Obsidian will automatically truncate multiple spaces in filenames and [[links]] into one space.',
			});
			wrapper.createDiv({ cls: 'css-class' }).appendChild(
				createFragment((frag) => {
					frag.appendText(
						''
					);
					frag.createEl('a', {
						text: '',
						href: '',
					});
				})
			);
		});
	}

	addReplacementOptions(dropdown: DropdownComponent): void {
		dropdown.addOption('off', 'off');
		dropdown.addOption('blank', 'empty string');
		dropdown.addOption('space', 'space');
		dropdown.addOption('hyphen', 'hyphen');
		dropdown.addOption('hyphen-space', 'hyphen surrounded by spaces');
	}

	obsidianChars(): void {
		const { containerEl } = this;

		this.containerEl.createEl("h2", { text: "Obsidian troublesome characters" });
		this.containerEl.createEl("p", { text: "Obsidian itself won't let you use these in titles, removing them automatically. If you create files via external means they can creep in. These characters wreak havoc with [[links]] syntax." });

		// Setting for square brackets: []
		new Setting(containerEl)
			.setName('Replacement for square brackets')
			.setDesc('Specify the replacament for \[ and \]')
			.addDropdown((dropdown) => {
					this.addReplacementOptions(dropdown);

				dropdown.setValue(this.plugin.settings.squareBrackets);
				dropdown.onChange(async (value) => {
					this.plugin.settings.squareBrackets = value;
					await this.plugin.saveSettings();
				});
			});

		// Setting for number sign: #
		new Setting(containerEl)
			.setName('Replacement for number sign')
			.setDesc('Specify the replacament for \#')
			.addDropdown((dropdown) => {
					this.addReplacementOptions(dropdown);

				dropdown.setValue(this.plugin.settings.numberSign);
				dropdown.onChange(async (value) => {
					this.plugin.settings.numberSign = value;
					await this.plugin.saveSettings();
				});
			});

		// Setting for caret: ^
		new Setting(containerEl)
			.setName('Replacement for caret')
			.setDesc('Specify the replacament for ^')
			.addDropdown((dropdown) => {
					this.addReplacementOptions(dropdown);

				dropdown.setValue(this.plugin.settings.caret);
				dropdown.onChange(async (value) => {
					this.plugin.settings.caret = value;
					await this.plugin.saveSettings();
				});
			});

		// Setting for pipe: |
		new Setting(containerEl)
			.setName('Replacement for pipe')
			.setDesc('Specify the replacament for |')
			.addDropdown((dropdown) => {
					this.addReplacementOptions(dropdown);

				dropdown.setValue(this.plugin.settings.pipe);
				dropdown.onChange(async (value) => {
					this.plugin.settings.pipe = value;
					await this.plugin.saveSettings();
				});
			});

		// Setting for colon: :
		new Setting(containerEl)
			.setName('Replacement for colon')
			.setDesc('Specify the replacament for :')
			.addDropdown((dropdown) => {
					this.addReplacementOptions(dropdown);

				dropdown.setValue(this.plugin.settings.colon);
				dropdown.onChange(async (value) => {
					this.plugin.settings.colon = value;
					await this.plugin.saveSettings();
				});
			});

	}
}
