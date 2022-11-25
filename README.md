CRUD Operations:
    
    
    A basic project with Authentication and perform CRUD operations on the following tables in the given database using NodeJS
    
    
//User Table

Column	    Type

user_id	    INTEGER
name	    TEXT
username	TEXT
password	TEXT
gender	    TEXT


//Follower Table

Column	            Type

follower_id	        INTEGER
follower_user_id	INTEGER
following_user_id	INTEGER


//Tweet Table

Column	    Type

tweet_id	INTEGER
tweet	    TEXT
user_id	    INTEGER
date_time	DATETIME


//Reply Table

Column	    Type

reply_id	INTEGER
tweet_id	INTEGER
reply	    TEXT
user_id	    INTEGER
date_time	DATETIME


//Like Table

Column	    Type

like_id	    INTEGER
tweet_id	INTEGER
user_id	    INTEGER
date_time	DATETIME

//Sample Valid User Credentials

{
  "username":"JoeBiden",
  "password":"biden@123"
}
