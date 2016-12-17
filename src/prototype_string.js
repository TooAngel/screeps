'use strict';

String.prototype.rpad = function(padString, length) {
  var str = this;
  while (str.length < length) {
    str = str + padString;
  }
  return str;
};

String.prototype.lpad = function(padString, length) {
  var str = this;
  while (str.length < length) {
    str = padString + str;
  }
  return str;
};
