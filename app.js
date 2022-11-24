const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "twitterClone.db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

let database = null; //data getting from database
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer(); //Starting the server

//User registration status
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const checkUser = `SELECT username FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(checkUser);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = `INSERT INTO user(name,username,password,gender) VALUES('${name}','${username}','${password}','${gender}')`;
      await database.run(insertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//User login Status
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUserIn = await database.get(checkUser);

  if (dbUserIn !== undefined) {
    const checkPassword = await bcrypt.compare(password, dbUserIn.password);
    if (checkPassword === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "SECRET_ID");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//User login Token
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authenticateHeader = request.headers["authorization"];
  console.log(authenticateHeader);
  if (authenticateHeader !== undefined) {
    jwtToken = authenticateHeader.split(" ")[1];
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }

  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "SECRET_ID", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

//The list of all names of people whom the user follows
app.get("/user/following/", authenticateToken, async (request, response) => {
  const { username } = request;
  const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}'`;
  const getUserId = await database.get(userIdQuery);

  const getFollowingQuery = `SELECT following_user_id FROM follower WHERE follower_user_id = ${getUserId.user_id}`;
  const getFollowing = await database.all(getFollowingQuery);

  const getUserFollowingIds = getFollowing.map((userIds) => {
    return userIds.following_user_id;
  });

  const getUserFollowingNamesQuery = `SELECT name FROM user WHERE user_id in (${getUserFollowingIds})`;
  const getUserFollowingNames = await database.all(getUserFollowingNamesQuery);

  response.send(getUserFollowingNames);
});

//The list of all names of people who follows the user
app.get("/user/followers/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}'`;
  const getUserId = await database.get(getUserIdQuery);

  const getUserFollowerIdQuery = `SELECT follower_user_id FROM follower WHERE following_user_id = ${getUserId.user_id}`;
  const getUserFollowerId = await database.all(getUserFollowerIdQuery);

  const userFollowerArray = getUserFollowerId.map((followers) => {
    return followers.follower_user_id;
  });

  const getUserFollowerNameQuery = `SELECT name FROM user WHERE user_id IN (${userFollowerArray})`;
  const getUserFollowerName = await database.all(getUserFollowerNameQuery);

  response.send(getUserFollowerName);
});

const forGeneratingOutput = (tweet, likesCount, repliesCount, dateTime) => {
  return {
    tweet: tweet.tweet,
    likes: likesCount.likes,
    replies: repliesCount.replies,
    dateTime: dateTime.date_time,
  };
};

//List of all tweets of the user
app.get("/user/tweets/", authenticateToken, async (request, response) => {
  const { username } = request;
  const getUserQuery = `SELECT user_id FROM user WHERE username = '${username}'`;
  const getUser = await database.get(getUserQuery);

  const getTweetIdQuery = `SELECT tweet_id FROM tweet WHERE user_id = ${getUser.user_id}`;
  const getTweetId = await database.all(getTweetIdQuery);

  const getTweetArray = getTweetId.map((eachTweetId) => {
    return parseInt(eachTweetId.tweet_id);
  });

  const tweetQuery = `SELECT tweet FROM tweet WHERE tweet_id IN (${getTweetArray})`;
  const tweet = await database.all(tweetQuery);
  const tweetArray = tweet.map((eachTweet) => {
    return eachTweet.tweet;
  });

  const likesQuery = `SELECT count(user_id)AS likes FROM like WHERE tweet_id  IN (${getTweetArray})`;
  const likes = await database.get(likesQuery);

  const repliesQuery = `SELECT count(user_id) AS replies FROM reply WHERE tweet_id IN (${getTweetArray})`;
  const replies = await database.get(repliesQuery);

  const dateTimeQuery = `SELECT date_time FROM tweet WHERE tweet_id IN (${getTweetArray})`;
  const dateTime = await database.all(dateTimeQuery);

  response.send(forGeneratingOutput([tweet], likes, replies, [dateTime]));
});

//Update The user Details
app.put("/user/:name/", authenticateToken, async (request, response) => {
  const { name } = request.params;
  const userDetails = request.body;
  const { name, username } = userDetails;

  const updateUserDetailsQuery = `
      UPDATE
        user
      SET
        name=${name},
        username=${username},
      WHERE
        name = ${name};`;

  await db.run(updateUserDetailsQuery);
  response.send("User Details updated successfully");
});

//Create a tweet in the tweet table
app.post("/user/tweets/", authenticateToken, async (request, response) => {
  let { username } = request;
  const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}'`;
  const getUserId = await database.get(getUserIdQuery);

  const { tweet } = request.body;
  const currentDate = new Date();
  const postRequestQuery = `insert into tweet(tweet, user_id, date_time) values ("${tweet}", ${getUserId.user_id}, '${currentDate}');`;
  const responseResult = await database.run(postRequestQuery);
  const tweet_id = responseResult.lastID;
  response.send("Created a Tweet");
});

//Request to Delete the tweet
app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const { username } = request;

    const getUserIdQuery = `SELECT user_id FROM user WHERE username = '${username}'`;
    const getUserId = await database.get(getUserIdQuery);

    const userTweetsQuery = `SELECT tweet_id FROM tweet where user_id = ${getUserId.user_id}`;
    const userTweets = await database.all(userTweetsQuery);

    const userTweetsArray = userTweets.map((eachTweetId) => {
      return eachTweetId.tweet_id;
    });
    if (userTweetsArray.includes(parseInt(tweetId))) {
      const deleteTweetQuery = `DELETE from tweet where tweet_id = ${tweetId}`;
      await database.run(deleteTweetQuery);

      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);
module.exports = app;
