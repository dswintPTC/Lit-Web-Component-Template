import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

// eslint-disable-next-line max-len
const defaultIconPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9Im5vbmUiIGZpbGw9IiM2RTcxN0MiIGZpbGwtcnVsZT0ibm9uemVybyI+PHBhdGggZD0iTTE2LDUuOSBMMTAuNSw1IEw4LDAgTDUuNSw1LjEgTDAsNS45IEw0LDkuOCBMMywxNiBMOCwxMi43IEwxMywxNiBMMTIsOS44IEwxNiw1LjkgWiBNOCwxMSBMNSwxMyBMNS42LDkuNCBMMy4yLDYuOSBMNi41LDYuNCBMOCwzLjQgTDkuNSw2LjQgTDEyLjgsNi45IEwxMC40LDkuMiBMMTEsMTIuOCBMOCwxMSBaIj48L3BhdGg+PC9nPjwvc3ZnPg==';

// Ungly fix for circular inclusion dependency
const BehaviorTooltip = PTCS.BehaviorTooltip || (cls => cls);

PTCS.Icon = class extends BehaviorTooltip(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
        <style>
        :host {
            flex: 0 0 auto;
            display: inline-flex;
            justify-content: space-between;
            align-items: stretch;
            box-sizing: border-box;
            fill: currentColor;
        }

        [part=image] {
            flex: 1 1 auto;
        }

        :host([hidden]) {
            display: none !important;
        }

        :host([aria-disabled="true"]) {
            pointer-events: none;
        }
        </style>`;
    }

    static get is() {
        return 'ptcs-icon';
    }

    static get properties() {
        return {
            // URL to icon set (optional)
            iconSet: {
                type: String
            },

            // Icon (id or url)
            icon: {
                type: String
            },

            // Alt text for screen reader
            alt: {
                type:     String,
                observer: '_altChanged'
            },

            // small || medium || large || xlarge
            size: {
                type:               String,
                value:              'small',
                reflectToAttribute: true
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            // Prevent the icon source from being cached by the browser so that the most recent version is shown when reloaded
            preventCaching: {
                type:  Boolean,
                value: false
            },

            // Use placeholder image if the icon property is empty
            placeholder: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // The placeholder that is currently being used, if any
            _usingPlaceholder: {
                type:     String,
                observer: '_usingPlaceholderChanged'
            }

        };
    }

    static get observers() {
        return [
            '_iconChanged(iconSet, icon, placeholder, preventCaching)',
            '_iconSizeChanged(size, iconWidth, iconHeight)'
        ];
    }

    // Get current placeholder icon
    static get placeholderIcon() {
        return PTCS.Icon.__placeholderIcon || defaultIconPlaceholder;
    }

    // Set a new placeholder icon
    static set placeholderIcon(icon) {
        PTCS.Icon.__placeholderIcon = icon;

        if (PTCS.Icon.__watch) {
            PTCS.Icon.__watch.forEach(el => {
                if (typeof el._usingPlaceholder === 'string') {
                    el._iconChanged(el.iconSet, el.icon, el.placeholder);
                }
            });
        }

        return icon;
    }

    static _watchPlaceholder(icon) {
        if (typeof icon._usingPlaceholder === 'string') {
            if (!PTCS.Icon.__watch) {
                PTCS.Icon.__watch = new Set();
            }
            PTCS.Icon.__watch.add(icon);
        } else {
            this._unwatchPlaceholder(icon);
        }
    }

    static _unwatchPlaceholder(icon) {
        if (PTCS.Icon.__watch) {
            PTCS.Icon.__watch.delete(icon);
        }
    }

    ready() {
        super.ready();
        if (PTCS.isEdge) {
            // Fix that protects us from MUB styling that leaks into the shady DOM on Edge
            this.style.boxSizing = 'border-box';
        }
    }

    connectedCallback() {
        super.connectedCallback();
        if (typeof this._usingPlaceholder === 'string') {
            if (this._usingPlaceholder !== PTCS.Icon.placeholderIcon) {
                this._iconChanged(this.iconSet, this.icon, this.placeholder, this.preventCaching);
            } else {
                PTCS.Icon._watchPlaceholder(this);
            }
        }
    }

    disconnectedCallback() {
        PTCS.Icon._unwatchPlaceholder(this);
        super.disconnectedCallback();
    }

    _usingPlaceholderChanged() {
        PTCS.Icon._watchPlaceholder(this);
    }

    _iconChanged(iconSet, icon, placeholder, preventCaching) {
        // Remove existing icon?
        let el = this.shadowRoot.querySelector('[part=image]');
        if (el) {
            this.shadowRoot.removeChild(el);
        }

        // Current timestamp, to create unique urls
        const timestamp = preventCaching ? `?${Date.now()}` : '';

        // Create an image for the icon
        const createImg = src => {
            // Put image in a wrapper so its dimension can be flex-box-controlled
            const e = document.createElement('div');
            const img = document.createElement('img');
            img.setAttribute('src', src + timestamp);
            img.setAttribute('style', 'width:100%;height:100%;');
            e.appendChild(img);
            return e;
        };

        // Create an iron-icon for the icon
        const createIcon = _icon => {
            const e = document.createElement('iron-icon');
            e.setAttribute('style', 'stroke:inherit;fill:inherit;width:unset;height:unset;');
            e.icon = _icon;
            return e;
        };

        // Assume that placeholder is not used
        let placeholderIcon = null;

        if (icon && icon !== '#none') {
            if (iconSet === '#iron-icon') {
                // Want an icon that is defined in the source code (not in an external image file)
                el = createIcon(icon);
            } else if (iconSet) {
                // Load external icon set
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttribute('href', encodeURI((iconSet || '') + '#' + icon) + timestamp);
                el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                el.appendChild(use);
                /*                 if (PTCS.isIE) { // IE needs extra help
                    this._loadUse(use, iconSet, icon);
                } */
            } else if (/^[a-z-:_\d]+$/gi.test(icon)) { // e.g. 'hardware:computer'
                // Want an icon that is defined in the source code (not in an external image file)
                el = createIcon(icon);
            } else {
                // Want an icon that is defined in an external image file
                el = createImg(icon);
                el.icon = icon; // WHY THIS?
            }
        } else if (placeholder) {
            // Display placeholder
            placeholderIcon = PTCS.Icon.placeholderIcon;
            el = createImg(placeholderIcon);
        } else {
            // Don't want an icon displayed (right now at least)
            el = document.createElement('div');
        }

        // Using a placeholder? (watch for changes...)
        this._usingPlaceholder = placeholderIcon;

        el.setAttribute('part', 'image');
        el.setAttribute('alt', ' '); /* Chrome will display a 'broken icon image' if the icon reference doesn't resolve, but only if alt is non-empty.
        This ought to be due to guideline from HTML5 spec,
        see https://www.w3.org/TR/html5/semantics-embedded-content.html#a-purely-decorative-image-that-doesnt-add-any-information.
        However, VD doesn't want a tooltip to appear in such case, so just using a space as alt attribute value. */
        this.shadowRoot.appendChild(el);
    }

    _altChanged(alt) {
        if (alt) {
            this.setAttribute('aria-label', alt);
        } else {
            this.removeAttribute('aria-label');
        }
    }

    _iconSizeChanged(size, iconWidth, iconHeight) {
        if (size === 'custom') {
            if (iconWidth) {
                this.style.width = `${iconWidth}px`;
            } else {
                this.style.removeProperty('width');
            }
            if (iconHeight) {
                this.style.height = `${iconHeight}px`;
            } else {
                this.style.removeProperty('height');
            }
        } else {
            this.style.removeProperty('width');
            this.style.removeProperty('height');
        }
    }

    /*   // Fix for IE
    _loadUse(use, iconSet, icon) {
        if (!PTCS._iconCache) {
            PTCS._iconCache = {};
        }

        let idPrefix = PTCS._iconCache[iconSet];
        if (idPrefix) {
            use.setAttribute('href', '#' + idPrefix + icon);
        } else {
            // Generate unique ID prefix for this icon set
            PTCS._iconId = (PTCS._iconId || 0) + 1;
            PTCS._iconCache[iconSet] = idPrefix = 'iconset-' + PTCS._iconId + '-';

            // Dowwnload icon set
            let xhttp = new XMLHttpRequest();

            xhttp.onload = () => {
                // Ugly way to parse the recived XML
                let x = document.createElement('x');
                x.innerHTML = xhttp.responseText;
                let svg = x.getElementsByTagName('svg')[0];

                if (!svg) {
                    return;
                }

                // Make unique identifiers for this icon set
                svg.querySelectorAll('svg > defs>[id]').forEach(el => {
                    el.setAttribute('id', idPrefix + el.getAttribute('id'));
                });

                // Hide icon set
                svg.setAttribute('aria-hidden', 'true');
                svg.style.position = 'absolute';
                svg.style.width = 0;
                svg.style.height = 0;
                svg.style.overflow = 'hidden';

                // Attach svg to DOM
                document.body.appendChild(svg);

                // Connect icon to this icon set
                use.setAttribute('href', '#' + idPrefix + icon);
            };

            const errCb = () => {
                console.error(
                    `Error downloading icon-set ${JSON.stringify(iconSet)}`
                );
            };

            xhttp.onerror = errCb;
            xhttp.ontimeout = errCb;

            xhttp.open('GET', iconSet);
            xhttp.send();
        }
    } */

    static get $parts() {
        return ['image'];
    }
};

customElements.define(PTCS.Icon.is, PTCS.Icon);

export const Icon = PTCS.Icon;
