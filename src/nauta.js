const got = require('got');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { Session } = require('./session');

const extractLoginParameters = (body) => {
  const $ = cheerio.load(body)

  return $('#formulario').find('input[type="hidden"]')
    .map((i, el) => {
      return {
        [$(el).attr('name')]: $(el).attr('value'),
      }
    })
    .get()
}

const extractUUID = (body) => {
  const match = /ATTRIBUTE_UUID=(\w*)&/.exec(body);

  return match ? match[1] : null;
}

class Nauta {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }

  async login(credentials) {
    const cookieJar = new CookieJar();

    let response = await got.get('https://secure.etecsa.net:8443', { cookieJar });

    const loginParameters = extractLoginParameters(response.body);

    response = await got.post('https://secure.etecsa.net:8443/LoginServlet', {
      cookieJar,
      form: {
        ...loginParameters,
        username: credentials.username,
        password: credentials.password,
      }
    });

    const sessionData = {
      username: credentials.username,
      uuid: extractUUID(response.body)
    };

    this.dataStore.set(sessionData);

    return new Session(sessionData);
  }
}

module.exports = { Nauta }