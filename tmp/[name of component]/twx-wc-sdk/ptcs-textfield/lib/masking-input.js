/* eslint-disable */
export const InputMask = function ( opts ) {
  if (opts && opts.shell) {
    this.wc = opts.wc;
	  this.shell = opts.shell;
	  this.mask = this.shell.querySelector("[part=mask]");
    this.masked = this.shell.querySelector("[part=text-value]");
  }
};

var inputMask = {

  maskingMode: false,

  // Default Values
  d: {
    mNum : 'XdDmMyY9',
    mChar : '_',
    mAlphaNum: '*'
  },

  refresh: function(init) {
    this.maskingMode = init;

    if (this.maskingMode) {
      this.createShell(this.masked);
      this.activateMasking(this.masked);
    } else {
      this.removeShell(this.masked);
    }
  },

  createShell : function (t) {
    var dataHintText = t.getAttribute('data-hint-text'),
        pTxt = t.getAttribute('placeholder'),
        maxlength = t.getAttribute('maxlength'),
        placeholder = document.createTextNode(dataHintText);

    this.shell.setAttribute("mask-active", "");

    t.setAttribute('maxlength', placeholder.length);
    t.setAttribute('data-placeholder', dataHintText);
    t.setAttribute('data-hint-text-2', pTxt ? pTxt : "");
    t.setAttribute('data-maxlength', maxlength);
    t.removeAttribute('placeholder');

    this.mask.appendChild(placeholder);
  },

  removeShell : function (t) {
    if (this.shell.getAttribute("mask-active") === undefined || this.shell.getAttribute("mask-active") === null) {
      return;
    }

    var pTxt = t.getAttribute('data-hint-text-2'),
        maxlength = t.getAttribute('data-maxlength');

    this.shell.removeAttribute("mask-active");

    t.setAttribute('placeholder', pTxt);
    t.setAttribute('maxlength', maxlength);
    t.removeAttribute('data-placeholder');
    t.removeAttribute('data-maxlength');

    // Remove all the text nodes which were added to the masked
    this.mask.childNodes.forEach((node) => {
      if (node.nodeType === 3) { // text node
        this.mask.removeChild(node);
      }
    });
  },

  setValueOfMask : function (e) {
    var value = e.target.value,
        placeholder = e.target.getAttribute('data-placeholder');

    return "<i>" + value + "</i>" + placeholder.substr(value.length);
  },

  // add event listeners
  activateMasking : function (t) {
    if (t.addEventListener) {
      t.addEventListener('input', this.handleValueChange.bind(this));
    }
  },

  handleValueChange : function (e) {
    if (!this.maskingMode) {
      return;
    }

    var input = e.target;
    var mask = e.target.parentNode.firstElementChild;

    if (input.value == mask.innerHTML) {
      return; // Continue only if value hasn't changed
    }

    // input.value = this.handleCurrentValue(e);
    this.wc.text = this.handleCurrentValue(e);
    this.wc.performUpdate();
    mask.innerHTML = this.setValueOfMask(e);
  },

  handleCurrentValue : function (e) {
    var isCharsetPresent = e.target.getAttribute('data-charset'),
        placeholder = isCharsetPresent || e.target.getAttribute('data-placeholder'),
        value = e.target.value, l = placeholder.length, newValue = '',
        i, j, isInt, isLetter, isAlphaNum, strippedValue, matchesNumber, matchesLetter, matchesAlphaNum;

    // strip special characters
    strippedValue = isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");

    for (i = 0, j = 0; i < l; i++) {
        isInt = strippedValue[j] ? strippedValue[j].match(/[0-9]/i) : false;
        isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
        isAlphaNum = strippedValue[j] ? strippedValue[j].match(/[A-Z0-9]/i) : false;
        matchesNumber = this.d.mNum.indexOf(placeholder[i]) >= 0;
        matchesLetter = this.d.mChar.indexOf(placeholder[i]) >= 0;
        matchesAlphaNum = this.d.mAlphaNum.indexOf(placeholder[i]) >= 0;
        if ((matchesNumber && isInt) || (isCharsetPresent && ((matchesLetter && isLetter) || (matchesAlphaNum && isAlphaNum)))) {
                newValue += strippedValue[j++];
          } else if ((!isCharsetPresent && !isInt && matchesNumber) || (isCharsetPresent && ((matchesLetter && !isLetter) || (matchesNumber && !isInt) || (matchesAlphaNum && !isAlphaNum)))) {
                //this.opts.onError( e ); // write your own error handling function
                return newValue;
        } else {
            newValue += placeholder[i];
        }
        // break if no characters left and the pattern is non-special character
        if (strippedValue[j] == undefined) {
          break;
        }
    }

    return newValue;
  }
};

for ( var property in inputMask ) {
  if (inputMask.hasOwnProperty(property)) {
    InputMask.prototype[ property ] = inputMask[ property ];
  }
}
