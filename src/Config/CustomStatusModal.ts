import { Modal, Notice, Setting, TextComponent } from 'obsidian';
import { StatusConfiguration } from '../StatusConfiguration';
import type TasksPlugin from '../main';
import { StatusValidator } from '../StatusValidator';
import { Status } from '../Status';

export class CustomStatusModal extends Modal {
    statusSymbol: string;
    statusName: string;
    statusNextSymbol: string;
    statusAvailableAsCommand: boolean;
    saved: boolean = false;
    error: boolean = false;
    constructor(public plugin: TasksPlugin, statusType: StatusConfiguration) {
        super(plugin.app);
        this.statusSymbol = statusType.indicator;
        this.statusName = statusType.name;
        this.statusNextSymbol = statusType.nextStatusIndicator;
        this.statusAvailableAsCommand = statusType.availableAsCommand;
    }

    /**
     * Return a {@link StatusConfiguration} from the modal's contents
     */
    public statusConfiguration() {
        return new StatusConfiguration(
            this.statusSymbol,
            this.statusName,
            this.statusNextSymbol,
            this.statusAvailableAsCommand,
        );
    }

    async display() {
        const { contentEl } = this;

        contentEl.empty();

        const settingDiv = contentEl.createDiv();
        //const title = this.title ?? '...';

        let statusSymbolText: TextComponent;
        new Setting(settingDiv)
            .setName('Task Status Symbol')
            .setDesc('This is the character between the square braces.')
            .addText((text) => {
                statusSymbolText = text;
                text.setValue(this.statusSymbol).onChange((v) => {
                    this.statusSymbol = v;
                    CustomStatusModal.setValid(
                        text,
                        new StatusValidator().validateIndicator(this.statusConfiguration()),
                    );
                });
            })
            .then((_setting) => {
                // Show any error if the initial value loaded is incorrect.
                CustomStatusModal.setValid(
                    statusSymbolText,
                    new StatusValidator().validateIndicator(this.statusConfiguration()),
                );
            });

        let statusNameText: TextComponent;
        new Setting(settingDiv)
            .setName('Task Status Name')
            .setDesc('This is the friendly name of the task status.')
            .addText((text) => {
                statusNameText = text;
                text.setValue(this.statusName).onChange((v) => {
                    this.statusName = v;
                    CustomStatusModal.setValid(text, new StatusValidator().validateName(this.statusConfiguration()));
                });
            })
            .then((_setting) => {
                CustomStatusModal.setValid(
                    statusNameText,
                    new StatusValidator().validateName(this.statusConfiguration()),
                );
            });

        let statusNextSymbolText: TextComponent;
        new Setting(settingDiv)
            .setName('Task Next Status Symbol')
            .setDesc('When clicked on this is the symbol that should be used next.')
            .addText((text) => {
                statusNextSymbolText = text;
                text.setValue(this.statusNextSymbol).onChange((v) => {
                    this.statusNextSymbol = v;
                    CustomStatusModal.setValid(
                        text,
                        new StatusValidator().validateNextIndicator(this.statusConfiguration()),
                    );
                });
            })
            .then((_setting) => {
                CustomStatusModal.setValid(
                    statusNextSymbolText,
                    new StatusValidator().validateNextIndicator(this.statusConfiguration()),
                );
            });

        if (Status.tasksPluginCanCreateCommandsForStatuses()) {
            new Setting(settingDiv)
                .setName('Available as command')
                .setDesc(
                    'If enabled this status will be available as a command so you can assign a hotkey and toggle the status using it.',
                )
                .addToggle((toggle) => {
                    toggle.setValue(this.statusAvailableAsCommand).onChange(async (value) => {
                        this.statusAvailableAsCommand = value;
                    });
                });
        }

        const footerEl = contentEl.createDiv();
        const footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip('Save')
                .setIcon('checkmark')
                .onClick(async () => {
                    const errors = new StatusValidator().validate(this.statusConfiguration());
                    if (errors.length > 0) {
                        const message = errors.join('\n') + '\n\n' + 'Fix errors before saving.';
                        // console.debug(message);
                        new Notice(message);
                        return;
                    }
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon('cross')
                .setTooltip('Cancel')
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });
    }

    // updateTitle(admonitionPreview: HTMLElement, title: string) {
    //     let titleSpan = admonitionPreview.querySelector('.admonition-title-content');
    //     let iconEl = admonitionPreview.querySelector('.admonition-title-icon');
    //     titleSpan.textContent = title;
    //     titleSpan.prepend(iconEl);
    // }
    onOpen() {
        this.display();
    }

    static setValidationError(textInput: TextComponent) {
        textInput.inputEl.addClass('tasks-settings-is-invalid');
    }

    static removeValidationError(textInput: TextComponent) {
        textInput.inputEl.removeClass('tasks-settings-is-invalid');
    }

    private static setValid(text: TextComponent, messages: string[]) {
        const valid = messages.length === 0;
        if (valid) {
            CustomStatusModal.removeValidationError(text);
        } else {
            CustomStatusModal.setValidationError(text);
        }
    }
}
