#!/usr/bin/env node
const path = require('path');
const os = require('os');
const { program } = require('commander');
const { prompt } = require('enquirer');
const { Store } = require('data-store');
const chalk = require('chalk');
const { Session } = require('./session');
const { Nauta } = require('./nauta');
const { default: got } = require('got/dist/source');
const log = console.log;
const clear = console.clear;

const configDataStore = new Store({
  path: path.join(os.homedir(), '.config', 'nauta-cli', 'config.json')
});

const sessionDataStore = new Store({
  path: path.join(os.homedir(), '.config', 'nauta-cli', 'session.json')
});

const printStatus = async (session) => {
  const remainingTime = await session.getRemainingTime();

  log(`${chalk.bold('Status')}         ${chalk.green('Connected')}`);
  log(`${chalk.bold('Username')}       ${session.data.username}`);
  log(`${chalk.bold('Remaining time')} ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`);
}

const printUserInfo = async (data) => {
  log(`${chalk.bold('Status')}          ${chalk.green(data.status)}`);
  log(`${chalk.bold('Credits')}         ${data.credits} CUP`);
  log(`${chalk.bold('Remaining Time')}  ${data.remainingTime.hours}h ${data.remainingTime.minutes}m ${data.remainingTime.seconds}s`);
  log(`${chalk.bold('Expiration date')} ${data.expirationDate}`);
  log(`${chalk.bold('Access Info')}     ${data.accessInfo}`);
}

program.version('1.0.0');

program
  .command('setup')
  .description('setup credentials')
  .action(async () => {
    const credentials = await prompt([
      {
        type: 'input',
        name: 'username',
        message: 'What is your username?',
        validate: (value) => {
          if (value === '') {
            return 'username is required'
          }

          return true
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'What is your password?',
        validate: (value) => {
          if (value === '') {
            return 'password is required'
          }

          return true
        }
      }
    ])

    configDataStore.set({ credentials })
  });

program
  .command('connect')
  .description('connect to internet')
  .option('--force', 'force a connection even if a session exists', false)
  .action(async (options) => {
    try {
      const config = configDataStore.load();

      if (!config.credentials?.username || !config.credentials?.password) {
        log(`${chalk.red.bold('No credentials found')} Aborting!`)
      }

      const sessionData = sessionDataStore.load();

      if (options.force) {
        sessionDataStore.unlink();
      } else if (sessionData.uuid && sessionData.username) {
        log(`${chalk.red.bold('Active session found!')}`);
        log(`${chalk.bold('Aborted')}`);

        process.exitCode = 1;

        return;
      }

      log(`${chalk.bold('Status')}         ${chalk.green('Connecting')}`);
      log(`${chalk.bold('Username')}       ${config.credentials.username}`);

      const nauta = new Nauta(sessionDataStore);

      const session = await nauta.login(config.credentials);

      clear();

      await printStatus(session);
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  })

program
  .command('status')
  .description('connection status')
  .action(async () => {
    const sessionData = sessionDataStore.load();
    const session = new Session(sessionData);

    await printStatus(session);
  })

program
  .command('user-info')
  .description('print user information')
  .action(async () => {
    const config = configDataStore.load();

    if (!config.credentials?.username || !config.credentials?.password) {
      log(`${chalk.red.bold('No credentials found')} Aborting!`);

      process.exit(1);

      return
    }

    try {
      const nauta = new Nauta(sessionDataStore);

      const data = await nauta.userInfo(config.credentials);

      printUserInfo(data);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })

program
  .command('disconnect')
  .description('disconnect from internet')
  .action(async () => {
    const sessionData = sessionDataStore.load();
    const session = new Session(sessionData);

    log(`${chalk.yellow.bold('Disconnecting...')}`);

    try {
      await session.logout();

      sessionDataStore.unlink();

      log(`${chalk.bold('Disconnected')}`);
    } catch (error) {
      console.error(error);

      process.exit(1);
    }
  })

program.parse(process.argv);