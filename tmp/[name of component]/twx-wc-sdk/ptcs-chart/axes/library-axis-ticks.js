import {PTCS} from 'ptcs-library/library.js';
import {timeSecond, timeMinute, timeHour, timeDay, timeMonth, timeWeek, timeYear} from 'd3-time';
import {timeFormat} from 'd3-time-format';
import {numberLabel} from 'ptcs-library/library-chart.js';
import moment from 'ptcs-moment/moment-import.js';


// Hack / polyfill to add the missing timeQuarter function
const timeQuarter = function(date) {
    return new Date(date.getFullYear(), 3 * Math.floor(date.getMonth() / 3), 1);
};

timeQuarter.count = (from, to) => {
    const first = 4 * from.getFullYear() + Math.ceil((1 + from.getMonth()) / 3);
    const last =  4 * to.getFullYear() + Math.floor(to.getMonth() / 3);
    return last - first + 1;
};

timeQuarter.every = num => {
    const ctor = quater => new Date(Math.floor(quater / 4), 3 * (quater % 4), 1, 0, 0, 0);
    const range = (from, to) => {
        const result = [];
        let quater = 4 * from.getFullYear() + Math.ceil((1 + from.getMonth()) / 3);
        let date = ctor(quater);
        while (date < to) {
            result.push(date);
            quater += num;
            date = ctor(quater);
        }
        return result;
    };
    return {range};
};

// Date formatters
const formatMillisecond = timeFormat('.%L');
const formatSecond = timeFormat(':%S');
const formatMinute = timeFormat('%I:%M');
const formatHour = timeFormat('%I %p');
const formatDay = timeFormat('%a %d');
const formatWeek = timeFormat('%b %d');
const formatMonth = timeFormat('%B');
const formatYear = timeFormat('%Y');

const formatDateDefault = date => {
    /* eslint-disable no-nested-ternary */
    return (timeSecond(date) < date ? formatMillisecond
        : timeMinute(date) < date ? formatSecond
            : timeHour(date) < date ? formatMinute
                : timeDay(date) < date ? formatHour
                    : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
                        : timeYear(date) < date ? formatMonth
                            : formatYear)(date);
    /* eslint-enable no-nested-ternary */
};

PTCS.formatDate = specifier => {
    return specifier
        ? date => moment(date).format(specifier)
        : formatDateDefault;
};


function countDecimals(format) {
    const decimalIx = format.lastIndexOf('.');
    if (decimalIx === -1) {
        return 0;
    }
    let i = decimalIx + 1;
    while ('0' <= format[i] && format[i] <= '9') {
        i++;
    }
    return i - decimalIx - 1;
}

PTCS.formatNumber = specifier => {
    // Special case for stacked values
    if (specifier === '#%') {
        return num => `${num}%`;
    }

    if (specifier) {
        const numDecimals = countDecimals(specifier);
        return typeof Number.prototype.format === 'function' ? num => num.format(specifier) : num => num.toFixed(numDecimals);
    }

    // No (or empty) specifier, use value as-is
    return numberLabel;
};


function minmax(scale) {
    const [a, b] = scale.domain();
    return a < b ? [a, b] : [b, a];
}

// Year [0], Quarter [1], Month [2], Week [3], Day [4], Hour [5], Minute [6], Second [7], Millisecond [8]
const dateFuncPrecision = [
    timeYear,
    timeQuarter,
    timeMonth,
    timeWeek,
    timeDay,
    timeHour,
    timeMinute,
    timeSecond
    // No filtering for milliseconds
];

const datePresetPrecision = {
    LT:   6,
    LTS:  7,
    L:    4,
    l:    4,
    LL:   4,
    ll:   4,
    LLL:  6,
    lll:  6,
    LLLL: 6,
    llll: 6
};

const dateFormatCharPrecison = {
    Q: 1,
    M: 2,
    w: 3,
    W: 3,
    D: 4,
    d: 4,
    e: 4,
    H: 5,
    h: 5,
    k: 5,
    m: 6,
    s: 7,
    S: 8,
    X: 8,
    x: 8
};

function getTimeFunc(format, scale, numTicks) {
    // Find the smallest timeFunc needed by the tick format
    let precision = datePresetPrecision[format] || -1; // Is this a preset format?
    if (precision === -1) {
        let escaped = false;
        for (let i = 0; i < format.length; i++) {
            if (escaped) {
                if (format[i] === ']') {
                    escaped = false;
                }
            } else if (format[i] === '[') {
                escaped = true;
            } else {
                precision = Math.max(dateFormatCharPrecison[format[i]] || 0, precision);
            }
        }
    }
    if (!dateFuncPrecision[precision]) {
        // Unrecognized format. Use default ticks
        return undefined;
    }

    // Use a bigger timeFunc if the selected timeFunc generates too many ticks
    const [min, max] = minmax(scale);

    while (precision >= 0) {
        const timeFunc = dateFuncPrecision[precision--];
        const count = timeFunc.count(min, max);
        if (count <= 5 * numTicks) {
            return timeFunc;
        }
    }
    return dateFuncPrecision[0];
}


function createDateTicks(scale, format, numTicks) {
    const timeFunc = getTimeFunc(format, scale, numTicks);
    if (scale._fixedNumTicks || !timeFunc) {
        return scale.ticks(numTicks);
    }
    const [min, max] = minmax(scale);
    const count = timeFunc.count(min, max);
    const num = Math.max(1, Math.floor(count / numTicks));
    const ticks = timeFunc.every(num).range(min, max.getTime() + 1);

    if (ticks.length === 0) {
        // Not a single possible tick occured on the axis: create a common tick for the whole axis
        ticks.push(new Date((min.getTime() + max.getTime()) / 2));
    }
    return ticks;
}


function createNumberTicks(scale, format, numTicks) {
    const ticks = scale.ticks(numTicks);

    // Hopefully no one will ask for 8 fractions or more...
    const numZeros = 8 - countDecimals(format);
    if (numZeros <= 0) {
        return ticks; // Someone asked for 8 fractions or more. Too high precision.
    }

    const filterByFormat = value => {
        const s = value.toFixed(8);
        for (let i = 1; i <= numZeros; i++) {
            if (s[s.length - i] !== '0') {
                return false;
            }
        }
        return true;
    };

    const result = scale._fixedNumTicks ? ticks : ticks.filter(filterByFormat);
    if (result.length === 0) {
        // Not a single possible tick occured on the axis: create a common tick for the whole axis
        const [min, max] = minmax(scale);
        result.push((min + max) / 2);
    }
    return result;
}

// Functions that generates ticks based on the clients axis format
const formattedTicks = {
    number: createNumberTicks,
    date:   createDateTicks
};

export function createTicks(scale, type, maxTicks, formatSpecifier) {
    const specialTicks = formatSpecifier && typeof formatSpecifier === 'string' && formattedTicks[type];
    const generateTicks = specialTicks
        ? num => specialTicks(scale, formatSpecifier, num)
        : num => scale.ticks(num);
    const ticks = generateTicks(maxTicks);
    const formatTick = scale._formatTick || (v => v);

    return ticks.map((value, index) => ({label: formatTick(value), value, offs: scale(value), index}));
}

// Generic formatter
PTCS.formatValue = specifier => {
    const fd = PTCS.formatDate(specifier);
    const fn = PTCS.formatNumber(specifier);

    return v => {
        if (v instanceof Date) {
            return fd(v);
        }
        return isNaN(v) ? v : fn(v);
    };
};
