var express = require("express");
var path = require("path");
var index = require("./routes/index");
var bodyParser = require("body-parser");
var passport = require('passport');
var session = require('express-session');
var User = require('../models/user');
var Playlist = require('../models/playlist');
var localStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(session({
   secret: 'secret',
   key: 'user',
   resave: true,
   saveUninitialized: false,
   cookie: { maxAge: 60000, secure: false }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(passport.initialize());
app.use(passport.session());


app.use("/", index);

//////////////////////////////////////////////////////
//MONGO/MONGOOSE/////////////////////////////////////
////////////////////////////////////////////////////
var mongoURI = "mongodb://localhost:27017/changedj";
var MongoDB = mongoose.connect(mongoURI).connection;

MongoDB.on('error', function (err) {
   console.log('mongodb connection error', err);
});

MongoDB.once('open', function () {
 console.log('mongodb connection open');
});


/////////////////////////////////////////////////////
//PASSPORT//////////////////////////////////////////
///////////////////////////////////////////////////
passport.serializeUser(function(user, done) {
   done(null, user.id);
});

passport.deserializeUser(function(id, done) {
   User.findById(id, function(err,user){
       if(err) done(err);
       done(null,user);
   });
});

passport.use('local', new localStrategy({
       passReqToCallback : true,
       usernameField: 'username'
   },
function(req, username, password, done){
   User.findOne({ username: username }, function(err, user) {
       if (err) throw err;
       if (!user)
           return done(null, false, {message: 'Incorrect username and password.'});

       // test a matching password
       user.comparePassword(password, function(err, isMatch) {
           if (err) throw err;
           if(isMatch)
               return done(null, user);
           else
               done(null, false, { message: 'Incorrect username and password.' });
       });
   });
}));

/////////////////////////////////////////////////////
//SOCKET.IO/////////////////////////////////////////
///////////////////////////////////////////////////
//users connected counter
var usersConnected = 0;

//dj in queue
var djList = [];

//users song list count
var songCounter = [];

//counter to keep track of which user we are on
var userIndex = 0;

//current time of video playing
var currentSongTime = 0;

//variable to count how many users requested to remove video
var removeRequests = 0;

//is users video playing or does it have an error count
var usersWithErrors = 0;

//tempArray global to hold temporary user names
var tempArray = [];

// array to hold all of the users that respond back after a disconnect
var tempUserHolder = [];

//array to temporary hold the song counter of users that are still connected
var tempSongCounter = [];

//array to hold the user list
var userList = [];

//temp array to hold users after once disconnects
var tempUserList = [];

io.on('connection', function(socket){

  usersConnected++;
  console.log('user connected ||', 'User Count:', usersConnected);

  //when user joins give the client the information the server currently has, atm this is only the dj list
  if(userIndex == djList.length && userIndex != 0){
    io.emit('current dj', djList[userIndex-1]);
  }else if(djList.length != 0){
    io.emit('current dj', djList[userIndex]);
  }

  //update user list when new users join
  socket.on('user wants userlist', function(userName){
    if(isInArray(userName, userList) != true){
      userList.push(userName);
      socket.emit('user wants userlist', userList);
    }else{
      socket.emit('user wants userlist', userList);
    }
  });
  socket.on('user list update', function(){
    console.log('hit ulu');
    socket.emit('user wants userlist', userList);
  });

  socket.on('disconnect', function(){
    usersConnected--;
    console.log('user disconnected ||', 'User Count:', usersConnected);
    //tell all clients to send down their ids
    io.emit('user disconnect');
    if(djList.length == 0){
      io.emit('current dj', 'There is currently no one playing music.');
    }
  });

  //when a user disconnects if they were in the dj list they will be removed from djing or if they click the leave dj list button they will also be removed
  socket.on('ids from client', function(userId){
    var songPosition = djList.indexOf(userId);
    if(songPosition != -1){
      var tempSongC = songCounter[songPosition];
      tempSongCounter.push(tempSongC);
    }

    tempUserHolder.push(userId);
    if(isInArray(userId, djList) == true){
      tempArray.push(userId);
    };

    if(tempUserHolder.length == usersConnected){
      console.log(djList, 'before hit');
      if(tempArray != djList){
        djList = tempArray;
        console.log(djList, 'after hit');
        tempUserHolder = [];
        tempArray = [];
        songCounter = tempSongCounter;
      }
    }

    //update user list
    tempUserList.push(userId);
    if(tempUserList.length == usersConnected){
      userList = tempUserList;
      socket.emit('user wants userlist', userList);
      tempUserList = [];
    }
  });

  function removeTheUser(userId){
    var removeUser = djList.indexOf(userId);
    console.log(djList.indexOf(userId));
    if(removeUser != -1) {
    	djList.splice(removeUser, 1);
      console.log(djList);
    }
    if(removeUser != -1){
      songCounter.splice(removeUser, 1);
      console.log(songCounter);
    }
    if(djList.length == 0){
      io.emit('current dj', 'There is no one currently playing music.');
    }
  }

  socket.on('leave dj list', function(userId){
    removeTheUser(userId);
  });

  //if there is no one djing then dont send anything, other wise get the new user into the music I may make them wait until the video is over im not sure
  if(currentSongTime == 0){
    console.log('nothing to send');
  }else{
    //if the index has already moved to the first dj, but the song isnt over yet move the index back to the previous dj otherwise play normal
    if(userIndex == djList.length && userIndex != 0){
      var tempUserIndex = userIndex - 1;
      Playlist.find({userId: djList[tempUserIndex]}, function(err, playlist){
        var currentSongData = {songlist: playlist[0].songs[songCounter[tempUserIndex]].songId, songtime: currentSongTime};
        io.emit('current playing data', currentSongData);
      });
    }else{
      Playlist.find({userId: djList[userIndex]}, function(err, playlist){
        var currentSongData = {songlist: playlist[0].songs[songCounter[userIndex]].songId, songtime: currentSongTime};
        io.emit('current playing data', currentSongData);
      });
    }
  }

  //function to check if value is inside of an array
  function isInArray(value, array) {
    return array.indexOf(value) > -1;
  }

  //tells the user to update their playlist css
  function updatePlaylistCss(){
    // var userIdAndSong = {userId: djList[userIndex], songNumber: songCounter[userIndex]};
    var userId = djList[userIndex];
    io.emit('update current song css', userId);
  }

  //when user joins queue
  socket.on('user wants to join dj list', function(userId){
    if(isInArray(userId, djList) == true){
      console.log('already in the list');
    }else{
      Playlist.find({userId: userId}, function(err, playlist){
        try{
          //if song exists and no djs are playing in the list currently then add them to list and play their song
          djList.push(userId);

          //because users will have different sized playlists give them their own unique playlist count
          var userPlaylistCount = playlist[0].songs.length -1;
          songCounter.push(userPlaylistCount);

          if(djList.length == 1){
            io.emit('song play from server', playlist[0].songs[songCounter[userIndex]].songId);
            io.emit('current dj', userId);

            updatePlaylistCss();

            userIndex++;
          }
        }catch(err){
            //if user doesnt have any songs remove user from dj list, will also want to send up an error message at some point telling the user they need to add songs to dj
            console.log('user doesnt have any songs');
            djList.pop();
            songCounter.pop();
        }
      });
    }
  });

  //when user has error on client side they are removed from the remove request quota
  socket.on('user video error', function(){
      usersWithErrors++;
  });

  //set the current time of the video data
  socket.on('current time of video', function(time){
    //maybe add if their time sent in is 30 seconds or more behind the currentsongtime they are minused from counting in the remove request == usersconnected-userswitherrors evaluation also add time limitations
    if(currentSongTime < time){
      currentSongTime = time;
    }
  });

  //turn current video time back to zero to let server know there is no video playing
  socket.on('clear current time of video', function(){
    currentSongTime = 0;
  });

  socket.on('play next song', function(){
    removeRequests++;
    var usersConMinusUsersErr = usersConnected - usersWithErrors;
    //if the amount of users with out errors videos are finished then move onto next video
    if(removeRequests == usersConMinusUsersErr){
      //if all the users in the dj list have gone, move back to the first dj
      if(userIndex == djList.length){
        userIndex = 0;
        updatePlaylistCss();
        songCounter[userIndex]--;
        Playlist.find({userId: djList[userIndex]}, function(err, playlist){
          try{
            io.emit('song play from server', playlist[0].songs[songCounter[userIndex]].songId);
            io.emit('current dj', djList[userIndex]);
            userIndex++;
          }catch(err){
            playlistFinished();
            //need to shift to next user after
          }
        });
      }else{
        Playlist.find({userId: djList[userIndex]}, function(err, playlist){
          try{
            io.emit('song play from server', playlist[0].songs[songCounter[userIndex]].songId);
            io.emit('current dj', djList[userIndex]);
            updatePlaylistCss();
            songCounter[userIndex]--;
            userIndex++;
          }catch(err){
            playlistFinished();
            //need to shift to next user after
          }
        });
      }
      removeRequests = 0;
      usersWithErrors = 0;
    }
  });

  function playlistFinished(){
    io.emit('user playlist finished', djList[userIndex]);
    removeTheUser(djList[userIndex]);g
    if(djList.length != 0){
      io.emit('switch users');
    }
  }

  ////////////////////////////////////////////////////////////////////
  //CHAT LOGIC///////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  var messageDB = [];
  socket.on('user chat message', function(idandmsg){
    if(messageDB.length == 100){
      messageDB = [];
      messageDB.unshift(idandmsg);
      io.emit('user chat message', messageDB[0]);
    }else{
      messageDB.unshift(idandmsg);
      io.emit('user chat message', messageDB[0]);
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
