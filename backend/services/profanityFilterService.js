const Filter = require('bad-words');


function isProfane(text) {
  if(text.length === 0) {
    return false;
  }
  const filter = new Filter();
  return filter.isProfane(text);
}

function clean(text) {
    if(text.length === 0) {
        return text;
    }
    const filter = new Filter();
    return filter.clean(text);
}


module.exports = { isProfane, clean };