import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';

import './ptcs-file-upload-list-item.js';

import 'ptcs-label/ptcs-label.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-confirmation/ptcs-confirmation.js';

import {fileLabel, getFileType, allFilesInListAllowed, exceedMaxFileSize, openValidationDialog} from './file-library';

const MULTI_FILE_DELIMITER = '|';

const STATUS_UPLOADING = 'uploading';
const STATUS_READY = 'ready';
const STATUS_COMPLETED = 'completed';
const STATUS_FAILED = 'failed';
const STATUS_CANCELED = 'canceled';

const EVENT_FAILED = 'upload-failed';
const EVENT_COMPLETE = 'upload-complete';
const EVENT_STARTED = 'upload-started';
const EVENT_DELETE = 'delete-file';

PTCS.FileUploadList = class extends PTCS.BehaviorValidate(PTCS.BehaviorTooltip(
    PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
            <div id="files-list" part="files-list">
                <dom-repeat items="[[_filesToUpload]]">
                    <template>
                        <ptcs-file-upload-list-item part="file-item" item="[[item]]" tabindex\$="[[_delegatedFocus]]"
                            hide-file-type-icon="[[hideFileTypeIcon]]" uploaded-file-height=[[uploadedFileHeight]]
                            on-cancel-file="_cancelUpload" on-replace-file="_replaceFile" disabled="[[disabled]]"
                            hide-validation-error="[[hideValidationError]]" hide-validation-criteria hide-validation-success
                            allowed-file-types="[[allowedFileTypes]]" allowed-file-types-message="[[allowedFileTypesMessage]]"
                            allowed-file-types-message-details="[[allowedFileTypesMessageDetails]]"
                            max-file-size="[[maxFileSize]]" max-file-size-failure-message="[[maxFileSizeFailureMessage]]"
                            max-file-size-failure-title="[[maxFileSizeFailureTitle]]" max-upload-size="[[maxUploadSize]]"
                            max-upload-size-failure-title="[[maxUploadSizeFailureTitle]]"
                            max-upload-size-failure-message="[[maxUploadSizeFailureMessage]]" replace-label="[[replaceLabel]]"
                            file-upload-error-message="[[fileUploadErrorMessage]]" file-upload-error-details="[[fileUploadErrorDetails]]">
                        </ptcs-file-upload-list-item>
                    </template>
                </dom-repeat>
            </div>
        `;
    }

    static get is() {
        return 'ptcs-file-upload-list';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            uploadManager: {
                type: Object
            },

            _filesToUpload: {
                type:  Array,
                value: () => []
            },

            _duplicateFiles: {
                type:  Array,
                value: () => []
            },

            _filesToUploadStatus: {
                type:     Number,
                value:    Date.now(),
                notify:   true,
                validate: '_validateFiles(fileRequired, allowedFileTypes, maxNumberOfFiles, maxFileSize, maxUploadSize, extraValidation)'
            },

            fileRequired: {
                type:    Boolean,
                isValue: fileRequired => !!fileRequired
            },

            disableInstantUpload: {
                type:  Boolean,
                value: false
            },

            _failedUploads: {
                type:  Number,
                value: 0
            },

            maxFileSize: {
                type: Number
            },

            maxFileSizeFailureTitle: {
                type:  String,
                value: 'Maximum File Size'
            },

            maxFileSizeFailureMessage: {
                type:  String,
                value: 'File exceeds the maximum ${value} MB limit per file'
            },

            maxUploadSize: {
                type: Number
            },

            maxUploadSizeFailureTitle: {
                type:  String,
                value: 'Upload Limit Reached'
            },

            maxUploadSizeFailureMessage: {
                type:  String,
                value: 'Selection exceeds the ${value} MB upload limit'
            },

            allowedFileTypes: {
                type: String
            },

            allowedFileTypesMessage: {
                type:  String,
                value: 'File type is not allowed'
            },

            allowedFileTypesMessageDetails: {
                type:  String,
                value: 'Select a supported file type'
            },

            repo: {
                type: String
            },

            path: {
                type:     String,
                observer: '_updateFileNamesAndFullPaths'
            },

            hideFileTypeIcon: {
                type: Boolean
            },

            hasFiles: {
                type:     Boolean,
                readOnly: true,
                notify:   true
            },

            hasFilesToUpload: {
                type:     Boolean,
                readOnly: true,
                notify:   true
            },

            uploadedFileHeight: {
                type: Number
            },

            replaceFileTitle: {
                type:  String,
                value: 'Replace File'
            },

            replaceMultiFileTitle: {
                type:  String,
                value: 'Replace Files'
            },

            replaceFileMsg: {
                type:  String,
                value: '${filename} already exists. Replace this file or cancel and keep the current version.'
            },

            replaceMultiFileMsg: {
                type:  String,
                value: 'The following files already exist: ${filenames}. Replace these files or cancel and keep the current version.'
            },

            deleteFileTitle: {
                type:  String,
                value: 'Delete files?'
            },

            deleteFileMsg: {
                type:  String,
                value: 'If you delete files, you will not be able to undo the action.'
            },

            cancelFileTitle: {
                type:  String,
                value: 'Cancel the File Upload?'
            },

            cancelFileMsg: {
                type:  String,
                value: 'If you cancel the file upload, you will lose the uploading process.'
            },

            deleteActionLabel: {
                type:  String,
                value: 'Delete'
            },

            replaceActionLabel: {
                type:  String,
                value: 'Replace'
            },

            cancelActionLabel: {
                type:  String,
                value: 'Cancel Upload'
            },

            cancelCancelLabel: {
                type:  String,
                value: 'Continue Uploading'
            },

            cancelLabel: {
                type:  String,
                value: 'Cancel'
            },

            fileNames: {
                type:     String,
                readOnly: true,
                notify:   true
            },

            fullPaths: {
                type:     String,
                readOnly: true,
                notify:   true
            },

            uploadInProgress: {
                type:     Boolean,
                notify:   true,
                readOnly: true
            },

            _totalUploadSize: {
                type:  Number,
                value: 0
            },

            _delegatedFocus: String
        };
    }

    static get observers() {
        return [
            '_observeFiles(_filesToUpload.*)',
            '_observeRepoAndPath(repo, path)'
        ];
    }

    _dispatchFileUploadEvent(eventName, filename) {
        this.dispatchEvent(new CustomEvent(eventName, {
            bubbles:  true,
            composed: true,
            detail:   {
                filename,
                repo: this.repo,
                path: this.path
            }
        }));
    }

    _observeFiles(cr) {
        let failedUploads = 0;
        let hasFilesToUpload = false;
        let uploadInProgress = false;
        let uploadComplete = true;
        let hasUploadedFiles = false;
        let totalUploadSize = 0;
        const hasFiles = cr.base.length > 0;

        const uploadedFiles = [];

        cr.base.forEach(file => {
            failedUploads += (file.status === STATUS_FAILED ? 1 : 0);
            totalUploadSize += file.file.size;

            if (file.status === STATUS_READY) {
                hasFilesToUpload = true;
            }

            if (file.status === STATUS_UPLOADING) {
                uploadInProgress = true;
            }

            if (file.status === STATUS_COMPLETED || file.status === STATUS_FAILED) {
                uploadedFiles.push(file.filename);
            } else {
                uploadComplete = false;
            }

            if (file.status === STATUS_COMPLETED) {
                hasUploadedFiles = true;
            }
        });

        this._failedUploads = failedUploads;
        this._totalUploadSize = totalUploadSize;

        this._setHasFilesToUpload(hasFilesToUpload);
        this._setHasFiles(hasFiles);

        this._setUploadInProgress(uploadInProgress);

        this._updateFileNamesAndFullPaths(this.path);

        if (this.disableInstantUpload && hasFiles && uploadComplete) {
            if (failedUploads > 0) {
                this._dispatchFileUploadEvent(EVENT_FAILED, uploadedFiles);
            } else {
                this._dispatchFileUploadEvent(EVENT_COMPLETE, uploadedFiles);
            }

            if (hasUploadedFiles) {
                this._filesToUpload = this._filesToUpload.filter(file => file.status !== STATUS_COMPLETED);
            }
        }

        this._filesToUploadStatus = Date.now();
    }

    _observeRepoAndPath(repo, path) {
        // The repo/path has been updated, reset any failed items back to STATUS_READY
        this._filesToUpload.forEach((file, index) => {
            if (file.status === STATUS_FAILED) {
                this.set(`_filesToUpload.${index}.status`, STATUS_READY);
            }
        });
    }

    _insertValidationMessage(messageElement) {
        this.shadowRoot.insertBefore(messageElement, this.shadowRoot.firstChild);
    }

    _validateFiles(fileRequired, allowedFileTypes, maxNumberOfFiles, maxFileSize, maxUploadSize, extraValidation) {
        let messages = [];

        if (fileRequired && this._filesToUpload.length === 0) {
            messages.push(this.fileRequiredMessage);
        }

        if (this._filesToUpload.length > 0 && allowedFileTypes && !allFilesInListAllowed(this._filesToUpload, allowedFileTypes)) {
            messages.push(this.allowedFileTypesMessageDetails);
        }

        if (maxNumberOfFiles && Number(maxNumberOfFiles) < this._filesToUpload.length) {
            const msg = PTCS.replaceStringTokens(this.maxNumberOfFilesFailureMessage, {value: this.maxNumberOfFiles});
            messages.push(msg ? msg.join('. ') : false);
        }

        if (maxFileSize && exceedMaxFileSize(this._filesToUpload, maxFileSize)) {
            const msg = PTCS.replaceStringTokens(this.maxFileSizeFailureMessage, {value: maxFileSize});
            messages.push(msg ? msg.join('. ') : false);
        }

        if (maxUploadSize && this._totalUploadSize > Number(maxUploadSize) * Math.pow(1024, 2)) {
            const msg = PTCS.replaceStringTokens(this.maxUploadSizeFailureMessage, {value: maxUploadSize});
            messages.push(msg ? msg.join('. ') : false);
        }

        if (this._failedUploads > 0) {
            messages.push(false);
        }

        // At least one validation failed
        if (messages.length) {
            return messages;
        }

        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }

    _upload(file, {indexOfFileToReplace} = {}) {
        const fileToUpload = {
            file,
            progress: 0,
            filename: file.name,
            status:   STATUS_READY,
            type:     getFileType(file).toUpperCase()
        };

        if (!isNaN(indexOfFileToReplace)) {
            this.splice('_filesToUpload', indexOfFileToReplace, 1, fileToUpload);
        } else {
            this.push('_filesToUpload', fileToUpload);
        }

        if (!this.disableInstantUpload) {
            this._doUpload(fileToUpload, indexOfFileToReplace !== undefined);
        }
    }

    // Search for focusable element into the element (this).
    // If no focusable element is found, go back to the document to find focusable element.
    get focusElement() {
        if (!this.tabindex) {
            return null; // Not focusable
        }
        let hit = this.shadowRoot.activeElement;
        let el = hit || document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            hit = hit || el === this || this.contains(el);
            el = el.shadowRoot.activeElement;
        }
        return hit ? hit && el : el;
    }

    _handleDuplicate(file, onreplace) {
        const duplicateFileIndex = this._filesToUpload.findIndex(fileToUpload => fileToUpload.filename === file.name);
        const duplicateFile = this._filesToUpload[duplicateFileIndex];

        this._lastFocusEl = this.focusElement;

        const doReplace = () => {
            this._upload(file, {
                indexOfFileToReplace: duplicateFileIndex
            });

            if (onreplace) {
                onreplace();
            }

            // Clear the list
            this._duplicateFiles = [];
        };

        const dlg = this._confirmationDialog;

        // Add a separate callback to clear the file list on cancel/close
        const doClose = () => {
            // Clear the list
            this._duplicateFiles = [];
            dlg.removeEventListener('close-action', doClose);
        };

        dlg.addEventListener('close-action', doClose);

        // One more...
        this._duplicateFiles.push(file);

        const singleFile = this._duplicateFiles.length === 1;

        let title, msg;

        if (singleFile) {
            // Single duplicate file
            title = this.replaceFileTitle;
            msg = PTCS.replaceStringTokens(this.replaceFileMsg, {
                filename: fileLabel(duplicateFile.file, duplicateFile.filename)
            }).join();
        } else {
            // Multiple files, use new properties
            title = this.replaceMultiFileTitle;

            // Create a comma-separated list of the file names
            const files = this._duplicateFiles.map(f => fileLabel(f, f.name)).join(', ');

            msg = PTCS.replaceStringTokens(this.replaceMultiFileMsg, {
                filenames: files
            }).join();
        }

        this._openDialog(doReplace, {
            titleText:          title,
            messageText:        msg,
            primaryActionLabel: this.replaceActionLabel
        });
    }

    _isDuplicate(file) {
        const duplicateFileIndex = this._filesToUpload.findIndex(fileToUpload => fileToUpload.filename === file.name);

        return duplicateFileIndex !== -1;
    }

    add(file) {
        const okAction = () => {
            this._confirmationDialog.removeEventListener('primary-action', okAction);
            this._switchFocus('last');
        };

        if (!this.disableInstantUpload) {
            this._lastFocusEl = this.focusElement;
            // Open a confirmation dialog with the relevant validation message and prevent the file from being uploaded
            if (this.maxFileSize && file.size >= Number(this.maxFileSize) * Math.pow(1024, 2)) {
                const msg = PTCS.replaceStringTokens(this.maxFileSizeFailureMessage, {value: this.maxFileSize});
                openValidationDialog(this._confirmationDialog, this.maxFileSizeFailureTitle, msg ? msg.join('. ') : '');
                this._confirmationDialog.addEventListener('primary-action', okAction);
                return;
            }

            if (this.maxUploadSize && this._totalUploadSize + file.size >= Number(this.maxUploadSize) * Math.pow(1024, 2)) {
                const msg = PTCS.replaceStringTokens(this.maxUploadSizeFailureMessage, {value: this.maxUploadSize});
                openValidationDialog(this._confirmationDialog, this.maxUploadSizeFailureTitle, msg ? msg.join('. ') : '');
                this._confirmationDialog.addEventListener('primary-action', okAction);
                return;
            }
        }

        if ((this.maxNumberOfFiles && Number(this.maxNumberOfFiles) < 1 + this._filesToUpload.length) && !this._isDuplicate(file)) {
            if (Number(this.maxNumberOfFiles) === 1 && Number(this.maxNumberOfFiles) === this._filesToUpload.length) {
                this._upload(file, {indexOfFileToReplace: 0});
                return;
            }
            const msg = PTCS.replaceStringTokens(this.maxNumberOfFilesFailureMessage, {value: this.maxNumberOfFiles});
            openValidationDialog(this._confirmationDialog, this.maxUploadSizeFailureTitle, msg ? msg.join('. ') : false);
            this._confirmationDialog.addEventListener('primary-action', okAction);
            return;
        }

        if (!this._isDuplicate(file)) {
            this._upload(file);
        } else {
            this._handleDuplicate(file);
        }
    }

    _replaceFile(ev) {
        if (this.disabled) {
            return;
        }

        const file = ev.detail.file;

        if (!this._isDuplicate(file)) {
            this._upload(file, {
                indexOfFileToReplace: ev.model.index
            });
        } else {
            this._handleDuplicate(file, () => {
                // We are actually replacing 2 files now. The original one (where "replace" was clicked)
                // and the duplicate one.
                this.splice('_filesToUpload', ev.model.index, 1);
            });
        }
    }

    _switchFocus(type) {
        switch (type) {
            case 'delete':
                this.getRootNode().host.$['file-select'].focus();
                break;
            case 'last':
                if (this._lastFocusEl) {
                    this._lastFocusEl.focus();
                }
                break;
        }
    }

    _openDialog(action, {titleText, messageText = '', primaryActionLabel,
        cancelActionLabel = this.cancelLabel, primaryButtonStyle = 'primary', hideCancelAction = false}) {
        const dlg = this._confirmationDialog;

        const primaryAction = () => {
            action();

            dlg.removeEventListener('primary-action', primaryAction);
            // eslint-disable-next-line no-use-before-define
            dlg.removeEventListener('close-action', closeAction);
            this._switchFocus('delete');
        };

        const closeAction = () => {
            dlg.removeEventListener('primary-action', primaryAction);
            dlg.removeEventListener('close-action', closeAction);
            this._switchFocus('last');
        };

        dlg.addEventListener('primary-action', primaryAction);
        dlg.addEventListener('close-action', closeAction);

        dlg.titleText = titleText;
        dlg.messageText = messageText;
        dlg.primaryButtonStyle = primaryButtonStyle;
        dlg.primaryActionLabel = primaryActionLabel;
        dlg.cancelActionLabel = cancelActionLabel;
        dlg.hideCancelAction = hideCancelAction;

        dlg.open();
    }

    _cancelUpload(ev) {
        if (this.disabled) {
            return;
        }

        this._lastFocusEl = this.focusElement;

        if (ev.model.item.status !== STATUS_UPLOADING) {
            const doDelete = () => {
                // File is not being uploaded right now. Delete it.
                this.splice('_filesToUpload', ev.model.index, 1);

                this._dispatchFileUploadEvent(EVENT_DELETE, ev.model.item.filename);
            };

            this._openDialog(doDelete, {
                titleText:          this.deleteFileTitle,
                messageText:        this.deleteFileMsg,
                primaryActionLabel: this.deleteActionLabel,
                primaryButtonStyle: 'danger'
            });

            return;
        }

        const doCancel = () => {
            ev.model.item.actions.cancel();
        };

        this._openDialog(doCancel, {
            titleText:          this.cancelFileTitle,
            messageText:        this.cancelFileMsg,
            primaryActionLabel: this.cancelActionLabel,
            primaryButtonStyle: 'danger',
            cancelActionLabel:  this.cancelCancelLabel
        });
    }

    deleteAll(noconfirm = false) {
        if (this.disabled) {
            return;
        }

        this._lastFocusEl = this.focusElement;

        const doDeleteAll = () => {
            this._filesToUpload.forEach((file) => {
                if (file.status === STATUS_UPLOADING) {
                    file.actions.cancel();
                }

                this._dispatchFileUploadEvent(EVENT_DELETE, file.filename);
            });

            this._filesToUpload = [];
        };

        if (!noconfirm) {
            this._openDialog(doDeleteAll, {
                titleText:          this.deleteFileTitle,
                messageText:        this.deleteFileMsg,
                primaryActionLabel: this.deleteActionLabel,
                primaryButtonStyle: 'danger'
            });
        } else {
            doDeleteAll();
        }
    }

    _updateFileNamesAndFullPaths(path) {
        if (!path) {
            path = '/';
        }

        const nIndexSlash = path.lastIndexOf('/');
        if (nIndexSlash !== path.length - 1) {
            path = path + '/';
        }

        let fileNames = '';
        let fullPaths = '';

        if (this._filesToUpload.length > 0) {
            for (const fileToUpload of this._filesToUpload) {
                const filename = fileToUpload.filename;

                if (fileNames === '') {
                    fileNames = filename;
                } else {
                    fileNames += MULTI_FILE_DELIMITER + filename;
                }
                // full path
                var currentPath;
                if (fullPaths === '') {
                    currentPath = path + filename;
                } else {
                    currentPath = MULTI_FILE_DELIMITER + path + filename;
                }
                fullPaths += currentPath;
            }
        } else {
            fullPaths = path;
        }

        this._setFullPaths(fullPaths);
        this._setFileNames(fileNames);
    }

    uploadAll() {
        if (this.disabled) {
            return;
        }

        if (!this.disableInstantUpload) {
            return;
        }

        for (const fileToUpload of this._filesToUpload) {
            this._doUpload(fileToUpload);
        }

        // If the upload process actually started for any of the files dispatch an event
        const started = [];

        for (const fileToUpload of this._filesToUpload) {
            if (fileToUpload.status === STATUS_UPLOADING) {
                started.push(fileToUpload.filename);
            }
        }

        if (started.length > 0) {
            this._dispatchFileUploadEvent(EVENT_STARTED, started);
        }
    }

    _doUpload(fileToUpload, replace) {
        if (fileToUpload.status !== STATUS_READY) {
            return;
        }

        if (!this.uploadManager || !(typeof this.uploadManager.upload === 'function')) {
            return;
        }

        const filename = fileToUpload.filename;

        // I'm searching for the correct index every time in case files were deleted/added from the list
        const fileIndex = () => this._filesToUpload.findIndex(f => f.filename === filename);

        const onprogress = e => {
            if (e.progress !== 100) {
                // 100% progress means only that the file fully reached the target server.
                // The action is completed only when the server responds with 200 status.
                this.set(`_filesToUpload.${fileIndex()}.progress`, e.progress);
            }
        };

        const onstatuschange = e => {
            const fileToUploadPath = `_filesToUpload.${fileIndex()}`;
            if (e.status === 200) {
                this.set(`${fileToUploadPath}.progress`, 100);

                // Setting "completed" status hides the progress bar so doing it with a small delay
                setTimeout(() => {
                    this.set(`${fileToUploadPath}.status`, STATUS_COMPLETED);

                    if (!this.disableInstantUpload) {
                        this._dispatchFileUploadEvent(EVENT_COMPLETE, [filename]);
                    }
                }, 500);
            } else if (e.status === 0) {
                this.set(`${fileToUploadPath}.status`, STATUS_CANCELED);
            } else {
                this.set(`${fileToUploadPath}.status`, STATUS_FAILED);

                if (!this.disableInstantUpload) {
                    this._dispatchFileUploadEvent(EVENT_FAILED, [filename]);
                }
            }
        };

        const actions = this.uploadManager.upload(fileToUpload.file, {
            repo: this.repo,
            path: this.path,
            replace,
            filename
        }, onprogress, onstatuschange);

        if (actions !== null) {
            fileToUpload.actions = actions;

            this.set(`_filesToUpload.${fileIndex()}.status`, STATUS_UPLOADING);
            this.set(`_filesToUpload.${fileIndex()}.progress`, 0);

            if (!this.disableInstantUpload) {
                this._dispatchFileUploadEvent(EVENT_STARTED, [filename]);
            }
        }
    }
};

customElements.define(PTCS.FileUploadList.is, PTCS.FileUploadList);
