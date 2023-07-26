import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';

PTCS.Hbar = class extends PolymerElement {
    static get is() {
        return 'ptcs-hbar';
    }

    static get properties() {
        return {
            // inline
            inline:
                {
                    type:     Boolean,
                    value:    false,
                    observer: '__inline'
                },

            // halign
            end:
                {
                    type:  Boolean,
                    value: false
                },

            center:
                {
                    type:  Boolean,
                    value: false
                },

            stretch:
                {
                    type:  Boolean,
                    value: false
                },

            spaceAround:
                {
                    type:  Boolean,
                    value: false
                },

            // valign
            top:
                {
                    type:  Boolean,
                    value: false
                },

            bottom:
                {
                    type:  Boolean,
                    value: false
                },

            xstretch:
                {
                    type:  Boolean,
                    value: false
                },

            // wrap
            wrap:
                {
                    type:     Boolean,
                    value:    false,
                    observer: '__wrap'
                }
        };
    }

    static get observers() {
        return [
            '__halign(center, end, stretch, spaceAround)',
            '__valign(top, bottom, xstretch)'
        ];
    }

    __inline(inline) {
        var s = this.style;

        s.display = inline ? 'inline-flex' : 'flex';
        s.flexDirection = 'row';
    }

    __halign(center, end, stretch, spaceAround) {
        let temp;
        if (spaceAround) {
            temp = 'space-around';
        } else if (stretch) {
            temp = 'space-between';
        } else if (end) {
            temp = 'flex-end';
        } else if (center) {
            temp = 'center';
        } else {
            temp = 'flex-start';
        }
        this.style.justifyContent = temp;
        //this.style.justifyContent = spaceAround ? 'space-around' : (stretch ? 'space-between' :
        //(end ? 'flex-end' : (center ? 'center' : 'flex-start')));
    }


    __valign(top, bottom, xstretch) {
        var s = this.style;
        let temp;
        if (xstretch) {
            temp = 'stretch';
        } else if (top) {
            temp = 'flex-start';
        } else if (bottom) {
            temp = 'flex-end';
        } else {
            temp = 'center';
        }
        s.alignItems = temp;
        //s.alignItems = xstretch ? 'stretch' : (top ? 'flex-start' : (bottom ? 'flex-end' : 'center'));

        // If there are multiple lines
        s.alignContent = temp;
        //s.alignContent = xstretch ? 'stretch' : (top ? 'flex-start' : (bottom ? 'flex-end' : 'center'));
    }

    __wrap(wrap) {
        this.style.flexWrap = wrap ? 'wrap' : 'nowrap';
    }
};

customElements.define(PTCS.Hbar.is, PTCS.Hbar);
