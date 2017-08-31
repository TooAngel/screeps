'use strict';

/* eslint-disable no-extend-native */

String.prototype.rpad = function(padString, length) {
  let str = this;
  while (str.length < length) {
    str = str + padString;
  }
  return str;
};

String.prototype.lpad = function(padString, length) {
  let str = this;
  while (str.length < length) {
    str = padString + str;
  }
  return str;
};
