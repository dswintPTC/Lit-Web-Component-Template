import {PTCS} from 'ptcs-library/library.js';

PTCS.BehaviorTabindex = superClass => {
    return class extends superClass {

        static get properties() {
            return {
                tabindex: {
                    type:  String,
                    value: '0'
                },
                noTabindex: {
                    type:      Boolean,
                    attribute: 'no-tabindex'
                }
            };

        }

        static get observers() {
            return [
                '__setTabindex(tabindex, noTabindex)'
            ];
        }

        __setTabindex(tabindex, noTabindex) {
            if (noTabindex || (noTabindex === undefined && tabindex === null)) {
                this.removeAttribute('tabindex');
            } else {
                this.setAttribute('tabindex', tabindex || '0');
            }
        }

    };
};

