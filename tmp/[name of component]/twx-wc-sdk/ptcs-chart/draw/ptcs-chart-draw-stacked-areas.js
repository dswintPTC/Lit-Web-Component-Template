import {DrawStack} from './ptcs-chart-draw-stack';
import {select} from 'd3-selection';
import {area} from 'd3-shape';
import {drawMarkers, showValuesSet, drawValues, removeChildren} from './ptcs-chart-draw-library';

/* eslint-disable no-confusing-arrow */

export class DrawStackedAreas extends DrawStack {
    constructor(seriesIxs, data, method, order, curve, markers, showValues, formatValues, zIndex) {
        super(seriesIxs, data, method, order, zIndex);
        this._curve = curve;
        this._markers = markers;
        this._showValues = showValues;
        this._formatValues = formatValues;
    }

    get chartType() {
        return (this._method === 'silhouette' || this._method === 'wiggle') ? 'streamgraph' : 'stacked-areas';
    }

    draw({el, xScale, yScale, flipAxes}) {
        const deltaX = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        const _xScale = deltaX ? value => xScale(value) + deltaX : xScale;
        const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
        const _yScale = deltaY ? value => yScale(value) + deltaY : yScale;

        const data = this._data;

        const legend = d => `L${d.key + 1}`;

        const d3area = flipAxes
            ? area().x0(d => _yScale(d[0])).x1(d => _yScale(d[1])).y(d => _xScale(d.data[0])).curve(this._curve)
            : area().x(d => _xScale(d.data[0])).y0(d => _yScale(d[0])).y1(d => _yScale(d[1])).curve(this._curve);

        removeChildren(':not(path)');

        const join = select(el)
            .selectAll('path')
            .data(data);

        // Enter
        join.enter()
            .append('path')
            .attr('part', 'area')
            .attr('legend', legend)
            .attr('d', d3area);

        // Update
        join
            .attr('part', 'area')
            .attr('legend', legend)
            .attr('d', d3area);

        // Exit
        join.exit().remove();
    }

    updateSelection() {
        // Ignored. The selection operates on the markers
    }

    drawMarkers({el, xScale, yScale, flipAxes, selectionMgr}) {
        /*if (!Array.isArray(this._markers)) {
            // There are no markers for this drawable - remove all markers
            removeChildren(el);
            return;
        }*/

        const deltaX = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        const _xScale = deltaX ? value => xScale(value) + deltaX : xScale;
        const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
        const _yScale = deltaY ? value => yScale(value) + deltaY : yScale;
        const fullData = this._fullData;
        const map = this._mapValueIx.bind(this);

        const markers = this._markers;
        const xPos = d => _xScale(d.data[0]);
        const yPos = d => _yScale(d[1]);

        function drawSeriesMarkers(data, i) {
            const marker = markers[i][0];
            const markerSize = markers[i][1];
            const serieIx = data.key;
            const legend = `L${serieIx + 1}`;

            const d0 = data[0].data;
            const i0 = fullData.find(row => row.key === serieIx).findIndex(_d => _d.data === d0);
            const selected = selectionMgr
                ? (_, vix) => selectionMgr.isSelected({valueIx: map(i0 + vix), serieIx}) || null
                : false;

            const hasSel = selection => Array.isArray(selection)
                ? selection.some(s => s.serieIx === serieIx)
                : selection && selection.serieIx === serieIx;

            if ((!marker || marker === 'none') && hasSel(selectionMgr && selectionMgr.selection)) {
                // Only selected markers should be displayed
                drawMarkers({flipAxes, markerSize, xPos, yPos, legend,
                    el:       this,
                    marker:   'circle',
                    data:     selected ? data.filter(selected) : [],
                    selected: true});
            } else {
                drawMarkers({el: this, flipAxes, marker, markerSize, xPos, yPos, legend, data, selected});
            }
        }

        // Root element should only contain g.multi-marker
        removeChildren(el, ':not(g.multi-marker)');

        const join = select(el)
            .selectAll('g')
            .data(this._hidden ? [] : this._data);

        join.enter()
            .append('g')
            .attr('class', 'multi-marker')
            .each(drawSeriesMarkers);

        join.each(drawSeriesMarkers);

        join.exit().remove();
    }

    updateMarkerSelection(args) {
        // TODO: If markers are visible, then we only need to set the selected attribute
        this.drawMarkers(args); // Might need to add / remove markers - rewrite
    }

    drawValues({el, xScale, yScale, flipAxes, fit}) {
        if (this._hidden || !Array.isArray(this._showValues) || this._showValues.every(showValues => !showValuesSet.has(showValues))) {
            // Hide all values
            removeChildren(el);
            return;
        }

        const deltaX = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        const _xScale = deltaX ? value => xScale(value) + deltaX : xScale;
        const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
        const _yScale = deltaY ? value => yScale(value) + deltaY : yScale;
        const data = this._data;
        const xPos = d => _xScale(d.data[0]);
        const yPos = d => _yScale(d[1]);

        function drawSeriesValues([index, seriesIx, showValues, formatValue, marker, markerSize]) {
            const legend = `L${data[index].key + 1}`;
            const label = d => formatValue(d.data[1][seriesIx]);
            drawValues({el: this, data: data[index], label, legend, xPos, yPos, showValues, marker, markerSize, flipAxes, fit});
        }

        removeChildren(el, ':not(div.multi-value)');

        const ixs = this._six.reduce((a, seriesIx, index) => {
            const ix = this._seriesIxs.indexOf(seriesIx);
            if (showValuesSet.has(this._showValues[ix])) {
                a.push([index, seriesIx, this._showValues[ix], this._formatValues[ix], ...this._markers[ix]]);
            }
            return a;
        }, []);

        const join = select(el)
            .selectAll('div.multi-value')
            .data(ixs);

        join.enter()
            .append('div')
            .attr('class', 'multi-value')
            .each(drawSeriesValues);

        join.each(drawSeriesValues);

        join.exit().remove();
    }

    showSelection({el, xScale, yScale, flipAxes, selection, cb}) {
        const {data, sels} = this.extractSelection(xScale, selection);

        const deltaX = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        const _xScale = deltaX ? value => xScale(value) + deltaX : xScale;
        const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
        const _yScale = deltaY ? value => yScale(value) + deltaY : yScale;
        const xPos = d => _xScale(d.data[0]);
        const yPos = d => _yScale(d[1]);
        const legend = (_, i) => `L${sels[i].serieIx + 1}`;

        const marker = (this._marker && this._marker !== 'none') ? this._marker : 'circle';
        const markerSize = this._markerSize || 'medium';

        function cb2(d, i) {
            cb.call(this, sels[i]);
        }

        drawMarkers({el, flipAxes, marker, markerSize, xPos, yPos, legend, data, cb: cb && cb2});
    }
}
