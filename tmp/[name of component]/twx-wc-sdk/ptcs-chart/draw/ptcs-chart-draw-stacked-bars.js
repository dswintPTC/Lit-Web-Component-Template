import {PTCS} from 'ptcs-library/library.js';
import {DrawStack} from './ptcs-chart-draw-stack';
import {removeChildren} from './ptcs-chart-draw-library';
import {select} from 'd3-selection';

/* eslint-disable no-inner-declarations */

const showBarValuesSet = new Set(['outside', 'inside', 'inside-end']);

export class DrawStackedBars extends DrawStack {
    constructor(seriesIxs, data, method, order, padding, showValues, formatValues, zIndex, showSum) {
        super(seriesIxs, data, method, order, zIndex);
        this._padding = isNaN(padding) ? 0 : padding;
        this._showValues = showValues;
        this._formatValues = formatValues;
        this._showSum = showSum;
    }

    get chartType() {
        return 'stacked-bars';
    }

    setBand(index, numBands) {
        this._index = index;
        this._numBands = numBands;
    }

    setPadding(padding) {
        this._padding = padding;
    }

    barSize(xScale) {
        const bandwidth = xScale.bandwidth ? Math.max(xScale.bandwidth(), 1) : 0;
        const padding = (Math.min(Math.max(this._padding, 0), 80) / 100) * (bandwidth / this._numBands);
        const barW = Math.max((bandwidth - (this._numBands - 1) * padding) / this._numBands, 1);

        return {barW, padding};
    }

    _barPositons(xScale, yScale) {
        const {barW, padding} = this.barSize(xScale);

        const deltaX = this._index * (barW + padding);
        const xPos = deltaX ? value => xScale(value) + deltaX : xScale;
        const deltaY = yScale.bandwidth ? Math.max(yScale.bandwidth() / 2, 1) : 0;
        const yPos = deltaY ? value => yScale(value) + deltaY : yScale;

        return {xPos, yPos, barW: Math.max(barW, 1)};
    }

    _drawBarFunc(xScale, yScale, flipAxes, showChartBands) {
        const {xPos, yPos, barW} = this._barPositons(xScale, yScale);

        // When chart gray bands are shown, we need to reserve 1px space on the bars for the white outline border.
        // showChartBands will be false if the vertical bar width/horizontal bar height is less than 6 px.
        // Show this border only if vertical bar dynamic height/horizontal bar dynamic width is greater than 2px otherwise they will not be visible.
        const outline = v => showChartBands && (v > 2);

        function drawVerticalBar(d) {
            const x = xPos(d.data[0]);
            const y1 = yPos(d[0]);
            const y2 = yPos(d[1]);
            const barH = Math.max(1, Math.abs(y2 - y1));

            this.setAttribute('part', 'bar');
            this.setAttribute('x', x + (showChartBands ? 1 : 0));
            this.setAttribute('y', Math.min(y1, y2) + (outline(barH) ? 1 : 0));
            this.setAttribute('width', barW - (showChartBands ? 2 : 0));
            this.setAttribute('height', barH - (outline(barH) ? 2 : 0));

            PTCS.setbattr(this, 'no-outline', showChartBands && !outline(barH));
        }

        function drawHorizontalBar(d) {
            const x = xPos(d.data[0]);
            const y1 = yPos(d[0]);
            const y2 = yPos(d[1]);
            const barH = Math.max(1, Math.abs(y2 - y1));

            this.setAttribute('part', 'bar');
            this.setAttribute('x', Math.min(y1, y2) + (outline(barH) ? 1 : 0));
            this.setAttribute('y', x + (showChartBands ? 1 : 0));
            this.setAttribute('width', barH - (outline(barH) ? 2 : 0));
            this.setAttribute('height', barW - (showChartBands ? 2 : 0));

            PTCS.setbattr(this, 'no-outline', showChartBands && !outline(barH));
        }

        return flipAxes ? drawHorizontalBar : drawVerticalBar;
    }

    _drawBars(el, data, {xScale, yScale, flipAxes, selectionMgr, showChartBands}) {
        const drawBar = this._drawBarFunc(xScale, yScale, flipAxes, showChartBands);
        const serieIx = data.key;
        const legend = `L${serieIx + 1}`;

        // Find number of zoomed out items - via linear search :-(
        const d0 = data[0].data;
        const i0 = this._fullData.find(row => row.key === serieIx).findIndex(d => d.data === d0);

        const selected = (i0 >= 0 && selectionMgr)
            ? (_, i) => selectionMgr.isSelected({valueIx: this._mapValueIx(i + i0), serieIx}) || null
            : false;

        const join = select(el)
            .selectAll('rect')
            .data(data);

        join.enter()
            .append('rect')
            .attr('legend', legend)
            .attr('selected', selected)
            .each(drawBar);

        join.attr('legend', legend)
            .attr('selected', selected)
            .each(drawBar);

        join.exit().remove();
    }

    draw(options) {
        const that = this;

        function drawBars(d) {
            that._drawBars(this, d, options);
        }

        // Root element should only contain g elements
        removeChildren(options.el, ':not(g)');

        const join = select(options.el)
            .selectAll('g')
            .data(this._data);

        // Enter
        join.enter()
            .append('g')
            .each(drawBars);

        // Update
        join.each(drawBars);

        // Exit
        join.exit().remove();
    }

    updateSelection({el, selectionMgr}) {
        const fullData = this._fullData;
        const map = this._mapValueIx.bind(this);

        function updateSel(d) {
            const serieIx = d.key;

            // Find number of zoomed out items - via linear search :-(
            const d0 = d[0].data;
            const i0 = fullData.find(row => row.key === serieIx).findIndex(_d => _d.data === d0);

            const selected = (i0 >= 0 && selectionMgr)
                ? (_, i) => selectionMgr.isSelected({valueIx: map(i0 + i), serieIx}) || null
                : false;

            select(this).selectAll('rect').data(d).attr('selected', selected);
        }

        select(el).selectAll('g').data(this._data).each(updateSel);
    }

    showSelection({el, xScale, yScale, flipAxes, selection, cb, showChartBands}) {
        const {data, sels} = this.extractSelection(xScale, selection);

        const _drawBar = this._drawBarFunc(xScale, yScale, flipAxes, showChartBands);

        function drawBar(d, i) {
            _drawBar.call(this, d, i);
            this.setAttribute('legend', `L${sels[i].serieIx + 1}`);
            if (cb) {
                cb.call(this, sels[i]);
            }
        }

        removeChildren(el, ':not(rect)');

        const join = select(el)
            .selectAll('rect')
            .data(data);

        join.enter()
            .append('rect')
            .each(drawBar);

        join.each(drawBar);

        join.exit().remove();
    }


    // Bar charts don't use markers
    drawMarkers({el}) {
        removeChildren(el);
    }


    updateMarkerSelection() {
        // Do nothing
    }


    drawValues({el, xScale, yScale, flipAxes, rotateValues, fit}) {
        if (this._hidden || !Array.isArray(this._showValues) || this._showValues.every(showValues => !showBarValuesSet.has(showValues))) {
            // Hide all values
            removeChildren(el);
            return;
        }

        const {xPos, yPos, barW} = this._barPositons(xScale, yScale);
        const deltaX = barW / 2;
        const _x = d => xPos(d.data[0]) + deltaX;
        const data = this._data;

        // Are any bar values negative?
        const fNeg = this._showSum && this._six.length > 1 && data[0].some(d => {
            const ay = d.data[1];
            return this._six.some(ix => ay[ix] < 0);
        });

        // Compute sum of stacked values, if requested
        const sum = this._showSum && this._six.length > 1 && data[0].reduce((a, d) => {
            const ay = d.data[1];

            // [x-value, y-sum+ (= sum of all y >= 0)]
            a.push([d.data[0], this._six.reduce((s, ix) => s + Math.max(0, ay[ix]), 0)]);

            if (fNeg) {
                const sumNeg = this._six.reduce((s, ix) => s + Math.min(0, ay[ix]), 0);

                // [x-value, y-sum- (= sum of all y < 0) or negative zero]
                a.push([d.data[0], sumNeg < 0 ? sumNeg : -0]);
            }

            return a;
        }, []);

        // Collect series that should show values
        const _ixs = this._six.reduce((a, seriesIx, index) => {
            const ix = this._seriesIxs.indexOf(seriesIx);
            if (showBarValuesSet.has(this._showValues[ix])) {
                a.push([index, seriesIx, this._showValues[ix], this._formatValues[ix]]);
            }
            return a;
        }, []);

        const formatValueSum = _ixs[0] && _ixs[0][3]; // Use formatter of first bar to format summary value
        const ixs = sum ? [..._ixs, {sum}] : _ixs; // Add stacked summary values to the bar values (in its own weird format)

        el.removeAttribute('rotate-values');

        const asvel = []; // Array of series values element (all labels, per series)

        function setSeriesValues(series, ix) {
            // series = [index, seriesIx, showValues, formatValue]
            const legend = series.sum ? 'Lsum' : `L${data[series[0]].key + 1}`; // series[0] = index

            const label = series.sum
                ? d => formatValueSum(d[1])
                : d => series[3](d.data[1][series[1]]); // series[3] = formatValue, series[1] = seriesIx

            this.style.display = '';

            const a = [];

            function setValue(d, i) {
                this.setAttribute('legend', legend);
                this.label = label(d);
                this.style.display = '';
                a[i] = this;
            }

            const join = select(this)
                .selectAll('ptcs-label')
                .data(series.sum || data[series[0]]); // series[0] = index

            join.enter()
                .append('ptcs-label')
                .attr('part', 'value')
                .attr('variant', 'label')
                .property('horizontalAlignment', 'center')
                .each(setValue);

            join.each(setValue);

            join.exit().remove();

            asvel[ix] = a;
        }

        removeChildren(el, ':not(div.multi-bar-value)');

        // Map data to DOM
        const join1 = select(el)
            .selectAll('div.multi-bar-value')
            .data(ixs);

        join1.enter()
            .append('div')
            .attr('class', 'multi-bar-value')
            .each(setSeriesValues);

        join1.each(setSeriesValues);

        join1.exit().remove();

        // Check if bars are too narrow for the labels
        const alabel = asvel.find(a => a.length > 0);
        const label = alabel && alabel[0];
        const hideAll = !label || label.clientHeight > barW; // Works for both flipped and non-flipped axes
        el.__$hidden = hideAll; // Marker that the values don't need to be rotated if they are hidden (hack)

        if (hideAll) {
            select(el).selectAll('div.multi-bar-value').data(ixs).style('display', 'none');
            return;
        }

        // Do we need to rotate labels? (Is any label wider than the bar width in non-flipped mode?)
        const rotated = rotateValues || (!flipAxes && asvel.some(a => a.some(e => e.clientWidth > barW)));
        if (rotated) {
            el.setAttribute('rotate-values', '');
        }

        // Show values (or hide them if too big)
        const multiBar = this._six.length > 1;
        const range = yScale.range();
        const reverse = range[0] > range[1];

        const selectTransform = showValues => {
            switch (showValues) {
                case 'outside':
                    if (flipAxes) {
                        return reverse
                            ? (x, y0, y1, w, h, f) => f(y1 - w, x - h / 2)
                            : (x, y0, y1, w, h, f) => f(y1, x - h / 2);
                    }
                    return reverse
                        ? (x, y0, y1, w, h, f) => f(x - w / 2, y1)
                        : (x, y0, y1, w, h, f) => f(x - w / 2, y1 - h);

                case 'inside':
                    if (flipAxes) {
                        return reverse
                            ? (x, y0, y1, w, h, f) => f(y0 - w, x - h / 2)
                            : (x, y0, y1, w, h, f) => f(y0, x - h / 2);
                    }
                    return reverse
                        ? (x, y0, y1, w, h, f) => f(x - w / 2, y0)
                        : (x, y0, y1, w, h, f) => f(x - w / 2, y0 - h);

                case 'inside-end':
                    if (flipAxes) {
                        return reverse
                            ? (x, y0, y1, w, h, f) => f(Math.min(y0 - w, y1), x - h / 2)
                            : (x, y0, y1, w, h, f) => f(Math.max(y0, y1 - w), x - h / 2);
                    }
                    return reverse
                        ? (x, y0, y1, w, h, f) => f(x - w / 2, Math.max(y0, y1 - h))
                        : (x, y0, y1, w, h, f) => f(x - w / 2, Math.min(y0 - h, y1));
            }
            return null;
        };

        asvel.forEach((a, ix) => {
            const s = ixs[ix]; // [index, seriesIx, showValues, formatValue]

            if (s.sum) {
                // Sum of stacked values
                const transform = selectTransform('outside');

                a.forEach((e, i) => {
                    const d = s.sum[i];
                    const {clientWidth, clientHeight} = e;
                    const x0 = xPos(d[0]) + deltaX;
                    const y0 = yPos(d[1]) +
                       // Put negative summarization values at the "bottom" of the grouped bar
                       // eslint-disable-next-line no-nested-ternary, max-len
                       ((d[1] > 0 || Object.is(d[1], 0)) ? 0 : (flipAxes ? (reverse ? clientWidth : -clientWidth) : (reverse ? -clientHeight : clientHeight)));

                    transform(x0, y0, y0, clientWidth, clientHeight, (x, y) => {
                        if (!fit || fit(x, y, clientWidth, clientHeight)) {
                            e.style.transform = `translate(${x}px,${y}px)`;
                        } else {
                            e.style.display = 'none';
                        }
                    });
                });

            } else {
                // Individual bar values
                const ad = data[s[0]];
                const transform = selectTransform(s[2] === 'outside' && multiBar ? 'inside-end' : s[2]);

                a.forEach((e, i) => {
                    const d = ad[i];
                    const {clientWidth, clientHeight} = e;
                    const y0 = yPos(d[0]);
                    const y1 = yPos(d[1]);
                    const barH = Math.abs(y1 - y0);

                    if (clientWidth > (flipAxes ? barH : barW) || (clientHeight > (flipAxes ? barW : barH) && multiBar)) {
                        // Value doesn't fit in bar
                        e.style.display = 'none';
                    } else {
                        transform(_x(d), y0, y1, clientWidth, clientHeight, (x, y) => {
                            if (!fit || fit(x, y, clientWidth, clientHeight)) {
                                e.style.transform = `translate(${x}px,${y}px)`;
                            } else {
                                e.style.display = 'none';
                            }
                        });
                    }
                });
            }
        });
    }
}
