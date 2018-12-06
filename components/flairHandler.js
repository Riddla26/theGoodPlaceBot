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

const updateFlair = (user, index) => {
  User.getFlair(user.username)
    .then((flair) => {
      let flairClass = flair.flair_css_class;
      let flairArray = flair.flair_css_class !== null ? flairClass.split(' ') : [];
      flairArray = stripPreviousAwardFlair(flairArray);
      flairArray = awardNewAwardFlair(user, flairArray, index);
      flairClass = flairArray.join(' ');

      User.updateFlair(user.username, flairClass, flair);
    });
};

let previousWeekRanking;

const updateRanking = (sort, func) => {
  return new Promise((resolve) => {
    User.find({})
      .sort({ score: sort })
      .exec((err, users) => {
        previousWeek = users;
        users.forEach((storedUser, index) => {
          setTimeout(() => {
            func(storedUser, index);
          }, 2500);
        });

        resolve();
      });
  });
};

const flairHandler = {
  updateAllFlairs: () => {
    console.log('>>> updated flairs');
    return updateRanking(-1, updateFlair);
  },

  verifyAllFlairs: () => {
    if (!previousWeekRanking || !previousWeekRanking.length) {
      return updateRanking(-1, updateFlair);
    }

    previousWeekRanking.forEach((user, index) => {
      setTimeout(() => {
        updateFlair(user, index);
      }, 2500);
    });
  },
};

module.exports = flairHandler;
