const Promise = require('bluebird');

module.exports = {
  directive: 'RNTO',
  handler: function ({log, command} = {}) {
    if (!this.renameFrom) return this.reply(503);

    if (!this.fs) return this.reply(550, 'File system not instantiated');
    if (!this.fs.rename) return this.reply(402, 'Not supported by file system');

    const from = this.renameFrom;
    const to = command.arg;

    return Promise.try(() => this.fs.rename(from, to))
    .then((renameCheck) => {
      if(renameCheck === true){return this.reply(250);}
      else if(renameCheck === "not-found"){
        return this.reply(550,"RNFR file cannot find");
      }
      else if (renameCheck === "already-exist"){
        return this.reply(550,"RNTO file already exist")
      }
      else if (renameCheck === "include-slash"){
        return this.reply(550,"File or directory names cannot include slash")
      }
      else if (renameCheck === "rename-root"){
        return this.reply(550,"Cannot rename root directory")
      }
      else if (renameCheck === "dot-name"){
        return this.reply(550,"This name cannot be used as a file (or directory) name")
      }
      else if(renameCheck === "WAITFOR_AVSCAN"){
        return this.reply(550,"This file has not been scanned yet")
      }
      else if(renameCheck === "permission-denied"){
        return this.reply(550,"Permission denied")
      }
      else{
        return this.reply(550,"Internal server error")
      }
    })
    .tap(() => this.emit('RNTO', null, to))
    .catch((err) => {
      log.error(err);
      this.emit('RNTO', err);
      return this.reply(550, err.message);
    })
    .then(() => {
      delete this.renameFrom;
    });
  },
  syntax: '{{cmd}} <name>',
  description: 'Rename to'
};
