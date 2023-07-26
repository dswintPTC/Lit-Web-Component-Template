/* eslint-disable no-unused-expressions */
import {fixture, expect} from '@open-wc/testing/index.js';
import {PTCS} from 'ptcs-library/library.js';
import moment from 'ptcs-moment/moment-import.js';

import 'ptcs-base-theme/ptcs-base-theme.js';

import '../ptcs-chip-data-filter-selector-dropdown.js';

const data = {
    dataShape: {
        fieldDefinitions: {
            TextBasedCategory: {
                name:     'textBasedCategory',
                baseType: 'STRING'
            },
            DateTimeBasedCategory: {
                name:     'dateTimeBasedCategory',
                baseType: 'DATETIME'
            },
            NumberBasedCategory: {
                name:     'numberBasedCategory',
                baseType: 'NUMBER'
            },
            IntegerBasedCategory: {
                name:     'integerBasedCategory',
                baseType: 'INTEGER'
            },
            BooleanBasedCategory: {
                name:     'booleanBasedCategory',
                baseType: 'BOOLEAN'
            },
            LocationBasedCategory: {
                name:     'locationBasedCategory',
                baseType: 'LOCATION'
            },
            DefaultBasedCategory: {
                name:     'defaultBasedCategory',
                baseType: 'XXX'
            },
            UnsupportedBasedCategory: {
                name:     'unsupportedBasedCategory',
                baseType: 'infotable'
            }
        }
    }
};

const columnFormat = JSON.stringify({
    TextBasedCategory: {
        name:     'textBasedCategory',
        baseType: 'STRING'
    },
    DateTimeBasedCategory: {
        name:     'dateTimeBasedCategory',
        baseType: 'DATETIME'
    },
    NumberBasedCategory: {
        name:     'numberBasedCategory',
        baseType: 'NUMBER'
    },
    IntegerBasedCategory: {
        name:            'integerBasedCategory',
        Title:           '[[integer]]',
        baseType:        'INTEGER',
        __showThisField: false
    },
    BooleanBasedCategory: {
        name:     'booleanBasedCategory',
        baseType: 'BOOLEAN'
    },
    LocationBasedCategory: {
        name:     'locationBasedCategory',
        baseType: 'LOCATION'
    },
    DefaultBasedCategory: {
        name:     'defaultBasedCategory',
        baseType: 'YYY'
    },
    UnsupportedBasedCategory: {
        name:     'unsupportedBasedCategory',
        baseType: 'infotable'
    }
});

const dataWithLocalization = {
    dataShape: {
        fieldDefinitions: {
            TextBasedCategory: {
                name:     'textBasedCategory',
                baseType: 'STRING'
            },
            DateTimeBasedCategory: {
                name:     'dateTimeBasedCategory',
                Title:    'tw.date',
                baseType: 'DATETIME'
            },
            NumberBasedCategory: {
                name:     'numberBasedCategory',
                baseType: 'NUMBER'
            },
            IntegerBasedCategory: {
                name:     'integerBasedCategory',
                Title:    '[[integer]]',
                baseType: 'INTEGER'
            },
            BooleanBasedCategory: {
                name:     'booleanBasedCategory',
                baseType: 'BOOLEAN'
            },
            LocationBasedCategory: {
                name:     'locationBasedCategory',
                baseType: 'LOCATION'
            },
            DefaultBasedCategory: {
                name:     'defaultBasedCategory',
                baseType: 'YYY'
            },
            UnsupportedBasedCategory: {
                name:     'unsupportedBasedCategory',
                baseType: 'infotable'
            }
        }
    }
};

function getDateQueryChip(type, fieldName, dataEnteredByUser) {
    let retObj = {fieldName: fieldName};
    const parseToTimestamp = (day) => Date.parse(day);

    switch (type) {
        case 'string':
        case 'number':
        case 'boolean':
            console.log ('Type ' + type + ' not supported yet');
            break;
        case 'datetime': {
            switch (dataEnteredByUser.operation) {
                case 'between':
                    retObj.type = 'BETWEEN';
                    retObj.from = parseToTimestamp(dataEnteredByUser.from);
                    retObj.to = parseToTimestamp(dataEnteredByUser.to);
                    break;
                case 'equals':
                    retObj.type = 'EQ';
                    retObj.value = parseToTimestamp(dataEnteredByUser.date);
                    break;
                case 'before':
                    retObj.type = 'LT';
                    retObj.value = parseToTimestamp(dataEnteredByUser.date);
                    break;
                case 'beforeEq':
                    retObj.type = 'LE';
                    retObj.value = parseToTimestamp(dataEnteredByUser.date);
                    break;
                case 'after':
                    retObj.type = 'GT';
                    retObj.value = parseToTimestamp(dataEnteredByUser.date);
                    break;
                case 'afterEq':
                    retObj.type = 'GE';
                    retObj.value = parseToTimestamp(dataEnteredByUser.date);
                    break;
                case 'notEq':
                    retObj.type = 'NE';
                    retObj.value = parseToTimestamp(dataEnteredByUser.date);
                    break;
                case 'within': {
                    const toDate = moment(); // current time
                    const fromDate = moment(toDate).add(-1 * dataEnteredByUser.value, dataEnteredByUser.units);

                    retObj.type = 'BETWEEN';
                    retObj.from = parseToTimestamp(fromDate);
                    retObj.to = parseToTimestamp(toDate);
                    break;
                }
            }
            break;
        }
        default:
            console.error('Unknown type: ' + type, dataEnteredByUser);
    }

    return retObj;
}

function findIndexForGivenType(refType, d) {
    let indexOfInterest;

    if (!d) {
        d = data;
    }

    Object.values(d.dataShape.fieldDefinitions).some((el, index) => {
        if (el.baseType.toLowerCase() === refType) {
            indexOfInterest = index;
            return true;
        }
        return false;
    });

    return indexOfInterest;
}

function findDataCategoryForGivenType(refType, d) {
    let dataCategory;

    if (!d) {
        d = data;
    }

    Object.values(d.dataShape.fieldDefinitions).some((el, index) => {
        if (el.baseType.toLowerCase() === refType) {
            dataCategory = el;
            return true;
        }
        return false;
    });

    return dataCategory;
}

function dataShapeDef(category, def) {
    let ds = {dataShape: {fieldDefinitions: {}}};
    ds.dataShape.fieldDefinitions[category] = def;
    return ds;
}

describe('<ptcs-chip-data-filter-selector-dropdown>-<text-case>', () => {
    const stringIndex = findIndexForGivenType('string');
    let textCompInStringCaseComp, textOperationsCompInStringCaseComp, stringCaseComp, selector, container, mainDropDown, applyButton;

    beforeEach(async() => {
        selector = await fixture(`
            <ptcs-chip-data-filter-selector-dropdown dictionary='{"stringBetween": "Between", "stringOutside": "Outside"}' tabindex="0">
            </ptcs-chip-data-filter-selector-dropdown>`
        );
        selector.sortFilters = false;
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        mainDropDown = selector.$['main-drop-down'];
        mainDropDown.selectedIndexes = [stringIndex];
        applyButton = selector.$['apply-button'];
        container = selector.$['container'];
        stringCaseComp = container.querySelector('#string-case');
        textOperationsCompInStringCaseComp = stringCaseComp.$['drop-down'];
        textCompInStringCaseComp = stringCaseComp.$['text-field'];
    });

    /* it('is saving handled properly & query generated correctly', done => {
        let expectedTextCaseData, expectedQuery;
        let queryObj = {
            filters: {
                type:    'And',
                filters: []
            }
        };

        const handler = event => {
            const passedData = event.detail.data;
            const dataOfInterest = passedData && passedData.length && passedData[passedData.length - 1];
            const dataEnteredByUser = dataOfInterest && dataOfInterest.dataEnteredByUser;
            const isError = dataOfInterest && dataOfInterest.isError;
            const selectorQuery = JSON.stringify(selector.query);

            expect(dataEnteredByUser).to.be.eql(expectedTextCaseData);
            expect(selectorQuery).to.be.eql(expectedQuery);
            expect(isError).to.be.eql(false);
            selector.removeEventListener('change', handler);
        };

        PTCS.flush(() => {
            const dataCategory = findDataCategoryForGivenType('string');
            expect(stringCaseComp.query).to.be.null;
            expectedTextCaseData = {operation: 'exact', value: 'Exact'};
            stringCaseComp.dataEnteredByUser = expectedTextCaseData; // this code replaces two lines below - just to validate this code as well
            //textCompInStringCaseComp.text = expectedTextCaseData.value;
            //textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
            queryObj.filters.filters.push({
                fieldName: dataCategory.name,
                type:      'EQ',
                value:     expectedTextCaseData.value
            });
            expectedQuery = JSON.stringify(queryObj);

            const enterPressEvent = new KeyboardEvent('keyup', {key: 'Enter'});
            selector.addEventListener('change', handler);
            textCompInStringCaseComp.dispatchEvent(enterPressEvent);
            // mainDropDown.selectedIndexes = [stringIndex];

            PTCS.flush(() => {
                expect(textCompInStringCaseComp.text).to.be.eql('');
                expectedTextCaseData = {operation: 'contains', value: 'Contains'};
                textCompInStringCaseComp.text = expectedTextCaseData.value;
                textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                queryObj.filters.filters.push({
                    fieldName: dataCategory.name,
                    type:      'LIKE',
                    value:     '*' + expectedTextCaseData.value + '*'
                });

                expectedQuery = JSON.stringify(queryObj);

                selector.addEventListener('change', handler);
                selector.$['apply-button'].click();
                mainDropDown.selectedIndexes = [stringIndex];

                PTCS.flush(() => {
                    expect(textCompInStringCaseComp.text).to.be.eql('');
                    expectedTextCaseData = {operation: 'startWith', value: 'Start'};
                    textCompInStringCaseComp.text = expectedTextCaseData.value;
                    textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                    queryObj.filters.filters.push({
                        fieldName: dataCategory.name,
                        type:      'LIKE',
                        value:     expectedTextCaseData.value + '*'
                    });
                    expectedQuery = JSON.stringify(queryObj);

                    selector.addEventListener('change', handler);
                    selector.$['apply-button'].click();
                    mainDropDown.selectedIndexes = [stringIndex];

                    PTCS.flush(() => {
                        expect(textCompInStringCaseComp.text).to.be.eql('');
                        expectedTextCaseData = {operation: 'endWith', value: 'End'};
                        textCompInStringCaseComp.text = expectedTextCaseData.value;
                        textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                        queryObj.filters.filters.push({
                            fieldName: dataCategory.name,
                            type:      'LIKE',
                            value:     '*' + expectedTextCaseData.value
                        });
                        expectedQuery = JSON.stringify(queryObj);

                        selector.addEventListener('change', handler);
                        selector.$['apply-button'].click();
                        mainDropDown.selectedIndexes = [stringIndex];

                        PTCS.flush(() => {
                            expect(textCompInStringCaseComp.text).to.be.eql('');
                            expectedTextCaseData = {operation: 'isNot', value: 'Is Not'};
                            textCompInStringCaseComp.text = expectedTextCaseData.value;
                            textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                            queryObj.filters.filters.push({
                                fieldName: dataCategory.name,
                                type:      'NOTLIKE',
                                value:     expectedTextCaseData.value
                            });
                            expectedQuery = JSON.stringify(queryObj);

                            selector.addEventListener('change', handler);
                            selector.$['apply-button'].click();
                            mainDropDown.selectedIndexes = [stringIndex];

                            PTCS.flush(() => {
                                expect(textCompInStringCaseComp.text).to.be.eql('');
                                expectedTextCaseData = {operation: 'notContains', value: 'not contains'};
                                textCompInStringCaseComp.text = expectedTextCaseData.value;
                                textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                                queryObj.filters.filters.push({
                                    fieldName: dataCategory.name,
                                    type:      'NOTLIKE',
                                    value:     '*' + expectedTextCaseData.value + '*'
                                });
                                expectedQuery = JSON.stringify(queryObj);

                                selector.addEventListener('change', handler);
                                selector.$['apply-button'].click();
                                mainDropDown.selectedIndexes = [stringIndex];

                                PTCS.flush(() => {
                                    expect(textCompInStringCaseComp.text).to.be.eql('');
                                    expectedTextCaseData = {operation: 'notStartWith', value: 'not start with'};
                                    textCompInStringCaseComp.text = expectedTextCaseData.value;
                                    textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                                    queryObj.filters.filters.push({
                                        fieldName: dataCategory.name,
                                        type:      'NOTLIKE',
                                        value:     expectedTextCaseData.value + '*'
                                    });
                                    expectedQuery = JSON.stringify(queryObj);

                                    selector.addEventListener('change', handler);
                                    selector.$['apply-button'].click();
                                    mainDropDown.selectedIndexes = [stringIndex];

                                    PTCS.flush(() => {
                                        expect(textCompInStringCaseComp.text).to.be.eql('');
                                        expectedTextCaseData = {operation: 'notEndWith', value: 'not ends with'};
                                        textCompInStringCaseComp.text = expectedTextCaseData.value;
                                        textOperationsCompInStringCaseComp.selectedValue = expectedTextCaseData.operation;
                                        queryObj.filters.filters.push({
                                            fieldName: dataCategory.name,
                                            type:      'NOTLIKE',
                                            value:     '*' + expectedTextCaseData.value
                                        });
                                        expectedQuery = JSON.stringify(queryObj);

                                        selector.addEventListener('change', handler);
                                        selector.$['apply-button'].click();
                                        mainDropDown.selectedIndexes = [stringIndex];

                                        PTCS.flush(() => {
                                            expect(textCompInStringCaseComp.text).to.be.eql('');
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
    }); */

    it('is setting non-existing operator', done => {
        let bInsideHandler = false;
        const handler = event => {
            bInsideHandler = true;
            selector.removeEventListener('change', handler);
        };

        PTCS.flush(() => {
            textCompInStringCaseComp.text = 'not important what to put here';
            textOperationsCompInStringCaseComp.selectedValue = 'nonExistingOperation';
            selector.addEventListener('change', handler);
            selector.$['apply-button'].click();

            // we don't expect handler will be fired since no filter change should occur
            expect(bInsideHandler).to.be.false;
            selector.removeEventListener('change', handler);
            mainDropDown.selectedIndexes = [stringIndex];

            PTCS.flush(() => {
                expect(textCompInStringCaseComp.text).to.be.eql('');
                stringCaseComp.dataEnteredByUser = null;
                expect(textCompInStringCaseComp.text).to.be.eql('');
                done();
            });
        });

    });

    it('does Apply button behave correctly', async() => {
        await applyButton.updateComplete;
        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);

        let textToBeInserted = 'an example text';
        textCompInStringCaseComp.text = textToBeInserted;
        await textCompInStringCaseComp.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);

        textCompInStringCaseComp.text = '';
        await textCompInStringCaseComp.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
    });
});

describe('<ptcs-chip-data-filter-selector-dropdown>-<text-select-case>', () => {
    let textSelectCompInStringCaseComp, stringCaseComp, selector, container, mainDropDown, applyButton;

    let selectOptions = 'val1:apples,val2:oranges,cotton candy grapes:cotton candy grapes';
    let textDropdownData = dataShapeDef('cat', {
        name:     'textSelect',
        baseType: 'STRING',
        aspects:  {selectOptions}
    });
    let textDropdownDataWithDefault = dataShapeDef('cat', {
        name:     'textSelect',
        baseType: 'STRING',
        aspects:  {selectOptions, defaultValue: 'val2'}
    });

    beforeEach(async() => {
        selector = await fixture(`
            <ptcs-chip-data-filter-selector-dropdown dictionary='{"stringBetween": "Between", "stringOutside": "Outside"}' tabindex="0">
            </ptcs-chip-data-filter-selector-dropdown>`
        );
    });

    let assertSelectVisible = () => {
        let textContainer = stringCaseComp.$['string-text-container'];
        let selectContainer = stringCaseComp.$['string-select-container'];
        expect(textContainer.hasAttribute('data-enabled')).to.be.eql(false);
        expect(selectContainer.hasAttribute('data-enabled')).to.be.eql(true);
    };

    let assertItems = () => {
        let items = textSelectCompInStringCaseComp.items;
        expect(items.length).to.be.eql(3);
        expect(items[0]).to.be.eql({val: 'val1', label: 'apples'});
        expect(items[1]).to.be.eql({val: 'val2', label: 'oranges'});
        expect(items[2]).to.be.eql({val: 'cotton candy grapes', label: 'cotton candy grapes'});
    };

    let assignData = _data => {
        selector.data = _data;
        mainDropDown = selector.$['main-drop-down'];
        mainDropDown.selectedIndexes = [0];
        applyButton = selector.$['apply-button'];
        container = selector.$['container'];
        stringCaseComp = container.querySelector('#string-case');
        textSelectCompInStringCaseComp = stringCaseComp.$['string-select-field'];
        assertSelectVisible();
    };

    it('parses and passes selectOptions displaying dropdown control', async() => {
        assignData(textDropdownData);
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
        expect(textSelectCompInStringCaseComp.selectedIndexes).to.be.eql([]);

        assertItems();
    });

    it('parses, passes selectOptions and applies default in dropdown', async() => {
        assignData(textDropdownDataWithDefault);
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);
        expect(textSelectCompInStringCaseComp.selectedIndexes).to.be.eql([1]);
        expect(stringCaseComp.getFormatted()).to.be.eql('is exactly: oranges');
        assertItems();
    });

    it('does Apply button behave correctly', async() => {
        assignData(textDropdownData);
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);

        textSelectCompInStringCaseComp.selectedIndexes = [0];
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);
    });

    it('handles dataEnteredByUser correctly', done => {
        assignData(textDropdownData);
        PTCS.flush(() => {
            stringCaseComp.dataEnteredByUser = {operation: 'And', value: 'val1'};
            PTCS.flush(() => {
                expect(stringCaseComp.__currentSelectionStringDropDown.val).to.be.eql('val1');
                done();
            });
        });
    });
});

describe('<ptcs-chip-data-filter-selector-dropdown>-<number-case>', () => {
    let selector, mainDropDown, applyButton, container;
    let numberCaseComp, numberDropDown, fromTextField, toTextField;
    let expectedDataContent, expectedDataIsError, expectedQuery;
    const handler = event => {
        const passedData = event.detail.data;
        const dataOfInterest = passedData && passedData.length && passedData[passedData.length - 1];
        const dataEnteredByUser = dataOfInterest && dataOfInterest.dataEnteredByUser;
        const isError = dataOfInterest && dataOfInterest.isError;
        const query = JSON.stringify(selector.query);

        expect(dataEnteredByUser).to.be.eql(expectedDataContent);
        expect(isError).to.be.eql(expectedDataIsError);
        expect(query).to.be.eql(expectedQuery);
        selector.removeEventListener('change', handler);
    };
    const numberIndex = findIndexForGivenType('integer');
    const dataCategory = findDataCategoryForGivenType('integer');

    function findIndexOfItemInDropDown(item) {
        let indexOfInterest;

        numberDropDown.items.some((el, index) => {
            if (el.name === item) {
                indexOfInterest = index;
                return true;
            }
            return false;
        });

        return indexOfInterest;
    }

    beforeEach(async() => {
        selector = await fixture(`
            <ptcs-chip-data-filter-selector-dropdown dictionary='{"stringBetween": "Between", "stringOutside": "Outside"}' tabindex="0">
            </ptcs-chip-data-filter-selector-dropdown>`
        );
        selector.sortFilters = false;
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        mainDropDown = selector.$['main-drop-down'];
        mainDropDown.selectedIndexes = [numberIndex]; // select the number type based filter option
        applyButton = selector.$['apply-button'];
        container = selector.$['container'];
        numberCaseComp = container.querySelector('#number-case');
        fromTextField = numberCaseComp.$['from-text-field'];
        toTextField = numberCaseComp.$['to-text-field'];
        numberDropDown = numberCaseComp.$['drop-down'];
    });

    it('is submenu populated correctly', done => {
        const desiredItemArray = ['=', '≠', '>', '<', '>=', '<=', 'Between', 'Outside'];

        PTCS.flush(() => {
            expect(numberDropDown.items.length).to.be.eql(desiredItemArray.length);
            for (const option of numberDropDown.items) {
                expect(desiredItemArray.indexOf(option.label) >= 0).to.be.true;
            }
            done();
        });
    });

    it('is saving handled properly & query generated correctly, single value', async() => {
        await PTCS.wait();
        // unhappy path
        let valToBeInserted = '';
        const dropDownItemSelection = '>';
        const dropDownItemSelectionIndex = findIndexOfItemInDropDown(dropDownItemSelection);
        expectedDataContent = {
            operation: dropDownItemSelection,
            value:     valToBeInserted
        };
        expectedDataIsError = true;
        expectedQuery = 'null';

        selector.addEventListener('change', handler);
        numberDropDown.selectedIndexes = []; // Force change event
        numberDropDown.selectedIndexes = [dropDownItemSelectionIndex];
        fromTextField.text = valToBeInserted;
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = []; // Force change event
        mainDropDown.selectedIndexes = [numberIndex];

        await PTCS.wait();
        expect(fromTextField.text).to.be.eql('');

        // happy path
        valToBeInserted = 90;
        expectedDataContent = {
            operation: dropDownItemSelection,
            value:     valToBeInserted
        };
        expectedDataIsError = false;
        expectedQuery = JSON.stringify({
            filters: {
                type:    'And',
                filters: [{
                    fieldName: dataCategory.name,
                    type:      'GT',
                    value:     valToBeInserted
                }]
            }
        });
        numberDropDown.selectedIndexes = []; // Force change event
        numberDropDown.selectedIndexes = [dropDownItemSelectionIndex];
        fromTextField.text = valToBeInserted;
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = []; // Force change event
        mainDropDown.selectedIndexes = [numberIndex];
        await PTCS.wait();
        expect(fromTextField.text).to.be.eql('');
    });

    it('is saving handled properly & query generated correctly, between case', done => {
        PTCS.flush(() => {
            let firstValToBeInserted = 90;
            let secondValToBeInserted = 10;
            const dropDownItemSelection = 'notBetween';
            const dropDownItemSelectionIndex = findIndexOfItemInDropDown(dropDownItemSelection);
            expectedDataContent = {
                operation: dropDownItemSelection,
                from:      firstValToBeInserted,
                to:        secondValToBeInserted
            };
            expectedDataIsError = false;
            expectedQuery = JSON.stringify({
                filters: {
                    type:    'And',
                    filters: [{
                        fieldName: dataCategory.name,
                        type:      'NOTBETWEEN',
                        from:      firstValToBeInserted,
                        to:        secondValToBeInserted
                    }]
                }
            });
            // positive case, correct data
            selector.addEventListener('change', handler);
            numberDropDown.selectedIndexes = []; // Force change event
            numberDropDown.selectedIndexes = [dropDownItemSelectionIndex];
            numberCaseComp.dataEnteredByUser = expectedDataContent;
            toTextField.text = secondValToBeInserted;

            const enterPressEvent = new KeyboardEvent('keyup', {key: 'Enter'});
            toTextField.dispatchEvent(enterPressEvent);
            mainDropDown.selectedIndexes = []; // Force change event
            mainDropDown.selectedIndexes = [numberIndex];

            PTCS.flush(() => {
                expect(fromTextField.text).to.be.eql('');
                expect(toTextField.text).to.be.eql('');

                done();
            });
        });
    });

    it('does Apply button behave correctly', async() => {
        await applyButton.updateComplete;
        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);

        const valToBeInserted = 92;
        fromTextField.text = '' + valToBeInserted;

        await fromTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);
        fromTextField.text = '';
        await fromTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
        fromTextField.text = '' + valToBeInserted;

        numberDropDown.selectedValue = 'between';
        await fromTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);

        toTextField.text = '' + valToBeInserted;
        await toTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);
        fromTextField.text = '';
        await fromTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
        toTextField.text = '';
        await toTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
        fromTextField.text = '' + valToBeInserted;
        await fromTextField.updateComplete;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);

        // back to the default selection
        numberDropDown.selectedIndexes = []; // Force change event
        numberDropDown.selectedIndexes = [0];
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);
    });

    it('test bad number conditions', done => {
        numberCaseComp.dataEnteredByUser = null;
        PTCS.flush(() => {
            expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
            numberCaseComp.dataEnteredByUser = {operation: ''};
            PTCS.flush(() => {
                expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                numberCaseComp.dataEnteredByUser = {operation: 'between'};
                PTCS.flush(() => {
                    expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                    numberCaseComp.dataEnteredByUser = {operation: '='};
                    PTCS.flush(() => {
                        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                        done();
                    });
                });
            });
        });
    });
});

describe('<ptcs-chip-data-filter-selector-dropdown>-<boolean-case>', () => {
    const booleanIndex = findIndexForGivenType('boolean');
    const dataCategory = findDataCategoryForGivenType('boolean');

    let selector, mainDropDown, booleanCaseComp, booleanDropdown, container;

    beforeEach(async() => {
        selector = await fixture(`
            <ptcs-chip-data-filter-selector-dropdown dictionary='{"stringTrue": "True", "stringFalse": "False"}' condition-label="Y/N" tabindex="0">
            </ptcs-chip-data-filter-selector-dropdown>`
        );
        selector.sortFilters = false;
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        mainDropDown = selector.$['main-drop-down'];
        mainDropDown.selectedIndexes = [booleanIndex]; // select the boolean  type based filter option
        container = selector.$['container'];
        booleanCaseComp = container.querySelector('#boolean-case');
        booleanDropdown = booleanCaseComp.$['drop-down'];
    });

    it('is saving handled correctly & query is generated correctly', done => {
        PTCS.flush(() => {
            let booleanSelection, expectedQuery, expectedData;
            const handler = event => {
                const passedData = event.detail.data;
                const dataOfInterest = passedData && passedData.length && passedData[passedData.length - 1];
                const dataEnteredByUser = dataOfInterest && dataOfInterest.dataEnteredByUser;
                const isError = dataOfInterest && dataOfInterest.isError;
                const selectorQuery = JSON.stringify(selector.query);

                expect(selectorQuery).to.be.eql(expectedQuery);
                expect(dataEnteredByUser).to.be.eql(expectedData);
                expect(isError).to.be.eql(false);
                selector.removeEventListener('change', handler);
            };

            // true & false choice
            selector.addEventListener('change', handler);

            booleanSelection = 'true';
            booleanCaseComp.dataEnteredByUser = booleanSelection;
            expectedData = booleanSelection;
            expectedQuery = JSON.stringify({
                filters: {
                    type:    'And',
                    filters: [{
                        fieldName: dataCategory.name,
                        type:      'EQ',
                        value:     booleanSelection
                    }]
                }
            });

            selector.$['apply-button'].click();
            mainDropDown.selectedIndexes = [booleanIndex];
            PTCS.flush(() => {
                expect(booleanDropdown.selectedValue).to.be.eql('true');

                // only false choice
                selector.addEventListener('change', handler);
                booleanSelection = 'false';
                booleanCaseComp.dataEnteredByUser = booleanSelection;
                expectedData = booleanSelection;
                expectedQuery = JSON.stringify({
                    filters: {
                        type:    'And',
                        filters: [{
                            fieldName: dataCategory.name,
                            type:      'EQ',
                            value:     'true'
                        }, {
                            fieldName: dataCategory.name,
                            type:      'EQ',
                            value:     booleanSelection
                        }]
                    }
                });

                selector.$['apply-button'].click();
                mainDropDown.selectedIndexes = [booleanIndex];
                PTCS.flush(() => {
                    // Coverage
                    expect(booleanCaseComp.queryFieldName()).to.be.eql('booleanBasedCategory');
                    expect(booleanCaseComp.getFormatted()).to.be.eql('True');
                    PTCS.flush(() => {
                        done();
                    });
                });
            });
        });
    });

    it('focusedElements', done => {
        selector.setAttribute('tabindex', '0');
        selector.mode = 'open';
        PTCS.flush(() => {
            const focusable = selector.focusableElements.map(el => el.getAttribute('id'));
            expect(focusable).to.be.eql(['main-drop-down', 'drop-down', 'apply-button', 'cancel-button']);
            done();
        }, 200);
    });
});

describe('<ptcs-chip-data-filter-selector-dropdown>-<datetime-case>', () => {
    const dateTimeIndex = findIndexForGivenType('datetime');
    const dataCategory = findDataCategoryForGivenType('datetime');
    let selector, mainDropDown, applyButton, datetimeCaseComp, container;
    let operationsDropDown, datePicker;
    let dateToBeInserted, withinValue, withinUnit;

    beforeEach(async() => {
        selector = await fixture(`
            <ptcs-chip-data-filter-selector-dropdown
            dictionary='{"stringBetween": "Between", "stringOutside": "Outside", "stringBefore": "before", "stringHours": "hours"}' tabindex="0">
            </ptcs-chip-data-filter-selector-dropdown>
        `);
        selector.sortFilters = false;
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        mainDropDown = selector.$['main-drop-down'];
        applyButton = selector.$['apply-button'];
        mainDropDown.selectedIndexes = [dateTimeIndex]; // select the datetime type based filter option
        container = selector.$['container'];
        datetimeCaseComp = container.querySelector('#datetime-case');
        operationsDropDown = datetimeCaseComp.$['drop-down'];
        datePicker = datetimeCaseComp.$['date-picker'];

        dateToBeInserted = new Date('2020-03-11');
        withinValue = 2;
        withinUnit = 'h';
    });

    it('is saving handled correctly & query is generated correctly', done => {
        let expectedQueryObj = {
            filters: {
                type:    'And',
                filters: []
            }
        };

        PTCS.flush(() => {
            const handler = event => {
                const passedData = event.detail.data;
                const dataOfInterest = passedData && passedData.length && passedData[passedData.length - 1];
                const dataEnteredByUser = dataOfInterest.dataEnteredByUser;
                const isError = dataOfInterest && dataOfInterest.isError;
                const valueEnteredByUser = dataEnteredByUser.operation === 'within' ? withinValue : dateToBeInserted;

                let expectedData = null;
                switch (dataEnteredByUser.operation) {
                    case 'within':
                        expectedData = dataEnteredByUser.value;
                        break;
                    case 'between':
                        expectedData = dataEnteredByUser.from;
                        break;
                    default:
                        expectedData = dataEnteredByUser.date;
                }
                expectedQueryObj.filters.filters.push(getDateQueryChip('datetime', dataCategory.name, dataOfInterest.dataEnteredByUser));
                const expectedQuery = JSON.stringify(expectedQueryObj);
                const selectorQuery = JSON.stringify(selector.query);

                expect(selectorQuery).to.be.eql(expectedQuery);
                expect(valueEnteredByUser).to.be.eql(expectedData);
                expect(isError).to.be.eql(false);
                selector.removeEventListener('change', handler);
            };

            // check whether query is not yet ready when none data were provided
            expect(datetimeCaseComp.query).to.be.eql(null);

            datetimeCaseComp.dataEnteredByUser = {operation: 'before', date: dateToBeInserted};

            PTCS.flush(() => {
                selector.addEventListener('change', handler);
                selector.$['apply-button'].click();
                mainDropDown.selectedIndexes = [dateTimeIndex];
                datetimeCaseComp.dataEnteredByUser = {operation: 'beforeEq', date: dateToBeInserted};

                PTCS.flush(() => {
                    selector.addEventListener('change', handler);
                    selector.$['apply-button'].click();
                    mainDropDown.selectedIndexes = [dateTimeIndex];
                    datetimeCaseComp.dataEnteredByUser = {operation: 'after', date: dateToBeInserted};

                    PTCS.flush(() => {
                        selector.addEventListener('change', handler);
                        selector.$['apply-button'].click();
                        mainDropDown.selectedIndexes = [dateTimeIndex];
                        datetimeCaseComp.dataEnteredByUser = {operation: 'afterEq', date: dateToBeInserted};

                        PTCS.flush(() => {
                            selector.addEventListener('change', handler);
                            selector.$['apply-button'].click();
                            mainDropDown.selectedIndexes = [dateTimeIndex];
                            datetimeCaseComp.dataEnteredByUser = {operation: 'equals', date: dateToBeInserted};

                            PTCS.flush(() => {
                                selector.addEventListener('change', handler);
                                selector.$['apply-button'].click();
                                mainDropDown.selectedIndexes = [dateTimeIndex];
                                datetimeCaseComp.dataEnteredByUser = {operation: 'notEq', date: dateToBeInserted};

                                PTCS.flush(() => {
                                    selector.addEventListener('change', handler);
                                    selector.$['apply-button'].click();
                                    mainDropDown.selectedIndexes = [dateTimeIndex];
                                    datetimeCaseComp.dataEnteredByUser = {operation: 'between', from: dateToBeInserted, to: dateToBeInserted};

                                    PTCS.flush(() => {
                                        selector.addEventListener('change', handler);
                                        selector.$['apply-button'].click();
                                        mainDropDown.selectedIndexes = [dateTimeIndex];
                                        datetimeCaseComp.dataEnteredByUser = {operation: 'within', value: withinValue, units: withinUnit};

                                        PTCS.flush(() => {
                                            selector.addEventListener('change', handler);
                                            selector.$['apply-button'].click();
                                            mainDropDown.selectedIndexes = [dateTimeIndex];
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

    it('is saving handled correctly & query is generated correctly - expanded mode', async function() {
        let expectedQueryObj = {
            filters: {
                type:    'And',
                filters: []
            }
        };

        await PTCS.wait();
        const handler = event => {
            const passedData = event.detail.data;
            const dataOfInterest = passedData && passedData.length && passedData[passedData.length - 1];
            const dataEnteredByUser = dataOfInterest.dataEnteredByUser;
            const isError = dataOfInterest && dataOfInterest.isError;
            const valueEnteredByUser = dataEnteredByUser.operation === 'within' ? withinValue : dateToBeInserted;

            let expectedData = null;
            switch (dataEnteredByUser.operation) {
                case 'within':
                    expectedData = dataEnteredByUser.value;
                    break;
                case 'between':
                    expectedData = dataEnteredByUser.from;
                    break;
                default:
                    expectedData = dataEnteredByUser.date;
            }
            expectedQueryObj.filters.filters.push(getDateQueryChip('datetime', dataCategory.name, dataOfInterest.dataEnteredByUser));
            const expectedQuery = JSON.stringify(expectedQueryObj);
            const selectorQuery = JSON.stringify(selector.query);

            expect(selectorQuery).to.be.eql(expectedQuery);
            expect(valueEnteredByUser).to.be.eql(expectedData);
            expect(isError).to.be.eql(false);
            selector.removeEventListener('change', handler);
        };

        // check whether query is not yet ready when none data were provided
        expect(datetimeCaseComp.query).to.be.eql(null);

        datetimeCaseComp.isCompactMode = false; // expanded mode
        datetimeCaseComp.dataEnteredByUser = {operation: 'before', date: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'beforeEq', date: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'after', date: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'afterEq', date: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'equals', date: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'notEq', date: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'between', from: dateToBeInserted, to: dateToBeInserted};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
        datetimeCaseComp.dataEnteredByUser = {operation: 'within', value: withinValue, units: withinUnit};

        await PTCS.wait();
        selector.addEventListener('change', handler);
        selector.$['apply-button'].click();
        mainDropDown.selectedIndexes = [dateTimeIndex];
    });


    it('is field name set correctly', done => {
        expect(datetimeCaseComp.queryFieldName()).to.be.eql(dataCategory.name);
        done();
    });

    it('does Apply button behave correctly', async() => {
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);

        operationsDropDown.selectedValue = 'equals';
        datePicker.dateTime = dateToBeInserted;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(false);

        datePicker.dateTime = null;
        await applyButton.updateComplete;

        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
    });

    it('test bad datetime conditions', done => {
        datetimeCaseComp.dataEnteredByUser = null;
        PTCS.flush(() => {
            expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
            datetimeCaseComp.dataEnteredByUser = {operation: ''};
            PTCS.flush(() => {
                expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                datetimeCaseComp.dataEnteredByUser = {operation: 'between'};
                PTCS.flush(() => {
                    expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                    datetimeCaseComp.dataEnteredByUser = {operation: 'within'};
                    PTCS.flush(() => {
                        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                        datetimeCaseComp.dataEnteredByUser = {operation: 'equals'};
                        PTCS.flush(() => {
                            expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
                            done();
                        });
                    });
                });
            });
        });
    });
});

describe('<ptcs-chip-data-filter-selector-dropdown>-nothingSelectedYet', () => {
    let noSelectionCaseTextField, selector, mainDropDown, applyButton;

    beforeEach(async() => {
        selector = await fixture(`
            <ptcs-chip-data-filter-selector-dropdown dictionary='{"stringBetween": "Between", "stringOutside": "Outside"}' tabindex="0">
            </ptcs-chip-data-filter-selector-dropdown>
        `);
        selector.sortFilters = false;
        mainDropDown = selector.$['main-drop-down'];
        noSelectionCaseTextField = selector.$['no-selection-case-text-field'];
        applyButton = selector.$['apply-button'];
    });

    it('are drop-down, text field, apply disabled when there is no input data', done => {
        expect(mainDropDown.hasAttribute('disabled')).to.be.eql(true);
        expect(noSelectionCaseTextField.hasAttribute('disabled')).to.be.eql(true);
        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
        done();
    });

    it('are text field & apply disabled once input data has been provided', done => {
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        expect(mainDropDown.hasAttribute('disabled')).to.be.eql(false);
        expect(noSelectionCaseTextField.hasAttribute('disabled')).to.be.eql(true);
        expect(applyButton.hasAttribute('disabled')).to.be.eql(true);
        done();
    });

    it('is main drop-down populated correctly', done => {
        const mainDropDownRefItems = Object
            .values(data.dataShape.fieldDefinitions)
            .map(extendedOption => new Object({label: extendedOption.name, value: extendedOption.name})).filter(e => {
                return e.value !== 'unsupportedBasedCategory'; // unsupportedBasedCategory will be excluded
            });

        expect(selector.data).to.be.null; // no data yet
        // unhappy path -> setting the wrong data
        selector.data = {
            incorrectField: 'incorrectValue'
        };
        expect(selector.data).to.be.null;

        // happy path
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        expect(mainDropDown.items).to.be.eql(mainDropDownRefItems);
        const supportedAndNotSupportedDataType = {
            dataShape: {
                fieldDefinitions: {
                    correctFilterOption: {
                        name:     'textBasedCategory',
                        baseType: 'STRING'
                    },
                    incorrectFilterOption: {
                        name:     'some unsupported type',
                        baseType: 'INFOTABLE'
                    }
                }
            }
        };

        // check case when no customBaseTypesMapping is set
        selector.customBaseTypesMapping = null;
        selector.data = supportedAndNotSupportedDataType;
        expect(mainDropDown.items).to.be.eql([{label: supportedAndNotSupportedDataType.dataShape.fieldDefinitions.correctFilterOption.name,
            value: supportedAndNotSupportedDataType.dataShape.fieldDefinitions.correctFilterOption.name}]);
        done();
    });

    it('are text field & apply button disabled after entering data', async() => {
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = data;
        mainDropDown.selectedIndexes = [findIndexForGivenType('string')]; // select the text type based filer option

        const stringCaseComp = selector.$['container'].querySelector('#string-case');

        stringCaseComp.dataEnteredByUser = {operation: 'exact', value: 'exact match'};
        await applyButton.updateComplete;

        expect(selector.$['apply-button'].hasAttribute('disabled')).to.be.eql(false);

        selector.$['apply-button'].click();
        await applyButton.updateComplete;

        expect(selector.$['apply-button'].hasAttribute('disabled')).to.be.eql(true);
        expect(noSelectionCaseTextField.hasAttribute('disabled')).to.be.eql(true);
    });

    it('localization is working', done => {
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
        selector.data = dataWithLocalization;
        let idx = findIndexForGivenType('integer', dataWithLocalization);
        let category = findDataCategoryForGivenType('integer', dataWithLocalization);
        expect(mainDropDown.items[idx].label).to.be.eql(category.Title);
        done();
    });

    it('sorting is working', done => {
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number', yyy: 'xxx'};
        selector.columnFormat = columnFormat;
        selector.sortFilters = true;
        selector.data = dataWithLocalization;

        const origcategoriesCount = Object.keys(dataWithLocalization.dataShape.fieldDefinitions).length;
        expect(mainDropDown.items.length).to.be.eql(origcategoriesCount - 3); // bad type,__showThisField=false, yyy->xxx
        done();
    });

    it('custom column format is excluded since it doesn\'t match dataShape', done => {
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number', yyy: 'xxx'};
        selector.columnFormat = JSON.stringify({
            TextBasedCategory: {
                name:     'zzzTextBasedCategory',
                baseType: 'STRING'
            }
        });

        selector.data = dataWithLocalization;

        const origcategoriesCount = Object.keys(dataWithLocalization.dataShape.fieldDefinitions).length;
        expect(mainDropDown.items.length).to.be.eql(origcategoriesCount - 2); // bad type, yyy->xxx
        done();
    });

    it('loading different dataShapes', done => {
        let dataTwoFields = {
            dataShape: {
                fieldDefinitions: {
                    TextBasedCategory: {
                        name:     'TextBasedCategory',
                        baseType: 'STRING'
                    },
                    TextBasedCategory2: {
                        name:     'TextBasedCategory2',
                        baseType: 'STRING'
                    }
                }
            }
        };
        let dataTwoFields2 = {
            dataShape: {
                fieldDefinitions: {
                    TextBasedCategory: {
                        name:     'TextBasedCategory',
                        baseType: 'STRING'
                    },
                    zzzTextBasedCategory2: {
                        name:     'zzzTextBasedCategory2',
                        baseType: 'STRING'
                    }
                }
            }
        };
        let dataOneField = {
            dataShape: {
                fieldDefinitions: {
                    TextBasedCategory: {
                        name:     'TextBasedCategory',
                        baseType: 'STRING'
                    }
                }
            }
        };
        let dataOneFieldDiffBaseType = {
            dataShape: {
                fieldDefinitions: {
                    TextBasedCategory: {
                        name:     'TextBasedCategory',
                        baseType: 'NUMBER'
                    }
                }
            }
        };
        selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number', yyy: 'xxx'};

        selector.data = dataTwoFields;
        expect(mainDropDown.items.length).to.be.eql(Object.keys(dataTwoFields.dataShape.fieldDefinitions).length);

        selector.data = dataTwoFields2;
        expect(mainDropDown.items.length).to.be.eql(Object.keys(dataTwoFields.dataShape.fieldDefinitions).length);

        selector.data = dataOneField;
        expect(mainDropDown.items.length).to.be.eql(Object.keys(dataOneField.dataShape.fieldDefinitions).length);

        selector.data = dataOneFieldDiffBaseType;
        expect(mainDropDown.items.length).to.be.eql(Object.keys(dataOneFieldDiffBaseType.dataShape.fieldDefinitions).length);

        // load 2nd time the same datashape
        selector.data = dataOneFieldDiffBaseType;
        expect(mainDropDown.items.length).to.be.eql(Object.keys(dataOneFieldDiffBaseType.dataShape.fieldDefinitions).length);

        done();
    });

    describe('<ptcs-chip-data-filter-selector-dropdown>-<location-case>', () => {
        const locationIndex = findIndexForGivenType('location');
        let locationCaseComp, container;
        let proximityValueTextField, latitudeValueTextField, longitudeValueTextField;

        beforeEach(async() => {
            selector = await fixture(`
                <ptcs-chip-data-filter-selector-dropdown dictionary='{"stringWithin": "Within", "stringNotWithin": "Not Within",
                "stringMiles": "miles", "stringKilometers": "kilometers", "stringNauticalMiles": "nautical miles"}' tabindex="0">
                </ptcs-chip-data-filter-selector-dropdown>`
            );
            selector.sortFilters = false;
            selector.customBaseTypesMapping = {default: 'string', infotable: 'unsupported', integer: 'number'};
            selector.data = data;
            mainDropDown = selector.$['main-drop-down'];
            mainDropDown.selectedIndexes = [locationIndex]; // select the location based filter option
            container = selector.$['container'];
            applyButton = selector.$['apply-button'];
            locationCaseComp = container.querySelector('#location-case');
            proximityValueTextField = locationCaseComp.$['proximity-value'];
            latitudeValueTextField = locationCaseComp.$['latitude-text-field'];
            longitudeValueTextField = locationCaseComp.$['longitude-text-field'];
        });

        it('is saving handled properly & query generated correctly', done => {
            let expectedLocationCaseData, expectedQuery;
            let queryObj = {
                filters: {
                    type:    'And',
                    filters: []
                }
            };

            const handler = event => {
                const passedData = event.detail.data;
                const dataOfInterest = passedData && passedData.length && passedData[passedData.length - 1];
                const dataEnteredByUser = dataOfInterest && dataOfInterest.dataEnteredByUser;
                const isError = dataOfInterest && dataOfInterest.isError;
                const selectorQuery = JSON.stringify(selector.query);

                expect(dataEnteredByUser).to.be.eql(expectedLocationCaseData);
                expect(selectorQuery).to.be.eql(expectedQuery);
                expect(isError).to.be.eql(false);
                selector.removeEventListener('change', handler);
            };

            PTCS.flush(() => {
                const dataCategory = findDataCategoryForGivenType('location');
                expect(proximityValueTextField.text).to.be.eql('');
                expect(latitudeValueTextField.text).to.be.eql('');
                expect(longitudeValueTextField.text).to.be.eql('');

                const firstValToBeInserted = '10';
                const secondValToBeInserted = '11';
                const thirdValToBeInserted = '22';

                let proximityTypeItemSelection = 'NEAR';
                let proximityUnitItemSelection = 'M';

                expectedLocationCaseData = {
                    type:      proximityTypeItemSelection,
                    value:     firstValToBeInserted,
                    units:     proximityUnitItemSelection,
                    latitude:  secondValToBeInserted,
                    longitude: thirdValToBeInserted
                };
                locationCaseComp.dataEnteredByUser = expectedLocationCaseData;

                queryObj.filters.filters.push({
                    fieldName: dataCategory.name,
                    type:      'NEAR',
                    location:  {latitude: '11', longitude: '22', elevation: 0, units: 'WGS84'},
                    distance:  '10',
                    units:     'M'
                });
                expectedQuery = JSON.stringify(queryObj);

                const enterPressEvent = new KeyboardEvent('keyup', {key: 'Enter'});
                selector.addEventListener('change', handler);
                latitudeValueTextField.dispatchEvent(enterPressEvent);
                mainDropDown.selectedIndexes = [locationIndex];

                PTCS.flush(() => {
                    expect(proximityValueTextField.text).to.be.eql('');
                    expect(latitudeValueTextField.text).to.be.eql('');
                    expect(longitudeValueTextField.text).to.be.eql('');

                    proximityTypeItemSelection = 'NOTNEAR';
                    proximityUnitItemSelection = 'K';
                    expectedLocationCaseData = {
                        type:      proximityTypeItemSelection,
                        value:     firstValToBeInserted,
                        units:     proximityUnitItemSelection,
                        latitude:  secondValToBeInserted,
                        longitude: thirdValToBeInserted
                    };
                    locationCaseComp.dataEnteredByUser = expectedLocationCaseData;

                    queryObj.filters.filters.push({
                        fieldName: dataCategory.name,
                        type:      'NOTNEAR',
                        location:  {latitude: '11', longitude: '22', elevation: 0, units: 'WGS84'},
                        distance:  '10',
                        units:     'K'
                    });
                    expectedQuery = JSON.stringify(queryObj);

                    selector.addEventListener('change', handler);
                    latitudeValueTextField.dispatchEvent(enterPressEvent);
                    mainDropDown.selectedIndexes = [locationIndex];

                    PTCS.flush(() => {
                        expect(proximityValueTextField.text).to.be.eql('');
                        expect(latitudeValueTextField.text).to.be.eql('');
                        expect(longitudeValueTextField.text).to.be.eql('');

                        proximityTypeItemSelection = 'NOTNEAR';
                        proximityUnitItemSelection = 'N';
                        expectedLocationCaseData = {
                            type:      proximityTypeItemSelection,
                            value:     firstValToBeInserted,
                            units:     proximityUnitItemSelection,
                            latitude:  secondValToBeInserted,
                            longitude: thirdValToBeInserted
                        };
                        locationCaseComp.dataEnteredByUser = expectedLocationCaseData;

                        queryObj.filters.filters.push({
                            fieldName: dataCategory.name,
                            type:      'NOTNEAR',
                            location:  {latitude: '11', longitude: '22', elevation: 0, units: 'WGS84'},
                            distance:  '10',
                            units:     'N'
                        });
                        expectedQuery = JSON.stringify(queryObj);

                        selector.addEventListener('change', handler);
                        latitudeValueTextField.dispatchEvent(enterPressEvent);
                        mainDropDown.selectedIndexes = [locationIndex];

                        done();
                    });
                });
            });
        });
    });
});
