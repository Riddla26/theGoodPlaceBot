const User = require('../models/user');
const Leaderboard = require('../models/leaderboard');

const awardClasses = [
  'belowmindy',
  'abovemindy',
  'mindy',
  'hemsworthless',
  'bestperson',
  'best-person',
  'Accounting',
];

const stripPreviousAwardFlair = (flairs) => {
  return flairs.filter(flair => awardClasses.includes(flair) === false);
};

const awardNewAwardFlair = (user, flairs, index) => {
  if (flairs.length === 0) {
    flairs.push('Accounting');
  }

  if (index <= 1) {
    flairs.push(index === 0 ? 'bestperson' : 'hemsworthless');
  } else {
    switch (true) {
      case user.score > 323:
        flairs.push('abovemindy');
        break;
      case user.score === 323:
        flairs.push('mindy');
        break;
      case user.score < 323:
        flairs.push('belowmindy');
        break;
      default:
        break;
    }
  }

  return flairs;
};

const updateFlair = (user, index, awardFlair) => {
  User.getFlair(user.username)
    .then((flair) => {
      let flairClass = flair.flair_css_class;
      let flairArray = flair.flair_css_class !== null ? flairClass.split(' ') : [];
      flairArray = stripPreviousAwardFlair(flairArray);

      if (awardFlair) {
        flairArray = awardNewAwardFlair(user, flairArray, index);
      }

      flairClass = flairArray.join(' ');

      User.updateFlair(user.username, flairClass, flair);
    });
};

const updateRanking = (sort, func, awardNew, reset = false) => {
  return new Promise((resolve) => {
    User.find({})
      .sort({ score: sort })
      .exec((err, users) => {
        users.forEach((storedUser, index) => {
          func(storedUser, index, awardNew);
        });

        if (reset) {
          Leaderboard.create({ users })
            .then((board) => {
              if (!board) {
                console.log('>>> err creating leaderboard', err);
              }
            });
        }

        resolve();
      });
  });
};

const flairHandler = {
  updateAllFlairs: () => {
    console.log('>>> updating flairs');
    return updateRanking(-1, updateFlair, true, true);
  },

  verifyAllFlairs: () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    Leaderboard.findOne({
      created: { $gt: lastWeek },
    })
      .then((board) => {
        if (!board) {
          return updateRanking(-1, updateFlair, true, true);
        }

        const { users } = board;

        users.forEach((usr, index) => {
          setTimeout(() => {
            updateFlair(usr, index);
          }, 2500);
        });

        return false;
      });
  },

  removeAwardFlairs: () => {
    return updateRanking(-1, updateFlair, false, false);
  },
};

module.exports = flairHandler;
