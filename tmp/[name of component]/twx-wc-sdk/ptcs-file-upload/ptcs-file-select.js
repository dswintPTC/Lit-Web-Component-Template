import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

import 'ptcs-label/ptcs-label.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-confirmation/ptcs-confirmation.js';

import {getDraggedFiles, allFilesInListAllowed, openValidationDialog} from './file-library';

PTCS.FileSelect = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
            <style>
                [part=browse-button]{
                    max-width: 100%;
                    display: none;
                }

                :host([file-select-type=select]) [part=browse-button]{
                    display: inline-block;
                }

                :host([file-select-type=select]) [part=drop-zone]{
                    display: none;
                }

                [part=drop-zone] {
                    width: 100%;

                    display: flex;
                    flex-direction: column;
                    flex-wrap: wrap;

                    align-content: center;
                    align-items: center;
                    justify-content: center;

                    overflow: hidden;
                    box-sizing: border-box;
                }

                :host(:not([disabled])) [part=drop-zone] {
                    cursor: pointer;
                }
            </style>

            <div id="drop-zone" part="drop-zone" on-drop="_dropHandler" on-dragover="_dragOverHandler">
                <ptcs-button id="add-button" part="add-button" variant="transparent"
                icon="[[dropZoneIcon]]" icon-placement="left" content-align="center"
                mode="icon" no-tabindex disabled="[[disabled]]">
                </ptcs-button>
                <ptcs-label part="label" label="[[dropZoneLabel]]" multi-line horizontal-alignment="center">
                </ptcs-label>
            </div>

            <ptcs-button id="browse" part="browse-button" class="button" label="[[browseButtonLabel]]" variant="[[browseButtonStyle]]"
                disabled="[[disabled]]" tabindex\$="[[_delegatedFocus]]">
            </ptcs-button>

            <input id="browse-file" type="file" hidden multiple$="[[!singleFileSelection]]" accept="[[allowedFileTypes]]"/>
        `;
    }

    static get is() {
        return 'ptcs-file-select';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // select/drag
            fileSelectType: {
                type:               String,
                value:              'drag',
                reflectToAttribute: true
            },

            file: {
                type:     Object,
                readOnly: true,
                notify:   true
            },

            browseButtonLabel: {
                type:  String,
                value: 'Browse'
            },

            browseButtonStyle: {
                type:  String,
                value: 'tertiary'
            },

            dropZoneLabel: {
                type:  String,
                value: 'Drag files here or click to browse'
            },

            dropZoneIcon: {
                type:  String,
                value: 'cds:icon_add'
            },

            dropZoneHeight: {
                type:     Number,
                value:    96,
                observer: '_dropZoneHeightChanged'
            },

            singleFileSelection: {
                type:  Boolean,
                value: false
            },

            // Flag to signal that the component has been modified by the user
            _stayUnvalidated: {
                type:   Boolean,
                value:  true,
                notify: true
            },

            _delegatedFocus: String
        };
    }

    ready() {
        super.ready();

        this.$.browse.addEventListener('click', () => {
            if (this.disabled) {
                return;
            }

            this.$['browse-file'].click();
        });

        this.$['drop-zone'].addEventListener('click', () => {
            if (this.disabled) {
                return;
            }

            this.$['browse-file'].click();
        });

        this.addEventListener('keydown', ev => {
            if (!this.disabled && this.fileSelectType === 'drag' && (ev.key === 'Enter' || ev.key === ' ')) {
                this.$['browse-file'].click();
            }
        });

        this.$['browse-file'].addEventListener('click', () => {
            // Change pristine state when closing the browse-file input
            document.body.onfocus = () => {
                this._stayUnvalidated = false;
            };
        });

        this.$['browse-file'].addEventListener('click', () => {
            // If a user selects the same file, the "change" event will not be triggered
            // because the current value is the same as the previous. To prevent this problem I'm erasing the value first.
            this.$['browse-file'].value = '';
        });

        this.$['browse-file'].addEventListener('change', () => {
            const files = this.$['browse-file'].files;

            // Not an array, so doesn't work with forEach
            for (let i = 0; i < files.length; i++) {
                this._setFile(files[i]);
            }
        });

        document.addEventListener('dragleave', (e) => {
            const {posX, posY} = PTCS.getCoordinatesFromEvent(e);

            if (posX === undefined && posY === undefined) {
                // we are outside the page
                this.removeAttribute('drag-over-page');
            }
        });

        document.addEventListener('dragover', e => {
            if (this.disabled) {
                return;
            }

            const _dragObjectIsFile = (ev) => {
                if (ev.dataTransfer.items && ev.dataTransfer.items[0].kind === 'file') {
                    return true;
                }

                if (ev.dataTransfer.files.length > 0) {
                    return true;
                }

                return false;
            };

            if (!_dragObjectIsFile(e)) {
                return;
            }

            this.setAttribute('drag-over-page', '');

            const mm = () => {
                this.removeAttribute('drag-over-page');
                this.removeAttribute('drag-over');

                if (this.hasAttribute('not-allowed')) {
                    openValidationDialog(this._confirmationDialog, this.allowedFileTypesMessage, this.allowedFileTypesMessageDetails);
                    this.removeAttribute('not-allowed');
                }

                document.removeEventListener('mousemove', mm);
            };

            // Using "mousemove" event to clear the drop zone states is a workaround. I can't find an appropriate event
            // when I drop the file on an invalid target.
            document.addEventListener('mousemove', mm);

            const x = PTCS.getCoordinatesFromEvent(e).posX;
            const y = PTCS.getCoordinatesFromEvent(e).posY;

            if (this._insideDropZone(x, y)) {
                if (!allFilesInListAllowed(getDraggedFiles(e), this.allowedFileTypes)) {
                    this.setAttribute('not-allowed', '');
                    e.dataTransfer.dropEffect = 'none';
                }
                this.setAttribute('drag-over', '');
            } else {
                this.removeAttribute('drag-over');
                this.removeAttribute('not-allowed');
            }
        });
    }

    _dropZoneHeightChanged(v) {
        if (!this.$['drop-zone']) {
            return;
        }

        this.$['drop-zone'].style.height = `${v}px`;
    }

    _dropHandler(ev) {
        if (this.disabled) {
            return;
        }

        // dragging is canceled
        this.removeAttribute('drag-over-page');
        this.removeAttribute('drag-over');

        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();

        getDraggedFiles(ev).forEach(file => this._setFile(file));

        this._stayUnvalidated = false;
    }

    _insideDropZone(x, y) {
        const dzR = this.$['drop-zone'].getBoundingClientRect();

        return x >= dzR.left && x <= dzR.right && y >= dzR.top && y <= dzR.bottom;
    }

    _dragOverHandler(ev) {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
    }
};

customElements.define(PTCS.FileSelect.is, PTCS.FileSelect);
