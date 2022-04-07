'use strict';

/* eslint-disable no-extend-native */

String.prototype.rightPad = function(padString, length) {
  let str = this;
  while (str.length < length) {
    str = str + padString;
  }
  return str;
};

String.prototype.leftPad = function(padString, length) {
  let str = this;
  while (str.length < length) {
    str = padString + str;
  }
  return str;
};
