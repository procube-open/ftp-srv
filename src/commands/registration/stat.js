const _ = require('lodash');
const Promise = require('bluebird');
const getFileStat = require('../../helpers/file-stat');

module.exports = {
  directive: 'STAT',
  handler: function (args = {}) {
    class PermissionDeniedException extends Error {
      constructor(message) {
        super(message);
        this.name = "PermissionDeniedException";
      }
    }

    const {log, command} = args;
    const path = _.get(command, 'arg');
    if (path) {
      if (!this.fs) return this.reply(550, 'File system not instantiated');
      if (!this.fs.get) return this.reply(402, 'Not supported by file system');

      return Promise.try(() => this.fs.get(path))
      .then((stat) => {
        if (stat === "permission-denied")  throw new PermissionDeniedException("Permission denied");
        if (stat.isDirectory()) {
          if (!this.fs.list) return this.reply(402, 'Not supported by file system');

          return Promise.try(() => this.fs.list(path))
          .then((stats) => {
            if (stats === "permission-denied")  throw new PermissionDeniedException("Permission denied");
            return [213, stats];
          });
        }
        return [212, [stat]];
      })
      .then(([code, fileStats]) => {
        return Promise.map(fileStats, (file) => {
          const message = getFileStat(file, _.get(this, 'server.options.file_format', 'ls'));
          return {
            raw: true,
            message
          };
        })
        .then((messages) => [code, messages]);
      })
      .then(([code, messages]) => this.reply(code, 'Status begin', ...messages, 'Status end'))
      .catch(PermissionDeniedException, (err) => {
        return this.reply(550, err.message || "Permission denied");
      })
      .catch((err) => {
        log.error(err);
        return this.reply(450, err.message);
      });
    } else {
      return this.reply(211, 'Status OK');
    }
  },
  syntax: '{{cmd}} [<path>]',
  description: 'Returns the current status'
};
