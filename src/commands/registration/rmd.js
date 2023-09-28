const Promise = require('bluebird');

module.exports = {
  directive: ['RMD', 'XRMD'],
  handler: function ({log, command} = {}) {
    if (!this.fs) return this.reply(550, 'File system not instantiated');
    if (!this.fs.rmdir) return this.reply(402, 'Not supported by file system');

    return Promise.try(() => this.fs.rmdir(command.arg))
    .then((res) => {
      if (res === "not-found") return this.reply(550,"That directory does not exist")
      else if (res === "rm-root") return this.reply(550,"Cannot remove root directory")
      else return this.reply(250);
    })
    .catch((err) => {
      log.error(err);
      return this.reply(550, err.message);
    });
  },
  syntax: '{{cmd}} <path>',
  description: 'Remove a directory'
};
