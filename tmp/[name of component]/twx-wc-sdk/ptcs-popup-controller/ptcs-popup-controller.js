import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-modal-overlay/ptcs-modal-overlay.js';

// Generate a secure random string using the browser crypto functions
const generateRandomString = () => {
    var array = new Uint32Array(28);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

PTCS.PopupController = class extends L2Pw(LitElement) {
    static get styles() {
        return css`
        :host {
            display: none;
        }`;
    }

    render() {
        return html`<form action=${this.url} id="form" method="post">
            </form>`;
    }

    static get is() {
        return 'ptcs-popup-controller';
    }

    static get properties() {
        return {
            url: {
                type: String
            },

            popupWidth: {
                type:      Number,
                value:     900,
                attribute: 'popup-width'
            },

            popupHeight: {
                type:      Number,
                value:     600,
                attribute: 'popup-height'
            },

            result: {
                type:     String,
                readOnly: true
            },

            popupState: {
                type:      String,
                value:     'initial',
                readOnly:  true,
                reflect:   true,
                attribute: 'popup-state'
            },

            // Additional level of security. Response from the URL should be validated using randomly generated string.
            messageValidation: {
                type:        Boolean,
                observer:    '_updateDisableMessageValidation',
                attribute:   'message-validation',
                observeWhen: 'immediate',
                noAccessor:  true
            },

            // No validation for the response from the URL
            disableResultValidation: {
                type:      Boolean,
                attribute: 'disable-result-validation'
            },

            disableMessageValidation: {
                type:        Boolean,
                value:       false,
                observer:    '_updateMessageValidation',
                attribute:   'disable-message-validation',
                observeWhen: 'immediate',
                noAccessor:  true
            },

            modal: {
                type:     Boolean,
                observer: '_updateNonModal'
            },

            nonModal: {
                type:      Boolean,
                value:     false,
                observer:  '_updateModal',
                attribute: 'non-modal'
            },

            showPopupBlockedMessage: {
                type:      Boolean,
                value:     false,
                attribute: 'show-popup-blocked-message'
            },

            popupBlockedMessage: {
                type:      String,
                attribute: 'popup-blocked-message'
            },

            // Possible options: 'GET'/'POST'
            method: {
                type:  String,
                value: 'GET'
            },

            params: {
                type:  Object,
                value: () => ({})
            }
        };
    }

    ready() {
        super.ready();

        this._focusOnPopup = () => {
            if (this.__popup && !this.__popup.closed && this.modal) {
                this.__popup.focus();
            }
        };

        document.addEventListener('click', this._focusOnPopup);
        window.addEventListener('blur', this._focusOnPopup);
        window.addEventListener('beforeunload', this._closePopup.bind(this));
    }

    disconnectedCallback() {
        this._closePopup();

        this._removeModalOverlay();

        document.removeEventListener('click', this._focusOnPopup);
        window.removeEventListener('blur', this._focusOnPopup);

        super.disconnectedCallback();
    }

    _putModalOverlay() {
        if (this.modal) {
            this.__overlay = document.createElement('ptcs-modal-overlay');
            document.body.appendChild(this.__overlay);
        }
    }

    _removeModalOverlay() {
        if (this.__overlay) {
            document.body.removeChild(this.__overlay);
            this.__overlay = undefined;
        }
    }

    _getWindowParams() {
        let left, top;
        let height = this.popupHeight || 0;
        let width = this.popupWidth || 0;

        if (width) {
            left = window.screenX + screen.width / 2 - width / 2;
        }

        if (height) {
            top = screen.height / 2 - height / 2;
        }

        return `height=${height},width=${width},top=${top},left=${left}`;
    }

    _closePopup() {
        if (this.__popup && !this.__popup.closed) {
            this.__popup.close();
        }
    }

    _cancelPopup(reject) {
        this.dispatchEvent(new CustomEvent('popup-canceled', {
            bubbles:  true,
            composed: true
        }));

        this._setPopupState('canceled');

        reject('popup-canceled');
    }

    __addStateToParams(state) {
        if (this.messageValidation) {
            this.params['__state__'] = state;
        } else {
            delete this.params['__state__'];
        }
    }

    _createFormProperties(state) {
        let input;

        this.$.form.innerHTML = '';

        this.__addStateToParams(state);

        Object.keys(this.params).forEach((key) => {
            input = document.createElement('textarea');
            input.name = key;
            input.value = this.params[key];

            this.$.form.appendChild(input);
        });
    }

    _createUrlParams(state) {
        this.__addStateToParams(state);

        let urlParams = this.url.includes('?') ? '&' : '?';

        Object.keys(this.params).forEach((key) => {
            const encodedKey = encodeURI(key);

            if (key === encodedKey) {
                urlParams += `${encodedKey}=${encodeURI(this.params[key])}&`;
            }
        });

        return urlParams.length === 1 ? '' : urlParams.substring(0, urlParams.length - 1);
    }

    _getPopupWndName() {
        if (this.hasAttribute('id')) {
            return `${this.getAttribute('id')}_popup`;
        }

        if (this.method === 'POST') {
            return 'popup'; // POST request popups must define window name
        }

        return '_blank';
    }

    _openPopup(resolve, reject) {
        if (!this.url || this.popupState === 'open') {
            reject();
            return;
        }

        const state = generateRandomString();
        const popupWndName = this._getPopupWndName();
        const popupUrl = this.method === 'POST' ? '' : `${this.url}${this._createUrlParams(state)}`;

        try {
            PTCS.saveValueInSession(`${popupWndName}__state__`, undefined, true);
        } catch (e) {
            reject('Local storage is inaccessible. Are third-party cookies, probably, blocked?');
            return;
        }

        this.__popup = window.open(popupUrl, popupWndName, this._getWindowParams());

        if (!this.__popup) {
            this._setPopupState('blocked');

            if (this.showPopupBlockedMessage && this.popupBlockedMessage) {
                alert(this.popupBlockedMessage);
            }

            this.dispatchEvent(new CustomEvent('popup-blocked', {
                bubbles:  true,
                composed: true
            }));

            reject('popup-blocked');
            return;
        }

        if (this.method === 'POST') {
            this.$.form.target = popupWndName;

            this._createFormProperties(state);

            if (this.messageValidation) {
                PTCS.saveValueInSession(`${popupWndName}__state__`, state, true);
            }

            this.$.form.submit();
        }

        this._putModalOverlay();

        this._setPopupState('open');

        const msgHandler = (event) => {
            let urlOrigin;
            let failed = false;

            // Try to fetch the origin of the URL
            try {
                urlOrigin = new URL(this.url).origin;
            // eslint-disable-next-line no-empty
            } catch (e) {
            }

            if (!(window.origin === event.origin) && (!urlOrigin || urlOrigin !== event.origin)) {
                return;
            }

            if (!event.data) {
                return;
            }

            if (this.messageValidation && event.data.state !== state) {
                return;
            }

            if (event.data.status === 'failed') {
                failed = true;
            }

            if ((!failed && event.data.result) || this.disableResultValidation) {
                const result = this.disableResultValidation ? event.data : event.data.result;

                this._setResult(result);
                this._setPopupState('done');

                this.dispatchEvent(new CustomEvent('popup-done', {
                    bubbles:  true,
                    composed: true,
                    detail:   {result}
                }));

                resolve(result);
            } else {
                this._cancelPopup(reject);
            }

            this.__popup.close();
        };

        const isPopupClosed = () => {
            if (this.__popup.closed) {
                this._removeModalOverlay();
                PTCS.saveValueInSession(`${popupWndName}__state__`, undefined, true);

                window.removeEventListener('message', msgHandler);

                if (this.popupState === 'open') {
                    this._cancelPopup(reject);
                }

                return;
            }

            setTimeout(isPopupClosed, 100);
        };

        isPopupClosed();

        window.addEventListener('message', msgHandler);

        this.__popup.addEventListener('blur', this._focusOnPopup);
    }

    open() {
        return new Promise(this._openPopup.bind(this));
    }

    _updateModal(v) {
        this.modal = !v;
    }

    _updateNonModal(v) {
        this.nonModal = !v;
    }

    _updateDisableMessageValidation(v) {
        this.disableMessageValidation = !v;
    }

    _updateMessageValidation(v) {
        this.messageValidation = !v;
    }
};

customElements.define(PTCS.PopupController.is, PTCS.PopupController);
