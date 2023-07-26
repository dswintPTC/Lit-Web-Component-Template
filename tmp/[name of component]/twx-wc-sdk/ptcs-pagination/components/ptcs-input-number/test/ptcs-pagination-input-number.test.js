/* eslint-disable no-unused-expressions */

import '../ptcs-pagination-input-number.js';

import {expect, fixture} from '@open-wc/testing/index.js';

describe('<ptcs-pagination-input-number>', () => {

    const initialValue = '1';
    let inputNumber, inputField;

    beforeEach(async() => {
        inputNumber = await fixture(`<ptcs-pagination-input-number value="${initialValue}"
                                     total-number-of-pages="20"></ptcs-pagination-input-number>`);
        inputField = inputNumber.shadowRoot.querySelector('#pagination-input');
    });

    it('should not allow string input', done => {
        const keyDownEvent = new KeyboardEvent('keydown', {key: 'a', cancelable: true});
        const isCharacter = inputField.dispatchEvent(keyDownEvent);
        expect(isCharacter).to.be.eql(false);
        expect(inputNumber.__inputValue).to.be.eql(initialValue);
        if (!isCharacter) {
            const keyUpEvent = new KeyboardEvent('keyup', {key: 'a'});
            inputField.dispatchEvent(keyUpEvent);
            expect(inputNumber.__inputValue).to.be.eql(initialValue);
        }
        done();
    });

    it('__isInputValueGratherThanMax returns true when input value is grather than total number of pages', done => {
        const event = new KeyboardEvent('keyup', {});

        inputNumber.__inputValue = 22;
        inputField.dispatchEvent(event);
        expect(inputNumber.__isInputValueGratherThanMax(inputNumber.__inputValue)).to.be.eql(true);
        done();
    });

    it('disabled attribute should be set if disabled property is equal true', done => {
        const newDisabledValue = true;

        inputNumber.disabled = newDisabledValue;
        expect(inputField.hasAttribute('disabled')).to.be.eql(newDisabledValue);
        done();
    });

    describe('test of blur event and `Enter` pressed', () => {
        let keyUpEvent, blurEvent;

        beforeEach(async() => {
            inputNumber = await fixture(`<ptcs-pagination-input-number value="${initialValue}"
                                         total-number-of-pages="20"></ptcs-pagination-input-number>`);
            inputField = inputNumber.shadowRoot.querySelector('#pagination-input');
            keyUpEvent = new KeyboardEvent('keyup', {key: 'Enter', cancelable: true});
            blurEvent = new Event('blur');
        });

        it ('check whether input value is set to the current value after blur event or pressing `Enter`', done => {
            inputNumber.__inputValue = 22;
            inputField.dispatchEvent(keyUpEvent);
            expect(inputNumber.__inputValue).to.be.eql(initialValue);

            inputNumber.__inputValue = 22;
            inputField.dispatchEvent(blurEvent);
            expect(inputNumber.__inputValue).to.be.eql(initialValue);
            done();
        });

        it('should set input value to previous value after blur event if not type any value', done => {
            inputNumber.__inputValue = '';
            inputField.dispatchEvent(blurEvent);
            expect(inputNumber.__inputValue).to.be.eql(initialValue);
            done();
        });
    });

    describe('test of pasted values', () => {
        // 'isEdge' property used to ommit tests on Edge (DataTransfer data is not transferred to ClipboardEvent on the edge)
        const isEdge = !!window.StyleMedia;

        function checkPastedValue(value) {
            const pasteData = new DataTransfer();
            pasteData.setData('text', value);
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: pasteData,
                cancelable:    true
            });
            return inputField.dispatchEvent(pasteEvent);
        }

        beforeEach(async() => {
            inputNumber = await fixture(`<ptcs-pagination-input-number value="${initialValue}"
                                         total-number-of-pages="20"></ptcs-pagination-input-number>`);
        });

        it('should not paste value in the field, input value not change', done => {
            const isPastedValueIsValid = checkPastedValue('abc');

            if (!isEdge) {
                expect(isPastedValueIsValid).to.be.eql(false);
            }
            expect(inputNumber.__inputValue).to.be.eql(initialValue);
            done();
        });

        it('input value should show error message for values > MAX, not Edge case', done => {
            if (!isEdge) {
                const valueGratherThanMax = '22';

                checkPastedValue(valueGratherThanMax);
                inputNumber.__inputValue = valueGratherThanMax;
                expect(inputNumber.__isInputValueGratherThanMax(inputNumber.__inputValue)).to.be.eql(true);
                expect(inputNumber.__inputValue).to.be.eql(valueGratherThanMax);
            }
            done();
        });
    });
});
