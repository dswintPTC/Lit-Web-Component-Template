import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import './ptcs-tooltip-overlay.js';

const _ptcsTooltipOverlay = 'ptcs-tooltip-overlay';

let _ptcsFocusPath = []; // Hover tree
let _ptcsFocusItem = null; // Current focus. Tooltip precedence
let _currTooltipEl = null; // Window that currently shows a tooltip
let _prevTooltipEl = null; // Last window that had focus

// Get tooltip element
export function getTooltipOverlayElem() {
    let el = document.getElementById(_ptcsTooltipOverlay);
    if (!el) {
        // Create the (one and only) tooltip element
        el = document.createElement(_ptcsTooltipOverlay);
        el.setAttribute('id', _ptcsTooltipOverlay);
        el.setAttribute('role', 'tooltip');
        el.setAttribute('aria-hidden', 'true');

        document.body.appendChild(el);

        // Hide tooltip if user presses Esc
        document.addEventListener('keydown', ev => {
            const key = ev.which || ev.keyCode;
            if (key === 27) {
                // eslint-disable-next-line no-use-before-define
                __hideTooltip();
            }
        });
    }
    return el;
}

// Get parent element - across shadow doms
function __parentOf(el) {
    return (el.nodeType === 11 && el.host) ? el.host : el.parentNode;
}

// Get the visible area of el
function __getVisibleArea(el) {
    let b = el.getBoundingClientRect();

    for (el = __parentOf(el); el; el = __parentOf(el)) {
        if (!el.getBoundingClientRect) {
            continue;
        }
        if (getComputedStyle(el).overflow === 'visible') {
            continue;
        }
        const b1 = el.getBoundingClientRect();
        b = {
            left:   Math.max(b.left, b1.left),
            right:  Math.min(b.right, b1.right),
            top:    Math.max(b.top, b1.top),
            bottom: Math.min(b.bottom, b1.bottom),
        };
    }

    return {top: b.top, left: b.left, width: b.right - b.left, height: b.bottom - b.top};
}

// Get the deepest hover tooltip
function __currTooltip() {
    for (let i = _ptcsFocusPath.length - 1; i >= 0; i--) {
        if (_ptcsFocusPath[i].tooltip && !_ptcsFocusPath[i].el.disableTooltip) {
            return _ptcsFocusPath[i];
        }
    }
    return null;
}

// Hide the tooltip window
function __hideTooltip() {
    if (_currTooltipEl) {
        _prevTooltipEl = _currTooltipEl;
        _currTooltipEl = null;
    }
    getTooltipOverlayElem().hide();
}

// Close tooltip element
export function closeTooltip() {
    __hideTooltip();
}
// Show tooltip window via timer. Abort if another request comes while waiting
let __reqItem = null;

function __showTooltip(switched, showAnyway = false, _delay = undefined) {
    const item = _ptcsFocusItem || __currTooltip();
    if (item === __reqItem) {
        return;
    }
    __reqItem = item;
    if (!item) {
        __hideTooltip();
        return;
    }
    if (_currTooltipEl === item.el && item.el.tooltipPos !== 'in') {
        return; // Already visible
    }

    const switchedFocus = (switched && item.el !== _prevTooltipEl && _currTooltipEl === null);
    const delayProp = switchedFocus ? '--ptcs-tooltip-start-delay' : '--ptcs-tooltip-next-delay';
    let delay = typeof _delay === 'number' ? _delay : parseInt(getComputedStyle(item.el).getPropertyValue(delayProp));
    if (isNaN(delay) && item.el.tooltipPos !== 'in') {
        delay = switchedFocus ? 750 : 100;
    }

    // Tooltip will be triggered from mouse hover (if hovering long enough)
    setTimeout(() => {
        if (item !== __reqItem) {
            return; // Superseeded by other request
        }
        const bv = __getVisibleArea(item.el);
        if (!showAnyway && (!(bv.width > 0) || !(bv.height > 0) || item.el.disableTooltip)) {
            // Element is not visible
            __hideTooltip();
            return;
        }
        _currTooltipEl = item.el;
        getTooltipOverlayElem().show(
            item.el,
            item.tooltip,
            {
                x:   bv.left,
                y:   bv.top,
                w:   bv.width,
                h:   bv.height,
                mx:  item.clientX,
                my:  item.clientY,
                arg: item.arg
            },
            showAnyway);
    }, delay);
}

// Find the deepest element with focus. If child, return it if it is a child of the focus element
function __getFocusEl(child) {
    if (!document.hasFocus()) {
        // Document may have an active element, but it is no longer in focus
        return null;
    }
    let el = document.activeElement;
    if (!el) {
        // No element has focus
        return null;
    }
    while (el.shadowRoot && el.shadowRoot.activeElement) {
        el = el.shadowRoot.activeElement;
    }
    if (child && (el.contains(child) || (el.shadowRoot && el.shadowRoot.contains(child)))) {
        return child.__disabledTooltipOnfocus ? null : child;
    }
    return el.__disabledTooltipOnfocus ? null : el;
}

// Focus has changed somewhere. See if we need a tooltip
let __setTooltipByFocus = false;
let __setFocusChild = null;

export function setTooltipByFocus(elChild) {
    if (arguments.length) {
        if (__setFocusChild === elChild) {
            // Already focusing on this child
            return;
        }
    }
    __setFocusChild = elChild;

    // Start timer, unless timer is already running
    // Note: this timer aggregates multiple calls
    if (__setTooltipByFocus) {
        return;
    }
    __setTooltipByFocus = true;
    requestAnimationFrame(() => {
        __setTooltipByFocus = false;

        // Check if focused element has a tooltip
        _ptcsFocusItem = null;
        for (let e = __getFocusEl(__setFocusChild); e; e = __parentOf(e)) {
            const el = PTCS.getFocusHiliteEl && PTCS.getFocusHiliteEl(e);
            if (!el || el.disableTooltip) {
                continue;
            }
            const tooltip = typeof el.tooltipFunc === 'function' ? el.tooltipFunc() : el.tooltip;
            if (tooltip) {
                _ptcsFocusItem = {el, tooltip};
                break;
            }
        }

        // Show focus tooltip or hover tooltip
        __showTooltip(true);
    });
}

// Element in focus with tooltip can be moving (e.g. slider)
export function updateTooltipInFocus(el) {
    __setFocusChild = null;
    __hideTooltip();
    setTooltipByFocus(el);
}

// Mouse enters element
function __enterEv(ev) {
    if (ev.stopImmediatePropagation) {
        ev.stopImmediatePropagation();
    }
    const el = ev.target;
    _ptcsFocusItem = null;
    let ancestor;

    // Fixing errors (occurs when page is changing dynamically like in datePicker or charts)
    while (_ptcsFocusPath.length > 0) {
        ancestor = _ptcsFocusPath[_ptcsFocusPath.length - 1].el;
        if (ancestor.contains(el)) {
            break;
        }
        if (ancestor.shadowRoot && ancestor.shadowRoot.contains(el)) {
            break;
        }
        _ptcsFocusPath.pop();
    }

    if (ancestor === el) {
        // We sometimes get two enter events without any leave event for the same element (?)
        // console.log('__enterEv: problem: ancestor === el: ', _ptcsFocusPath[_ptcsFocusPath.length - 1]);
        _ptcsFocusPath.pop();
    }

    const tooltip = ev.tooltip || (typeof el.tooltipFunc === 'function' ? el.tooltipFunc() : el.tooltip);
    const tArg = ev.tooltipArg;

    _ptcsFocusPath.push({el, tooltip, clientX: ev.clientX, clientY: ev.clientY, arg: tArg});

    //console.log('PATH: ' + JSON.stringify(_ptcsFocusPath.map(item => ({tagName: item.el.tagName, tooltip: item.tooltip}))));

    if (tooltip && !el.disableTooltip) {
        __showTooltip(_ptcsFocusPath.length <= 1, tArg ? !!tArg.showAnyway : false, tArg && tArg.delay);
    }
}

// Mouse leaves element
function __leaveEv(ev) {
    if (ev.stopImmediatePropagation) {
        ev.stopImmediatePropagation();
    }
    _ptcsFocusItem = null;
    const el = ev.target;
    //console.log('LEAVE: ' + el.tagName + ' IN ' + (el.parentNode ? el.parentNode.tagName : '#FRAGMENT'));

    if (_ptcsFocusPath.length > 0 && _ptcsFocusPath[_ptcsFocusPath.length - 1].el === el) {
        _ptcsFocusPath.pop();
    } else {
        // Fixing errors (occurs when page is changing dynamically like in datePicker or charts)
        const i = _ptcsFocusPath.findIndex(item => item.el === el);
        //console.log('__leaveEv: problem: i=' + i, i >= 0 ? _ptcsFocusPath[i] : '');
        if (i >= 0) {
            _ptcsFocusPath.splice(i, _ptcsFocusPath.length - i);
        } else {
            _ptcsFocusPath.length = 0; // DOM was changed and _ptcsFocusPath isn't relevant any more
        }
    }

    //console.log('PATH: ' + JSON.stringify(_ptcsFocusPath.map(item => ({tagName: item.el.tagName, tooltip: item.tooltip}))));

    // Reactivate ancestor tooltip or close tooltip
    __showTooltip(false);
}

// Only hover tooltip (no focus)
export function hoverTooltip(el, clientX, clientY, tooltip) {
    __hideTooltip();
    __enterEv({target: el, clientX, clientY, tooltip});
}

// behavior that uses the ptcs-tooltip-overlay
PTCS.BehaviorTooltip = superClass => {

    return class extends superClass {

        static get properties() {
            // Common properties for all widgets implementing tooltip behavior
            return {
                disableTooltip: {
                    type:      Boolean,
                    value:     false,
                    attribute: 'disable-tooltip'
                },

                tooltip: {
                    type: String
                },

                tooltipIcon: {
                    type: String
                },

                // To supply the component-determined tooltip dynamically
                tooltipFunc: {
                    type: Function
                }
            };
        }

        ready() {
            super.ready();
            this._trackHover(this);
        }

        // Track hover on el and show the tooltip for elHilite
        _trackHover(el) {
            el.addEventListener('mouseenter', __enterEv);
            el.addEventListener('mouseleave', __leaveEv);
        }

        _untrackHover(el) {
            el.removeEventListener('mouseenter', __enterEv);
            el.removeEventListener('mouseleave', __leaveEv);
        }

        // Implement manual hovering: enter
        _tooltipEnter(el, clientX, clientY, tooltip, arg) {
            __enterEv({target: el, clientX, clientY, tooltip, tooltipArg: arg});
        }

        // Implement manual hovering: leave
        _tooltipLeave(el) {
            __leaveEv({target: el});
        }

        // Close current tooltip
        _tooltipClose() {
            __hideTooltip();
        }

        disconnectedCallback() {
            this._tooltipClose();
            super.disconnectedCallback();
        }

        hideIfTooltipEqualsLabel() {
            if (!this.tooltip) {
                return '';
            }
            if (this.label !== this.tooltip) {
                return this.tooltip;
            }
            return '';
        }
    };
};
