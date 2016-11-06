export default class roomController {
  constructor($scope,$http,$stateParams,$state) {

    String.prototype.unescapeHtml = function(){
        return this.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "\'");
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    this.$scope = $scope;
    this.$http = $http;
    this.$stateParams = $stateParams;
    this.$state = $state;
    this.roomMember = 1;
    this.roomName = $scope.rootCtrl.roomName;
    if(!$scope.rootCtrl.roomName){
      $state.go('root.main');
    }
    this.code = {
      "name" : "new file",
      "content" : ""
    };
    this.modes = [
      {"lang" : "javascript", "ex" : "js"},
      {"lang" : "python", "ex" : "py"},
      {"lang" : "ruby", "ex" : "rb"}
    ];
    this.themes = ["midnight","neo","eclipse"];
    this.theme = this.themes[0];
    this.mode = this.modes[0];
    this.editorOptions = {
        "lineWrapping" : true,
        "lineNumbers": true,
        "mode": this.mode.lang,
        "theme": this.theme,
        "extraKeys": {"Ctrl-Space":"autocomplete"}
    };
    this.former = "";
    this.pastCursor = {"line": 0, "ch": 0};
    this.peer = new Peer({
      // Set API key for cloud server (you don't need this if you're running your
      // own.
      key: '91f325de-7cf5-4036-be2b-8ebd0a5a5e17'
    });
    // Show this peer's ID.
    this.peer.on('open', (id) => {
      console.log("peerはconnect")
      navigator.getUserMedia(
        {audio: true, video: true},
        (stream) => {
            // Set your video displays
            window.localStream = stream;
            const streamURL = URL.createObjectURL(stream);
            const myPeerId = id;
            $('.videos').append($(
                '<video id="video_' + myPeerId + '" class="videoBox" width="300" height="200" autoplay="autoplay" class="remoteVideos" src="' + streamURL + '" > </video> <br>'
            ));
            console.log(this.roomName,"に接続します")
            this.room = this.peer.joinRoom(this.roomName, {mode: 'sfu', stream: stream});
            this.room.on('open', () => {
              this.connect();
            });
        },
        (e) => {
          console.error(e);
        }
      );
    });
    // Await connections from others
    this.peer.on('connection', this.connect);
    this.peer.on('error', (err) => {
      console.log(err);
    });
    // Make sure things clean up properly.
    window.onunload = window.onbeforeunload = (e) => {
      if (!!this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }
    };
  };
  codemirrorLoaded(_editor){
    this.editor = angular.element('.CodeMirror')[0].CodeMirror;
    console.log("codeMirror instance : this.editor :",this.editor);
    this.editor.on("cursorActivity", ()=>{
      this.pastCursor = this.editor.getDoc().getCursor()
      console.log("update cursor",this.pastCursor);
    });
    this.editor.on("change", (codemirror,changeObj)=>{
      console.log("change! codemirror,changeObj : ",codemirror,changeObj);
    });
    this.editor.on("changes", (codemirror,changes)=>{
      console.log("changes! codemirror,changes : ",codemirror,changes);
    });
    this.editor.on("beforeChange", (codemirror,changeObj)=>{
      console.log("beforeChange! codemirror,changeObj : ",codemirror,changeObj);
    });
  }
  update(data){
    this.pastCursor = angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()
    var newCursor = this.pastCursor;
    this.$scope.$apply(() => {
      /*
        this.code.contentとdataをうまく比較してrememberから修正を加えて、cursorの位置を更新
        後日アルゴリズムの詳細に関してコメントを追加する
      */
      console.log("before update",this.code.content);
      console.log("recieved data is : ",data);
      console.log("data.pastCursor,newCursor : ",data.pastCursor,newCursor);
      if(data.pastCursor == newCursor){
        newCursor = data.newCursor;
      }else if(data.pastCursor.line < newCursor.line || (data.pastCursor.line == newCursor.line && data.pastCursor.ch < newCursor.ch)){
        var behindString = this.code.content.slice(this.cursorIndex(this.code.content,angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()));
        console.log("behindString",behindString);
        var duplicated_length = 0;
        for(var i = 0;i < behindString.length;i++){
          if(this.code.content[this.code.content.length - i] != behindString[behindString.length -i]){
            break;
          }else{
            duplicated_length++;
          }
        };
        console.log("duplicated_length",duplicated_length);
        newCursor = this.indexCursor(data.newString, data.newString.length - duplicated_length);
      }else{
        var beforeString = this.code.content.slice(0,this.cursorIndex(this.code.content,angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()));
        console.log("beforeString",beforeString);
        var duplicated_length = 0;
        for(var i = 0;i < beforeString.length;i++){
          if(this.code.content[i] != beforeString[i]){
            break;
          }else{
            duplicated_length++;
          }
        };
        console.log("duplicated_length",duplicated_length);
        newCursor = this.indexCursor(data.newString, duplicated_length);
      };
      this.code.content = data.newString;
    });
    angular.element('.CodeMirror')[0].CodeMirror.focus();
    angular.element('.CodeMirror')[0].CodeMirror.getDoc().setCursor(newCursor);
    console.log("newCursor position",newCursor);
  };

  indexCursor(string,index){
    console.log("indexCursor function with string : ",string," index : ",index);
    var beforeCursor = string.slice(0,index);
    console.log("beforeCursor string : ",beforeCursor);
    var lines = beforeCursor.split("\n");
    return {
      "line" : lines.length-1,
      "ch" : lines[lines.length-1].length
    };
  };

  cursorIndex(string,cursor){
    var lines = string.split("\n");
    var result = 0;
    for(var i = 0;i < cursor.line;i++,result++){
      result+=lines[i].length;
    };
    result+=cursor.ch;
    return result;
  };

  test(){
    var cursorIndex = this.cursorIndex(this.code.content,angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor());
    console.log(cursorIndex);
    console.log(this.code.content.slice(cursorIndex));
  }

  setTofirst(){
    angular.element('.CodeMirror')[0].CodeMirror.focus();
    angular.element('.CodeMirror')[0].CodeMirror.getDoc().setCursor({line: 0, ch: 0})
  }

  getCursor(){
    angular.element('.CodeMirror')[0].CodeMirror.focus();
    console.log(angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor());
  }

  settingChange(){
    console.log("setting Changed!",this.mode.lang,this.theme);
    this.editorOptions = {
        "lineWrapping" : true,
        "lineNumbers": true,
        "mode": this.mode.lang,
        "theme": this.theme,
        "extraKeys": {"Ctrl-Space":"autocomplete"}
    };
  };

  // Handle a connection object.
  connect() {
    console.log("roomに参加できました。")

    this.room.on('data', (message) => {
      console.log(message.src + "からのデータ：",message)
      this.update(message.data);
    });

    this.room.on('peerJoin', (peerId) => {
      console.log(peerId + 'has joined the room');
    });

    this.room.on('peerLeave', (peerId) => {
      console.log(peerId + 'has left the room');
    });

    // Wait for stream on the call, then set peer video display
    this.room.on('stream', (stream) =>{
      const streamURL = URL.createObjectURL(stream);
      const peerId = stream.peerId;
      this.$scope.$apply(()=>{
        this.roomMember++;
      });
      $('.videos').append($(
          '<video id="video_' + peerId + '" class="videoBox" width="300" height="200" autoplay="autoplay" class="remoteVideos" src="' + streamURL + '" > </video> <br>'
      ));
    });
    this.room.on('removeStream', (removedStream) => {
      this.$scope.$apply(()=>{
        this.roomMember--;
      });
      $('#video_' + removedStream.peerId).remove();
    });
  };

  showContent($fileContent){
    this.code.name = $fileContent.name;
    this.code.content = $fileContent.content;
    console.log("send code!");
    this.input();
  };

  run(data){
    console.log("sended data : ",JSON.stringify({
      "language" : this.mode.lang,
      "code" :  data
    }));
    return this.$http.post("http://104.198.125.87/exec",JSON.stringify({
      "language" : this.mode.lang,
      "code" :  data
    }))
    .then((response) => {
      console.log("response : ",response);

      this.searchResult = 0;

      this.result = response.data;
      if(this.result.is_error){
        this.search({
          "language" : this.mode.lang,
          "code" :  data,
          "output" : this.result.output
        });
      }
    });
  };

  search(query){
    console.log("search now!")
    return this.$http.post("http://104.198.125.87/search",JSON.stringify(query))
    .then((response) => {
      console.log("search response : ",response);
      this.searchResult = {
        "title" : response.data.title.unescapeHtml(),
        "url" : response.data.url
      };
    });
  }

  clear(){
    this.code.name = "new file";
    this.code.content = "";
    this.input();
  };

  save(data){
    var link = document.createElement('a');
    link.download = this.code.name; //filename
    link.href = 'data:text,\uFEFF' + escape(data); //content
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  input(){
    console.log("changed! send code!");
    console.log(angular.element('.CodeMirror')[0].CodeMirror);
    console.log(angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor());
    //pastCursor,newString,newCursorを送る。
    this.room.send({
      "pastCursor" : this.pastCursor,
      "newString" : this.code.content,
      "newCursor" : angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()
    });
    this.pastCursor = angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()
  };

};