const cheerio = require('cheerio');

const extractUUID = (body) => {
  const match = /ATTRIBUTE_UUID=(\w*)&/.exec(body);

  return match ? match[1] : null;
}

module.exports = {
  extractLoginParameters,
  extractUUID
}