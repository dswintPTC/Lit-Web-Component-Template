import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';

PTCS.Vbar = class extends PolymerElement {
    static get is() {
        return 'ptcs-vbar';
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

            // valign
            center:
                {
                    type:  Boolean,
                    value: false
                },

            bottom:
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

            // halign
            start:
                {
                    type:  Boolean,
                    value: false
                },

            end:
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
            '__valign(center, bottom, stretch, spaceAround)',
            '__halign(start, end, xstretch)'
        ];
    }

    __inline(inline) {
        var s = this.style;

        s.display = inline ? 'inline-flex' : 'flex';
        s.flexDirection = 'column';
    }


    __valign(center, bottom, stretch, spaceAround) {
        let temp;
        if (spaceAround) {
            temp = 'space-around';
        } else if (stretch) {
            temp = 'space-between';
        } else if (bottom) {
            temp = 'flex-end';
        } else if (center) {
            temp = 'center';
        } else {
            temp = 'flex-start';
        }
        this.style.justifyContent = temp;
        //this.style.justifyContent = spaceAround ? 'space-around' : (stretch ? 'space-between'
        //    : (bottom ? 'flex-end' : (center ? 'center' : 'flex-start')));
    }


    __halign(start, end, xstretch) {
        var s = this.style;

        let temp;
        if (xstretch) {
            temp = 'stretch';
        } else if (start) {
            temp = 'flex-start';
        } else if (end) {
            temp = 'flex-end';
        } else {
            temp = 'center';
        }
        s.alignItems = temp;
        //s.alignItems = xstretch ? 'stretch' : (start ? 'flex-start' : (end ? 'flex-end' : 'center'));

        // If there are multiple lines
        s.alignContent = temp;
        //s.alignContent = xstretch ? 'stretch' : (start ? 'flex-start' : (end ? 'flex-end' : 'center'));
    }


    __wrap(wrap) {
        this.style.flexWrap = wrap ? 'wrap' : 'nowrap';
    }
};

customElements.define(PTCS.Vbar.is, PTCS.Vbar);
