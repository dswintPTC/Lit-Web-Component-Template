import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-label/ptcs-label.js';

const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="ptcs-link-default-theme" theme-for="ptcs-link">
  <template>
      <style>
        :host([disabled]) [part=link]
        {
          cursor: auto;
          pointer-events: none;
        }
        :host(:not([disabled]):not([variant=label])) [part=link]
        {
          cursor: pointer;
        }
      </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);

PTCS.Link = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
    <style>
      :host {
        /*display: inline-block;*/
        display: inline-flex;
        justify-content: space-between;
        align-items: center;

        overflow: hidden;

        min-width: 34px;
        min-height: 19px;

        box-sizing: border-box;

        align-items: flex-start;
        overflow: auto
      }

      :host([vertical-alignment=flex-start]) {
        align-items: flex-start;
      }

      :host([vertical-alignment=center]) {
        align-items: center;
      }

      :host([vertical-alignment=flex-end]) {
        align-items: flex-end;
      }

      :host([_zero-padding-no-scroll]) {
        overflow: hidden;
        min-height: 0px;
      }

      :host([_zero-padding-no-scroll]) [part=label]{
        padding-top: 0px;
        padding-bottom: 0px;
      }

      a {
        display: inline-flex;

        width: 100%;
      }

      [part=label] {
        width: inherit;

        text-decoration: inherit;

        min-width: unset;
        min-height: unset;
      }
    </style>

    <a part="link" href\$="[[_compute_href(disabled, href)]]" target\$="[[_compute_target(target)]]"
      rel="nofollow noopener noreferrer" tabindex\$="[[_tabindex(_delegatedFocus, noTabindex)]]">
      <ptcs-label part="label" id="label" label\$="[[label]]" multi-line="[[_multiLine(singleLine)]]"
      variant="[[variant]]" exportparts\$="[[_exportparts]]"
      dis-scroll-on-ellips-multi-line="[[_disScrollOnPtcsLabelEllipsMultiLine]]" max-height="[[_disScrollOnPtcsLabelMaxHeight]]"
      horizontal-alignment\$="[[alignment]]" disclosure-control="ellipsis" disable-tooltip no-wc-style></ptcs-label></a>`;
    }

    static get is() {
        return 'ptcs-link';
    }

    static get properties() {
        return {
            href: {
                type:     String,
                observer: '_hrefChanged'
            },

            linkRouted: {
                type: Boolean
            },

            target: {
                type: String
            },

            label: {
                type:  String,
                value: 'Link'
            },

            // Note - variant is assigned to the internal ptcs-label too, to prevent it from the default variant=label.
            //        However, since no-wc-style is active, the variant for the ptcs-label is ignored, so the assignemnt
            //        is only for code readability.
            variant: {
                type:               String,
                value:              'primary',
                reflectToAttribute: true
            },

            singleLine: {
                type:  Boolean,
                value: false
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            ariaDisabled: {
                type:               String,
                computed:           '_compute_ariaDisabled(disabled)',
                reflectToAttribute: true
            },

            role: {
                type:               String,
                value:              'link',
                reflectToAttribute: true
            },

            alignment: {
                type: String
            },

            textMaximumWidth: {
                type:     String,
                observer: '_textMaximumWidth_changed'
            },

            _zeroPaddingNoScroll: {
                type:               Boolean,
                reflectToAttribute: true
            },

            _disScrollOnPtcsLabelEllipsMultiLine: {
                type: Boolean
            },

            _disScrollOnPtcsLabelMaxHeight: {
                type: String
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            verticalAlignment: {
                type:               String,
                reflectToAttribute: true
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('label-', PTCS.Label)
            }
        };
    }

    // Implements ptcs-link's tooltip behavior on label truncation
    _monitorTooltip() {
        const label = this.shadowRoot.querySelector('[part=label]');
        if (label && label.isTruncated()) {
            if (!this.tooltip) {
                return this.label;
            } else if (this.tooltip !== this.label) {
                // Truncated label with a tooltip (not identical to the label), show both
                return this.label + '\n\n' + this.tooltip;
            }
        } else if (this.tooltip === this.label) {
            return '';
        }
        return this.tooltip || '';
    }

    ready() {
        super.ready();

        const link = this.shadowRoot.querySelector('[part=link]');
        this._trackFocus(link, this);
        this.addEventListener('click', this._onClick.bind(this), true);

        // Custom tooltip func
        this.tooltipFunc = this._monitorTooltip;

        link.addEventListener('keypress', ev => {
            const key = ev.which || ev.keyCode;
            if ((key === 32 || key === 13) && !this.disabled) {
                this.$.label.click();
                ev.preventDefault();
            }
        });
    }

    _multiLine(singleLine) {
        if (singleLine) {
            return false;
        }
        return true;
    }

    _tabindex(_delegatedFocus, noTabindex) {
        return (_delegatedFocus && !noTabindex) ? _delegatedFocus : '-1';
    }

    _hrefChanged(href) {
        if (!PTCS.validateURL(href)) {
            console.warn('[ptcs-link]XSS prevention: URL includes the protocol "javascript:"');
        }
    }

    _compute_href(disabled, href) {
        if (disabled || !href) {
            return false;
        }
        return PTCS.validateURL(href) ? (PTCS.rectifyURI(href) || '#') : '';
    }


    _compute_target(target) {
        switch (target) {
            case '_self':
            case '_blank':
            case '_parent':
            case '_top':
                return target;

            case 'same':
                return '_self';

            case 'new':
                return '_blank';

            case '_popup':
            case 'popup':
                return 'PopupWindow';
        }

        return '_self';
    }

    _activateLink(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.activateLink() ;
    }


    _onClick(ev) {
        if (this.disabled || !PTCS.validateURL(this.href) || this.isIDE) {
            ev.preventDefault();
            return;
        }

        const targetName = ev.composedPath();
        if (targetName && targetName[0] && targetName[0].nodeName === 'PTCS-LINK') {
            // in case one click on ptcs-link but not on the anchor element itself (in case ptcs-link has padding)
            this._activateLink(ev);
            return;
        }

        // Add event for hyperlink
        const evClickA = new CustomEvent('a-click', {
            bubbles:    true,
            cancelable: true,
            composed:   true,
            detail:     {
                a:             this.shadowRoot.querySelector('a'),
                originalEvent: ev
            }});

        this.dispatchEvent(evClickA);

        // If the user is handling the link routing, then we are done...
        if (evClickA.defaultPrevented || this.linkRouted) {
            ev.preventDefault();
            return;
        }

        let trgt = this._compute_target(this.target);
        if (trgt === 'PopupWindow') {
            ev.preventDefault();
            let wnd = PTCS.openUrl('open', this.href, 'PopupWindow', 'height=450,width=700');
            if (wnd) {
                wnd.focus();
            }
        } else {
            let bRequireReload = trgt !== '_self';
            PTCS.keepHashForSSORedirect(this.href, bRequireReload); // <a href> doen't call to openUrl but _onClick helps us to manage #-part (SSO)
        }

    }

    _compute_ariaDisabled(disabled) {
        return disabled ? 'true' : false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._connected = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._connected = false;
    }

    _textMaximumWidth_changed(val) {
        if (val) {
            var unitTest = val + '';
            if (unitTest.indexOf('px') === -1) {
                this.$.label.style.maxWidth = val + 'px';
            } else {
                this.$.label.style.maxWidth = val;
            }
        } else {
            this.$.label.style.maxWidth = '';
        }
    }

    // Allow manual activation of the link
    activateLink() {
        this.$.label.click();
    }

    static get $parts() {
        if (!this._$parts) {
            this._$parts = ['link', 'label', ...PTCS.partnames('label-', PTCS.Label)];
        }
        return this._$parts;
    }
};

customElements.define(PTCS.Link.is, PTCS.Link);
