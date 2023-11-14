const Promise = require('bluebird');
const escapePath = require('../../helpers/escape-path');

module.exports = {
  directive: ['CWD', 'XCWD'],
  handler: function ({log, command} = {}) {
    if (!this.fs) return this.reply(550, 'File system not instantiated');
    if (!this.fs.chdir) return this.reply(402, 'Not supported by file system');

    return Promise.try(() => this.fs.chdir(command.arg))
    .then((cwd) => {
      if(cwd === "not-exist") return this.reply(550, "That directory does not exist")
      else if(cwd === "permission-denied") return this.reply(550, "Permission denied")
      const path = cwd ? `"${escapePath(cwd)}"` : undefined;
      return this.reply(250, path);
    })
    .catch((err) => {
      log.error(err);
      return this.reply(550, err.message);
    });
  },
  syntax: '{{cmd}} <path>',
  description: 'Change working directory'
};
