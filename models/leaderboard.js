const mongoose = require('mongoose');

const { Schema } = mongoose;

const leaderboardSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  users: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
