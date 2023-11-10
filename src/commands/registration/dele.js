const Promise = require('bluebird');

module.exports = {
  directive: 'DELE',
  handler: function ({log, command} = {}) {
    if (!this.fs) return this.reply(550, 'File system not instantiated');
    if (!this.fs.delete) return this.reply(402, 'Not supported by file system');

    return Promise.try(() => this.fs.delete(command.arg))
    .then((res) => {
      if(res === true){
        return this.reply(250);
      }
      else if(res === "WAITFOR_AVSCAN"){
        return this.reply(550,"That file has not been scanned yet")
      }
      else if(res === "rm-root"){
        return this.reply(550,"Cannot remove root directory")
      }
      else if(res === "permission-denied"){
        return this.reply(550,"Permission denied")
      }
      else{
        return this.reply(550,"That file does not exist")
      }
      
    })
    .catch((err) => {
      log.error(err);
      return this.reply(550, err.message);
    });
  },
  syntax: '{{cmd}} <path>',
  description: 'Delete file'
};
