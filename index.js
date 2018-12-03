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
    let processor = unified()
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
}

const createFile = (text) => {
  return new Promise((resolve) => {
    const timestamp = new Date().getTime();
    const path = `./comments/comment_${timestamp}.txt`;
    fs.writeFile(path, text, (err) => {
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

const processComment = (body) => {
  return new Promise((resolve) => {
    let data = {};
    let path;

    createFile(body)
      .then(filepath => analyzeComment(filepath))
      .then((_data) => {
        data = _data.data;
        path = _data.path
      })
      .then(() => deleteFile(path))
      .then(() => {
        resolve(data);
      });
  });
};

const flairUser = (score, commentObj) => {
  const polarity = score.polarity !== undefined;

  if (polarity) {
    const newScore = commentObj.currentScore + (polarity * 10);

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
    currentScore: comment.author_flair_css_class,
  };

  processComment(comment.body)
    .then(score => flairUser(score, commentObj));
});
