const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  score: {
    type: Number,
    default: 0,
  },
});

userSchema.statics.findOrCreate = function findOrCreate(condition, callback) {
  return new Promise((resolve) => {
    const self = this;
    self.findOne(condition, (err, result) => {
      return result ? callback(err, result) : self.create(condition, (err, result) => { return callback(err, result) });
    });
  });
};

module.exports = mongoose.model('User', userSchema);
