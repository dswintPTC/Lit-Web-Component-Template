import {DrawBase} from './ptcs-chart-draw-base';
import {select} from 'd3-selection';
import {area, line} from 'd3-shape';
import {steps, removeChildren} from './ptcs-chart-draw-library';

export class DrawArea extends DrawBase {
    constructor(seriesIx, data, allIxs, curve, showLine, marker, markerSize, showValues, valueFormat, zIndex) {
        super(seriesIx, data, allIxs, zIndex);
        this._curve = curve;
        this._showLine = showLine;
        this._marker = marker;
        this._markerSize = markerSize;
        this._showValues = showValues;
        this._valueFormat = valueFormat;
    }

    get chartType() {
        return steps.has(this._curve) ? 'step' : 'area';
    }

    _drawArea(path, {el, xScale, yScale, flipAxes}) {
        const {xPos, yPos} = this._coordinates(xScale, yScale);

        // const y1Pos0 = this._getZeroPosOfScale(this.yScale, this.yType, this.yMin);
        const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
        const _yScale = deltaY ? value => yScale(value) + deltaY : yScale;
        const y1Pos0 = _yScale(0);

        const d3area = flipAxes
            ? area().x0(y1Pos0).x1(d => yPos(d)).y(d => xPos(d))
            : area().x(d => xPos(d)).y0(y1Pos0).y1(d => yPos(d));

        path.setAttribute('part', 'area');
        path.setAttribute('legend', this._legend);
        path.setAttribute('d', d3area.curve(this._curve)(this._xix));
    }

    _drawLine(path, {xScale, yScale, flipAxes}) {
        const {xPos, yPos} = this._coordinates(xScale, yScale);

        const d3line = flipAxes
            ? line().x(d => yPos(d)).y(d => xPos(d))
            : line().x(d => xPos(d)).y(d => yPos(d));

        path.setAttribute('part', 'line');
        path.setAttribute('legend', this._legend);
        path.setAttribute('d', d3line.curve(this._curve)(this._xix));
    }

    draw(options) {
        const that = this;
        const el = options.el;
        const drawActions = [];

        if (!this._hidden) {
            drawActions.push(this._drawArea);
            if (this._showLine) {
                drawActions.push(this._drawLine);
            }
        }

        function call(d) {
            d.call(that, this, options);
        }

        removeChildren(el, ':not(path)');

        const join = select(el)
            .selectAll('path')
            .data(drawActions);

        join.enter()
            .append('path')
            .each(call);

        join.each(call);

        join.exit().remove();
    }

    updateSelection() {
        // Do nothing
    }
}
