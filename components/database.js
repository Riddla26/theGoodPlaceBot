const mongoose = require('mongoose');

let conn = null;

const database = {
  init: (url) => {
    mongoose.connect(url, { promiseLibrary: global.Promise });
    conn = mongoose.connection;
    conn.once('open', (err) => {
      if (err) throw err;
    });

    return conn;
  },
};

module.exports = database;
