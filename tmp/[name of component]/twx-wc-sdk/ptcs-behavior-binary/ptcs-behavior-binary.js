import {PTCS} from 'ptcs-library/library.js';

PTCS.BehaviorBinary = superClass => class extends superClass {

    static get properties() {
        return {
            checked: {
                type:               Boolean,
                value:              false,
                notify:             true,
                reflectToAttribute: true, // Polymer
                reflect:            true, // Lit
                observer:           '_checkedChanged',
                observeWhen:        'immediate',
                noAccessor:         true
            },

            state: {
                type:        Boolean,
                value:       false,
                observer:    '_stateChanged',
                observeWhen: 'immediate',
                noAccessor:  true
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true, // Polymer
                reflect:            true, // Lit
                value:              false
            },

            // The variable controlled by this checkbox control
            variable: {
                notify:      true,
                observer:    '_variableChanged',
                observeWhen: 'immediate',
                noAccessor:  true
            },

            // Value of variable that represents on mode
            valueOn: {
                attribute: 'value-on',
                value:     true
            },

            // Value of variable that represents off mode
            valueOff: {
                attribute: 'value-off',
                value:     false
            }
        };
    }

    _variableChanged(variable) {
        if (variable === this.valueOn) {
            if (!this.checked) {
                this.checked = true;
            }
        } else if (variable === this.valueOff) {
            if (this.checked) {
                this.checked = false;
            }
        } else {
            console.error('Checkbox value is unknown: ' + variable);
        }
    }

    _checkedChanged(checked) {
        this.variable = checked ? this.valueOn : this.valueOff;
        this.state = checked;
    }

    _stateChanged(state) {
        this.variable = state ? this.valueOn : this.valueOff;
        this.checked = state;
    }
};

