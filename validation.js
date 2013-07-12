/**
 * Validation
 */

if (window.NVS === undefined) { window.NVS = {}; }

(function(window, document, NVS){
    'use strict';

    NVS.Validation = function () {
        /*
         * types below are not yet implemented
         *
         * color
         * date
         * datetime
         * datetime-local
         * file
         * month
         * range
         * time
         * url
         * week
         */
        this._regex = {
            number: /^[0-9]*$/, //only numbers, bit incorrect but does enough for most use-cases
            email: /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/ //e-mail pattern according to w3c
        };

        this.valid = false;

        this.customValidations = [];
    };

    //Add an extra custom validation
    NVS.Validation.prototype.addValidation = function (newValidation) {
        this.customValidations.push(newValidation);
    };

    //check if element is empty or checked
    NVS.Validation.prototype.isEmpty = function (element) {
        var radioChecked = false;
        if (element.type === 'radio') {
            document.getElementsByName(element.name).forEach(function (elem) {
                if (elem.checked) { radioChecked = true; }
            });
            return radioChecked;
        }

        if (element.type === 'checkbox') {
            return element.checked;
        }

        return element.value === '';
    };

    //check if element value is required
    NVS.Validation.prototype.isRequired = function (element) {
        return element.hasAttribute('required');
    };

    //check if the value matches te givin pattern
    NVS.Validation.prototype.checkPattern = function (element) {
        return !!element.value.match(element.getAttribute('pattern'));
    };

    //check the value according to the input type
    NVS.Validation.prototype.checkType = function (element) {
        switch (element.type) {
            case 'email':
                if (element.hasAttribute('pattern')) {
                    return this.checkPattern(element);
                }
                return !!element.value.match(this._regex.email);
            case 'number':
                return this.checkNumber(element);
            case 'tel':
            case 'text':
            case 'search':
                if (element.hasAttribute('pattern')) {
                    return this.checkPattern(element);
                }
                return true;
            default:
                return true;
        }
    };

    //check if the length is not longer than the maxlength attribute
    NVS.Validation.prototype.checkLength = function (element) {
        var elemValue = element.value || '',
            valueLength = elemValue.length;

        if (element.hasAttribute('maxlength')
         && valueLength > parseFloat(element.getAttribute('maxlength'))) {
            return false;
        }
    };

    //checks if the input is a number and correct according to the attributes
    NVS.Validation.prototype.checkNumber = function (element) {
        var elemValue = parseFloat(element.value) || 0,
            minValue = element.hasAttribute('min') ? element.getAttribute('min') : -Infinity,
            maxValue = element.hasAttribute('max') ? element.getAttribute('max') : Infinity,
            step = element.hasAttribute('step') ? element.getAttribute('step') : 1;

        if (!element.value.match(this._regex.number)) {
            return false;
        }

        /*
         * Checks if the value in an input like below is valid.
         * <input type="number" min="2" max="7" step="2" />
         *
         * If the min-attribute is ommited, min value = -Infinity, but step counts as default from 0
         */
        if (elemValue > maxValue
         || elemValue < minValue
         || ((minValue === -Infinity ? 0 : minValue) + elemValue % step !== 0)) {
            return false;
        }

        return true;
    };

    //special validation checks
    NVS.Validation.prototype.checkSpecial = function (element) {
        var value = element.value;

        //current element should be the same as given input
        if (element.hasAttribute('data-same-as') && element.value !== document.getElementById(element.getAttribute('data-same-as')).value) {
            return false;
        }
    };

    //checks if the input is valid
    NVS.Validation.prototype.checkValid = function (element) {
        var parent = element.parentNode;
        while (parent.tagName !== 'LI' && parent.tagName !== 'FORM') {
            parent = parent.parentNode;
        }
        if (parent.tagName === 'FORM') {
            return;
        }

        // some types should not be validated, same as a disabled element
        if (element.type === "submit"
         || element.type === "image"
         || element.type === "hidden"
         || element.type === "reset"
         || element.hasAttribute('disabled')) {
            return;
        }

        if (this.isEmpty(element)) {
            if (this.isRequired(element)) {
                //required element is empty
                parent.classList.add('error-item');
                parent.getElementsByClassName('error-required')[0].classList.add('show');

                this.valid = false;
            }
        } else if (this.checkLength(element) === false
                || this.checkType(element) === false) {
            parent.classList.add('error-item');
            parent.getElementsByClassName('error-value')[0].classList.add('show');
            this.valid = false;
        }

        if (this.checkSpecial(element) === false) {
            parent.classList.add('error-item');
            parent.getElementsByClassName('error-special')[0].classList.add('show');
            this.valid = false;
        }
    };

    //set the handlers
    NVS.Validation.prototype.setHandlers = function() {
        var validateForm,
            inputElements,
            nodeList = NodeList.prototype,
            forEach = 'forEach',
            each = [][forEach],
            self = this,
            submitElements = document.querySelectorAll('input[type="submit"]');

        nodeList[forEach] = each;nodeList[forEach] = each

        document.forms[0].addEventListener('submit', function (e) {
            var i;

            document.getElementsByClassName('error').forEach(function (elem) {
                elem.classList.remove('show');
            });
            document.getElementsByClassName('error-item').forEach(function (elem) {
                elem.classList.remove('error-item');
            });

            inputElements = validateForm.querySelectorAll('input, select, textarea');

            inputElements.forEach(function (elem) {
                self.checkValid(elem);
            });

           //custom validations
           for (i = self.customValidations.length; i; i--) {
                if (!self.customValidations[i-1]()) {
                    self.valid = false;
                }
           }

            if (!self.valid) {
                window.scrollTo(0,0)
                e.preventDefault();
            }
        }, false);

        each.call(submitElements, function(elem) {
            elem.addEventListener('click', function () {
                if (this.getAttribute('data-validate')) {
                    validateForm = document.getElementById(this.getAttribute('data-validate'));
                } else {
                    validateForm = null;
                }
            });
        });
    };

    //initialise after dom load
    NVS.Validation.prototype.init = function() {
        var self = this;
        document.addEventListener('DOMContentLoaded', self.setHandlers.bind(this));
    };

    window.Validator = new NVS.Validation();
    window.Validator.init();

}(window, document, window.NVS));
