import {PTCS} from 'ptcs-library/library.js';
import moment from 'ptcs-moment/moment-import.js';

/* eslint-disable no-confusing-arrow */

const dateField = Symbol('date');
const formatField = Symbol('format');
const validRangeField = Symbol('valid');
const tolcField = Symbol('tolc');

// Add post-fix padding
const pad0 = n => n > 0 ? `0${pad0(n - 1)}` : '';
const padc = (n, c) => n > 0 ? `${c}${padc(n - 1, c)}` : '';

// Assign fields to date
function assign(date$, value) {
    return date$.set(this.unit, value);
}

function assignMonth(date$, value) {
    return date$.set('M', Number(value) - 1); // Month are assigned as 0 - 11
}

function assignDate(date$, value) {
    return date$.set('date', value);
}

function assignMeridiem(date$, value) {
    if (date$.format(this.f) !== value) {
        const dh = date$.hours() < 12 ? 12 : -12;
        date$.add(dh, 'h');
        if (date$.format(this.f) !== value) {
            date$.subtract(dh, 'h'); // Restore
        }
    }
    return date$;
}

// eslint-disable-next-line max-len
const re = /(YYYY|YY)|(Mo|M{1,4})|(Qo|Q)|(Do|D{1,2})|(DDDD|DDDo)|(d{1,4})|(wo|w{1,2})|(h{1,2})|(H{1,2})|(m{1,2})|(s{1,2})|(a)|(A)|(S{1,3})/g;

// Note: declarations must follow the order of the regular expression
const fields = [
    {f: 'YYYY', unit: 'y', sort: 1, assign},
    {f: 'MM', unit: 'M', sort: 4, assign: assignMonth},
    {f: 'Q', unit: 'Q', sort: 2, assign},
    {f: 'DD', unit: 'd', sort: 5, assign: assignDate},
    {f: 'DDDD', unit: 'd', sort: 5, assign: assignDate},
    {f: 'd', unit: 'd', sort: 5, assign},
    {f: 'ww', unit: 'w', sort: 3, assign},
    {f: 'hh', unit: 'h', sort: 6, assign},
    {f: 'HH', unit: 'h', sort: 6, assign},
    {f: 'mm', unit: 'm', sort: 7, assign},
    {f: 'ss', unit: 's', sort: 8, assign},
    {f: 'a', unit: 'h', num: 12, length: 2, sort: 10, assign: assignMeridiem},
    {f: 'A', unit: 'h', num: 12, length: 2, sort: 10, assign: assignMeridiem},
    {f: 'SSS', unit: 'ms', sort: 9, assign}
];

function length(field) {
    return field.length || field.f.length;
}

function daysOf(date$) {
    return [1, date$.isValid() ? Number(date$.endOf('month').format('D')) : 31];
}

function weeksOf(date$) {
    const d = date$.endOf('year');
    const w = d.format('w');
    // Sometimes the first week of a year starts in the previous year
    return [1, Number(w !== '1' ? w : d.subtract(1, 'w').format('w'))];
}

const domain = {
    Y: [0, 9999],
    M: [1, 12],
    Q: [1, 4],
    D: daysOf,
    d: [0, 6],
    w: weeksOf,
    H: [0, 23],
    h: [1, 12],
    m: [0, 59],
    s: [0, 59],
    S: [0, 999]
};

function domainOf(field, date$) {
    const d = domain[field.f[0]];
    if (!d) {
        return [-1, -1];
    }
    return Array.isArray(d) ? d : d(date$, field);
}

function fill(field, _, format) {
    switch (field.f) {
        case undefined:
            return field; // Is a separator string
        case 'a': case 'A':
            return moment('2021-12-10 09:00').format(field.f); // 'am' or 'AM'
        default:
            return padc(length(field), format.tolc ? field.f[0].toLowerCase() : field.f[0]);
    }
}

function decodeEditFormat(format) {
    const _format = moment.localeData().longDateFormat(format) || format;

    const a = [];
    const matches = _format.matchAll(re);
    let index = 0;

    for (const match of matches) {
        if (index < match.index) {
            a.push(_format.substring(index, match.index)); // Add separator
        }
        a.push(fields[match.findIndex((s, i) => s && i > 0) - 1]);
        index = match.index + match[0].length;
    }

    if (index < _format.length) {
        a.push(_format.substring(index)); // Ending separator
    }

    return a;
}

function editFormat(el) {
    const format = el[formatField] || '';
    const a = decodeEditFormat(format);
    a.tolc = el[tolcField];
    return a;
}

export function hintFormat(format) {
    return decodeEditFormat(format).map(fill).join('');
}

// Lowlevel find format region
function _formatRegion(format, index) {
    let p = 0;
    for (let i = 0; i < format.length; i++) {
        p += length(format[i]);
        if (index < p) {
            return {index: i, start: p - length(format[i]), end: p};
        }
    }

    return {index: 0, start: 0, end: length(format[0])};
}

// Find non-separator format region
function formatRegion(format, sel, key) {
    let {index, start, end} = _formatRegion(format, sel.selectionStart);

    const goLeft = () => {
        end -= length(format[index]);
        start -= length(format[--index]);
    };

    const goRight = () => {
        start += length(format[index]);
        end += length(format[++index]);
    };

    // Positioned on a separator?
    if (typeof format[index] === 'string') {
        if (key === 'ArrowLeft' && index > 0) {
            goLeft();
        } else if (key === 'ArrowRight' && index + 1 < format.length) {
            goRight();
        } else if (sel.selectionStart === start && index > 0) {
            goLeft();
        } else if (sel.selectionEnd === end && index + 1 < format.length) {
            goRight();
        } else if (index > 0) {
            goLeft();
        } else if (index + 1 < format.length) {
            goRight();
        }
    }

    return {index, start, end};
}

function decodeDate(format, date, text) {
    const values = [];
    let start = 0;
    for (let i = 0; i < format.length; i++) {
        const field = format[i];
        const end = start + length(field);
        if (field.hasOwnProperty('assign')) {
            values.push({field, value: text.substring(start, end)});
        }
        start = end;
    }

    const date$ = moment(date);
    values.sort((a, b) => a.field.sort - b.field.sort).forEach(item => {
        item.field.assign(date$, item.value);
    });
    return date$;
}

function isValid(format, date$, el) {
    const text = el.text;
    let start = 0;
    for (let i = 0; i < format.length; i++) {
        const field = format[i];
        const end = start + length(field);
        if (field.f) {
            const value = text.substring(start, end);
            if (value !== date$.format(field.f)) {
                return false;
            }
        }
        start = end;
    }
    return true;
}

// Try to add a digit ('0', ..., '9') to a date field.
function addDigit(date$, format, index, value, digit) {
    const field = format[index];
    const [min, max] = domainOf(field, date$);

    let v = value[0] === '0' ? `${value.substring(1)}${digit}` : `${pad0(length(field) - 1)}${digit}`;

    if (!(min <= v && v <= max)) {
        v = `${pad0(length(field) - 1)}${digit}`; // Restart value
        if (!(min <= v && v <= max)) {
            return false; // There is no way to add this digit to the date field
        }
    }

    // Is it possible to add another digit to this value?
    const more = v[0] === '0' && `${v.substring(1)}0`;

    return {value: v, complete: !(more && min <= more && more <= max)};
}

function onDragstart(ev) {
    ev.preventDefault();
}

function onFocus(ev) {
    const el = ev.target;
    requestAnimationFrame(() => {
        const {selectionStart, selectionEnd} = el;
        const format = editFormat(el);

        if (el[dateField]) {
            el.text = moment(el[dateField]).format(format.map(s => s.f || s).join(''));
        } else if (el.text === '') {
            el.text = format.map(fill).join('');
        }
        el.performUpdate();
        const {start, end} = formatRegion(format, {selectionStart, selectionEnd});

        // If no region has been selected, select first region
        if (selectionStart === selectionEnd) {
            if (typeof format[0] === 'string' && format.length > 1) {
                // When first region is a separator, skip it
                el.setSelectionRange(length(format[0]), length(format[0]) + length(format[1]));
            } else {
                el.setSelectionRange(0, length(format[0]));
            }
        } else {
            el.setSelectionRange(start, end);
        }
    });
}

function onTextChanged(ev) {
    if (ev.detail.value === '' && PTCS.hasFocus(ev.target)) {
        const el = ev.target;
        const format = editFormat(el);

        el[dateField] = undefined;
        el.text = format.map(fill).join('');

        const {start, end} = formatRegion(format, {selectionStart: 0, selectionEnd: 0});
        el.setSelectionRange(start, end);
    }
}

function onBlur(ev) {
    const el = ev.target;
    const format = editFormat(el);
    const date$ = decodeDate(format, el[dateField], el.text);

    if (isValid(format, date$, el)) {
        el[dateField] = date$.toDate();
        el.text = date$.format(el[formatField]);
    } else if (el.text === format.map(fill).join('')) {
        el.text = '';
    }
}

function onMouse(ev) {
    const el = ev.target;
    requestAnimationFrame(() => {
        const {start, end} = formatRegion(editFormat(el), el);
        el.setSelectionRange(start, end);
    });
}

function onKeydown(ev) {
    const el = ev.target;
    if (el.disabled) {
        return;
    }
    const key = ev.key;
    const format = editFormat(el);
    let {index, start, end} = formatRegion(format, el, key);

    const goLeft = () => {
        end -= length(format[index]);
        start -= length(format[--index]);
    };

    const goRight = () => {
        start += length(format[index]);
        end += length(format[++index]);
    };

    const goBackward = () => {
        if (index > 0) {
            goLeft();
            if (typeof format[index] === 'string') {
                if (index > 0) {
                    goLeft();
                } else {
                    goRight();
                }
            }
        }
    };

    const goForward = () => {
        if (index + 1 < format.length) {
            goRight();
            if (typeof format[index] === 'string') {
                if (index + 1 < format.length) {
                    goRight();
                } else {
                    goLeft();
                }
            }
        }
    };

    const stayHere = () => {
        el.setSelectionRange(start, end);
        ev.preventDefault();
    };

    // Inconsistent selection?
    if (!(start <= el.selectionStart && el.selectionEnd <= end)) {
        stayHere(); // Resync selection
        return;
    }

    const field = format[index];

    const change = (value, unit) => {
        const date$ = decodeDate(format, el[dateField], el.text);
        const valid = isValid(format, date$, el);
        if (valid) {
            const t = date$.add(value, unit).format(format[index].f);
            if (!(t.indexOf('NaN') >= 0) && t.length === length(field) && el[validRangeField](date$)) {
                el[dateField] = date$.toDate();
                el.text = date$.format(format.map(s => s.f || s).join(''));
            }
        } else {
            // No date loaded yet. Use todays date instead
            let t = field.assign(moment(), el.text.substring(start, end)).add(value, unit).format(field.f);
            if (t.indexOf('NaN') >= 0) {
                t = moment().add(value, unit).format(field.f);
            }
            if (!(t.indexOf('NaN') >= 0) && t.length === length(field)) {
                el.text = el.text.substring(0, start) + t + el.text.substring(end);
            }
        }
        el.performUpdate();
        stayHere();
    };

    switch (key) {
        case 'Home':
            if (index > 0) {
                index = 0;
                start = 0;
                end = length(format[0]);
                if (typeof format[index] === 'string' && index + 1 < format.length) {
                    goRight();
                }
            }
            stayHere();
            return;

        case 'End':
            if (index + 1 < format.length) {
                index = format.length - 1;
                end = format.reduce((a, s) => a + length(s), 0);
                start = end - length(format[index]);
                if (typeof format[index] === 'string' && index > 0) {
                    goLeft();
                }
            }
            stayHere();
            return;

        case 'ArrowLeft':
            goBackward();
            stayHere();
            return;

        case 'ArrowRight':
            goForward();
            stayHere();
            return;

        case 'ArrowUp':
            change(field.num || 1, field.unit);
            return;

        case 'ArrowDown':
            change(-(field.num || 1), field.unit);
            return;

        case 'Backspace':
        case 'Delete':
            el.text = el.text.substring(0, start) + padc(length(field), format.tolc ? field.f[0].toLowerCase() : field.f[0]) + el.text.substring(end);
            stayHere();
            return;

        default:
            if (key.length === 1) {

                // Not a numeric key pressed?
                if (!('0' <= key && key <= '9')) {

                    // AM / PM field?
                    if (field.f && field.f.toUpperCase() === 'A') {
                        const amLabel = moment('2021-12-10 09:00').format('A');
                        const pmLabel = moment('2021-12-10 21:00').format('A');
                        const ucKey = key.toUpperCase();
                        const currentMeridiem = el.text.substring(start, end);
                        // Accept any character unique to either AM or PM label to switch
                        if (currentMeridiem === pmLabel && (amLabel.includes(ucKey) && !pmLabel.includes(ucKey))) {
                            // PM -> AM
                            change(-(field.num), field.unit);
                        } else if (currentMeridiem === amLabel && (pmLabel.includes(ucKey) && !amLabel.includes(ucKey))) {
                            // AM -> PM
                            change(field.num, field.unit);
                        }
                    }

                    ev.preventDefault();
                    return;
                }

                const date$ = moment(el[dateField]);
                const r = addDigit(date$, format, index, el.text.substring(start, end), key);
                if (!r) {
                    ev.preventDefault();
                    return;
                }
                if (field.assign) {
                    field.assign(date$, r.value);
                }

                el.text = el.text.substring(0, start) + r.value + el.text.substring(end);
                if (isValid(format, date$, el)) {
                    el[dateField] = date$.toDate();
                    el.text = date$.format(format.map(s => s.f || s).join(''));
                }

                el.performUpdate();
                if (r.complete) {
                    goForward();
                }

                stayHere();
            }
    }
}

const eventHandlers = {
    keydown:        onKeydown,
    mousedown:      onMouse,
    mouseup:        onMouse,
    focus:          onFocus,
    blur:           onBlur,
    dragstart:      onDragstart,
    'text-changed': onTextChanged
};

export function setDate(el, date) {
    if (!el || !el[formatField]) {
        return;
    }

    el[dateField] = date instanceof Date ? date : undefined;
    if (el[dateField]) {
        el.text = moment(el[dateField]).format(el[formatField]);
    } else if (PTCS.hasFocus(el)) {
        el.text = editFormat(el).map(fill).join('');
    } else {
        el.text = '';
    }
}

export function getDate(el) {
    return el && el[dateField];
}

export function hasValidDate(el, required) {
    if (!el || !el[formatField]) {
        return !required;
    }
    if (!el[dateField]) {
        if (required) {
            return false;
        }
        return PTCS.hasFocus(el) ? el.text === editFormat(el).map(fill).join('') : el.text === '';
    }
    return el.text === moment(el[dateField]).format(el[formatField]);
}

export function enableDatePickerEditor(el, format, date, min, max, tolc) {
    console.assert(el);
    el.noAutoSelect = true;
    for (const eventName in eventHandlers) {
        el.removeEventListener(eventName, eventHandlers[eventName]); // Better safe than sorry
        el.addEventListener(eventName, eventHandlers[eventName]);
    }
    el[formatField] = format;
    el[tolcField] = tolc;
    el[validRangeField] = (min || max) ? date$ => (!min || date$.isSameOrAfter(min)) && (!max || date$.isSameOrBefore(max)) : () => true;
    setDate(el, date);
}

export function removeDatePickerEditor(el) {
    console.assert(el);
    el.noAutoSelect = undefined;
    for (const eventName in eventHandlers) {
        el.removeEventListener(eventName, eventHandlers[eventName]);
    }
    el[dateField] = el[formatField] = el[validRangeField] = undefined;
}
