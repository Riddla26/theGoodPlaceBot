const User = require('../models/user');

const awardClasses = [
  'belowmindy',
  'abovemindy',
  'mindy',
  'hemsworthless',
  'bestperson',
  'best-person',
];

const stripPreviousAwardFlair = (flairs) => {
  return flairs.filter(flair => awardClasses.includes(flair) === false);
};

const awardNewAwardFlair = (user, flairs, index) => {
  if (index === 0 || index === 1) {
    flairs.push(index === 0 ? 'bestperson' : 'hemsworthless');
  } else {
    switch (true) {
      case user.score > 0:
        flairs.push('abovemindy');
        break;
      case user.score === 0:
        flairs.push('mindy');
        break;
      case user.score < 0:
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

let previousWeekRanking;

const updateRanking = (sort, func, awardNew, reset = false) => {
  return new Promise((resolve) => {
    User.find({})
      .sort({ score: sort })
      .exec((err, users) => {
        users.forEach((storedUser, index) => {
          func(storedUser, index, awardNew);
        });

        if (reset) {
          previousWeek = users;
        }

        resolve();
      });
  });
};

const flairHandler = {
  updateAllFlairs: () => {
    return updateRanking(-1, updateFlair, true, true);
  },

  verifyAllFlairs: () => {
    if (!previousWeekRanking || !previousWeekRanking.length) {
      return updateRanking(-1, updateFlair, true, true);
    }

    previousWeekRanking.forEach((user, index) => {
      setTimeout(() => {
        updateFlair(user, index);
      }, 2500);
    });
  },

  removeAwardFlairs: () => {
    return updateRanking(-1, updateFlair, false, false);
  },
};

module.exports = flairHandler;
