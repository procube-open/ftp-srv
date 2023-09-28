const Promise = require('bluebird');
const escapePath = require('../../helpers/escape-path');

module.exports = {
  directive: ['MKD', 'XMKD'],
  handler: function ({log, command} = {}) {
    if (!this.fs) return this.reply(550, 'File system not instantiated');
    if (!this.fs.mkdir) return this.reply(402, 'Not supported by file system');

    return Promise.try(() => this.fs.mkdir(command.arg, { recursive: true }))
    .then((dir) => {
      const path = dir ? `"${escapePath(dir)}"` : undefined;
      if(dir === "exist-file") return this.reply(550, "The file that has same name already exists")
      else if(dir === "exist-dir") return this.reply(550, "The directory that has same name already exists")
      else if(dir === "not-exist-parent") return this.reply(550, "Parent directory does not exist")
      else if(dir === "dot-name") return this.reply(550, "This name cannot be used as a directory name")
      else return this.reply(257, path);
    })
    .catch((err) => {
      log.error(err);
      return this.reply(550, err.message);
    });
  },
  syntax: '{{cmd}} <path>',
  description: 'Make directory'
};
