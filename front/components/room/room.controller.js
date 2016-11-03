export default class roomController {
  constructor($scope) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		var roomCtrl = this;
    roomCtrl.$scope = $scope;
    roomCtrl.roomName = $scope.rootCtrl.roomName;

    roomCtrl.showContent = function($fileContent){
      roomCtrl.content = $fileContent;
      console.log("send code!");
      roomCtrl.room.send(roomCtrl.content);
    };

    roomCtrl.new = function(){
      roomCtrl.content = "";
      console.log("send code!");
      roomCtrl.room.send("");
    };

    roomCtrl.change = function(){
      console.log("changed! send code!");
      roomCtrl.room.send(roomCtrl.content);
    };

    //save code
    roomCtrl.save = function(){
	var link = document.createElement('a');
	link.download = "test.txt";
	link.href = 'data:text,\uFEFF' + roomCtrl.content;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
    };
    // Connect to SkyWay, have server assign an ID instead of providing one
    // Showing off some of the configs available with SkyWay :).
    roomCtrl.peer = new Peer({
      // Set API key for cloud server (you don't need this if you're running your
      // own.
      key: 'fcf65b78-fe22-4ba2-b0d7-77987ac06760'
    });

    // Show this peer's ID.
    roomCtrl.peer.on('open', function(id){
      console.log("peerはconnect")

      navigator.getUserMedia({audio: true, video: false}, function(stream){
          // Set your video displays
          window.localStream = stream;

          console.log(roomCtrl.roomName,"に接続します")
          roomCtrl.room = roomCtrl.peer.joinRoom(roomCtrl.roomName, {mode: 'sfu', stream: stream});

          roomCtrl.room.on('open', function() {
            connect();
          });

      }, function(e){ console.error(e); });

    });

    // Await connections from others
    roomCtrl.peer.on('connection', connect);

    roomCtrl.peer.on('error', function(err) {
      console.log(err);
    });
    // Handle a connection object.
    function connect() {
      console.log("roomに参加できました。")

      roomCtrl.room.on('data', function(message) {
        console.log(message.src + "からのデータ：",message)
        $scope.$apply(function () {
          roomCtrl.content = message.data;
        });
      });

      roomCtrl.room.on('peerJoin', function(peerId) {
        console.log(peerId + 'has joined the room');
      });

      roomCtrl.room.on('peerLeave', function(peerId) {
        console.log(peerId + 'has left the room');
      });

      // Wait for stream on the call, then set peer video display
      roomCtrl.room.on('stream', function(stream){
        const streamURL = URL.createObjectURL(stream);
        const peerId = stream.peerId;

        $('#their-audios').append($(
          '<div class="col-xs-8" id="control_' + peerId + '">' +
          '<div class="panel panel-primary">'+
          '<div class = "panel-heading">' +
            '<h3 id="label_' + peerId + '" class="panel-title">' + 'Student ID :' + stream.peerId + '</h3>' +
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

      roomCtrl.room.on('removeStream', function(removedStream) {
        $('#audio_' + removedStream.peerId).remove();
        $('#label_' + removedStream.peerId).remove();
        $('#control_' + removedStream.peerId).remove();
      });


    }
    // Make sure things clean up properly.
    window.onunload = window.onbeforeunload = function(e) {
      if (!!roomCtrl.peer && !roomCtrl.peer.destroyed) {
        roomCtrl.peer.destroy();
      }
    };
  };
};
