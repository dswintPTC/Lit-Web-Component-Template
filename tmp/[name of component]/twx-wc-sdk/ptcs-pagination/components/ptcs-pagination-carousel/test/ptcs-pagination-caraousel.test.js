/* eslint-disable no-unused-expressions */

import '../ptcs-pagination-carousel.js';
import {PTCS} from 'ptcs-library/library.js';

import {expect, fixture} from '@open-wc/testing/index.js';


describe('<ptcs-pagination-carousel>', () => {
    const ENABLED = false;
    const DISABLED = true;
    const TEN = 10;
    let slider, expectedButtonNumbers, expectedDotsHidden;

    function buttonsAreUpdated() {
        const buttonNodeList = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]:not([hidden])');

        return Promise.all(Array.from(buttonNodeList).map(button => button.updateComplete));
    }

    function areButtonValuesCorrect(refArray) {
        const buttonNodeList = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]:not([hidden])');
        if (buttonNodeList.length !== refArray.length) {
            return false;
        }

        for (let i = 0; i < buttonNodeList.length; ++i) {
            if (Number(buttonNodeList[i].label) !== Number(refArray[i])) {
                return false;
            }
        }
        return true;
    }

    function areArrowStateCorrect(isRefLetArrowDisabled, isRefRightArrowDisabled) {
        const isLeftArrowDisabled = slider.shadowRoot.querySelector('#left-arrow').hasAttribute('disabled');
        const isRightArrowDisabled = slider.shadowRoot.querySelector('#right-arrow').hasAttribute('disabled');

        return isLeftArrowDisabled === isRefLetArrowDisabled && isRightArrowDisabled === isRefRightArrowDisabled;
    }

    function areThreeDotsHidden() {
        return slider.shadowRoot.querySelector('#three-dots:not([hidden])') === null;
    }

    function checkCommonResponse() {
        expect(areArrowStateCorrect(ENABLED, ENABLED)).to.be.eql(true);
        expect(areButtonValuesCorrect(expectedButtonNumbers)).to.be.eql(true);
        expect(areThreeDotsHidden()).to.be.eql(expectedDotsHidden);
    }

    beforeEach(async() => {
        slider = await fixture('<ptcs-pagination-carousel></ptcs-pagination-carousel>');
    });

    it('one item', done => {
        const buttonNumber = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]').length;
        const disabledArrowsNumber = slider.shadowRoot.querySelectorAll('ptcs-button[disabled]').length;

        expect(buttonNumber).to.be.eql(1);
        expect(disabledArrowsNumber).to.be.eql(2);
        done();
    });

    it('two items', done => {
        slider.totalNumberOfPages = 2;
        PTCS.flush(() => {
            const buttonNumber = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]').length;
            const isLeftArrowDisabled = slider.shadowRoot.querySelector('#left-arrow').hasAttribute('disabled');
            const isRightArrowDisabled = slider.shadowRoot.querySelector('#right-arrow').hasAttribute('disabled');

            expect(buttonNumber).to.be.eql(2);
            expect(isLeftArrowDisabled).to.be.eql(true);
            expect(isRightArrowDisabled).to.be.eql(false);

            done();
        });
    });

    it('seven items, navigation back and forth', async function() {
        const SEVEN = 7;
        slider.totalNumberOfPages = SEVEN;
        await PTCS.wait();

        const buttonNumber = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]:not([hidden])').length;
        expectedButtonNumbers = [1, 2, 3, 4, 5, 6, 7];
        expectedDotsHidden = true;
        const rightArrow = slider.shadowRoot.querySelector('#right-arrow');

        expect(areArrowStateCorrect(DISABLED, ENABLED)).to.be.eql(true);
        expect(buttonNumber).to.be.eql(SEVEN);

        // navigate to the right
        for (let i = 2; i < SEVEN; ++i) {
            rightArrow.click();

            await buttonsAreUpdated();

            checkCommonResponse();
            expect(slider.currentPage).to.be.eql(i);
        }

        rightArrow.click();
        await buttonsAreUpdated();

        expect(areArrowStateCorrect(ENABLED, DISABLED)).to.be.eql(true);

        // navigate to the left
        const leftArrow = slider.shadowRoot.querySelector('#left-arrow');
        for (let i = SEVEN - 1; i > 1; --i) {
            leftArrow.click();
            await buttonsAreUpdated();

            checkCommonResponse();
            expect(slider.currentPage).to.be.eql(i);
        }

        leftArrow.click();
        await buttonsAreUpdated();

        expect(areArrowStateCorrect(DISABLED, ENABLED)).to.be.eql(true);
    });

    it('many items, navigation back & forth', async function() {
        slider.totalNumberOfPages = TEN;
        await PTCS.wait();
        expectedButtonNumbers = [1, 2, 3, 4, 5, 10]; // 1 2 3 4 5 ... 10
        expectedDotsHidden = false;

        expect(areArrowStateCorrect(DISABLED, ENABLED)).to.be.eql(true);
        expect(areButtonValuesCorrect(expectedButtonNumbers)).to.be.eql(true);
        expect(areThreeDotsHidden()).to.be.eql(expectedDotsHidden);

        const rightArrow = slider.shadowRoot.querySelector('#right-arrow');
        rightArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(2);

        rightArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(3);

        rightArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(4);

        rightArrow.click();
        await buttonsAreUpdated();

        expectedButtonNumbers = [1, 5, 6, 7, 10];
        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(5);

        rightArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(6);

        rightArrow.click();
        await buttonsAreUpdated();

        expectedButtonNumbers = [1, 6, 7, 8, 9, 10];
        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(7);

        rightArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(8);

        rightArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(9);

        rightArrow.click();
        await buttonsAreUpdated();

        expectedButtonNumbers = [1, 6, 7, 8, 9, 10];
        expect(areButtonValuesCorrect(expectedButtonNumbers)).to.be.eql(true);
        expect(areArrowStateCorrect(ENABLED, DISABLED)).to.be.eql(true);
        expect(areThreeDotsHidden()).to.be.eql(expectedDotsHidden);
        expect(slider.currentPage).to.be.eql(10);

        const leftArrow = slider.shadowRoot.querySelector('#left-arrow');
        leftArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(9);

        leftArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(8);

        leftArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(7);

        leftArrow.click();

        await buttonsAreUpdated();

        expectedButtonNumbers = [1, 4, 5, 6, 10];
        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(6);

        leftArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(5);

        leftArrow.click();
        await buttonsAreUpdated();

        expectedButtonNumbers = [1, 2, 3, 4, 5, 10];
        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(4);

        leftArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(3);

        leftArrow.click();
        await buttonsAreUpdated();

        checkCommonResponse();
        expect(slider.currentPage).to.be.eql(2);

        leftArrow.click();
        await buttonsAreUpdated();

        expectedButtonNumbers = [1, 2, 3, 4, 5, 10];
        expect(areButtonValuesCorrect(expectedButtonNumbers)).to.be.eql(true);
        expect(areArrowStateCorrect(DISABLED, ENABLED)).to.be.eql(true);
        expect(areThreeDotsHidden()).to.be.eql(expectedDotsHidden);
        expect(slider.currentPage).to.be.eql(1);
    });

    it('direct page setting', done => {
        slider.totalNumberOfPages = TEN;
        PTCS.flush(() => {
            const SIX = 6;
            slider.currentPage = SIX;
            expectedButtonNumbers = [1, 6, 7, 8, 9, 10]; // 1 ... 6 7 8 9 10
            expectedDotsHidden = false;
            PTCS.flush(() => {
                checkCommonResponse();
                expect(slider.currentPage).to.be.eql(SIX);

                const NINE = 9;
                slider.currentPage = NINE;
                expectedButtonNumbers = [1, 6, 7, 8, 9, 10]; // 1 ... 6 7 8 9 10

                PTCS.flush(() => {
                    checkCommonResponse();
                    expect(slider.currentPage).to.be.eql(NINE);

                    // unhappy path; set a page outside the allowed range;
                    slider.currentPage = TEN + 1;
                    expect(slider.currentPage).to.be.eql(NINE);

                    // clicking on a button
                    const someButton = slider.shadowRoot.querySelector('ptcs-button[part="page-number-button"]:not([hidden])');
                    const someButtonLabelAsNumber = Number(someButton.getAttribute('data-label'));
                    someButton.click();
                    expect(slider.currentPage).to.be.eql(someButtonLabelAsNumber);

                    done();
                });
            });
        });
    });

    it('min size attribute', done => {
        slider.totalNumberOfPages = 6;
        PTCS.flush(() => {
            slider.minSize = true;
            PTCS.flush(() => {
                expect(areArrowStateCorrect(DISABLED, ENABLED)).to.be.eql(true);
                expect(areButtonValuesCorrect([1, 2, 6])).to.be.eql(true);
                expect(areThreeDotsHidden()).to.be.eql(false);
                expect(slider.currentPage).to.be.eql(1);

                const rightArrow = slider.shadowRoot.querySelector('#right-arrow');
                rightArrow.click();
                PTCS.flush(() => {
                    expect(areArrowStateCorrect(ENABLED, ENABLED)).to.be.eql(true);
                    expect(areButtonValuesCorrect([2, 3, 6])).to.be.eql(true);
                    expect(areThreeDotsHidden()).to.be.eql(false);
                    expect(slider.currentPage).to.be.eql(2);
                    rightArrow.click();
                    PTCS.flush(() => {
                        function checkCommonResponseWhenGoRight() {
                            expect(areArrowStateCorrect(ENABLED, ENABLED)).to.be.eql(true);
                            expect(areButtonValuesCorrect([3, 4, 5, 6])).to.be.eql(true);
                            expect(areThreeDotsHidden()).to.be.eql(true);
                        }
                        checkCommonResponseWhenGoRight();
                        expect(slider.currentPage).to.be.eql(3);
                        rightArrow.click();
                        PTCS.flush(() => {
                            checkCommonResponseWhenGoRight();
                            expect(slider.currentPage).to.be.eql(4);
                            rightArrow.click();
                            PTCS.flush(() => {
                                checkCommonResponseWhenGoRight();
                                expect(slider.currentPage).to.be.eql(5);
                                rightArrow.click();
                                PTCS.flush(() => {
                                    expect(areArrowStateCorrect(ENABLED, DISABLED)).to.be.eql(true);
                                    expect(areButtonValuesCorrect([1, 5, 6])).to.be.eql(true);
                                    expect(areThreeDotsHidden()).to.be.eql(false);
                                    expect(slider.currentPage).to.be.eql(6);

                                    const leftArrow = slider.shadowRoot.querySelector('#left-arrow');
                                    leftArrow.click();
                                    PTCS.flush(() => {
                                        expect(areArrowStateCorrect(ENABLED, ENABLED)).to.be.eql(true);
                                        expect(areButtonValuesCorrect([1, 4, 5])).to.be.eql(true);
                                        expect(areThreeDotsHidden()).to.be.eql(false);
                                        expect(slider.currentPage).to.be.eql(5);
                                        leftArrow.click();

                                        PTCS.flush(() => {
                                            function checkCommonResponseWhenGoLeft() {
                                                expect(areArrowStateCorrect(ENABLED, ENABLED)).to.be.eql(true);
                                                expect(areButtonValuesCorrect([1, 2, 3, 4])).to.be.eql(true);
                                                expect(areThreeDotsHidden()).to.be.eql(true);
                                            }
                                            checkCommonResponseWhenGoLeft();
                                            expect(slider.currentPage).to.be.eql(4);
                                            leftArrow.click();

                                            PTCS.flush(() => {
                                                checkCommonResponseWhenGoLeft();
                                                expect(slider.currentPage).to.be.eql(3);
                                                leftArrow.click();

                                                PTCS.flush(() => {
                                                    checkCommonResponseWhenGoLeft();
                                                    expect(slider.currentPage).to.be.eql(2);
                                                    leftArrow.click();

                                                    PTCS.flush(() => {
                                                        expect(areArrowStateCorrect(DISABLED, ENABLED)).to.be.eql(true);
                                                        expect(areButtonValuesCorrect([1, 2, 6])).to.be.eql(true);
                                                        expect(areThreeDotsHidden()).to.be.eql(false);
                                                        expect(slider.currentPage).to.be.eql(1);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('big numbers and button widths', done => {
        // Fewer buttons are shown when we have large numbers
        slider.totalNumberOfPages = 99999;
        slider.currentPage = 12340; // PageSize is 1 in the test
        PTCS.flush(() => {
            let buttonNumber = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]:not([hidden])').length;
            expect(buttonNumber).to.be.eql(4); // 1 ... 12339 12340 ... 99999
            slider.currentPage = 10000;
            PTCS.flush(() => {
                // Don't drop the target page number
                buttonNumber = slider.shadowRoot.querySelectorAll('ptcs-button[part="page-number-button"]:not([hidden])').length;
                expect(buttonNumber).to.be.eql(5); // 1 ... 10000 10001 10002 ... 99999
                done();
            });
        });
    });

    it('invalid totalnumberofpages fallback', done => {
        // Fewer buttons are shown when we have large numbers
        slider.totalNumberOfPages = 100;
        slider.currentPage = 50;
        PTCS.flush(() => {
            slider.totalNumberOfPages = 'xyzzy';
            PTCS.flush(() => {
                expect(slider.currentPage).to.be.eql(1);
                done();
            });
        });
    });

});
