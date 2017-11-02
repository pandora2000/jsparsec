module.exports = {
  extends: 'standard',
  rules: {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    "generator-star-spacing": ["error", {"before": false, "after": true}],
    "yield-star-spacing": ["error", {"before": false, "after": true}],
  }
}
