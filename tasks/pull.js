'use strict';

const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
const node_ssh = require('node-ssh');
const ssh = new node_ssh();

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
  run: options => {
    const app = lando.getApp(options._app.root);
    const myLando = lando.config.command.$0;
    const rawData = fs.readFileSync('pull-config.json');
    const lpConfig = JSON.parse(rawData);
    const appPath = options._app.root;
    const connect = ssh.connect({
      host: lpConfig.LP_HOST,
      username: lpConfig.LP_HOST_USER,
      privateKey: lpConfig.LP_PRIVATE_KEY
    });
    //_runThePull(connect, lpConfig, myLando, appPath); 
    _dump(connect, lpConfig).then(_getFile(connect, lpConfig));
    
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
function _dump(connect, lpConfig) {
  connect.then(() => { 
    ssh.exec(
      `mysqldump -u ${lpConfig.LP_DB_USER} -p${lpConfig.LP_DB_PWD} ${lpConfig.LP_DB} > ${lpConfig.LP_DB_BACK_PATH}`
    );
  });
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
function _getFile(connect, lpConfig) {
  connect
    .then(() => {
      ssh.getFile('db.sql', lpConfig.LP_DB_BACK_PATH);
    });
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
function _runThePull(connect, lpConfig, myLando, appPath, tasks) {
  if (tasks.length === 1) return tasks[0](input);
  tasks[0](input, (output) => {
    _runThePull(output, tasks.slice(1)); //Performs the tasks in the 'tasks[]' array
  });
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
