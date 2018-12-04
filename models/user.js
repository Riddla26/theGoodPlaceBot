const mongoose = require('mongoose');
const r = require('./../lib/reddit')();

const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  score: {
    type: Number,
    default: 0,
  },
});

userSchema.statics.findOrCreate = function findOrCreate(condition, callback) {
  const self = this;
  self.findOne(condition, (err, result) => {
    return result ? callback(err, result) : self.create(condition, (err, result) => { return callback(err, result) });
  });
};

userSchema.statics.getTen = function getTen(direction, callback) {
  const self = this;
  self.find({})
    .sort({ score: direction })
    .limit(10)
    .exec(callback);
};

userSchema.statics.verifyRedditUserExists = function verifyRedditUserExists(username, create) {
  const self = this;
  return new Promise((resolve) => {
    r.getUser(username)
      .getOverview()
      .then(() => {
        if (create) {
          const user = new self({
            username,
            score: 0,
          });

          user.save((err) => {
            if (!err) {
              resolve(user);
            }
          });
        } else {
          resolve({ error: 'User exists but was not created' });
        }
      })
      .catch(() => {
        resolve({ error: 'Reddit user does not exist' });
      });
  });
};

userSchema.statics.getOverallRank = function getOverallRank(user) {
  const self = this;
  return new Promise((resolve) => {
    self.find({})
      .sort({ score: -1 })
      .exec((err, users) => {
        const userPosition = users.map((x) => x.username).indexOf(user.username);
        const userFound = users[userPosition]['_doc'];
        userFound.rank = userPosition + 1;
        resolve(userFound);
      });
  });
};

module.exports = mongoose.model('User', userSchema);
