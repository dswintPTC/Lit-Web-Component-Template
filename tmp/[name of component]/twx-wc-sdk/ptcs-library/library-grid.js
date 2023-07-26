// Grid function library

// Replace the operation tokens in string. Currently we support a certain set of TWX functions.
export function replaceOperationTokens(str, def, data) {
    const tokenRegex = /\{#[A-Za-z0-9-_:]+\}|&#44;/g;

    const calc = (op = 'min') => {
        if (!data && data.length === 0) {
            return null;
        }

        const items = [];
        // Get the items from the current projection
        for (let i = 0; i < data.length; i++) {
            items.push(data.item(i));
        }

        const isNumber = def.type.toUpperCase() === 'NUMBER' || def.type.toUpperCase() === 'INTEGER' || def.type.toUpperCase() === 'LONG';
        const isDate = def.type.toUpperCase() === 'DATETIME';

        const v = items[0].hasOwnProperty(def.name) ? item => item[def.name] : def.select;

        let res = v(items[0]);

        const calcAcc = (acc, curr, f) => {
            if (acc === undefined) {
                return curr;
            } else if (curr === undefined) {
                return acc;
            }

            return f(acc, curr);
        };

        if (op === 'min' && (isNumber || isDate)) {
            res = items.reduce(function(acc, curr) {
                return calcAcc(acc, v(curr), (a, b) => {
                    return def.compare(a, b) >= 0 ? b : a;
                });
            }, res);
        } else if (op === 'max' && (isNumber || isDate)) {
            res = items.reduce(function(acc, curr) {
                return calcAcc(acc, v(curr), (a, b) => {
                    return def.compare(a, b) >= 0 ? a : b;
                });
            }, res);
        } else if ((op === 'total' || op === 'average') && isNumber) {
            res = items.reduce(function(acc, curr) {
                return calcAcc(acc, v(curr), (a, b) => (a + b));
            }, undefined);

            if (op === 'average' && res !== undefined) {
                let count = items.filter(item => v(item) !== undefined).length;
                res /= count;
            }
        }

        if (def.config && def.config.format && typeof def.config.format === 'function') {
            // We have external formatting function for the item
            const resItem = {};
            resItem[def.name] = res;

            return def.config.format(resItem);
        }

        return def.format ? def.format(res) : res;
    };

    return str.replace(tokenRegex, (match, p1) => {
        switch (match) {
            case '{#stat_count}':
                return data ? data.length : 0;
            case '{#stat_min}':
                return calc('min');
            case '{#stat_max}':
                return calc('max');
            case '{#stat_total}':
                return calc('total');
            case '{#stat_average}':
                return calc('average');
            case '&#44;':
                return ',';
        }

        return match;
    });
}

// Replace the localization tokens in string. We don't have localization support in visual SDK so this method actualy does something only in MB
export function replaceLocalizationTokens(str) {
    if (!window.TW || !window.TW.Runtime || typeof window.TW.Runtime.convertLocalizableString !== 'function') {
        return str;
    }

    const tokenRegex = /\[\[[A-Za-z0-9-_:]+\]\]/g;

    return str.replace(tokenRegex, (match) => {
        let t = TW.Runtime.convertLocalizableString(match);

        if (!t || t === '???') {
            t = match;
        }

        return t;
    });
}
