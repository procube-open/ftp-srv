const Promise = require('bluebird');
const { pipeline } = require('node:stream');

module.exports = {
  directive: 'STOR',
  handler: function ({log, command} = {}) {
    if (!this.fs) return this.reply(550, 'File system not instantiated');
    if (!this.fs.write) return this.reply(402, 'Not supported by file system');

    const append = command.directive === 'APPE';
    const fileName = command.arg;

    return this.connector.waitForConnection()
    .tap(() => this.commandSocket.pause())
    .then(() => Promise.try(() => this.fs.write(fileName, {append, start: this.restByteCount})))
    .then((fsResponse) => {
      if(fsResponse === "already-exist-dir") return this.reply(550, "The directory that has same name already exists");
      if(fsResponse === "not-exist-dir") return this.reply(550, "That directory does not exist");
      if(fsResponse === "dot-name") return this.reply(550, "This name cannot be used as a file name");
      if(fsResponse === "upload-root") return this.reply(550, "Cannot rewrite root directory");
      if(fsResponse === "permission-denied") return this.reply(550, "Permission denied");
      let {stream, clientPath, ws} = fsResponse;
      if (!ws) return this.reply(550, "Cannot access the WriteStream");
      if (!stream && !clientPath) {
        stream = fsResponse;
        clientPath = fileName;
      }
      const serverPath = stream.path || fileName;

      const destroyConnection = (connection, reject) => (err) => {
        try {
          if (connection) {
            if (connection.writable) connection.end();
            connection.destroy(err);
          }
        } finally {
          reject(err);
        }
      };

      const socketPromise = new Promise((resolve, reject) => {
        pipeline(
          this.connector.socket,
          stream,
          ws,
          (error) => {
            if (error) {
              destroyConnection(this.connector.socket, reject)(error)
            } else {
              resolve();
            }
          },
        )
      });

      this.restByteCount = 0;

      return this.reply(150).then(() => this.connector.socket && this.connector.socket.resume())
      .then(() => Promise.all([socketPromise]))
      .tap(() => this.emit('STOR', null, serverPath))
      .then(() => this.reply(226, clientPath))
      .then(() => stream.destroy && stream.destroy());
    })
    .catch(Promise.TimeoutError, (err) => {
      log.error(err);
      return this.reply(425, 'No connection established');
    })
    .catch((err) => {
      let message = null;
      if (typeof err === 'string' || err instanceof String) {
        message = err.toString();
        log.info(err);
      } else {
        log.error(err);
      }
      this.emit('STOR', err);
      return this.reply(550, err.message || message);
    })
    .then(() => {
      this.connector.end();
      this.commandSocket.resume();
    });
  },
  syntax: '{{cmd}} <path>',
  description: 'Store data as a file at the server site'
};