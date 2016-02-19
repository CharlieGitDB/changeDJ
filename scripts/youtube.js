//this could easily have been done with jQuery's $.getScript, but I feel like following the documentation
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//frequently updated global variables that will hold the current video id and current time all users are on, held on the client side
var joinVideo;
var joinTime;

//when initally connecting the server will tell you the current video in the queue and the current video time
socket.on('current playing data', function(songData){
  joinVideo = songData.songlist;
  joinTime = songData.songtime;
});

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    // height: '390',
    // width: '640',
    height: $('.mainrightcontainer').width() / 2,
    width: $('.mainrightcontainer').width(),
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    },
    playerVars: {
      controls: 0,
      disabled: 1
    }
  });
  console.log(joinVideo, 'from youtube');
  console.log(joinTime, 'from youtube')
}

var currentSongTimeTimer;

//every second the video is playing tell the time of where your video is
function sendCurrentTime(){
  currentSongTimeTimer = setInterval(function(){
    var currentSongTime = player.getCurrentTime();

    socket.emit('current time of video', currentSongTime);
  }, 1000);
}

//when a song ends clear the server side video timer and tell client to stop sending current time
function clearCurrentTime(){
  clearInterval(currentSongTimeTimer);
  socket.emit('clear current time of video');
}

//play the next song
function playNextSong(){
  socket.emit('play next song');
}

//when player has error
function onPlayerError(event){
  console.log(event);
  socket.emit('user video error');
}

//when player is ready
function onPlayerReady(event) {
  //if there is a video playing and a current time play that video and join that time
  if(joinVideo && joinTime != undefined){
    playSong(joinVideo, Math.floor(joinTime) + 5);
  }else{
    console.log('nothing to play');
  }
}

//on player state change like when the video starts or stops
function onPlayerStateChange(event){
  if(event.data === 0){
    clearCurrentTime();
    playNextSong();
  }

  if(event.data === 1){
    console.log('playing');
    //set video text to video title
    $('.videoTitleSpan').text(player.getVideoData().title);

    //tell the server your current video time
    sendCurrentTime();
  }
}

//function to play a song;
function playSong(id, seconds){
  player.loadVideoById({'videoId': id, 'startSeconds': seconds});
}

//server tells client to play video
socket.on('song play from server', function(songId){
  playSong(songId, 0);
});
