const Filter = require('bad-words');


function isProfane(text) {
  const filter = new Filter();
  return filter.isProfane(text);
}

function clean(text) {
    const filter = new Filter();
    return filter.clean(text);
}


module.exports = { isProfane, clean };