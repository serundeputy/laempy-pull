'use strict';

const Client = require('ssh2').Client;
const conn = new Client();
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');

module.exports = lando => ({
  command: 'lp',
  describe: 'Pull the database from your remote app.',
  level: 'app',
  options: {
    files: {
      describe: 'Pull files from remote app too?',
      alias: ['f'],
      default: '',
      interactive: {
        type: 'confirm',
        default: false,
        message: 'Files retrieved!',
      }
    },
  },
  run: async options => {
    const app = lando.getApp(options._app.root);
    const myLando = lando.config.command.$0;
    const rawData = fs.readFileSync('pull-config.json');
    const lpConfig = JSON.parse(rawData);
    const appPath = options._app.root;
    const connect = {
      host: lpConfig.LP_HOST,
      username: lpConfig.LP_HOST_USER,
      port: 22,
      privateKey: fs.readFileSync(lpConfig.LP_PRIVATE_KEY)
    };
    _runThePull(connect, lpConfig, myLando, appPath);

    if (options.files) {
      console.log(options.files);
    }
  },
});

/**
 * Helper function to dump the db.sql file on the server.
 *
 * @param Promise connnect
 * The ssh connection for your server.
 *
 * @param Ojbect lpConfig
 * The connecton configuration and paths.
 */
async function _dump(connect, lpConfig) {
  const mysqldump =
    `mysqldump -u ${lpConfig.LP_DB_USER} -p${lpConfig.LP_DB_PWD} ${lpConfig.LP_DB} > ${lpConfig.LP_DB_BACK_PATH}`;
  return await conn.on('ready', () => {
    conn.exec(mysqldump, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        conn.end();
      }).on('data', (data) => {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', (data) => {
        console.log('STDERR: ' + data);
      });
    })
  }).connect(connect);

}

/**
 * Helper function to retrieve the db.sql file.
 *
 * @param Promise connnect
 * The ssh connection for your server.
 *
 * @param Ojbect lpConfig
 * The connecton configuration and paths.
 */
function _getFile(lpConfig, appPath) {
  const scp =
    `scp ${lpConfig.LP_HOST_USER}@${lpConfig.LP_HOST}:${lpConfig.LP_DB_BACK_PATH} ${appPath}/db.sql`;
  exec(scp, console.log('did it'));
}

/**
 * Helper function to execute lando db-import db.sql on local.
 *
 * @param string myLando
 * The local lando executable.
 */
function _import(myLando) {
  execShellCommand(`${myLando} db-import db.sql`);
}

/**
 *
 */
function _cleanLocal(appPath) {
  console.log("\n\n\t wtf from _cleanLocal()\n\n");
  execShellCommand(`rm ${appPath}/db.sql`);
}

/**
 *
 */
function _cleanRemote(connect, lpConfig) {
  console.log("\n\n\t wtfffff from _cleanRemote()\n\n");
  connect.then(() => { 
    ssh.exec(
      `rm ${lpConfig.LP_DB_BACK_PATH}`
    );
  }); 
}

/**
 *
 */
async function _runThePull(connect, lpConfig, myLando, appPath) {
  let dump = await _dump(connect, lpConfig);
  let file = await _getFile(lpConfig, appPath);
}

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
       console.warn(error);
      }
      resolve(stdout? stdout : stderr);
    });
  });
}
