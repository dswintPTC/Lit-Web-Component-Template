import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

PTCS.ValidationMessage = class extends PTCS.BehaviorTooltip(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get is() {
        return 'ptcs-validation-message';
    }

    static get template() {
        return html`
        <style>
            :host { display: grid; grid-template-columns: auto 1fr; user-select: text; cursor: text; }
            :host([_hidden]) { display: none; }
            :host([_no-label]) [part=messages-list] { grid-row: 1; }
            :host([_no-label]) [part=icon] { place-self: start; }
            :host(:focus) { outline: none; }
            [part=icon] { grid-column: 1; grid-row: 1; place-self: center; }
            [part=label] { grid-column: 2; grid-row: 1; align-self: center; }
            [part=messages-list] { grid-column: 2; grid-row: 2; overflow: hidden; list-style-type: none; }
            [part=messages-list]:not([single-message]) [part~=message-li]::before { content: "\u2022"; padding-right: 0.5em; }
            [part~=message-li] { display: flex; }
            [part=message-text]::part(label) { overflow: hidden; }
            [hidden] { display: none !important; }
        </style>

        <ptcs-icon part="icon" icon="[[icon]]" hidden\$="[[!icon]]"></ptcs-icon>
        <ptcs-label id="label" part="label" label="[[label]]" variant="label" multi-line="[[!singleLine]]" hidden\$="[[_no-label]]" disable-tooltip>
        </ptcs-label>
        <ul id="messages-list" part="messages-list" single-message\$=[[_singleMessage(messages)]] hidden\$="[[_hideMessagesList(messages)]]">
            <dom-repeat items="[[messages]]">
                <template>
                    <li part="message-li message-text">
                        <ptcs-label label="[[item]]" part="message-text" variant="caption" multi-line="[[!singleLine]]" disable-tooltip></ptcs-label>
                    </li>
                </template>
            </dom-repeat>
        </ul>`;
    }

    static get properties() {
        return {
            validity: {
                type:               String,
                reflectToAttribute: true
            },

            icon: {
                type: String
            },

            label: {
                type: String
            },

            messages: {
                type: Array
            },

            singleLine: {
                type:  Boolean,
                value: false
            },

            _noLabel: {
                type:               Boolean,
                computed:           '_computeNoLabel(label)',
                reflectToAttribute: true
            },

            _hidden: {
                type:               Boolean,
                computed:           '_computeHidden(label, messages)',
                reflectToAttribute: true
            }
        };
    }

    ready() {
        super.ready();
        this.tooltipFunc = this._monitorTooltip.bind(this);

        // Need to change from undefiend for @hidden computation
        if (this.icon === undefined) {
            this.icon = null;
        }
        if (this.label === undefined) {
            this.label = null;
        }
        if (this.messages === undefined) {
            this.messages = null;
        }
    }

    // Tooltip behavior on label and messages truncation
    _monitorTooltip() {
        const messages = this.$['messages-list'].querySelectorAll('ptcs-label[part=message-text]');

        if (!this.$.label.isTruncated() && !Array.from(messages).some(msg => msg.isTruncated())) {
            return '';
        }

        const labelTooltip = this.$.label ? this.$.label.label : '';
        let messagesTooltip = '';

        messages.forEach((msg, i) => {
            messagesTooltip += messages.length > 1 ? '\u2022 ' : '';
            messagesTooltip += i < messages.length - 1 ? `${msg.label}\n\n` : msg.label;
        });

        return labelTooltip.concat(labelTooltip && messagesTooltip ? '\n\n' : '', messagesTooltip);
    }

    _hideMessagesList(messages) {
        return !messages || messages.length === 0;
    }

    _singleMessage(messages) {
        return messages.length === 1;
    }

    _computeNoLabel(label) {
        return !label;
    }

    _computeHidden(label, messages) {
        return !label && this._hideMessagesList(messages);
    }
};

customElements.define(PTCS.ValidationMessage.is, PTCS.ValidationMessage);
