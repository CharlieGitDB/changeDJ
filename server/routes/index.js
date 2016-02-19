var express = require("express");
var router = express.Router();
var path = require("path");
var passport = require('passport');
var User = require('../../models/user');
var Playlist = require('../../models/playlist');
var app = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);

router.use("/", express.static(path.join(__dirname, "../public")));

router.get("/", function(request,response){
    response.sendFile(path.join(__dirname, "../public/views/index.html"));
});

//client calls as soon as the page loads to ask if the users session is still valid
router.get('/isuserloggedin', function(request, response){
    if(request.isAuthenticated() == true){
      response.send('yes');
    } else {
      response.send('no');
    }
});

////////////////////////////
//PASSPORT/////////////////
//////////////////////////
router.get('/main', function(request, response){
  response.send('success');
});

router.get('/fail', function(request, response){
  response.send('failed');
});

router.post('/register', function(request,response,next) {
  console.log(request.body);
   User.create(request.body, function (err, post) {
       if (err){
         console.log(err);
        response.send('error');
       }
       else {
         response.send('registered');
       }
   })
});

//logs out the user when they click logout on the client side aka ends their cookie session also it redirects them back to the starting page from the client side
router.get('/logout', function(request,response){
  request.logout();
  response.send('logged out');
});

//need to lockout user after a certain amount of fails
router.post('/login', passport.authenticate('local', {failureRedirect: '/fail'}), function(request, response){
  //if the user wants to be remembered then they have a valid cookie session for 30 days otherwise their session lasts for until they close the window
  if(request.body.remember == true){
    request.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  }else{
    request.session.cookie.expires = false;
  }
  response.redirect('/main');
});

////////////////////////////
//MAIN AJAX////////////////
//////////////////////////
router.get('/userinformation', function(request, response){
  response.send(request.user);
});

//when user gets to main page grab their playlist from the database then send it to the client to be loaded
router.post('/getuserplaylist', function(request, response){
  var idToSend = request.body.userId;
  Playlist.findOne({userId: idToSend}, function(err, playlist){
    response.send(playlist);
  });
});

//post a new song to playlist then send back new playlist information
router.post('/addsongtoplaylist', function(request, response){
  var songToAddToPlaylistId = request.body.userId;
  var songToAddToPlaylist = request.body.songs;
  Playlist.findOneAndUpdate({userId: songToAddToPlaylistId}, {$push:{'songs': {songName: songToAddToPlaylist.songName, songId: songToAddToPlaylist.songId, imgUrl: songToAddToPlaylist.imgUrl}}}, {safe: true, upsert: true, new: true}, function(err, playlist){
    if(err){
      console.log(err, 'outer err');
    }
    response.send(playlist);
  });
});

router.post('/removesong', function(request, response){
  Playlist.update({userId: request.body.userId}, {$pull: {songs: {songId: request.body.songId}}}, {safe: true}, function(err){
    if(err){
      console.log(err)
    }else{
      Playlist.findOne({userId: request.body.userId}, function(err, playlist){
        response.send(playlist);
      });
    };
  });
});

router.post('/movesongtotop', function(request, response){
  moveToFirst(request, response);
});

//function to move a selected song from the client to first on the list, this works by removing it and readding it.
function moveToFirst(songObject, response){
  var storedSong = songObject.body;
  Playlist.update({userId: storedSong.userId}, {$pull: {songs: {songId: storedSong.songs.songId}}}, {safe: true}, function(err){
    if(err){
      console.log(err)
    }else{
      Playlist.findOneAndUpdate({userId: storedSong.userId}, {$push:{'songs': {songName: storedSong.songs.songName, songId: storedSong.songs.songId, imgUrl: storedSong.songs.imgUrl}}}, {safe: true, upsert: true, new: true}, function(err, playlist){
        if(err){
          console.log(err);
        }
        response.send(playlist);
      });
    };
  });
}

module.exports = router;
