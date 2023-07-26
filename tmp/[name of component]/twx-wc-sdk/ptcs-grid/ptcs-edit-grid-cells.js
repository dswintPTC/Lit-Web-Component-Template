import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';

import 'ptcs-label/ptcs-label.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-textarea/ptcs-textarea.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-list/ptcs-list.js';
import 'ptcs-radio/ptcs-radio.js';
import 'ptcs-toggle-button/ptcs-toggle-button.js';
import 'ptcs-datepicker/ptcs-datepicker.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-modal-overlay/ptcs-modal-overlay.js';

import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

/* eslint-disable no-confusing-arrow */

// Symbol that stores field name on input UI controls
const columnRef = Symbol('columnRef'); // Attach column definition to input element

const textarea = 'textarea';

const dfltEditControl = {
    BOOLEAN:  'checkbox',
    DATETIME: 'datepicker',
    //HYPERLINK:
    HTML:     textarea,
    //IMAGE:
    //IMAGELINK:
    //INTEGER:      textfield,
    //LONG:         textfield,
    //NUMBER:       textfield,
    //STRING:       textfield,
    TEXT:     textarea,
    //BASETYPENAME: textfield,
    //LOCATION:
    JSON:     textarea,
    XML:      textarea
};

const valueProp = {
    'PTCS-TEXTFIELD':     'text',
    'PTCS-TEXTAREA':      'text',
    'PTCS-DATEPICKER':    'dateTime',
    'PTCS-CHECKBOX':      'checked',
    'PTCS-TOGGLE-BUTTON': 'checked',
    'PTCS-DROPDOWN':      'selectedValue',
    'PTCS-LIST':          'selectedValue'
};

// Components that always needs a label
const needLabel = ['PTCS-CHECKBOX', 'PTCS-TOGGLE-BUTTON'];


const toBoolean = v => typeof v === 'string' ? v && v.trim() !== 'false' : !!v;
const toString = v => typeof v === 'string' ? v : `${v}`;
const toDate = v => v instanceof Date ? v : new Date(v);

const toJSON = v => {
    try {
        return JSON.parse(v);
    } catch (e) {
        console.log('Error parsing JSON data');
    }

    // Failure
    return null;
};

const splitValues = (v, n, s) => {
    const values = typeof v === 'string' ? v.split(s || ':') : [];
    return values.length === n ? values : null;
};

const checkNumValidity = v => {
    if (Array.isArray(v)) {
        return v.reduce((p, n) => p && checkNumValidity(n), true);
    }
    return !isNaN(Number(v));
};

const toThingCode = v => {
    const values = splitValues(v, 2);
    return checkNumValidity(values) ? {domainId: Number(values[0]), instanceId: Number(values[1])} : null;
};

const toLocation = v => {
    const values = splitValues(v, 3);
    return checkNumValidity(values) ? {latitude: Number(values[0]), longitude: Number(values[1]), elevation: Number(values[2])} : null;
};

const toVEC2 = v => {
    const values = splitValues(v, 2, ',');
    return checkNumValidity(values) ? {x: Number(values[0]), y: Number(values[1])} : null;
};

const toVEC3 = v => {
    const values = splitValues(v, 3, ',');
    return checkNumValidity(values) ? {x: Number(values[0]), y: Number(values[1]), z: Number(values[2])} : null;
};

const toVEC4 = v => {
    const values = splitValues(v, 4, ',');
    return checkNumValidity(values) ? {x: Number(values[0]), y: Number(values[1]), z: Number(values[2]), w: Number(values[3])} : null;
};

const toInt = v => {
    const value = Math.round(v);
    return checkNumValidity(value) ? value : null;
};

const toNumber = v => {
    const value = Number(v);
    return checkNumValidity(value) ? value : null;
};

const _obj = v => typeof v === 'object';
const fromJSON = v => JSON.stringify(v);
const fromThingCode = v => _obj(v) ? `${v.domainId} : ${v.instanceId}` : '';
const fromLocation = v => _obj(v) ? `${v.latitude} : ${v.longitude} : ${v.elevation}` : '';
const fromVEC2 = v => _obj(v) ? `${v.x} , ${v.y}` : '';
const fromVEC3 = v => _obj(v) ? `${v.x} , ${v.y} , ${v.z}` : '';
const fromVEC4 = v => _obj(v) ? `${v.x} , ${v.y} , ${v.z} , ${v.w}` : '';

const convertValues = {
    BOOLEAN:      toBoolean,
    DATETIME:     toDate,
    //HYPERLINK:
    VEC2:         toVEC2,
    VEC3:         toVEC3,
    VEC4:         toVEC4,
    THINGCODE:    toThingCode,
    HTML:         toString,
    //IMAGE:
    //IMAGELINK:
    INTEGER:      toInt,
    LONG:         toInt,
    NUMBER:       toNumber,
    STRING:       toString,
    TEXT:         toString,
    BASETYPENAME: toString,
    LOCATION:     toLocation,
    JSON:         toJSON,
    XML:          toString
};

const stringifyValues = {
    VEC2:      fromVEC2,
    VEC3:      fromVEC3,
    VEC4:      fromVEC4,
    LOCATION:  fromLocation,
    THINGCODE: fromThingCode,
    JSON:      fromJSON
};

const noConversion = v => v;
const convertValue = (v, type) => (convertValues[type] || noConversion)(v);
const stringifyValue = (v, type) => (stringifyValues[type] || noConversion)(v);

function createTextfield(field, item, column) {
    const el = document.createElement('ptcs-textfield');
    const value = item[field];
    el.text = (value && typeof value === 'object' && value.href) ? value.href : stringifyValue(value, column.type);
    el.addEventListener('text-changed', this._textChangedRef);
    return el;
}

function createTextarea(field, item, column) {
    const el = document.createElement('ptcs-textarea');
    const value = item[field];
    el.text = stringifyValue(value, column.type);
    el.addEventListener('text-changed', this._textChangedRef);
    return el;
}

function createDatepicker(field, item, column) {
    const el = document.createElement('ptcs-datepicker');
    el.dateTime = item[field];
    el.addEventListener('date-time-changed', this._dateChangedRef);
    el.dateLabel = this.dateLabel;
    el.monthLabel = this.monthLabel;
    el.yearLabel = this.yearLabel;
    el.hoursLabel = this.hoursLabel;
    el.minutesLabel = this.minutesLabel;
    el.secondsLabel = this.secondsLabel;
    el.meridiemLabel = this.meridiemLabel;
    el.selectLabel = this.selectLabel;
    el.cancelLabel = this.cancelLabel;
    el.formatToken = column.config.editorProps ? column.config.editorProps.formatToken : '';
    return el;
}

function createCheckbox(field, item) {
    const el = document.createElement('ptcs-checkbox');
    el.checked = toBoolean(item[field]);
    el.addEventListener('checked-changed', this._valueChangedRef);
    return el;
}

function createToggle(field, item) {
    const el = document.createElement('ptcs-toggle-button');
    el.checked = toBoolean(item[field]);
    el.style.justifyContent = 'flex-start';
    el.addEventListener('checked-changed', this._valueChangedRef);
    return el;
}

function createDropdown(field, item, column) {
    if (column.config && Array.isArray(column.config.enum)) {
        const el = document.createElement('ptcs-dropdown');
        el.items = column.config.enum;
        el.selectedValue = item[field];
        el.addEventListener('selected-value-changed', this._valueChangedRef);
        return el;
    }
    return createTextfield.call(this, field, item, column);
}

function createList(field, item, column) {
    if (column.config && Array.isArray(column.config.enum)) {
        const el = document.createElement('ptcs-list');
        el.items = column.config.enum;
        el.selectedValue = item[field];
        el.addEventListener('selected-value-changed', this._valueChangedRef);
        return el;
    }
    return createTextfield.call(this, field, item, column);
}

function createRadio(field, item, column) {
    if (!column.config && Array.isArray(column.config.enum)) {
        return createTextfield.call(this, field, item, column);
    }

    // Create radio group
    const el = document.createElement('div');
    const type = column.type;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';

    // Label (only show in row-edit mode)
    if (!this.field) {
        if (typeof column.title === 'string') {
            const label = document.createElement('ptcs-label');
            label.label = column.title;
            el.appendChild(label);
        } else if (typeof column.title === 'function') {
            el.appendChild(column.title());
        }
    }

    // Radio buttons
    const radiogroup = 'rg' + performance.now().toString().replace('.', '-');
    let active;
    column.config.enum.forEach(value => {
        const btn = document.createElement('ptcs-radio');
        btn.label = value;
        btn.preventAutoSelect = true;
        btn.radiogroup = radiogroup;
        btn.setAttribute('tabindex', '0');
        if (item[field] === value) {
            active = btn;
        }
        btn.addEventListener('checked-changed', ev => {
            if (ev.detail.value) {
                // This radio button has been selected
                if (this.item[field] !== value || this.values.hasOwnProperty(field)) {
                    this.values[field] = convertValue(value, type);
                    if (this.field) {
                        // Selected a new value when editing a single field: editing is done
                        this.update();
                    }
                }
            }
        });
        el.appendChild(btn);

        // For some strange reason, we must check the active radiobutton after a delay... (bug?)
        if (active) {
            requestAnimationFrame(() => {
                active.checked = true;
                active.focus();
            });
        }
    });
    return el;
}

const createDefault = createDropdown;

const createEditor = {
    textarea:   createTextarea,
    datepicker: createDatepicker,
    checkbox:   createCheckbox,
    toggle:     createToggle,
    dropdown:   createDropdown,
    list:       createList,
    radiogroup: createRadio
};


PTCS.EditGridCells = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get is() {
        return 'ptcs-edit-grid-cells';
    }

    static get template() {
        return html`
            <style>
                :host {
                    display: block;
                    z-index: 99996;
                    box-sizing: border-box;
                }

                [part=controls] {
                    overflow: auto;
                }

                [part=buttons] {
                    display: flex;
                    justify-content: flex-end;
                }

                [part=update-button],
                [part=cancel-button] {
                    z-index: 9000;
                }

                [hidden] {
                    display: none !important;
                }

                [part=overlay] {
                    display: none;
                }

                :host([__pending]) [part=overlay] {
                    display: block;
                }

                :host([__pending]) [part=spinner] {
                    display: block;
                }

                [part=spinner],
                [part=spinner]:after {
                    border-radius: 50%;
                    width: 34px;
                    height: 34px;
                }

                [part=spinner] {
                    display: none;
                    z-index: 9999;
                    position: absolute;
                    top: calc(50% - 17px);
                    left: calc(50% - 17px);
                    -webkit-transform: translateZ(0);
                    -ms-transform: translateZ(0);
                    transform: translateZ(0);
                    -webkit-animation: load8 1.1s infinite linear;
                    animation: load8 1.1s infinite linear;
                }

                @-webkit-keyframes load8 {
                    0% {
                        -webkit-transform: rotate(0deg);
                        transform: rotate(0deg);
                    }
                    100% {
                        -webkit-transform: rotate(360deg);
                        transform: rotate(360deg);
                    }
                }

                @keyframes load8 {
                    0% {
                        -webkit-transform: rotate(0deg);
                        transform: rotate(0deg);
                    }
                    100% {
                        -webkit-transform: rotate(360deg);
                        transform: rotate(360deg);
                    }
                }
            </style>
            <ptcs-modal-overlay part=overlay
                backdrop-color="white" backdrop-opacity="60%" backdrop-z-index="9000">
            </ptcs-modal-overlay>
            <div part=spinner></div>
            <ptcs-label part="label" label="[[label]]" hidden\$="[[_hideTitle(label, field)]]" variant="title"></ptcs-label>
            <div id="controls" part="controls"></div>
            <div part="buttons" hidden\$="[[field]]">
               <ptcs-button label="[[updateButtonText]]" variant="primary" part="update-button" disabled="[[__pending]]"
                            on-action="update" tabindex="0"></ptcs-button>
               <ptcs-button label="[[cancelButtonText]]" variant="tertiary" part="cancel-button"
                            on-action="cancel" tabindex="0"></ptcs-button>
            </div>`;
    }

    static get properties() {
        return {
            // Title
            label: {
                type: String
            },

            // Declarations for all columns, from the grid view configrator (absolutely read-only!)
            columns: {
                type: Array
            },

            // If only a single column should be edited (field must match columns[n].editable)
            field: {
                type:               String,
                reflectToAttribute: true // So theme engine knows if cell or row is edited
            },

            // Item that has the original values (absolutely read-only!)
            item: {
                type: Object
            },

            // The changed values: {fieldName: new value}
            values: {
                type: Object
            },

            // {field: [validation message, validation details]}
            validation: {
                type: Object
            },

            // Hide validation error message
            hideValidationError: {
                type: Boolean
            },

            // Hide validation criteria message
            hideValidationCriteria: {
                type: Boolean
            },

            // Hide validation success message
            hideValidationSuccess: {
                type: Boolean
            },

            // Icon for validation error
            validationErrorIcon: {
                type: String
            },

            // Icon for validation success
            validationSuccessIcon: {
                type: String
            },

            // Icon for validation criteria
            validationCriteriaIcon: {
                type: String
            },

            // 'Update' button label
            updateButtonText: {
                type: String
            },

            // 'Cancel' button label
            cancelButtonText: {
                type: String
            },

            // Calendar labels
            dateLabel: {
                type:  String,
                value: 'Date'
            },

            monthLabel: {
                type:  String,
                value: 'Month'
            },

            yearLabel: {
                type:  String,
                value: 'Year'
            },

            hoursLabel: {
                type:  String,
                value: 'Hours'
            },

            minutesLabel: {
                type:  String,
                value: 'Minutes'
            },

            secondsLabel: {
                type:  String,
                value: 'Seconds'
            },

            meridiemLabel: {
                type:  String,
                value: 'AM/PM'
            },

            selectLabel: {
                type:  String,
                value: 'Select'
            },

            cancelLabel: {
                type:  String,
                value: 'Cancel'
            },

            parentLabel: {
                type:  String,
                value: 'Parent'
            },

            // The label used as the "Parent" value in the edit form when adding a root item
            noParentLabel: {
                type:  String,
                value: 'None'
            },

            __pending: {
                type:               Boolean,
                readOnly:           true,
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        return ['_changed(columns, field, item, validation)'];
    }

    constructor() {
        super();
        this._textChangedRef = this._textChanged.bind(this);
        this._dateChangedRef = this._dateChanged.bind(this);
        this._valueChangedRef = this._valueChanged.bind(this);
    }

    ready() {
        super.ready();

        this.shadowRoot.addEventListener('keydown', ev => {
            if (ev.defaultPrevented) {
                return;
            }
            switch (ev.key) {
                case 'Enter':
                    if (!ev.shiftKey) { // Shift-Enter adds newlines to controls that supports Enter
                        this.update();
                        ev.preventDefault();
                    }
                    break;

                case 'Escape':
                    this.cancel();
                    ev.preventDefault();
                    break;
            }
        });
        if (this.updateButtonText === undefined) {
            this.updateButtonText = 'Update';
        }
        if (this.cancelButtonText === undefined) {
            this.cancelButtonText = 'Cancel';
        }
        if (this.label === undefined) {
            this.label = null; // Force update
        }
    }

    _setPendingInterval() {
        this.__scheduleUpdate = false;

        this.__pendingInterval = setInterval(() => {
            let pending = false;
            let stayUnvalidated = true;

            this.shadowRoot.querySelectorAll('[validity], [part=input]').forEach(el => {
                if (el[columnRef] && typeof el.getValidity === 'function') {
                    const validity = el.getValidity();
                    if (validity === 'unvalidated') {
                        pending = true;
                    }
                    if (!el._stayUnvalidated) {
                        stayUnvalidated = false;
                    }
                }
            });

            // Show the spinner if the an element should show the validation
            this._set__pending(pending && !stayUnvalidated);

            if (!pending && this.__scheduleUpdate) {
                this.doUpdate();
            }
        }, 20);
    }

    _removePendingInterval() {
        this._set__pending(false);
        clearInterval(this.__pendingInterval);
    }

    _hideTitle(label, field) {
        return !(label && !field); // Return true or false
    }

    _createEditControl(frag, column, item, validation) {
        const cntr = document.createElement('div');
        cntr.setAttribute('part', 'column');

        // Input
        const type = (column.config && column.config.editor) || dfltEditControl[column.type];
        const input = (createEditor[type] || createDefault).call(this, column.editable, item, column);
        input.setAttribute('part', 'input');

        if (input.tagName !== 'DIV') { // DIV = a compound control that configures itself
            input.setAttribute('tabindex', '0');

            // Keep track of edited field (for validation reporting)
            input[columnRef] = column;

            // Label (only show in row-edit mode)
            if (!this.field || needLabel.indexOf(input.tagName) >= 0) {
                if (typeof column.title === 'string') {
                    input.label = column.title;
                } else if (typeof column.title === 'function') {
                    cntr.appendChild(column.title());
                }
            }

            // Assign editor properties
            if (column.config && column.config.editorProps) {
                for (const propName in column.config.editorProps) {
                    input[propName] = column.config.editorProps[propName];
                }
            }

            if (column && typeof column.validationFunction === 'function' && column.editable && valueProp[input.tagName]) {
                const colName = column.editable;
                const propName = valueProp[input.tagName];
                const validationFunction = column.validationFunction;
                if (propName) {
                    input.extraValidation = el => Promise.resolve(validationFunction(
                        Object.assign({
                            __baseIndex__: this.baseIndex,
                            __el__:        el}, item, {[colName]: el[propName]}))).then(v => !v);
                }
            }

            // Turn on validation?
            if (validation && validation[column.editable] && typeof input.enableValidationMessage === 'function') {
                input.enableValidationMessage();
            }
        }

        // Validation setup
        input._forceAppendValidationMessage = true; // Show the validation message at the bottom of editor always
        input.hideValidationError = this.hideValidationError;
        input.hideValidationCriteria = this.hideValidationCriteria;
        input.hideValidationSuccess =  this.hideValidationSuccess;
        input.validationErrorIcon = this.validationErrorIcon || undefined;
        input.validationSuccessIcon = this.validationSuccessIcon || undefined;
        input.validationCriteriaIcon = this.validationCriteriaIcon || undefined;

        cntr.appendChild(input);
        frag.appendChild(cntr);
    }

    _changed(columns, field, item, validation) {
        const controls = this.$.controls;

        // Remove current edit controls
        while (controls.firstChild) {
            controls.removeChild(controls.firstChild);
        }

        // Reset values
        this.values = {};

        // Create new edit controls
        const frag = document.createDocumentFragment();

        if (field) {
            const column = columns.find(col => col.editable === field);
            if (!column) {
                console.error('Unknown column: ' + field);
                return;
            }
            this._createEditControl(frag, column, item, validation);
        } else {
            if (this.theParentLabel !== false && this.theParentLabel !== undefined) {
                const div = document.createElement('div');
                div.innerHTML = '<div><ptcs-label></ptcs-label></div><div><ptcs-label variant="body"></ptcs-label></div>';

                // Add external labels without risking injections
                const labels = div.querySelectorAll('ptcs-label');
                labels[0].label = this.parentLabel;
                // theParentLabel === null => adding a root item
                labels[1].label = this.theParentLabel !== null ? this.theParentLabel : this.noParentLabel;

                // Append parent name
                frag.appendChild(div);
            }

            columns.forEach(column => {
                if (column.editable && !column.noRowEdit) {
                    this._createEditControl(frag, column, item, validation);
                }
            });
        }
        controls.appendChild(frag);
        this._setPendingInterval();
    }

    _setValue(el, value) {
        const column = el[columnRef];
        if (!column) {
            return false;
        }
        const field = column.editable;

        // Reject empty string for partial behavior alignment with legacy grid on clearing the cell contents
        const newValue = (!value && ['INTEGER', 'NUMBER', 'LONG'].includes(column.type))
            ? this.item[field]
            : convertValue(value, column.type);
        if (this.item[field] !== newValue || this.values.hasOwnProperty(field)) {
            if (newValue !== null) {
                this.values[field] = newValue;
                return true;
            }
            delete this.values[field];
        }
        return false;
    }

    // Text value changed. More changes may be coming
    _textChanged(ev) {
        this._setValue(ev.target, ev.detail.value);
    }

    _dateChanged(ev) {
        if (ev.detail.value === undefined) {
            // The date field is empty. Don't update and don't close the dialog.
            return;
        }

        this._valueChanged(ev);
    }

    // Value changed. Can validate now
    _valueChanged(ev) {
        if (this._setValue(ev.target, ev.detail.value) && this.field) {
            // Selected a new value when editing a single field: editing is done
            // The component may need a moment to perform all validations
            setTimeout(() => {
                this.update();
            }, 20);
        }
    }

    initFocus() {
        // Don't focus on unselected radio-buttons
        let el = this.shadowRoot.querySelector('[tabindex]:not(ptcs-radio:not([checked]))');
        if (el) {
            el.focus();
        } else {
            // Focus on anything
            el = this.shadowRoot.querySelector('[tabindex]');
            if (el) {
                el.focus();
            }
        }
    }

    cancel() {
        this._removePendingInterval();
        this.dispatchEvent(new CustomEvent('close'));
    }

    update() {
        this.__scheduleUpdate = true;
    }

    doUpdate() {
        // eslint-disable-next-line no-unused-vars
        for (const k in this.values) {
            // Found at least one updated value
            const validation = {};
            this.shadowRoot.querySelectorAll('[validity], [part=input]').forEach(el => {
                if (el[columnRef] && typeof el.getValidity === 'function' && el.getValidity() === 'invalid') {
                    // Numbers whose edited value is NaN are rejected unconditionally so the corresponding grid field
                    // should not be set as invalid, but pass through other use cases.
                    if (!(['INTEGER', 'NUMBER', 'LONG'].includes(el[columnRef].type) && isNaN(el.text))) {
                        const a = [el.validationMessage || 'Invalid'];
                        if (el.validationCriteria) {
                            a.push(el.validationCriteria);
                        }
                        validation[el[columnRef].editable] = a;
                    }
                }
            });
            this._removePendingInterval();
            this.dispatchEvent(new CustomEvent('close', {detail: {values: this.values, validation}}));
            return;
        }
        // Nothing to update, so cancel instead
        this.cancel();
    }
};

customElements.define(PTCS.EditGridCells.is, PTCS.EditGridCells);

