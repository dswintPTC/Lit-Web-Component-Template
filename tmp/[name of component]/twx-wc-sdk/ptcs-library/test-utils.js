import {expect} from '@open-wc/testing/index.js';

export function checkTooltip(lines, notitle = false, {icons, colors} = {}) {
    const tEl = document.getElementById('ptcs-tooltip-overlay');
    expect(window.getComputedStyle(tEl).visibility).to.not.eql('hidden', 'tooltip should be visible');

    const tElRoot = document.getElementById('ptcs-tooltip-overlay').shadowRoot;

    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    if (!notitle) {
        const title = tElRoot.querySelector('[part=title]');
        expect(title.textContent).to.be.eql(lines[0]);
    }

    const textLines = tElRoot.querySelectorAll('[part=text]');
    for (let i = 0; i < textLines.length; i++) {
        let text = textLines[i].textContent;
        if (text.indexOf(' 00:00:00') !== -1) {
            text = text.substring(0, text.indexOf(' 00:00:00'));
        }
        expect(text).to.be.eql(lines[notitle ? i : i + 1]);
    }

    if (icons) {
        const ttIcons = tElRoot.querySelectorAll(`[part=${notitle ? 'text' : 'title'}-icon]`);
        expect(ttIcons.length).to.be.eql(icons.length);

        for (let i = 0; i < ttIcons.length; i++) {
            expect(ttIcons[i].icon).to.be.eql(icons[i]);
        }
    }

    if (colors) {
        const ttMarkers = tElRoot.querySelectorAll('[part=marker]');
        expect(ttMarkers.length).to.be.eql(colors.length);

        for (let i = 0; i < ttMarkers.length; i++) {
            expect(window.getComputedStyle(ttMarkers[i]).backgroundColor).to.be.eql(colors[i]);
        }
    }
}

export function getBaseURL(component) {
    return `/base/src/components/${component}`;
}
