import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';

import 'ptcs-label/ptcs-label.js';
import 'ptcs-link/ptcs-link.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-confirmation/ptcs-confirmation.js';

import {fileLabel, getFileType, isFileTypeAllowed} from './file-library';

PTCS.FileUploadListItem = class extends PTCS.BehaviorValidate(PTCS.BehaviorTooltip(
    PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
            <style>
                :host {
                    display: inline-block;
                    box-sizing: border-box;
                    width: 100%;
                }

                :host(:focus) {
                    outline: none;
                }

                :host([uploading]) [part=file-progress] {
                    display: block;
                }

                :host([uploading]) [part=file-progress-bar] {
                    display: block;
                }

                :host([failed]) [part=file-replace] {
                    display: block;
                }

                :host([validity=invalid]) [part=file-replace] {
                    display: block;
                }

                [part=file-replace], [part=file-progress], [part=file-progress-bar] {
                    display: none;
                }

                .file-item {
                    display: inline-flex;
                    flex-direction: column;
                    justify-content: center;
                    width: 100%;

                    overflow: hidden;
                }

                [part=file-to-upload] {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .file-info {
                    display: flex;
                    align-items: center;

                    overflow: hidden;
                }

                .file-actions {
                    display: flex;
                    align-items: center;

                    overflow: hidden;

                    flex: 0 0 auto;
                }

                [part=file-progress-bar] {
                    width: 100%;
                }

                [part=file-progress-bar] > span {
                    display: block;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }

                [part=file-name] {
                    flex: 0 1 auto;
                }

                [part=file-icon] {
                    flex: 0 0 auto;
                }

                [part=file-icon][hidden] {
                    display: none;
                }
            </style>

            <div class="file-item" part="file-item">
                <div id="file-to-upload" part="file-to-upload">
                    <div class="file-info">
                        <svg part="file-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="24" fill="none" viewBox="0 0 20 24"
                            hidden$="[[hideFileTypeIcon]]">
                            <path fill-rule="evenodd" d="M17 22.5H5A1.5 1.5 0 013.5 21V3A1.5 1.5 0 015 1.5h9v4A1.5 1.5 0 0015.5
                                7h3v14a1.5 1.5 0 01-1.5 1.5zM20 6l-5-6H5a3 3 0 00-3 3v18a3 3 0 003 3h12a3 3 0 003-3V6z" clip-rule="evenodd"/>
                            <g>
                                <rect part="file-icon-rectangle" width="17" height="8" y="12" rx="1"/>
                                <text part="file-icon-text" y="18" x$="[[_getIconTextX(item.type)]]">[[item.type]]</text>
                            </g>
                        </svg>
                        <ptcs-label part="file-name" label="[[_fileLabel(item.file, item.filename)]]" variant="body">
                        </ptcs-label>
                    </div>
                    <div class="file-actions">
                        <ptcs-label class="progress" part="file-progress"
                            label="[[_addPercents(item.progress)]]" variant="caption">
                        </ptcs-label>
                        <ptcs-link id="file-replace" part="file-replace" label="[[replaceLabel]]" tabindex\$="[[_delegatedFocus]]"
                            disabled="[[disabled]]">
                        </ptcs-link>
                        <input id="browse-file" type="file" hidden accept="[[allowedFileTypes]]">
                        <div part="hit-area" on-click="_cancel">
                            <ptcs-button part="file-cancel" icon="cds:icon_close_mini" variant="small"
                            tooltip="[[_getCancelTooltip(item.status)]]" tabindex\$="[[_delegatedFocus]]" disabled="[[disabled]]">
                            </ptcs-button>
                        </div>
                    </div>
                </div>
                <div part="file-progress-bar">
                    <span part="file-progress-bar-progress" style$="[[_progressBarWidth(item.progress)]]"></span>
                </div>
            </div>
        `;
    }

    static get is() {
        return 'ptcs-file-upload-list-item';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            item: {
                type:     Object,
                validate: '_validateListItem(item, allowedFileTypes, maxFileSize, maxUploadSize, failed)'
            },

            failed: {
                type:               Boolean,
                computed:           '_setFailed(item.status)',
                reflectToAttribute: true
            },

            completed: {
                type:               Boolean,
                computed:           '_setCompleted(item.status)',
                reflectToAttribute: true
            },

            uploading: {
                type:               Boolean,
                computed:           '_setUploading(item.status)',
                reflectToAttribute: true
            },

            status: {
                type:  String,
                value: ''
            },

            maxFileSize: {
                type: Number
            },

            maxFileSizeFailureTitle: {
                type: String
            },

            maxFileSizeFailureMessage: {
                type: String
            },

            maxUploadSize: {
                type: Number
            },

            maxUploadSizeFailureTitle: {
                type: String
            },

            maxUploadSizeFailureMessage: {
                type: String
            },

            allowedFileTypes: {
                type: String
            },

            allowedFileTypesMessage: {
                type: String
            },

            allowedFileTypesMessageDetails: {
                type: String
            },

            hideFileTypeIcon: {
                type:               Boolean,
                reflectToAttribute: true
            },

            uploadedFileHeight: {
                type:     Number,
                observer: '_uploadedFileHeightChanged'
            },

            replaceLabel: {
                type:  String,
                value: 'Replace'
            },

            deleteFileTooltip: {
                type:  String,
                value: 'Delete file'
            },

            cancelUploadTooltip: {
                type:  String,
                value: 'Cancel upload'
            },

            _delegatedFocus: String
        };
    }

    ready() {
        super.ready();

        if (this.uploadedFileHeight === undefined) {
            this.uploadedFileHeight = 48;
        }

        this.$['file-replace'].addEventListener('click', () => {
            if (this.disabled) {
                return;
            }

            this.$['browse-file'].click();
        });

        this.$['browse-file'].addEventListener('click', () => {
            // If a user selects the same file, the "change" event will not be triggered
            // because the current value is the same as the previous. To prevent this problem I'm erasing the value first.
            this.$['browse-file'].value = '';
        });

        this.$['browse-file'].addEventListener('change', () => {
            this.dispatchEvent(new CustomEvent('replace-file', {
                bubbles:  true,
                composed: true,
                detail:   {
                    file: this.$['browse-file'].files[0]
                }
            }));
        });
    }

    _getIconTextX(type) {
        return type.length > 3 ? 1 : 3;
    }

    _getCancelTooltip(status) {
        return status === 'uploading' ? this.cancelUploadTooltip : this.deleteFileTooltip;
    }

    _uploadedFileHeightChanged(v) {
        if (!this.$['file-to-upload']) {
            return;
        }

        this.$['file-to-upload'].style.height = `${v}px`;
    }

    _fileLabel(file, filename) {
        return fileLabel(file, filename);
    }

    _setUploading(status) {
        return status === 'uploading';
    }

    _setFailed(status) {
        return status === 'failed';
    }

    _setCompleted(status) {
        return status === 'completed';
    }

    _sizeLimit(filesize, maxMB) {
        return filesize <= Number(maxMB) * Math.pow(1024, 2);
    }

    _computeIsFileSizeAllowed(item, maxFileSize) {
        return maxFileSize && item ? this._sizeLimit(item.file.size, maxFileSize) : true;
    }

    _computeIsUploadSizeAllowed(item, maxUploadSize) {
        return maxUploadSize && item ? this._sizeLimit(item.file.size, maxUploadSize) : true;
    }

    _computeIsFileTypeAllowed(item, allowedFileTypes) {
        return allowedFileTypes && item ? isFileTypeAllowed(allowedFileTypes, getFileType(item.file)) : true;
    }

    _validateListItem(item, allowedFileTypes, maxFileSize, maxUploadSize, failed) {
        let messages = [];

        if (!this._computeIsFileTypeAllowed(item, allowedFileTypes)) {
            this.validationMessage = this.allowedFileTypesMessage ? this.allowedFileTypesMessage : this.validationMessage;
            messages.push(this.allowedFileTypesMessageDetails);
        }

        if (!this._computeIsFileSizeAllowed(item, maxFileSize)) {
            this.validationMessage = this.maxFileSizeFailureTitle;
            const msg = PTCS.replaceStringTokens(this.maxFileSizeFailureMessage, {value: maxFileSize});
            messages.push(this.maxFileSizeFailureMessage ? msg.join('. ') : this.validationMessage);
        }

        if (!this._computeIsUploadSizeAllowed(item, maxUploadSize)) {
            this.validationMessage = this.maxUploadSizeFailureTitle;
            const msg = PTCS.replaceStringTokens(this.maxUploadSizeFailureMessage, {value: maxUploadSize});
            messages.push(this.maxUploadSizeFailureMessage ? msg.join('. ') : this.validationMessage);
        }

        if (failed) {
            this.validationMessage = this.fileUploadErrorMessage ? this.fileUploadErrorMessage : this.validationMessage;
            messages.push(this.fileUploadErrorDetails);
        }

        return messages.length ? messages : true;
    }

    _insertValidationMessage(messageElement) {
        this.shadowRoot.appendChild(messageElement);
    }

    _progressBarWidth(w) {
        return `width: ${w}%`;
    }

    _addPercents(v) {
        return `${v}%`;
    }

    _cancel() {
        this.dispatchEvent(new CustomEvent('cancel-file', {
            bubbles:  true,
            composed: true
        }));
    }
};

customElements.define(PTCS.FileUploadListItem.is, PTCS.FileUploadListItem);
