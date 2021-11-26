const got = require('got');

const parseTime = (value) => {
  const match = /([\d]{2}):([\d]{2}):([\d]{2})/.exec(value);

  return {
    hours: parseInt(match[1]),
    minutes: parseInt(match[2]),
    seconds: parseInt(match[3])
  };
}

class Session {
  constructor(data) {
    this.data = data || {};
  }

  async getRemainingTime() {
    const response = await got.post('https://secure.etecsa.net:8443/EtecsaQueryServlet', {
      form: {
        op: 'getLeftTime',
        ATTRIBUTE_UUID: this.data.uuid,
        username: this.data.username
      }
    })

    return parseTime(response.body)
  }

  async logout() {
    const response = await got.post('https://secure.etecsa.net:8443/LogoutServlet', {
      form: {
        ATTRIBUTE_UUID: this.data.uuid,
        // CSRFHW: this.data.csrfHw,
        username: this.data.username,
        remove: 1
      }
    });

    if (response.body === "logoutcallback('SUCCESS');") {
      return;
    }

    throw new Error('Failure to logout: ' + response.body);
  }
}

module.exports = { Session }