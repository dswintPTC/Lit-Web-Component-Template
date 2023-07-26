import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-image/ptcs-image.js';
import 'ptcs-label/ptcs-label.js';

PTCS.MenuFooter = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
            :host {
                cursor: pointer;
                display: flex;
                flex-direction: row;
                min-width: 34px;
                min-height: 19px;
                align-items: center;

                box-sizing: border-box;

                white-space: nowrap;
                overflow: hidden;
                outline: none;
            }

            :host([hidden]) {
                display: none;
            }

            :host([disabled]) {
                cursor: default;
            }

            :host [part=icon][hidden] {
                display: none;
            }

            [part=icon] {
                flex-grow: 0;
                flex-shrink: 0;
            }

            [part=label] {
                flex-grow: 100;
            }

        </style>

        <ptcs-image id="icon" part="icon" src="[[_imageSrc]]" size="contain" hidden$="[[_hideImage]]" aria-hidden="true"></ptcs-image>
        <ptcs-label part="label" id="label" label="[[text]]" hidden$="[[_hideLabel]]"></ptcs-label>`;
    }

    static get is() {
        return 'ptcs-menu-footer';
    }

    static get properties() {
        return {
            text: {
                type: String
            },

            icon: {
                type: String
            },

            logo: {
                type: String
            },

            item: {
                type: Object
            },

            compactMode: {
                type: Boolean
            },

            ignoreClick: {
                type:  Boolean,
                value: false
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            hidden: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            logoMode: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            _imageSrc: {
                type: String
            },

            _hideImage: {
                type:     Boolean,
                computed: '_hideImageFunc(compactMode, logo, icon)',
            },

            _hideLabel: {
                type:     Boolean,
                computed: '_hideLabelFunc(compactMode, text, logo, icon)'
            },

            _resizeObserver: ResizeObserver
        };
    }

    static get observers() {
        return [
            '_imageSrcFunc(compactMode, logo, icon)'
        ];
    }

    ready() {
        super.ready();
        this.addEventListener('click', (ev) => {
            this._emitActionEvent();
            ev.preventDefault();
        });
        this.addEventListener('keydown', ev => this._emitActionEvent(ev));
        this.tooltipFunc = this._monitorTooltip;
        this._resizeObserver = new ResizeObserver(this.__resize.bind(this));
        this.$.label.verticalAlignment = 'center';

        this.addEventListener('blur', () => {
            this.dispatchEvent(new CustomEvent('lost-focus', {
                bubbles:  true,
                composed: true,
                detail:   {cmpnt: 'footer'}
            }));
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        super.disconnectedCallback();
    }

    __resize() {
        if (this.compactMode || !this.logo) {
            return;
        }
        const footerWidth = PTCS.getElementWidth(this) || 0;
        const widthStr = window.getComputedStyle(this.$.icon).getPropertyValue('width');
        const imageWidth = Number(widthStr.substr(0, widthStr.indexOf('px'))) || 0;

        if (this.logoMode) {
            this.__logoimageWidth = imageWidth;
            if (imageWidth > footerWidth) {
                this._imageSrc = this.icon;
                this.logoMode = false;
                this.$.icon.position = 'center';
            }
        } else if (footerWidth > this.__logoimageWidth) {
            this._imageSrc = this.logo;
            this.logoMode = true;
            this.$.icon.position = 'left';
        }
    }

    _imageSrcFunc(compactMode, logo, icon) {
        if (!compactMode && logo) {
            this._imageSrc = logo;
            this.logoMode = true;
            this.$.icon.position = 'left';
        } else {
            this._imageSrc = icon;
            this.logoMode = false;
            this.$.icon.position = 'center';
        }
        this.__resize();
    }

    _hideImageFunc(compactMode, logo, icon) {
        return !!(!icon && (compactMode || (!compactMode && !logo)));
    }

    _hideLabelFunc(compactMode, text, logo, icon) {
        return !!(!text || (compactMode && icon) || (!compactMode && logo));
    }

    _monitorTooltip() {
        if (this.compactMode) {
            return this.text;
        }
        const el = this.$.label;
        if (el && el.isTruncated()) {
            return this.text;
        }

        return '';
    }

    _emitActionEvent(ev) {
        if (!this.disabled && !this.ignoreClick) {
            this._tooltipClose();
            if (!ev || ev && (ev.key === ' ' || ev.key === 'Enter')) {
                this.dispatchEvent(new CustomEvent('action',
                    {
                        bubbles:  true,
                        composed: true,
                        detail:   {item: this.item}
                    })
                );
            }
        }
    }
};

customElements.define(PTCS.MenuFooter.is, PTCS.MenuFooter);
