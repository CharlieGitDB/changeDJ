/////////////////////////////////////////////
//MAIN PAGE LOGIC///////////////////////////
///////////////////////////////////////////

//////////////////////////////////
//MP GLOBAL VARIABLES////////////
////////////////////////////////

//global variable to store users unique information
var userInfo;
//global variable to store users playlist
var userPlaylist;
//global variable to store the websocket functionality
var socket;
//global variable to count how many times mainPageLogic is called, it should only ever be one
var mainPageCounter = 0;

//main page logic is encapsolated by a function that is called once the user is authenticated
function mainPageLogic(){

  //////////////////////////////////
  //MP START UP LOGIC//////////////
  ////////////////////////////////

  //make connection to websocket
  socket = io();

  //get youtube logic
  $.getScript('/scripts/youtube.min.js');

  //Grab DJs in queue from server
  socket.on('current dj', function(userName){
    $('.queuebox').text(userName);
  });

  //when user disconnects
  socket.on('user disconnect', function(){
    socket.emit('ids from client', userInfo.username);
  });

  //update css to show current playing song
  var songCountCss = 0;
  socket.on('update current song css', function(userName){
    console.log(userName);
    if(userName == userInfo.username){
      if(songCountCss == 0){
        $('.playlistviewlist').children().eq(songCountCss).css('background-color', '#56C247');
        songCountCss++;
      }else{
        $('.playlistviewlist').children().css('background-color', '#34509D');
        $('.playlistviewlist').children().eq(songCountCss).css('background-color', '#56C247');
        songCountCss++;
      }
    };
  });

  //what to do when user has played their entire playlist
  socket.on('user playlist finished', function(userName){
    console.log(userName, 'hit');
    if(userName == userInfo.username){
      songCountCss = 0;
      $('.leavedjqueue').hide();
      $('.joindjqueue').show();
      $('.playlistviewlist').children().css('background-color', '#34509D');
    }
  });

  //update the user list
  socket.on('user wants userlist', function(userList){
    console.log('hit');
    $('.userlistoptionview').empty();
    for(var i = 0; i<userList.length; i++){
      $('.userlistoptionview').append('<li class="userlistitem innersearchdiv">'+userList[i]+'</li>');
    }
  });

  //switch users after list end
  socket.on('switch users', function(){
    clearCurrentTime();
    playNextSong();
  });

  //make the playlist view the default starting view
  $('.playlistoptionview').show();

  //give jQuery a global variable with the users information to work with also retrieve their playlist
  $.ajax({
    method: 'GET',
    url: '/userinformation',
  }).done(function(response){
    userInfo = response;

    var userIdToSend = {userId: userInfo.username};
    $.ajax({
      method: 'POST',
      url: '/getuserplaylist',
      data: userIdToSend
    }).done(function(response){
      if(response.length != 0){
        updatePlaylist(response);
        //once we have the username send it through the web socket
        socket.emit('user wants userlist', userInfo.username);
      }
    });
  });

  //////////////////////////////////
  //HEADER MENU LOGIC//////////////
  ////////////////////////////////

  //function to log out user which tells the server to end their cookie sessions
  $('.logOutBtn').on('click', function(){
    $.ajax({
      method: 'GET',
      url: '/logout',
    }).done(function(response){
      if(response == 'logged out'){
        //once logged out just refresh the page.. could do this another way but this is the simplest at the moment
        location.reload();
      }
    });
  });

  //////////////////////////////////
  //LEFT MENU LOGIC////////////////
  ////////////////////////////////

  $('.leftcontaineroptionbtn').on('click', function(){
    $('.playlistcontainerbtn').addClass('orlogregbtn');
    $('.addsongcontainerbtn').addClass('orlogregbtn');
    $('.userscontainerbtn').addClass('orlogregbtn');
    $('.chatboxcontainerbtn').addClass('orlogregbtn');
    $(this).removeClass('orlogregbtn');
    if($(this).prev().text() == 'Add Song'){
      $('.optionviewleft').hide();
      $('.userlistoptionview').show();
      socket.emit('user list update');
    }else if($(this).prev().text() == 'Playlist'){
      $('.optionviewleft').hide();
      $('.addsongoptionview').show();
      $('.addsongsearch').focus();
    }else if($(this).prev().text() == 'Users List'){
      $('.optionviewleft').hide();
      $('.chatboxoptionview').show();
      $('.chatboxcontainerbtn').text('Chat');
    }else{
      $('.optionviewleft').hide();
      $('.playlistoptionview').show();
    }
  });

  //////////////////////////////////
  //PLAYLIST LOGIC/////////////////
  ////////////////////////////////

  //function that updates playlist, called by multiple requests
  function updatePlaylist(response){
    $('.playlistoptionview').empty();
    if(response.songs.length == 0){
      $('.playlistoptionview').text('You currently have no songs in your playlist.');
    }else{
      userPlaylist = response.songs;
      $('.playlistoptionview').append('<ul class="playlistviewlist"></ul>');
      var songIdData = 0;
      //this moves in reverse because the songs are played by move recent added to least recent
      for(var i = userPlaylist.length - 1; i > -1; i--){
        $('.playlistviewlist').append('<li class="playlistviewlistitem innersearchdiv"><div class="movesongtofirst option" id="movesongtofirst'+songIdData+'">&#8593;</div><div class="removesongbtn orlogregbtn" id="removesongbtn'+songIdData+'">-</div><img src="'+userPlaylist[i].imgUrl+'" class="playlistimg"/><br><span class="songnameplaylistitem">'+userPlaylist[i].songName+'</span></li>');
        $('#removesongbtn'+songIdData).data('songId', userPlaylist[i].songId);
        $('#movesongtofirst'+songIdData).data('song', userPlaylist[i]);
        songIdData++;
      }
      $('.movesongtofirst').hide();
    };
  }

  //when remove song btn is clicked tell server
  $('body').on('click', '.removesongbtn', function(){
    console.log($(this).parent().index());

    var userIdandSongId = {userId: userInfo.username, songId: $(this).data('songId')};
    $.ajax({
      method: 'POST',
      url: '/removesong',
      data: userIdandSongId
    }).done(function(response){
        updatePlaylist(response);
    });
  });

  //function to move songs to top of the playlist
  $('body').on('click', '.movesongtofirst', function(){
    var idAndSongToSend = {userId: userInfo.username, songs: $(this).data('song')};
    $.ajax({
      method: 'POST',
      url: '/movesongtotop',
      data: idAndSongToSend
    }).done(function(response){
      console.log(response);
      updatePlaylist(response);
    });
  });

  //functions to show move to top buttons/////
  $('body').on('mouseenter', '.playlistviewlistitem', function(){
    if($(this).index() != 0){
      $(this).children(':first-child').show();
      $(this).children(':nth-child(3)').css({'margin-left': '1px'});
    }
  });
  $('body').on('mouseleave', '.playlistviewlistitem', function(){
    $('.movesongtofirst').hide();
    $('.playlistimg').css({'margin-left': '55px'});
  });
  /////////////////////////////////////


  //////////////////////////////////
  //ADD SONG LOGIC/////////////////
  ////////////////////////////////

  //global variable for array that holds searched song ids
  var songIdArray = [];
  var imgUrlArray = [];

  //allows user to search for songs thne appends the results to the dom
  $('.addsongsearch').on('keyup', function(e){
    e.preventDefault();
    if(e.which == 13){
      //clear the array if it had previous ids in it
      songIdArray = [];
      imgUrlArray = [];
      $('.searchvideosholder').empty();
      var request = gapi.client.youtube.search.list({
        part: 'snippet',
        type: 'video',
        q: encodeURIComponent($(".addsongsearch").val()).replace(/%20/g, "+"),
        maxResults: 10,
        order: 'viewCount'
      });
      request.execute(function(response){
        for(i = 0; i < response.items.length; i++){
          songIdArray.push(response.items[i].id.videoId);
          imgUrlArray.push(response.items[i].snippet.thumbnails.default.url);
          //adding image urls to the db
          $('.searchvideosholder').append('<div class="searchedvideodiv"><div class="addsong2pl btn">+</div><div class="innersearchdiv"><img src="'+ response.items[i].snippet.thumbnails.default.url+'" class="centersearchimg"/><div class="clearfix"></div><span class="searchedvideotitle">'+response.items[i].snippet.title+'</span></div></div>');
        }
      });
      $('.addsongsearch').val('');
    }
  });

  //sends song info to the server which then goes to the database to save their new song to their playlist then updates the playlist view
  $('body').on('click', '.addsong2pl', function(e){
    e.preventDefault();

    var theSpecificVideoDiv = $(this).parent().children();
    var theSpecificVideoText = $(this).parent().find('.searchedvideotitle');
    var theSpecificImage = $(this).parent().find('.centersearchimg');
    var theSpecificButton = $(this).parent().find('.addsong2pl');

    //remove plus sign from text
    var songNameTrimmed = $(this).parent().text().substring(1);

    //create song object relative to the position it is appended with the index of the song id's array
    var idAndSongToAddToPlaylist = {userId: userInfo.username, songs: { songName: songNameTrimmed, songId: songIdArray[$(this).parent().index()], imgUrl: imgUrlArray[$(this).parent().index()] } };

    //send to server
    $.ajax({
      method: 'POST',
      url: '/addsongtoplaylist',
      data: idAndSongToAddToPlaylist
    }).done(function(response){
      theSpecificVideoDiv.css('background', '#56C247');
      theSpecificImage.css('margin', '0px');
      theSpecificVideoText.text('Added to playlist!');
      theSpecificButton.hide();
      updatePlaylist(response);
    });
  });

  //////////////////////////////////
  //JOIN DJ LOGIC//////////////////
  ////////////////////////////////
  $('body').on('click', '.joindjqueue', function(){
    $('.joindjqueue').hide();
    $('.leavedjqueue').show();
    socket.emit('user wants to join dj list', userInfo.username);
  });

  //////////////////////////////////
  //LEAVE DJ LOGIC/////////////////
  ////////////////////////////////
  $('body').on('click', '.leavedjqueue', function(){
    $(this).hide();
    $('.joindjqueue').show();
    socket.emit('leave dj list', userInfo.username);
    $('.playlistviewlist').children().css('background-color', '#34509D');
    songCountCss = 0;
  });

  //////////////////////////////////
  //CHAT LOGIC/////////////////////
  ////////////////////////////////
  $('.messageinput').on('keyup', function(e){
    e.preventDefault();
    if(e.which == 13){
      var userNameAndMsg = {userId: userInfo.username, msg: $(this).val()};
      socket.emit('user chat message', userNameAndMsg);
      $(this).val('');
    }
  });

  socket.on('user chat message', function(idmsg){
    $('.messagesholder').append('<li><span class="usernamemsg">'+idmsg.userId+'</span>: '+idmsg.msg+'</li>');
    $('.chatbody').scrollTop($('.messagesholder').height());
    if($('.chatboxcontainerbtn').css('display') != 'none' && $('.chatboxoptionview').css('display') == 'none'){
      $('.chatboxcontainerbtn').text('Chat *');
    }
  });

  //////////////////////////////////
  //HELP LOGIC/////////////////////
  ////////////////////////////////
  var helpCount = 0;
  $('.helpBtn').on('click', function(){
    $('.helppagebg').show();
    $('.helpclasscontent').show();
    $('.steptwo').hide();
    $('.stepthree').hide();
    $('.stepfour').hide();
    $('.backbtn').hide();
  });

  $('.forwardbtn').on('click', function(){
    helpCount++;
    if(helpCount == 1){
      $('.stepone').hide();
      $('.steptwo').show();
      $('.backbtn').show();
    }
    if(helpCount == 2){
      $('.stepone').hide();
      $('.steptwo').hide();
      $('.stepfour').hide();
      $('.stepthree').show();
    }
    if(helpCount == 3){
      $('.stepthree').hide();
      $('.stepfour').show();
    }
    if(helpCount > 3){
      $('.stepfour').hide();
      $('.backbtn').hide();
      $('.stepone').show();
      helpCount = 0;
    }
  });
  $('.backbtn').on('click', function(){
    helpCount--;
    if(helpCount == 0){
      $('.stepone').show();
      $('.backbtn').hide();
      $('.steptwo').hide();
    }
    if(helpCount == 1){
      $('.steptwo').show();
      $('.stepone').hide();
      $('.stepthree').hide();
    }
    if(helpCount == 2){
      $('.stepthree').show();
      $('.stepfour').hide();
    }
  })

  $('body').on('click', '.helppagebg', function(){
    $(this).hide();
    $('.helpclasscontent').hide();
  });
}
