const got = require('got')
const { CookieJar } = require('tough-cookie')
const cheerio = require('cheerio')

const LOGIN_PAGE_URL = 'https://secure.etecsa.net:8443/'
const LOGIN_URL = 'https://secure.etecsa.net:8443//LoginServlet'
const LOGOUT_URL = "https://secure.etecsa.net:8443/LogoutServlet"

const login = async ({
  username,
  password,
}) => {
  const cookieJar = new CookieJar()

  // Get login page
  let response = await got.get(LOGIN_PAGE_URL, { cookieJar })

  // Extract login parameters
  const parameters = {
    username,
    password,
    ...extractLoginParameters(response.body)
  }

  // Do login
  response = await got.post(LOGIN_URL, {
    form: parameters,
    followRedirect: true,
    throwHttpErrors: false,
    cookieJar,
  })

  // Extract UUID
  const uuid = extractUUID(response.body)

  // console.log('headers', response.headers)
  // console.log('body', response.body)
  console.log('cookies', cookieJar.toJSON())
  console.log('uuid', uuid)
}



const logout = async (parameters, cookies) => {
  const cookieJar = new CookieJar()
  cookieJar.setCookieSync({ key: 'JSESSIONID', value: sessionId })

  const response = await got.get(LOGOUT_URL, {
    cookieJar,
    query: {
      ATTRIBUTE_UUID: uuid,
      remove: '1',
    }
  })

  console.log('body', response.body)
}

module.exports = {
  login,
  logout,
}