import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface FilenameLinterSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: FilenameLinterSettings = {
	mySetting: 'default'
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
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async lintFilename(file: TFile) {
		new Notice(`hello: ${file.basename}`);
	}

	async lintAllFilenames() {
		new Notice(`we lint everything!`);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: FilenameLinter;

	constructor(app: App, plugin: FilenameLinter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
