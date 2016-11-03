myApp.controller("studentController", Controller);

function Controller($scope) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  var studentCtrl = this;

  studentCtrl.roomName = $scope.indexCtrl.roomName;

  // Connect to SkyWay, have server assign an ID instead of providing one
  // Showing off some of the configs available with SkyWay :).
  studentCtrl.peer = new Peer({
    // Set API key for cloud server (you don't need this if you're running your
    // own.
    key: 'fcf65b78-fe22-4ba2-b0d7-77987ac06760'
  });

  // Show this peer's ID.
  studentCtrl.peer.on('open', function(id){
    console.log("peerはconnect")

    navigator.getUserMedia({audio: true, video: false}, function(stream){
        // Set your video displays
        window.localStream = stream;

        console.log($scope.indexCtrl.roomName,"に接続します")
        studentCtrl.room = studentCtrl.peer.joinRoom($scope.indexCtrl.roomName, {mode: 'sfu', stream: stream});

        studentCtrl.room.on('open', function() {
          connect();
        });

    }, function(e){ console.error(e); });

  });

  // Await connections from others
  studentCtrl.peer.on('connection', connect);

  studentCtrl.peer.on('error', function(err) {
    console.log(err);
  });

  // Handle a connection object.
  function connect() {
    console.log("roomに参加できました。")

    studentCtrl.room.on('data', function(code) {
      console.log("先生からのコードデータ：",code)
      $scope.$apply(function () {
            studentCtrl.content = code.data;
      });
      console.log(studentCtrl.content)
    });

    studentCtrl.room.on('peerJoin', function(peerId) {
      console.log('<div><span class="peer">' + peerId + '</span>: has joined the room </div>');
    });

    studentCtrl.room.on('peerLeave', function(peerId) {
      console.log('<div><span class="peer">' + peerId + '</span>: has left the room </div>');
    });

    // Wait for stream on the call, then set peer video display
    studentCtrl.room.on('stream', function(stream){
      const streamURL = URL.createObjectURL(stream);
      const peerId = stream.peerId;

      $('#their-audios').append($(
        '<div class="col-xs-8" id="control_' + peerId + '">' +
        '<div class="panel panel-primary">'+
        '<div class = "panel-heading">' +
          '<h3 id="label_' + peerId + '" class="panel-title">' + 'Teacher ID :' + stream.peerId + '</h3>' +
          '<audio autoplay="autoplay" class="remoteAudios" src="' + streamURL + '" id="audio_' + peerId + '">' +
        '</div>' + 
        '<div class="panel-body">' +
          '<button onclick="document.getElementById('+"'"+'audio_' + peerId  +"'"+').play()" class="mdl-button mdl-js-button mdl-button--raised">Play</button>' +
          '<button onclick="document.getElementById('+"'"+'audio_' + peerId  +"'"+').pause()" class="mdl-button mdl-js-button mdl-button--raised">Pause</button>' +
          '<button onclick="document.getElementById('+"'"+'audio_' + peerId  +"'"+').volume+=0.1" class="mdl-button mdl-js-button mdl-button--raised">Volume Up</button>' +
          '<button onclick="document.getElementById('+"'"+'audio_' + peerId  +"'"+').volume-=0.1" class="mdl-button mdl-js-button mdl-button--raised">Volume Down</button>' +
        '</div>' + 
        '</div>' +
        '</div>'
        ));
    });

    studentCtrl.room.on('removeStream', function(removedStream) {
      $('#audio_' + removedStream.peerId).remove();
      $('#label_' + removedStream.peerId).remove();
      $('#control_' + removedStream.peerId).remove();
    });

  };

  // Make sure things clean up properly.
  window.onunload = window.onbeforeunload = function(e) {
    if (!!studentCtrl.peer && !studentCtrl.peer.destroyed) {
      studentCtrl.peer.destroy();
    }
  };
}