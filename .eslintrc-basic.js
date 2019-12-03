module.exports = {
  "extends": ["google", '.eslintrc-slow'],
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "env": {
    "mocha": true
  },
  "rules": {
    "max-len": [2, 600],
    "prefer-const": "error",
    "eqeqeq": ["error", "always"],
    "no-unused-vars": [
      "error",
      {
        "varsIgnorePattern": "should|expect|assert"
      }
    ],
    "indent": ["error", 2]
  }
};
