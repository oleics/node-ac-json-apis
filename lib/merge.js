
var isScalar = require('is-scalar');

module.exports = merge;

// merge nextValue into origValue
// strictly same object and array
function merge(origValue, nextValue) {
  if(isScalar(nextValue)) return nextValue;
  if(isArray(nextValue)) {
    if(isArray(origValue)) {
      origValue.splice.apply(origValue, [0, origValue.length].concat(nextValue));
      return origValue;
    }
    return nextValue.slice(0);
  }

  if(isScalar(origValue)) return nextValue;
  if(isArray(origValue)) return nextValue;
  Object.keys(nextValue).forEach(function(key){
    origValue[key] = merge(origValue[key], nextValue[key]);
  });

  return origValue;
}


function isArray(val) {
  return typeof val === 'array' || val instanceof Array;
}
