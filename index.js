// includes
const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');
const unified = require('unified');
const sentiment = require('retext-sentiment');
const english = require('retext-english');
const profanities = require('retext-profanities');
const vfile = require('to-vfile');
const fs = require('fs');

// config
const sub = 'theGoodPlace';

const config = {
  userAgent: 'GoodPlaceBot',
  clientId: process.env.ID,
  clientSecret: process.env.SECRET,
  username: process.env.USERNAME,
  password: process.env.PASS,
};

const r = new snoowrap(config);
const client = new snoostorm(r);

const commentStream = client.CommentStream({
  subreddit: sub,
  results: 20,
  pollTime: 2000,
});

const analyzeComment = (path) => {
  return new Promise((resolve) => {
    const processor = unified()
      .use(english)
      .use(sentiment)
      .use(profanities);

    const file = vfile.readSync(path);
    const tree = processor.parse(file);

    processor.run(tree, file);

    if (tree.data) {
      resolve({ data: tree.data, path });
    } else {
      resolve({ data: {}, path });
    }
  });
};

const createFile = (text, id) => {
  return new Promise((resolve) => {
    const path = `./comments/comment_${id}.txt`;
    fs.writeFile(path, text, { flag: 'w' }, (err) => {
      if (err) throw err;

      resolve(path);
    });
  });
};

const deleteFile = (path) => {
  return new Promise((resolve) => {
    fs.unlink(path, (err) => {
      if (err) throw err;
      resolve();
    });
  });
};

const processComment = (body, id) => {
  return new Promise((resolve) => {
    let data = {};
    let path;

    createFile(body, id)
      .then(filepath => analyzeComment(filepath))
      .then((_data) => {
        ({ data, path } = _data);
      })
      .then(() => deleteFile(path))
      .then(() => {
        resolve(data);
      })
      .catch((err) => { throw err; });
  });
};

const flairUser = (score, commentObj) => {
  const polarity = score.polarity !== undefined;

  if (polarity) {
    const newScore = commentObj.currentScore + (score.polarity * 10);

    const flair = {
      subredditName: sub,
      text: 'Placeholder text here...',
      cssClass: newScore,
    };

    r.getUser(commentObj.author).assignFlair(flair);
  }
};

commentStream.on('comment', (comment) => {
  const commentObj = {
    author: comment.author.name,
    currentScore: parseInt(comment.author_flair_css_class) || 0,
  };

  processComment(comment.body, comment.id)
    .then(score => flairUser(score, commentObj))
    .catch((err) => { throw err; });
});
