import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';

import 'ptcs-label/ptcs-label.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-confirmation/ptcs-confirmation.js';

import './ptcs-file-select.js';
import './ptcs-file-upload-list.js';

import {parseAllowedFileTypes} from './file-library';

PTCS.FileUpload = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
            <style>
                :host {
                    display: inline-flex;
                    flex-direction: column;

                    box-sizing: border-box;

                    overflow: auto;
                }

                [part=upload-button] {
                    max-width: 50%;
                    align-self: flex-start;
                }

                [part=delete-all] {
                    max-width: 50%;
                    align-self: flex-start;
                }

                [part=upload-button][hidden] {
                    visibility: hidden;
                }

                [part=delete-all][hidden] {
                    visibility: hidden;
                }

                [part=label] {
                    flex-shrink: 0;
                }

                [part=desc] {
                    flex-shrink: 0;
                }

                .footer {
                    display: flex;
                    justify-content: space-between;
                }

                .footer[hidden] {
                    display: none;
                }

                :host(:not([show-repository-selector]):not([show-repository-path])) [part=repo] {
                    display: none;
                }

                :host([show-repository-selector][show-repository-path]) [part=repo] {
                    display: flex;
                }

                :host(:not([show-repository-selector])) [part=repos-list] {
                    display: none;
                }

                :host([show-repository-selector]:not([show-repository-path])) [part=repos-list] {
                    width: 100%;
                }
                :host([show-repository-selector][show-repository-path]) [part=repos-list] {
                    width: 50%;
                }

                :host(:not([show-repository-selector])[show-repository-path]) [part=path] {
                    width: 100%;
                }

                :host([show-repository-selector][show-repository-path]) [part=path] {
                    width: 50%;
                }

                :host(:not([show-repository-path])) [part=path] {
                    display: none;
                }

                :host(:focus) {
                    outline: none;
                }

                [part=file-select]:focus {
                    outline: none;
                }

                [part=file-upload-list]:focus {
                    outline: none;
                }
            </style>

            <ptcs-label part="label" label="[[title]]" variant="[[titleStyle]]" hidden$="[[!title]]"></ptcs-label>

            <ptcs-label part="desc" label="[[description]]" variant="[[descriptionStyle]]"
                hidden$="[[!description]]" multi-line>
            </ptcs-label>

            <div part=repo>
                <ptcs-dropdown part="repos-list" label="[[fileRepoLabel]]" items="[[repositoryList]]" disabled="[[disabled]]"
                    selected-value="{{repo}}" tabindex\$="[[_delegatedFocus]]">
                </ptcs-dropdown>
                <ptcs-textfield part="path" label="[[pathLabel]]" text="{{path}}" disabled="[[disabled]]"
                    tabindex\$="[[_delegatedFocus]]">
                </ptcs-textfield>
            </div>

            <ptcs-file-select part="file-select" id="file-select" file-select-type="[[fileUploadType]]"
                browse-button-label="[[browseButtonLabel]]" browse-button-style="[[browseButtonStyle]]" tabindex\$="[[_delegatedFocus]]"
                drop-zone-label="[[dropZoneLabel]]" drop-zone-icon="[[dropZoneIcon]]" drop-zone-height="[[dropZoneHeight]]"
                disabled="[[_fileSelectIsDisabled(disabled, disableInstantUpload, __uploadInProgress)]]"
                _stay-unvalidated="{{_stayUnvalidated}}" allowed-file-types="[[_parseAllowedFileTypes(allowedFileTypes)]]"
                allowed-file-types-message="[[allowedFileTypesMessage]]" allowed-file-types-message-details="[[allowedFileTypesMessageDetails]]"
                _confirmation-dialog="[[_confirmationDialog]]" single-file-selection="[[singleFileSelection]]">
            </ptcs-file-select>

            <ptcs-file-upload-list part="file-upload-list" id="file-upload-list" upload-manager="[[uploadManager]]"
                hidden="[[_hideFilesList(externalValidity, fileRequired, _stayUnvalidated, _hasFiles)]]" validity="{{validity}}"
                disable-instant-upload="[[disableInstantUpload]]" uploaded-file-height=[[uploadedFileHeight]] tabindex\$="[[_delegatedFocus]]"
                hide-validation-success repo="[[repo]]" path="[[path]]" disabled="[[disabled]]" _files-to-upload-status="{{_filesToUploadStatus}}"
                hide-file-type-icon="[[hideFileTypeIcon]]" has-files="{{_hasFiles}}" has-files-to-upload="{{_hasFilesToUpload}}"
                hide-validation-error="[[hideValidationError]]" validation-error-icon="[[validationErrorIcon]]" hide-validation-criteria
                validation-message="[[validationMessage]]" validation-criteria="[[validationCriteria]]"
                allowed-file-types="[[_parseAllowedFileTypes(allowedFileTypes)]]" allowed-file-types-message="[[allowedFileTypesMessage]]"
                allowed-file-types-message-details="[[allowedFileTypesMessageDetails]]" _confirmation-dialog="[[_confirmationDialog]]"
                file-required="[[fileRequired]]" file-required-message="[[fileRequiredMessage]]" _stay-unvalidated="[[_stayUnvalidated]]"
                max-number-of-files="[[maxNumberOfFiles]]" max-number-of-files-failure-message="[[maxNumberOfFilesFailureMessage]]"
                max-file-size="[[maxFileSize]]" max-file-size-failure-title="[[maxFileSizeFailureTitle]]"
                max-file-size-failure-message="[[maxFileSizeFailureMessage]]" max-upload-size="[[maxUploadSize]]"
                max-upload-size-failure-title="[[maxUploadSizeFailureTitle]]" max-upload-size-failure-message="[[maxUploadSizeFailureMessage]]"
                file-upload-error-message="[[fileUploadErrorMessage]]" file-upload-error-details="[[fileUploadErrorDetails]]"
                replace-label="[[replaceLabel]]" extra-validation="[[extraValidation]]" external-validity="[[externalValidity]]"
                validation-output="{{validationOutput}}">
            </ptcs-file-upload-list>

            <div class="footer" part="footer" hidden\$="[[_footerIsHidden(disableInstantUpload, showUploadButton, _hasFiles, showDeleteAllButton)]]">
                <ptcs-button id="upload-button" part="upload-button" label="[[uploadButtonLabel]]" variant="[[uploadButtonVariant]]"
                    hidden$="[[_uploadIsHidden(disableInstantUpload, showUploadButton)]]" tabindex\$="[[_delegatedFocus]]"
                    disabled="[[_uploadIsDisabled(disabled, _hasFiles, validity)]]" on-click="uploadAll">
                </ptcs-button>

                <ptcs-link id="delete-all" part="delete-all" label="[[deleteAllButtonLabel]]" tabindex\$="[[_delegatedFocus]]"
                    hidden$="[[_deleteAllIsHidden(_hasFiles, showDeleteAllButton)]]" disabled="[[disabled]]" on-click="deleteAllHandler">
                </ptcs-link>
            </div>

            <ptcs-confirmation id="dlg"></ptcs-confirmation>
        `;
    }

    static get is() {
        return 'ptcs-file-upload';
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

            showRepositoryPath: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            showRepositorySelector: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            repositoryList: {
                type:  Array,
                value: () => []
            },

            // select/drag
            fileUploadType: {
                type:               String,
                value:              'drag',
                reflectToAttribute: true
            },

            fileRepoLabel: {
                type:  String,
                value: 'File Repository'
            },

            replaceLabel: {
                type:  String,
                value: 'Replace'
            },

            pathLabel: {
                type:  String,
                value: 'Path'
            },

            title: {
                type:  String,
                value: 'Upload'
            },

            titleStyle: {
                type:  String,
                value: 'label'
            },

            browseButtonLabel: {
                type:  String,
                value: 'Browse'
            },

            browseButtonStyle: {
                type:  String,
                value: 'tertiary'
            },

            uploadButtonLabel: {
                type:  String,
                value: 'Upload'
            },

            uploadButtonVariant: {
                type:  String,
                value: 'primary'
            },

            showUploadButton: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            description: {
                type:  String,
                value: ''
            },

            descriptionStyle: {
                type:  String,
                value: 'body'
            },

            dropZoneLabel: {
                type:  String,
                value: 'Drag files here or click to browse'
            },

            dropZoneIcon: {
                type: String
            },

            dropZoneHeight: {
                type: Number
            },

            disableInstantUpload: {
                type: Boolean
            },

            maxHeight: {
                type:     Number,
                observer: '_maxHeightChanged'
            },

            hideFileTypeIcon: {
                type: Boolean
            },

            deleteAllButtonLabel: {
                type:  String,
                value: 'Delete All'
            },

            showDeleteAllButton: {
                type:  Boolean,
                value: false
            },

            _hasFiles: {
                type: Boolean
            },

            _hasFilesToUpload: {
                type: Boolean
            },

            uploadedFileHeight: {
                type: Number
            },

            repo: {
                type:   String,
                notify: true
            },

            path: {
                type:   String,
                notify: true
            },

            __uploadInProgress: {
                type:     Boolean,
                readOnly: true
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

            validationMessage: {
                type:  String,
                value: 'File Upload Error(s)'
            },

            validationCriteria: {
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

            fileRequired: {
                type: Boolean
            },

            fileRequiredMessage: {
                type: String
            },

            singleFileSelection: {
                type:     Boolean,
                computed: '_singleFileSelection(maxNumberOfFiles)'
            },

            maxNumberOfFiles: {
                type: Number
            },

            maxNumberOfFilesFailureMessage: {
                type: String
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

            fileUploadErrorMessage: {
                type: String
            },

            fileUploadErrorDetails: {
                type: String
            },

            // Custom validation function that complements the existing client-side validation
            extraValidation: {
                type: Function
            },

            externalValidity: {
                type: String
            },

            validity: {
                type:               String,
                notify:             true,
                reflectToAttribute: true
            },

            validationOutput: {
                type:   String,
                notify: true,
            },

            hideValidationError: {
                type: Boolean
            },

            validationErrorIcon: {
                type: String
            },

            _confirmationDialog: {
                type: Element
            },

            _filesToUploadStatus: {
                type:   Number,
                notify: true
            },

            _delegatedFocus: String
        };
    }

    ready() {
        super.ready();

        this.$['file-select'].addEventListener('file-changed', (e) => {
            this.$['file-upload-list'].add(e.detail.value);
        });

        this.$['file-upload-list'].addEventListener('upload-in-progress-changed', e => {
            this._set__uploadInProgress(e.detail.value);
        });

        this.$['file-upload-list'].addEventListener('file-names-changed', e => {
            this._setFileNames(e.detail.value);
        });

        this.$['file-upload-list'].addEventListener('full-paths-changed', e => {
            this._setFullPaths(e.detail.value);
        });

        if (this.dropZoneIcon === undefined) {
            this.dropZoneIcon = 'cds:icon_add';
        }

        this._confirmationDialog = this.$['dlg'];
    }

    _hideFilesList(externalValidity, fileRequired, _stayUnvalidated, _hasFiles) {
        return externalValidity !== 'invalid' && !fileRequired ? !_hasFiles : _stayUnvalidated;
    }

    _fileSelectIsDisabled(disabled, disableInstantUpload, uploadInProgress) {
        return disabled || (disableInstantUpload && uploadInProgress);
    }

    _uploadIsDisabled(disabled, _hasFiles, validity) {
        return disabled || !_hasFiles || validity === 'invalid';
    }

    _deleteAllIsHidden(_hasFiles, showDeleteAllButton) {
        return !(_hasFiles && showDeleteAllButton);
    }

    _uploadIsHidden(disableInstantUpload, showUploadButton) {
        return !disableInstantUpload || !showUploadButton;
    }

    _footerIsHidden(disableInstantUpload, showUploadButton, _hasFiles, showDeleteAllButton) {
        return this._uploadIsHidden(disableInstantUpload, showUploadButton) && this._deleteAllIsHidden(_hasFiles, showDeleteAllButton);
    }

    _disabled(disabled, disableInstantUpload) {
        return disabled || !disableInstantUpload;
    }

    uploadAll() {
        if (!this._uploadIsDisabled(this.disabled, this._hasFiles, this.validity)) {
            this.$['file-upload-list'].uploadAll();
            this._stayUnvalidated = true;
        }
    }

    deleteAll(noconfirm) {
        this.$['file-upload-list'].deleteAll(noconfirm);
    }

    deleteAllHandler() {
        this.$['file-upload-list'].deleteAll();
    }

    _maxHeightChanged(maxHeight) {
        if (maxHeight) {
            this.style.maxHeight = `${maxHeight}px`;
        } else {
            this.style.maxHeight = '';
        }
    }

    _singleFileSelection(maxNumberOfFiles) {
        return Number(maxNumberOfFiles) === 1;
    }

    _parseAllowedFileTypes(allowedFileTypes) {
        return parseAllowedFileTypes(allowedFileTypes);
    }
};

customElements.define(PTCS.FileUpload.is, PTCS.FileUpload);
