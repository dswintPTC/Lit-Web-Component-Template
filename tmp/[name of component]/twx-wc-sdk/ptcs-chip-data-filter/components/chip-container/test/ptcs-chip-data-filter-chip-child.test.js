import {fixture, expect} from '@open-wc/testing/index.js';
import {PTCS} from 'ptcs-library';

import '../ptcs-chip-data-filter-chip-child.js';

describe('<ptcs-chip-data-filter-chip-child>', () => {
    let chipChild;
    const shortLabel = 'Przemek';

    beforeEach(async() => {
        chipChild = await fixture('<ptcs-chip-data-filter-chip-child></ptcs-chip-data-filter-chip-child>');
        chipChild.content = shortLabel;
    });

    it('is correctly displayed without error attribute', done => {
        expect(chipChild.$.content.classList.contains('hand')).to.not.be.eql(true); // no ellipsis
        expect(chipChild.$.content.label).to.be.eql(shortLabel);
        done();
    });

    it('is hand displayed in case of the long label', async() => {
        //content max-width is needed for test (Normally these styles are found in "ptcs-base-theme")
        chipChild.shadowRoot.querySelector('[part="content"]').style['max-width'] = '238px';
        chipChild.content = 'very very very very very very very very very long label';

        await PTCS.wait(100);

        expect(chipChild.$.content.classList.contains('hand')).to.be.eql(true);
    });

    it('is event generated in case of removing', done => {
        const chipIdToBeSet = '5';
        chipChild.setAttribute('data-id', chipIdToBeSet);

        const clickHandler = event => {
            const triggerChip = event.composedPath()[0];
            const passedChipId = triggerChip.getAttribute('data-id');

            expect(passedChipId).to.be.eql(passedChipId);
            chipChild.removeEventListener('remove', clickHandler);
            done();
        };
        chipChild.addEventListener('remove', clickHandler);
        chipChild.$['cross-button'].click();
    });

    it('closeChip method', done => {
        const chipIdToBeSet = '5';
        chipChild.setAttribute('data-id', chipIdToBeSet);

        const clickHandler = event => {
            const triggerChip = event.composedPath()[0];
            expect(triggerChip.getAttribute('data-id')).to.be.eql(chipIdToBeSet);
            done();
        };
        chipChild.addEventListener('remove', clickHandler, {once: true});
        chipChild.closeChip();
    });
});
