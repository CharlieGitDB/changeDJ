function userView(){
  $('.chatboxcontainerbtn').hide();
  $('.djqueuelower').hide();

  function setLargeView(){
    $('.chatboxcontainerbtn').hide();
    $('.djqueuelower').hide();
    $('.chatboxoptionview').hide();
    $('.chatbox').show();
    $('.djqueueupper').show();
    $('.chatbody').css({
      'width': '100%',
      'background': 'white',
      'height': '200px',
      'overflow-y': 'scroll'
    });
    $('.leftcontaineroptioncontainer').css({
      'text-align': 'center',
      'margin-top': '10px',
      'background': '#34509D',
      'border-radius': '5px',
      'padding': '10px'
    });
    $('#player').css({
      'width': $('.mainrightcontainer').width(),
      'height': $('.mainrightcontainer').width() / 2
    });
    if($(window).width() > 1180){
      $('.chatboxcontainerbtn').hide();
      $('.leftcontaineroptionbtn').css({
        'width': '31.7%',
        'display': 'inline-block',
        'float': 'left'
      });
    }else{
      $('.chatboxcontainerbtn').hide();
      $('.leftcontaineroptionbtn').css({
        'width': '100%',
        'display': 'block',
        'float': 'none'
      });
    }
  }

  function setSmallView(){
    $('.chatboxcontainerbtn').show();
    $('.djqueuelower').show();
    $('.chatbox').hide();
    $('.djqueueupper').hide();

    var playlistContainerHeight = $(window).height() - 180;
    var searchVideoHeight = $(window).height() - 245;
    var chatboxContainerHeight = $(window).height() - 180;
    var chatBodyHeight = $(window).height() - 240;
    $('.leftcontaineroptioncontainer').css({
      'margin-top': '0px',
    });

    $('.playlistoptionview').css({
      'max-height': playlistContainerHeight
    });

    $('.userlistoptionview').css({
      'max-height': playlistContainerHeight
    });

    $('.searchvideosholder').css({
      'max-height': searchVideoHeight
    });

    $('.chatboxoptionview').css({
      'min-height': chatboxContainerHeight,
      'max-height': chatboxContainerHeight
    });

    $('.chatbody').css({
      'height': chatBodyHeight
    });

    $('#player').css({
      'width': $('.mainrightcontainer').width(),
      'height': $('.mainrightcontainer').width() / 2
    });

    if($(window).width() > 1180){
      $('.leftcontaineroptionbtn').css({
        'width': '23.3%',
        'display': 'inline-block',
        'float': 'left'
      });
    }else{
      $('.leftcontaineroptionbtn').css({
        'width': '100%',
        'display': 'block',
        'float': 'none'
      });
    }
  }

  if($(window).height() < 850){
    setSmallView();
  }

  $(window).resize(function(){
    if($(window).height() < 850){
      setSmallView();
    }
  });

  $(window).resize(function(){
    if($(window).height() > 850){
      setLargeView();
      $('.chatboxcontainerbtn').hide();
    }
  });
}
