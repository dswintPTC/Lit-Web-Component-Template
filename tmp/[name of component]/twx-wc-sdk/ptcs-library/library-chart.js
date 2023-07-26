import {PTCS} from 'ptcs-library/library.js';

// Convert screen coordinate range to scale value range
export function invertScaleRange(scale, v1, v2) {
    if (scale.invert) {
        return [scale.invert(v1), scale.invert(v2)];
    }
    const domain = scale.domain();
    if (domain.length <= 1) {
        return [domain[0], domain[0]];
    }
    let a = scale(domain[0]);
    let b = scale(domain[1]);
    let min, max;

    if (a < b) {
        const d = (b - a);
        const p = d * scale.padding();
        min = Math.ceil((v1 - a + p) / d - 1);
        max = Math.floor((v2 - a) / d);
    } else {
        a = scale(domain[domain.length - 1]);
        b = scale(domain[domain.length - 2]);
        const d = (b - a);
        const p = d * scale.padding();
        max = domain.length - 1 - Math.ceil((v2 - a + p) / d - 1);
        min = domain.length - 1 - Math.floor((v1 - a) / d);
    }

    min = Math.max(Math.min(min, domain.length), 0);
    max = Math.max(Math.min(max, domain.length), min);

    return [domain[min], domain[max]];
}

// Convert screen coordinate to scale value
export function invertScalePoint(scale, v) {
    if (scale.invert) {
        return scale.invert(v);
    }
    const domain = scale.domain();
    if (domain.length <= 1) {
        return domain[0];
    }
    let a = scale(domain[0]);
    let b = scale(domain[1]);
    let min, max;

    if (a < b) {
        const d = (b - a);
        const p = d * scale.padding();
        min = Math.ceil((v - a + p) / d - 1);
        max = Math.floor((v - a) / d);
    } else {
        a = scale(domain[domain.length - 1]);
        b = scale(domain[domain.length - 2]);
        const d = (b - a);
        const p = d * scale.padding();
        max = domain.length - 1 - Math.ceil((v - a + p) / d - 1);
        min = domain.length - 1 - Math.floor((v - a) / d);
    }

    return domain[Math.max(Math.min(Math.round((min + max) / 2), domain.length - 1), 0)];
}


// Create a sample of an array: n = number of items to keep
export function sampleArray(a, n, compare) {
    // Uniform sampling based on indices
    function _sampleArray(length, sample, select) {
        const excess = (length - sample);
        if (excess <= 0) {
            throw Error(`Invalid sample: ${sample} out of ${length}`);
        }
        if (sample / excess > 1) {
            // Remove every d:th value
            const d = sample / excess;
            const f = i => Math.floor(i * (d + 1));
            let j = 0;
            for (let i = 0; i < sample; ++i) {
                const k = f(i);
                while (j++ < k) {
                    if (j <= length) {
                        select(j - 1);
                    }
                }
            }
        } else {
            // Keep every d:th value
            const d = excess / sample;
            const f = i => Math.floor(i * (d + 1));
            for (let i = 0; i < sample; ++i) {
                select(f(i));
            }
        }
    }

    const _a = [];
    if (!compare) {
        // No outlier detection
        _sampleArray(a.length, n, i => _a.push(a[i]));
        return _a;
    }

    // Make sure outliers are included in each chunk
    const delta = 2 * (a.length / n);
    let start = 0;
    let end = delta;
    const ai = [];

    // Where should index be inserted?
    function injectIx(index) {
        for (let i = 0; i < ai.length; i++) {
            if (ai[i] >= index) {
                if (i === 0) {
                    return 0;
                }
                return (index - ai[i - 1] < ai[i] - index) ? i - 1 : i;
            }
        }
        return ai.length - 1;
    }

    // Find min / max in chunk and swap them into the sample array
    function selectOutliers() {
        // Compute min and max
        let min = start;
        let max = start;
        const _end = Math.min(Math.floor(end), a.length);

        for (let i = start + 1; i < _end; i++) {
            if (compare(a[min], a[i]) > 0) {
                min = i;
            }
            if (compare(a[max], a[i]) < 0) {
                max = i;
            }
        }

        // Include min and max by replacing closest samples (index wise)
        if (min === max) {
            // This should be rare - all values in the range must be identical
            ai[injectIx(min)] = min; // Replacement shouldn't really be needed...
        } else {
            // Find index to the min and max values
            const minIx = injectIx(min);
            const maxIx = injectIx(max);

            if (minIx === maxIx) {
                // Both the maximum and the minimum values are mapped to the same index
                if (min < max) {
                    if (maxIx + 1 < ai.length) {
                        ai[minIx] = min;
                        ai[maxIx + 1] = max;
                    } else {
                        ai[minIx - 1] = min;
                        ai[maxIx] = max;
                    }
                } else if (minIx + 1 < ai.length) {
                    ai[minIx + 1] = min;
                    ai[maxIx] = max;
                } else {
                    ai[minIx] = min;
                    ai[maxIx - 1] = max;
                }
            } else {
                ai[minIx] = min;
                ai[maxIx] = max;
            }
        }

        // Collect the outlier corrected sample
        ai.forEach(i => _a.push(a[i]));

        // Prepare for next chunk
        start = _end;
        end += delta;
        ai.length = 0;
    }

    _sampleArray(a.length, n, i => {
        if (i >= end) {
            selectOutliers();
        }
        ai.push(i);
    });

    // Final chunk
    selectOutliers();

    return _a;
}

// Stabilize the maximum number of data points for a given x-range, to avoid flickering graphs
export function computeSampleSize(scale, sampleSize) {
    if (sampleSize !== '' && sampleSize !== null && sampleSize !== false && sampleSize >= 0) {
        return +sampleSize; // Explicit value
    }

    // Default sample size (dependent on length of scale)
    const [min, max] = (scale && scale.range) ? scale.range() : [0, 1000];
    const num = Math.abs(max - min) / 3;

    // Don't use more than 512 sample points (which is already a bit slow)
    return [64, 128, 256, 256 + 128, 256 + 128 + 64].find(v => v >= num) || 512;
}


// Alternative implementation of sampleArray
export function sampleArray2(a, n, compare) {
    // The requested sample size must be a number smaller than then size of a
    if (a.length <= n || !(n > 0)) {
        return a;
    }

    const _a = [];
    const length = a.length; // Number of data points
    const delta = 2 * (length / n); // Chunk size that contains at least two items (for min and max outliers)
    console.assert(delta > 2);

    let from = 0;

    // Sample data
    for (let i = 0; i < length; i += delta) {
        const to = Math.min(Math.floor(i + delta), length);

        if (to - from > 2) {
            // Select two items from the range [from, to)
            let [min, max] = compare(a[from], a[from + 1]) < 0 ? [from, from + 1] : [from + 1, from];

            for (let j = from + 2; j < to; j++) {
                if (compare(a[min], a[j]) > 0) {
                    min = j;
                } else if (compare(a[max], a[j]) < 0) {
                    max = j;
                }
            }

            //console.log(from + ' to ' + to + '(of ' + length + '): ' + Math.min(min, max) + ', ' + Math.max(min, max));

            // Now we have the indexes of the best outliers. Add them in correct order
            _a.push(a[Math.min(min, max)]);
            _a.push(a[Math.max(min, max)]);

            from = to;
        }
    }

    return _a;
}


// Convert value to a "type value", a numeric value that can be compared
// NaN is returned if the value is not of the type
export function typeValue(value, type, precision) {
    if (value === '' || value === null || value === undefined) {
        return NaN;
    }
    if (type === 'date') {
        return value instanceof Date ? value.getTime() : NaN;
    }
    if (type instanceof Array) {
        // eslint-disable-next-line eqeqeq
        let index = type.findIndex(s => s == value || s.label == value);
        if (index < 0) {
            // Multilevel string? (schedule chart?)
            const ix = value.indexOf ? value.indexOf(':$') : -1;
            if (ix > 0) {
                const value2 = value.substring(0, ix);
                index = type.findIndex(s => s === value2 || s.label === value2);
            }
        }

        return index >= 0 ? index : NaN;
    }
    value = +value;
    if (typeof precision !== 'number') {
        return value;
    }
    return value.toFixed ? value.toFixed(precision) : value;
}

// Do the zoom range span the full range (i.e. should reset button be disabled)?
export function typeIsFullRange(type, minValue, maxValue, zoomStart, zoomEnd) {
    const v1 = typeValue(minValue, type, 6);
    const v2 = typeValue(maxValue, type, 6);
    const z1 = typeValue(zoomStart, type, 6);
    const z2 = typeValue(zoomEnd, type, 6);
    return (isNaN(z1) || z1 === v1) && (isNaN(z2) || z2 === v2);
}

// Inversion of typeValue
// NaN is returned if the value isn't a number
export function invTypeValue(value, type) {
    if (typeof value !== 'number' || isNaN(value)) {
        return undefined;
    }
    if (type === 'date') {
        return new Date(value);
    }
    if (type instanceof Array) {
        const v = type[Math.max(0, Math.min(Math.round(value), type.length - 1))];
        return (v && v.label) || v; // Multilevel string? (schedule chart?)
    }
    return value;
}

// convert spec-min / spec-max value to number or NaN
export function axisSpec(spec) {
    if (spec === '' || spec === 'auto' || spec === undefined || spec === null || isNaN(spec)) {
        return NaN;
    }
    return +spec;
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

// compute the lower end of the chart axis
export function axisMin(min, max, type, spec, specMax) {
    // Labels?
    if (type instanceof Array) {
        if (typeof spec === 'string' && spec !== '') {
            if (type.find(item => item === spec)) {
                return spec;
            }
        }
        return min;
    }
    // Date?
    if (type === 'date') {
        if (!(spec instanceof Date)) {
            spec = new Date(spec);
        }

        if (min instanceof Date && max instanceof Date) {
            return new Date(axisMin(min.getTime(), max.getTime(), 'number', spec.getTime() || undefined));
        }

        if (isValidDate(spec)) {
            return spec;
        }
    }
    // Number
    if (spec === 'baseline' && min >= 0 && type === 'number') {
        return 0;
    }
    const _spec = axisSpec(spec);
    const _specMax = axisSpec(specMax);
    const _max = isNaN(_specMax) ? max : _specMax;
    return isNaN(_spec) ? min - Math.abs(_max - min) * 0.20 : _spec;
}

// compute the upper end of the chart axis
export function axisMax(min, max, type, spec, specMin) {
    // Labels?
    if (type instanceof Array) {
        if (typeof spec === 'string' && spec !== '') {
            if (type.find(item => item === spec)) {
                return spec;
            }
        }
        return max;
    }
    // Date?
    if (type === 'date') {
        if (!(spec instanceof Date)) {
            spec = new Date(spec);
        }

        if (min instanceof Date && max instanceof Date) {
            return new Date(axisMax(min.getTime(), max.getTime(), 'number', spec.getTime() || undefined));
        }

        if (isValidDate(spec)) {
            return spec;
        }
    }
    // Number
    const _spec = axisSpec(spec);
    const _specMin = axisSpec(specMin);
    const _min = isNaN(_specMin) ? min : _specMin;
    return isNaN(_spec) ? max + Math.abs(max - _min) * 0.20 : _spec;
}


// Compute the lower end of the chart axis for a bar chart type
// A bar chart contains bars that (by default) goes from the bar value to zero
export function axisBarMin(min, max, specMin, specMax) {
    // spec defaults to 'baseline' for bar charts
    if ((specMin === '' || specMin === undefined || specMin === null || specMin === 'baseline')) {
        if (min >= 0) {
            return 0; // The bars goes down to zero
        }
        if (max < 0 && (specMax === '' || specMax === undefined || specMax === null)) {
            max = 0; // The bars goes up to zero
        }
    }
    return axisMin(min, max, 'number', specMin, specMax);
}

// Compute the upper end of the chart axis for a bar chart type
// A bar chart contains bars that (by default) goes from the bar value to zero
export function axisBarMax(min, max, specMin, specMax) {
    // spec defaults to 'baseline' for bar charts
    if ((specMin === '' || specMin === undefined || specMin === null || specMin === 'baseline')) {
        if (min >= 0) {
            min = 0; // The bars goes down to zero
        }
        if (max < 0 && (specMax === '' || specMax === undefined || specMax === null)) {
            max = 0; // The bars goes up to zero
        }
    }
    return axisMax(min, max, 'number', specMax, specMin);
}


/*
 * Gets a tokenized string and returns an actual chart tooltip.
 * Tokens like ${<token_name>} are replaced using tokenValues object.
 * Some #<token_anme># tokens are predefined in the body of the function.
 * #<cond_name>#...#<cond_name># are conditional parts of the string and they are eliminated if conditions[cond_name] is false.
 */
export function getChartTooltip(str, tokenValues, conditions) {
    return PTCS.replaceStringTokens(str, tokenValues, conditions);
}

// Convert (only) numbers to strings, limiting the precision to 6 digits.
// The main reason for this function is to eliminate effects of IEEE-7454
// floating point converisons, which can add strange fraction residuals.
// Examples:
//  - numberLabel(1) = '1'
//  - numberLabel(1.23) = '1.23'
//  - numberLabel(1.0000000000023) = '1'
//
export function numberLabel(d) {
    if (typeof d !== 'number') {
        return d;
    }

    let r = `${d}`;
    const dpi = r.indexOf('.');
    if (dpi < 0 || dpi + 7 >= r.length) { // 7 = fraction + 6 digits
        return r;
    }

    // Number has more than 6 fraction digits
    if (r.charCodeAt(dpi + 7) >= 53) { // '5' === ASCII 53
        // Easiest way to handle rounding errors
        r = d.toFixed(6);
        console.assert(r[dpi] === '.');
    }

    let i = Math.min(r.length - 1, dpi + 6);
    while (r[i] === '0') {
        i--;
    }
    if (i === dpi) {
        return r.substr(0, dpi); // Can strip whole fraction
    }
    return i + 1 < r.length ? r.substr(0, i + 1) : r;
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
export function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false;
    }

    const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // Lines are parallel
    if (denominator === 0) {
        return false;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false;
    }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1);
    let y = y1 + ua * (y2 - y1);

    return {x, y};
}
