import {PTCS} from 'ptcs-library/library.js';
import {DrawBase} from './ptcs-chart-draw-base';
import {removeChildren} from './ptcs-chart-draw-library';
import {select} from 'd3-selection';

/* eslint-disable no-confusing-arrow */

export class DrawBar extends DrawBase {
    constructor(seriesIx, data, allIxs, padding, showValues, valueFormat, zIndex) {
        super(seriesIx, data, allIxs, zIndex);
        this._padding = isNaN(padding) ? 0 : padding;
        this._showValues = showValues;
        this._valueFormat = valueFormat;
    }

    get chartType() {
        return 'bar';
    }

    eachY(cb) {
        if (!this._hidden) {
            cb(0); // Add zero for bar charts
            this._xixOrg.forEach(index => cb(this._data[index][1][this._seriesIx]));
        }
    }

    eachVisible(cb) {
        if (!this._hidden) {
            const data = this._data;
            this._xix.forEach(index => {
                const y = data[index][1][this._seriesIx];
                cb(data[index][0], y, index, this._seriesIx, Math.min(y, 0), Math.max(y, 0), this._index);
            });
        }
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

    _barFunctions(xScale, yScale) {
        const {barW, padding} = this.barSize(xScale);
        const barX = this._index * (barW + padding);

        const deltaY = yScale.bandwidth ? Math.max(yScale.bandwidth() / 2, 1) : 0;
        const _yScale = deltaY ? value => yScale(value) + deltaY : yScale;
        const data = this._data;

        const xPos = i => xScale(data[i][0]) + barX;
        const yPos = i => _yScale(data[i][1][this._seriesIx]);

        // eslint-disable-next-line no-confusing-arrow
        const depField = i => data[i][2] && data[i][2][this._seriesIx] ? data[i][2][this._seriesIx] : data[i][1][this._seriesIx];
        const yPos0 = _yScale(0);

        return {xPos, yPos, yPos0, barW, depField};
    }

    _createBarFunc(d, i) {
        const stateKey = this._seriesIx + 1;

        return () => {
            const barEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            barEl.setAttribute('part', 'bar');
            barEl.setAttribute('state-key', stateKey);

            return barEl;
        };
    }

    _drawBarFunc(xScale, yScale, flipAxes, selectionMgr, cb, showChartBands) {
        const {xPos, yPos, yPos0, barW, depField} = this._barFunctions(xScale, yScale);

        const legend = this._legend;
        const serieIx = this._seriesIx;
        const stateKey = this._seriesIx + 1;

        function setBar(valueIx) {
            this.setAttribute('legend', legend);
            this.setAttribute('state-key', stateKey);
            this._depfield = depField(valueIx);

            if (selectionMgr) {
                PTCS.setbattr(this, 'selected', selectionMgr.isSelected({valueIx, serieIx}));
            }
            if (cb) {
                cb.call(this, {valueIx, serieIx});
            }
        }

        // When chart gray bands are shown, we need to reserve 1px space on the bars for the white outline border.
        // showChartBands will be false if the vertical bar width/horizontal bar height is less than 6 px.
        // Show this border only if vertical bar dynamic height/horizontal bar dynamic width is greater than 2px otherwise they will not be visible.
        const outline = v => showChartBands && (v > 2);

        function drawVerticalBar(valueIx) {
            const y = yPos(valueIx);
            const barH = Math.abs(y - yPos0);

            this.setAttribute('x', xPos(valueIx) + (showChartBands ? 1 : 0));
            this.setAttribute('y', Math.min(y, yPos0) + (outline(barH) ? 1 : 0));
            this.setAttribute('width', barW - (showChartBands ? 2 : 0));
            this.setAttribute('height', barH - (outline(barH) ? 2 : 0));

            PTCS.setbattr(this, 'no-outline', showChartBands && !outline(barH));

            setBar.call(this, valueIx);
        }

        function drawHorizontalBar(valueIx) {
            const y = yPos(valueIx);
            const barH = Math.abs(y - yPos0);

            this.setAttribute('x', Math.min(y, yPos0) + (outline(barH) ? 1 : 0));
            this.setAttribute('y', xPos(valueIx) + (showChartBands ? 1 : 0));
            this.setAttribute('width', barH - (outline(barH) ? 2 : 0));
            this.setAttribute('height', barW - (showChartBands ? 2 : 0));

            PTCS.setbattr(this, 'no-outline', showChartBands && !outline(barH));

            setBar.call(this, valueIx);
        }

        return flipAxes ? drawHorizontalBar : drawVerticalBar;
    }


    draw({el, xScale, yScale, flipAxes, selectionMgr, showChartBands}) {
        const createBar = this._createBarFunc();
        const drawBar = this._drawBarFunc(xScale, yScale, flipAxes, selectionMgr, undefined, showChartBands);

        // Root element should only contain rect elements
        removeChildren(el, ':not(rect[part=bar])');

        const join = select(el)
            .selectAll('rect[part=bar]')
            .data(this._hidden ? [] : this._xix);

        join.enter()
            .append(createBar)
            .each(drawBar);

        join.each(drawBar);

        join.exit().remove();
    }

    updateSelection({el, selectionMgr}) {
        const serieIx = this._seriesIx;
        const selected = selectionMgr
            ? valueIx => selectionMgr.isSelected({valueIx, serieIx}) || null
            : false;

        select(el).selectAll('rect').data(this._hidden ? [] : this._xix).attr('selected', selected);
    }

    // Bar charts don't use markers
    drawMarkers({el}) {
        removeChildren(el);
    }

    updateMarkerSelection() {
        // Do nothing
    }


    drawValues({el, xScale, yScale, flipAxes, rotateValues, fit}) {
        const {xPos, yPos, yPos0, barW, depField} = this._barFunctions(xScale, yScale);
        const _xPos = i => xPos(i) + barW / 2;
        const _barW = barW + 6; // Add some pixels to adjust for label padding
        const legend = this._legend;
        const seriesIx = this._seriesIx;
        const stateKey = this._seriesIx + 1;
        const data = this._data;
        const formatValue = PTCS.formatValue(this._valueFormat);
        const value = index => formatValue(data[index][1][seriesIx]);
        const range = yScale.range();
        const reverse = range[0] > range[1];
        let tooWide = rotateValues; // Is any label too wide? (Check if values needs to be rotated)

        const selectTransform = () => {
            switch (this._showValues) {
                case 'outside':
                    if (flipAxes) {
                        return reverse
                            ? (x, y, w, h, f) => y < yPos0 ? f(y - w, x - h / 2) : f(yPos0 - w, x - h / 2)
                            : (x, y, w, h, f) => y < yPos0 ? f(yPos0, x - h / 2) : f(y, x - h / 2);
                    }
                    return reverse
                        ? (x, y, w, h, f) => y < yPos0 ? f(x - w / 2, y - h) : f(x - w / 2, y)
                        : (x, y, w, h, f) => y < yPos0 ? f(x - w / 2, y - h) : f(x - w / 2, yPos0 - h);

                case 'inside':
                    if (flipAxes) {
                        return reverse
                            ? (x, y, w, h, f) => y < yPos0 ? f(yPos0 - w, x - h / 2) : f(yPos0, x - h / 2)
                            : (x, y, w, h, f) => y < yPos0 ? f(yPos0 - w, x - h / 2) : f(yPos0, x - h / 2);
                    }
                    return reverse
                        ? (x, y, w, h, f) => y < yPos0 ? f(x - w / 2, yPos0 - h) : f(x - w / 2, yPos0)
                        : (x, y, w, h, f) => y < yPos0 ? f(x - w / 2, yPos0 - h) : f(x - w / 2, y - h);

                case 'inside-end':
                    if (flipAxes) {
                        return reverse
                            ? (x, y, w, h, f) => y < yPos0 ? f(Math.min(yPos0 - w, y), x - h / 2) : f(yPos0, x - h / 2)
                            : (x, y, w, h, f) => y < yPos0 ? f(yPos0 - w, x - h / 2) : f(Math.max(yPos0, y - w), x - h / 2);
                    }
                    return reverse
                        ? (x, y, w, h, f) => y < yPos0 ? f(x - w / 2, yPos0 - h) : f(x - w / 2, Math.max(yPos0, y - h))
                        : (x, y, w, h, f) => y < yPos0 ? f(x - w / 2, Math.min(yPos0 - h, y)) : f(x - w / 2, yPos0);
            }
            return null;
        };

        const transform = selectTransform();

        const newBars = [];

        function saveNewBar() {
            newBars.push(this);
        }

        const createValueEl = (d, i) => {
            const valueEl = document.createElement('ptcs-label');
            valueEl.setAttribute('part', 'value');
            valueEl.setAttribute('state-key', stateKey);
            valueEl.setAttribute('variant', 'label');
            valueEl.horizontalAlignment = 'center';

            return valueEl;
        };

        function testWidth() {
            if (!tooWide && this.clientWidth > _barW) { // Don't compute this.clientWidth if we already know some bar text is too wide
                tooWide = true;
            }
        }

        function drawValue(index) {
            const {clientWidth, clientHeight} = this;

            if ((flipAxes ? clientHeight : clientWidth) > _barW) {
                this.style.display = 'none'; // Hide value because it doesn't fit in bar
            } else {
                transform(_xPos(index), yPos(index), clientWidth, clientHeight, (x, y) => {
                    if (!fit || fit(x, y, clientWidth, clientHeight)) {
                        this.style.transform = `translate(${x}px,${y}px)`;
                    } else {
                        this.style.display = 'none'; // Hide value, because it collides with other value
                    }
                });
            }
        }

        el.removeAttribute('rotate-values');

        // Root element should only contain values
        removeChildren(el, ':not(ptcs-label[part=value])');

        const join = select(el)
            .selectAll('ptcs-label[part=value]')
            .data(transform && !this._hidden ? this._xix : []);

        join.enter()
            .append(createValueEl)
            .attr('legend', legend)
            .property('label', value)
            .property('_depfield', depField)
            .each(saveNewBar); // Need access to the new elements. This might not be the best way...

        join.style('display', '')
            .attr('legend', 'legend')
            .attr('state-key', stateKey)
            .property('label', value)
            .property('_depfield', depField);

        join.exit().remove();

        // The code below this comment forces CSS recalculations - so don't do it until all properties that affects the styling has been changed.
        //  Dramatic performance improvement.
        if (!flipAxes) {
            if (!tooWide) {
                for (let i = newBars.length - 1; i >= 0; i--) {
                    if (newBars[i].clientWidth > _barW) {
                        tooWide = true;
                        break;
                    }
                }

                if (!tooWide) {
                    join.each(testWidth); // Check pre-existing labels too
                }
            }


            // Rotate labels?
            if (tooWide) {
                el.setAttribute('rotate-values', '');
            }
        }

        if (newBars.length) {
            // Maybe there is a better (faster) way to do this?
            select(el).selectAll('ptcs-label[part=value]').data(transform && !this._hidden ? this._xix : []).each(drawValue);
        } else {
            join.each(drawValue);
        }
    }

    showSelection({el, xScale, yScale, flipAxes, selection, cb, showChartBands}) {
        const createBar = this._createBarFunc();
        const drawBar = this._drawBarFunc(xScale, yScale, flipAxes, undefined, cb, showChartBands);
        const xix = this._extractSelection(selection, xScale);

        // Root element should only contain rect elements
        removeChildren(el, ':not(rect)');

        const join = select(el)
            .selectAll('rect')
            .data(xix);

        join.enter()
            .append(createBar)
            .each(drawBar);

        join.each(drawBar);

        join.exit().remove();
    }
}
