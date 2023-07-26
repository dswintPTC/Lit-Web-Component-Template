import {PTCS} from 'ptcs-library/library.js';
import './ptcs-validation-message.js';

/* eslint-disable no-confusing-arrow */

// Validity modes
export const Validity = {
    VALID:       'valid',
    INVALID:     'invalid',
    UNVALIDATED: 'unvalidated'
};

Object.freeze(Validity);

// Icons, labels and details
const iconDflt = {valid: 'cds:icon_success', invalid: 'cds:icon_error', unvalidated: 'cds:icon_info'};
const iconCust = {valid: 'validationSuccessIcon', invalid: 'validationErrorIcon', unvalidated: 'validationCriteriaIcon'};
const labelCust = {valid: 'validationSuccessMessage', invalid: 'validationMessage', unvalidated: 'validationMessage'};
const details = {valid: 'validationSuccessDetails', invalid: 'validationCriteria', unvalidated: 'validationCriteria'};
const hide = {valid: 'hideValidationSuccess', invalid: 'hideValidationError', unvalidated: 'hideValidationCriteria'};

// Validation status of observed properties
const NOT_VALIDATED = 0; // No validation and no property observer
const VALIDATED = 1; // Validating, unknown result
const VALIDATED_IGNORE = 2; // Validating, and last result tells us to ignore the validation
const VALIDATED_FALSE = 3; // Validating, and last result is invalid
const VALIDATED_TRUE = 4; // Validating, and last result is valid

const VALIDATION_DEBOUNCE_TIMEOUT = 10;
const MARK_VALIDITY_TIMEOUT = 150;
// Reject the Promise if it does not produce a result in the specified time
const timeout = (prom, time, exception) => {
    let timer;

    if (typeof Promise.race === 'function') {
        return Promise.race([
            prom,
            new Promise((resolve, reject) => {
                timer = setTimeout(reject, time, exception);
            })
        ]).finally(() => clearTimeout(timer));
    }

    // MB case. They have their own Promise object (I have no idea why).
    return prom;
};

PTCS.BehaviorValidate = superClass => {
    return class extends superClass {
        static get properties() {
            return {
                // External (server side) validation
                externalValidity: {
                    type:     String,
                    observer: '_markValidity'
                },

                // undefined | 'unvalidated' | 'invalid' | 'valid' (reflects the visual validation state)
                validity: {
                    type:     String,
                    observer: '__validityChanged',
                    notify:   true
                },

                // This counter is incremented when there has been *some* sort of change in the validity or in the message
                // format---a component can observe this property if it e.g. needs to adjust its height dynamically
                // when the message changes (e.g. ptcs-textarea)
                _validationChangeNo: {
                    type:  Number,
                    value: 0
                },

                // undefined | 'unvalidated' | 'invalid' | 'valid' (reflects the internal validation state)
                validationOutput: {
                    type:   String,
                    notify: true
                },

                // Allow component to disable validation (stay in unvalidated mode)
                _stayUnvalidated: {
                    type:     Boolean,
                    observer: '_markValidity'
                },

                //
                // Properties that controls the validation message
                //

                // Icon for success state (valid). Default: cds:icon_success
                validationSuccessIcon: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // Icon for error state (invalid). Default: cds:icon_error
                validationErrorIcon: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // Icon for criteria state (unvalidated). Default: cds:icon_info
                validationCriteriaIcon: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // The validation (title) message
                validationMessage: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // The validation success (title) message. Default: "Success"
                validationSuccessMessage: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // The validation details message
                validationCriteria: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // The validation success details message
                validationSuccessDetails: {
                    type:     String,
                    observer: '_messageFormatChanged'
                },

                // Don't show validation success state?
                hideValidationSuccess: {
                    type:     Boolean,
                    observer: '_messageFormatChanged'
                },

                // Don't show validation error state?
                hideValidationError: {
                    type:     Boolean,
                    observer: '_messageFormatChanged'
                },

                // Don't show validation criteria in unvalidated state?
                hideValidationCriteria: {
                    type:     Boolean,
                    observer: '_messageFormatChanged'
                },

                // The validation message component
                _validationMessageEl: Element,

                __validationPromiseController: {
                    type:  Object,
                    value: () => ({})
                },

                validationTimeout: {
                    type:  Number,
                    value: 10
                },

                _validationMessageResizeObserver: {
                    type: ResizeObserver
                }
            };
        }
        static get observers() {
            return [
                '_setValidityAttribute(validity, hideValidationSuccess, hideValidationError, hideValidationCriteria)'
                //'_messageFormatChanged(_externalMsgs.*)' --- not yet supported by Lit wrapper. Use manual bumps instead (for now)
            ];
        }
        constructor() {
            super();
            this._validatedProps = {};
            this._externalMsgs = {};
        }

        ready() {
            super.ready();

            this.__loadValidatedProperties();
            this.__attachValidationObservers();

            this._validationMessageResizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => {
                    this._noSpaceForMessage = this.offsetHeight < this.scrollHeight;
                });
            });
        }

        disconnectedCallback() {
            if (this._validationMessageEl) {
                this._validationMessageResizeObserver.unobserve(this._validationMessageEl);
            }

            super.disconnectedCallback();
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'validity') {
                return; // validity is read-only. Ignore any attribute changes
            }
            if (super.attributeChangedCallback) {
                super.attributeChangedCallback(name, oldValue, newValue);
            }
        }

        // The validity attribute should be hidden if the corresponding message type is hidden.
        // (An old design mistake that we have to live with)
        _setValidityAttribute(validity, hideValidationSuccess, hideValidationError, hideValidationCriteria) {
            if (validity && !this[hide[validity]]) {
                this.setAttribute('validity', validity);
            } else {
                this.removeAttribute('validity');
            }
        }

        // Show success / failure messages instead of info message
        enableValidationMessage(enable) {
            this._stayUnvalidated = (enable === false);
        }

        // Find and load the validated properties
        __loadValidatedProperties() {
            if (this.constructor.__validation) {
                return;
            }
            this.constructor.__validation = {};
            const stop = {};

            // Find all validated properties with validation function and arguments
            for (let el = this; el; el = Object.getPrototypeOf(el)) {
                const properties = el.constructor.properties;
                if (!properties) {
                    continue;
                }
                for (const propName in properties) {
                    const validate = properties[propName].validate;
                    if (typeof validate !== 'string') {
                        continue;
                    }
                    if (!stop[propName]) {
                        stop[propName] = validate;
                        this.__parseValidate(propName, validate);
                    } else if (stop[propName] !== validate) {
                        // Can only happen if the same property is defined by several behaviors
                        console.warn(`${this.tagName} declares duplicate validation functions for ${propName}`);
                    }
                }
            }

            // Find isValue functions, if any
            const argSet = new Set(); // Collect all arguments
            Object.values(this.constructor.__validation).forEach(call => call.args.forEach(arg => argSet.add(arg)));

            for (let el = this; el; el = Object.getPrototypeOf(el)) {
                const properties = el.constructor.properties;
                if (!properties) {
                    continue;
                }
                for (const propName in properties) {
                    if (argSet.has(propName) && typeof properties[propName].isValue === 'function') {
                        if (!this.constructor.__isValueMap) {
                            this.constructor.__isValueMap = {};
                        }
                        this.constructor.__isValueMap[propName] = properties[propName].isValue;
                    }
                }
            }
        }

        // validate must conform to: methodName '(' propName ( ',' propName )* ')'
        __parseValidate(propName, validate) {
            const argi = validate.indexOf('(');
            if (argi === -1) {
                return;
            }
            const argEnd = validate.indexOf(')', argi + 1);
            if (argEnd === -1) {
                return;
            }
            const method = validate.substring(0, argi).trim();
            const args = validate.substring(argi + 1, argEnd).trim().split(',').map(s => s.trim());
            console.assert(!this.constructor.__validation[propName]);
            this.constructor.__validation[propName] = {method, args};
        }

        __attachValidationObservers() {
            const set = new Set(); // Validation contraints poperties

            Object.keys(this.constructor.__validation).forEach(propName => {
                this._validatedProps[propName] = NOT_VALIDATED;

                // TODO?: Don't actually need to observe this property until we have a constraint on it
                this._createPropertyObserver(propName, () => this.__validationPropertyChanged(propName), false);

                this.constructor.__validation[propName].args.forEach(arg => set.add(arg));
            });

            // Create properties declarations for the validity constraints
            set.forEach(propName => {
                this._createPropertyObserver(propName, () => this.__validationConstraintChanged(propName), false);
            });

            // Get initial values
            this.__updateConstraints(set);
        }

        __validationPropertyChanged(propName) {
            if (this._validatedProps[propName] >= VALIDATED) {
                this._clearPropMsg(propName);
                this._updateValidity(propName);
            }
        }

        __validationConstraintChanged(propName) {
            if (this.__constraintChangedSet) {
                this.__constraintChangedSet.add(propName);
                return;
            }
            this.__constraintChangedSet = new Set([propName]);
            requestAnimationFrame(() => {
                const set = this.__constraintChangedSet;
                this.__constraintChangedSet = null;
                this.__updateConstraints(set);
            });
        }

        // Validate this property? (Do any of the validation argument enable validation?)
        __hasValidationArgs(propName) {
            const isValueMap = this.constructor.__isValueMap || {};
            const isValue = x => x !== undefined && x !== null && x !== '';

            return this.constructor.__validation[propName].args.some(arg => (isValueMap[arg] || isValue)(this[arg]));
        }

        __updateConstraints(set) {
            const validation = this.constructor.__validation;

            for (const propName in validation) {
                this._clearPropMsg(propName);

                // Affected?
                if (!validation[propName].args.some(arg => set.has(arg))) {
                    continue; // No arguments of this validation function has been changed
                }

                // Validate this property?
                if (this.__hasValidationArgs(propName)) {
                    this._validatedProps[propName] = VALIDATED;
                    this._updateValidity(propName);
                } else {
                    // No argument of this validation function enables validation
                    this._validatedProps[propName] = NOT_VALIDATED;
                }
            }

            this._markValidity();
        }

        _clearPropMsg(propName) {
            if (this._externalMsgs[propName]) {
                delete this._externalMsgs[propName];
                this._messageFormatChanged(); // Manual bump
            }
        }

        _getExternalMsgs(validity) {
            if (validity === Validity.INVALID && Object.keys(this._externalMsgs).length) {
                for (const propName in this._externalMsgs) {
                    return this._externalMsgs[propName];
                }
            }
            return [];
        }

        // Tests validity of property
        _updateValidity(propName) {
            if (this._validatedProps[propName] < VALIDATED) {
                this._markValidity();
                return; // This property should not (yet) be validated
            }

            const validateMethod = this.constructor.__validation[propName].method;
            if (typeof this[validateMethod] === 'function') {
                if (this.__validationPromiseController[validateMethod]) {
                    this.__validationPromiseController[validateMethod].ignore = true;
                    clearTimeout(this.__validationPromiseController[validateMethod].validationTimeoutId);
                }

                const validationPromiseController = this.__validationPromiseController[validateMethod] = {
                    ignore: false
                };

                this.__validationPromiseController[validateMethod].validationTimeoutId = setTimeout(() => {
                    if (!this.__hasValidationArgs(propName)) {
                        // All validation properties has been turned off
                        this._validatedProps[propName] = NOT_VALIDATED;
                        this._markValidity();
                        return;
                    }
                    this._validatedProps[propName] = VALIDATED;
                    this._markValidity();
                    const value = this[validateMethod](...this.constructor.__validation[propName].args.map(arg => this[arg]), this[propName]);

                    const timeoutError = Symbol();
                    timeout(Promise.resolve(value), this.validationTimeout * 1000, timeoutError)
                        .then(val => {
                            if (validationPromiseController.ignore) {
                                return;
                            }

                            switch (val) {
                                case true:
                                    this._validatedProps[propName] = VALIDATED_TRUE;
                                    break;
                                case false:
                                    this._validatedProps[propName] = VALIDATED_FALSE;
                                    break;
                                case undefined:
                                    // Assign to VALIDATED_IGNORE, but with no warning message
                                    this._validatedProps[propName] = VALIDATED_IGNORE;
                                    break;
                                default:
                                    if (Array.isArray(val)) {
                                        this._validatedProps[propName] = VALIDATED_FALSE;
                                        this._externalMsgs[propName] = val.filter(msg => msg);
                                        this._messageFormatChanged(); // Manual bump
                                    } else {
                                        this._validatedProps[propName] = VALIDATED_IGNORE;
                                        console.warn(`${validateMethod} on ${this.tagName} should return true | false | array | undefined`);
                                    }
                            }

                            this._markValidity();
                        })
                        .catch((e) => {
                            if (e === timeoutError) {
                                this._validatedProps[propName] = VALIDATED_FALSE;
                                console.warn(`${validateMethod} on ${this.tagName} failed on ${this.validationTimeout}s timeout`);
                            } else {
                                this._validatedProps[propName] = VALIDATED_IGNORE;
                                console.warn(`${validateMethod} on ${this.tagName} failed`, e);
                            }

                            this._markValidity();
                        });
                }, VALIDATION_DEBOUNCE_TIMEOUT);

                return;
            }

            console.warn(`${validateMethod} is not a method on ${this.tagName}`);

            this._validatedProps[propName] = VALIDATED_IGNORE;

            this._markValidity();
        }

        getValidity() {
            let valid = true; // true if every test succeeds

            // Handle external validity
            switch (this.externalValidity) {
                case Validity.INVALID:
                    return Validity.INVALID;
                case Validity.UNVALIDATED:
                    valid = false;
                    break;
                case Validity.VALID:
                    break;

                default: {
                    // No external validation. Any internal validation?
                    let _validating = false;
                    for (const propName in this._validatedProps) {
                        if (this._validatedProps[propName] !== NOT_VALIDATED && this._validatedProps[propName] !== VALIDATED_IGNORE) {
                            _validating = true;
                            break;
                        }
                    }
                    if (!_validating) {
                        // No validation for this component
                        return undefined;
                    }
                }
            }

            // Handle internal validity
            for (const propName in this._validatedProps) {
                switch (this._validatedProps[propName]) {
                    case VALIDATED: // Unknown validation result
                        valid = false;
                        break;
                    case VALIDATED_FALSE: // Failed validation
                        return Validity.INVALID;
                    case VALIDATED_TRUE:
                    case VALIDATED_IGNORE:
                    case NOT_VALIDATED:
                        if (this.externalValidity === 'valid') {
                            valid = true;
                        } else if (this.externalValidity === 'invalid') {
                            return Validity.INVALID;
                        }
                        break;
                }
            }

            return valid ? Validity.VALID : Validity.UNVALIDATED;
        }

        _markValidity() {
            if (this._refreshingValidity) {
                return;
            }
            this._refreshingValidity = true;
            setTimeout(() => {
                this._doMarkValidity();
                this._refreshingValidity = false;
            }, MARK_VALIDITY_TIMEOUT);
        }

        _doMarkValidity() {
            const validity = this.getValidity();
            this.validationOutput = validity;

            if (validity) {
                this.validity = this._stayUnvalidated ? Validity.UNVALIDATED : validity;
            } else {
                this.validity = undefined;
            }
        }

        _messageFormatChanged() {
            if (this.__updatingFormat) {
                return;
            }
            this.__updatingFormat = true;
            requestAnimationFrame(() => {
                this.__updatingFormat = undefined;
                this.__validityChanged(this.validity);
            });
        }

        __validityChanged(validity) {
            if (validity && this[hide[validity]]) {
                // in case of hidden message - behave as validation wasn't done at all
                // but keep the last validation value in case hide will be unchecked and we'll have to restore last value
                validity = undefined;
            }

            if (!this._validationMessageEl) {
                if (!validity) {
                    return; // Don't have a validation message - and don't need one
                }
                this._validationMessageEl = document.createElement('ptcs-validation-message');
                this._validationMessageEl.setAttribute('part', 'validation-message');

                if ('_delegatedFocus' in this) {
                    // The message element must be focusable or focus will be delegated to sub-element
                    // which makes it impossible for the user to select the message text
                    this._validationMessageEl.setAttribute('tabindex', '-1');
                }

                this._validationMessageResizeObserver.observe(this._validationMessageEl);
            }

            if (!validity) {
                if (this._validationMessageEl.parentNode) {
                    this._validationMessageEl.parentNode.removeChild(this._validationMessageEl);
                    // removing old messages, the dom-repeat (polymer) has a caching issue/bug on message ordering
                    // looks like a dom-repeat bug !!!!
                    this._validationMessageEl.messages = [];
                }
            } else {
                const messages = this._getExternalMsgs(validity);

                const select2 = (a, b) => a !== undefined ? a : b;

                const getMessages = (a, b) => {
                    const msg = select2(a, b);
                    return msg ? [msg, ...messages] : messages;
                };

                this._validationMessageEl.setProperties({
                    validity,
                    icon:     select2(this[iconCust[validity]], iconDflt[validity]),
                    label:    select2(this[labelCust[validity]], this[labelCust.unvalidated]),
                    messages: getMessages(this[details[validity]], this[details.unvalidated])
                });

                if (!this._validationMessageEl.parentNode) {
                    this._insertValidationMessage(this._validationMessageEl);
                }
            }

            this._validationChangeNo++;
        }

        setValidationMessageMaxWidth(maxWidth) {
            if (this._validationMessageEl) {
                this._validationMessageEl.style.maxWidth = `${maxWidth}px`;
            }
        }

        _insertValidationMessage(/*messageElement*/) {
            console.error(`${this.tagName} must implement _insertValidationMessage()`);
        }

        isValidationMessageEvent(ev) {
            return ev.composedPath().includes(this._validationMessageEl);
        }

        defaultInsertValidationMessageForVerticalLayout(messageElement, insertToEl) {
            const el = insertToEl ? insertToEl : this.shadowRoot;
            const prevHeight = this.offsetHeight;

            el.append(messageElement);

            if (this._forceAppendValidationMessage) {
                // Component wants the validation message to be appended only
                return;
            }

            requestAnimationFrame(() => {
                // If the height of the element has been increased after inserting a validation message it doesn't have a fixed height
                const hasFixedHeight = !(this.offsetHeight > prevHeight);

                // In case there is a fixed height, insert the message at the top
                if (hasFixedHeight) {
                    messageElement.remove();
                    el.prepend(messageElement);
                }

                this.style['overflow-y'] = 'auto';

                messageElement.setAttribute('pos', hasFixedHeight ? 'top' : 'bottom');
            });
        }

        _showCurrentValidity() {
            return this.validity && !this[hide[this.validity]];
        }
    };
};
