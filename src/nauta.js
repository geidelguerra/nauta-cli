const got = require('got');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { Session } = require('./session');
const HOUR_RATE = 12.5;

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

const extractUserInfo = (body) => {
  const $ = cheerio.load(body);

  const statusText = $('#sessioninfo tr:nth-child(1) td:nth-child(2)').text().trim();
  const creditsText = $('#sessioninfo tr:nth-child(2) td:nth-child(2)').text().trim();
  const expirationDateText = $('#sessioninfo tr:nth-child(3) td:nth-child(2)').text().trim();
  const accessInfoText = $('#sessioninfo tr:nth-child(4) td:nth-child(2)').text().trim();

  return {
    status: statusText === 'Activa' ? 'Active' : 'Disabled',
    credits: parseFloat(creditsText.replace(' CUP', '')),
    expirationDate: expirationDateText === 'No especificada' ? 'None' : expirationDateText,
    accessInfo: accessInfoText === 'Acceso desde todas las áreas de Internet' ? 'All' : accessInfoText
  };
}

const extractUUID = (body) => {
  const match = /ATTRIBUTE_UUID=(\w*)&/.exec(body);

  return match ? match[1] : null;
}

const calculateRemainingTime = (credits) => {
  const time = (credits / HOUR_RATE).toFixed(2);
  const parts = time.toString().split('.');
  const hours = parseInt(parts[0]);

  let minutes = parseInt(parts[1]);
  let seconds = 0;

  if (minutes > 60) {
    seconds = minutes - 60;
    minutes = 60;
  }

  return { hours, minutes, seconds: 0 };
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

  async userInfo(credentials) {
    const cookieJar = new CookieJar();

    let response = await got.get('https://secure.etecsa.net:8443', { cookieJar });

    const loginParameters = extractLoginParameters(response.body);

    response = await got.post('https://secure.etecsa.net:8443/EtecsaQueryServlet', {
      cookieJar,
      form: {
        ...loginParameters,
        username: credentials.username,
        password: credentials.password,
      }
    });

    const userInfo = extractUserInfo(response.body);

    return {
      ...userInfo,
      remainingTime: calculateRemainingTime(userInfo.credits)
    }
  }
}

module.exports = { Nauta }