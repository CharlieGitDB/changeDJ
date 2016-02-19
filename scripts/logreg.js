//////////////////////////////////////////////////////////////////////////
//GLOBAL VARIABLES///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
localStorage.hasUserBeenHere;

//////////////////////////////////////////////////////////////////////////
//DOCUMENT READY/////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

$(function(){
  start();
});

//////////////////////////////////////////////////////////////////////////
//INITIATE FUNCTION//////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

function start(){
  isUserAuthenticated();
  loginUser();
  registerUser();
  swapRegisterLoginButtons();
  userView();
  hideHelp();
  //load youtube search api
  $.getScript('http://apis.google.com/js/client.js?onload=init');
};

//////////////////////////////////////////////////////////////////////////
//FUNCTIONS//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////
//LOGIN/REGISTER LOGIC//////////////////////
///////////////////////////////////////////

//checks if user is authenticed aka is the user remembered
function isUserAuthenticated(){
  //hide left option menu
  $('.optionviewleft').hide();

  $('.holdall, .ifRemembered').hide();
  $.ajax({
    method: 'GET',
    url: '/isuserloggedin'
  }).done(function(response){
    if(response == 'yes'){
      //user is remembered
      if(mainPageCounter == 0){
        mainPageLogic();
        mainPageCounter++;
      }
    }else{
      $('.holdall, .ifRemembered').show();
      hasUserBeenHereBefore();
    }
  });
};

  //if the user isnt authenticated then inside of the isUserAuthenticated function this hasUserBeenHereBefore function will be called to choose if login menu or reg menu is shown
  function hasUserBeenHereBefore(){
    $('.regShow, .loginShow, .regerrs, .logerr, .usertaken').hide();
    if(localStorage.hasUserBeenHere == undefined){
      $('.regShow').show();
      $('.regUser').focus();
    }else {
      $('.loginShow').show();
      $('.loginUser').focus();
    }
  };

//function to show and hide login register views
function swapRegisterLoginButtons(){
  $('.swapbtn').on('click', function(event){
    event.preventDefault();
    if($('.regShow').css('display') == 'none'){
      $('.regShow').show();
      $('.regUser').focus();
      $('.ifRemembered :input').val('');
      $('.loginShow').hide();
      $('.regerrs').hide();
    }else{
      $('.regShow').hide();
      $('.loginShow').show();
      $('.loginUser').focus();
    }
  });
};

//function to send the server a request to be registered add a if username and password too long error later
function registerUser(){
  $('.submitreg').on('click', function(event){
    event.preventDefault();
    if($('.passwordRegUser').val() != $('.passwordRegUser2').val()){
      $('.regerrs').text('Passwords must match.');
      $('.regerrs').show();
    }
    if($('.regUser').val().length < 3){
      $('.regerrs').text('Username must be at least 3 characters long.');
      $('.regerrs').show();
    }
    if($('.passwordRegUser').val().length < 5 || $('.passwordRegUser2').val().length < 5){
      $('.regerrs').text('Password be at least 5 characters long.');
      $('.regerrs').show();
    }

    if($('.regUser').val().length >= 3 && $('.passwordRegUser').val().length >= 5 && $('.passwordRegUser2').val().length >= 5 &&  $('.passwordRegUser').val() == $('.passwordRegUser2').val()){
      var regData = {username: $('.regUser').val(), password: $('.passwordRegUser').val()};

      $.ajax({
        method: 'POST',
        url: '/register',
        data: regData
      }).done(function(response){
        if(response == 'registered'){
          $('.holdall, .ifRemembered').hide();
          if(mainPageCounter == 0){
            mainPageLogic();
            mainPageCounter++;
          }
        } else {
          $('.regerrs').text('Username is taken.');
          $('.regerrs').show();
        }
      });
    }
  });
};

//function used to send a request to login to the server
function loginUser(){
  $('.reqLogin').on('click', function(event){
    event.preventDefault();
    var loginData = {remember: $('remembercheckbox').is(':checked'), username: $('.loginUser').val(), password: $('.passwordLoginUser').val()};

    $.ajax({
      method: 'POST',
      url: '/login',
      data: loginData
    }).done(function(response){
      if(response == 'failed'){
        $('.logerr').show();
        $('.ifRemembered :input').val('');
        $('.loginUser').focus();
      }else {
        $('.holdall, .ifRemembered').hide();
        if(mainPageCounter == 0){
          mainPageLogic();
          mainPageCounter++;
        }
      }
    });
  });

};

function hideHelp(){
  $('.helppagebg').hide();
  $('.helpclasscontent').hide();
}

//set up youtube api key
function init() {
  gapi.client.setApiKey();//not for you
  gapi.client.load('youtube', 'v3', function(){
  });
};
