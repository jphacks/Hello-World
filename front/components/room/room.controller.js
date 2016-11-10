export default class roomController {

  /*
  classのコンストラクタ
  $scope,$http,$stateParams,$stateはこのroomControllerで使うためにinjectする必要のなるものであり、
  詳細はAngularJSを参照すること。
  */
  constructor($scope,$http,$stateParams,$state) {

    //おすすめサイトの名前を正しくstringに直すためにこの関数を具現した。
    String.prototype.unescapeHtml = function(){
        return this.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "\'");
    };
    //ブラウザでカメラとマイクを使用するために必要なコードライン
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    //必要となる変数などをここで定義
    this.$scope = $scope;
    this.$http = $http;
    this.$stateParams = $stateParams;
    this.$state = $state;
    //現在のmember数
    this.roomMember = 1;
    /*
    room stateでroomNameを決めてきていたらそれがroomKeyとなる。
    もし、そうでないのなら、urlからroomKeyを読み取る。
    main.jsを見ればわかるように、routing ruleにより、こうすることでroomKeyは得られる。
    */
    this.roomName = ($scope.rootCtrl.roomName) ? $scope.rootCtrl.roomName: $stateParams.roomKey;
    //現在書いているコードの情報
    this.code = {
      "name" : "new file",
      "content" : ""
    };
    //選択可能な言語モードの情報
    this.modes = [
      {"lang" : "javascript", "ex" : "js"},
      {"lang" : "python", "ex" : "py"},
      {"lang" : "ruby", "ex" : "rb"}
    ];
    //選択された言語モードの情報
    this.mode = this.modes[0];
    //選択可能なテーマの情報
    this.themes = ["midnight","neo","eclipse"];
    //選択されたテーマの情報
    this.theme = this.themes[0];
    //codeMirrorのOption
    this.editorOptions = {
        "lineWrapping" : true,
        "lineNumbers": true,
        "mode": this.mode.lang,
        "theme": this.theme,
        "extraKeys": {"Ctrl-Space":"autocomplete"}
    };
    //これらはアルゴリズム実装のために必要
    this.former = "";
    this.pastCursor = {"line": 0, "ch": 0};
    //このpeerが通信を可能とするオブジェクト
    this.peer = new Peer({
      //Api key(KIM GEE WOOK)
      key: '91f325de-7cf5-4036-be2b-8ebd0a5a5e17'
    });
    // peerにつながったらopenというイベントが発生し、(id)=>{...}と書かれているcallback関数が実行される。
    // もしこのCallback関数のことがわからないのなら、JSのことの勉強をすること。
    this.peer.on('open', (id) => {
      //debugをしやすくするためにこのように時々console.log()を用いてコンソルに出力している。
      console.log("peerはconnect")
      /*
      以下はaudioとvideoをstreamにして、
      angular.elementでclassがvideoであるroom.htmlでのdivに(room.htmlを確認すること。)
      '<video id="video_' + myPeerId + '" class="videoBox" width="300" height="200" autoplay="autoplay" class="remoteVideos" src="' + streamURL + '" > </video> <br>'
      このvideoタグを入れている。
      そして実行してみてdivの中に要素が追加されることが確認できる。
      */
      navigator.getUserMedia(
        {audio: true, video: true},
        (stream) => {
            // Set your video displays
            window.localStream = stream;
            const streamURL = URL.createObjectURL(stream);
            const myPeerId = id;
            angular.element('.videos').append(angular.element(
                '<video id="video_' + myPeerId + '" class="videoBox" width="300" height="200" autoplay="autoplay" class="remoteVideos" src="' + streamURL + '" > </video> <br>'
            ));
            /*
            自分のvideoを表示できてから、roomに入る準備をする。
            ここでthis.roomNameが入ろうとするroomを特定するkeyとなる。
            */
            console.log(this.roomName,"に接続します")
            this.room = this.peer.joinRoom(this.roomName, {mode: 'sfu', stream: stream});
            this.room.on('open', () => {
              //openイベントの後connect関数を実行することで、roomに入る。
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
    //アプリから抜ける時にcうあんと接続関連して、綺麗に片付けるためのコードライン
    window.onunload = window.onbeforeunload = (e) => {
      if (!!this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }
    };
  };
  /*
  この関数は、codeMirrorが準備できてから呼ばれる関数である。
  ここでcodeMirrorのeditorのイベントに対して、callback関数を定義できる。

  例えばcursorが移動するなどのイベントはcursorActivityであり、
  ここでcallback関数をつけることで、
  いろいろアルゴリズムに関連した実装をしている。
  */
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
  //この関数はeditorに何らかのアップデートが生じた時に呼ぶように自分が作ったものではあるが、上でイベントハンドラをつける方がより良いので今後削除すると思う。
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

  //自分がroomに参加したり、他の人たちがroomに参加したりする時のロジックをここに書く。
  connect() {
    //まずは自分が参加したときこの関数を始めて呼ぶ
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

  //file load機能
  showContent($fileContent){
    this.code.name = $fileContent.name;
    this.code.content = $fileContent.content;
    console.log("send code!");
    this.input();
  };

  //コード実行機能
  run(data){
    console.log("sended data : ",JSON.stringify({
      "language" : this.mode.lang,
      "code" :  data
    }));
    //http post
    return this.$http.post("https://hello-world.moe/exec",JSON.stringify({
      "language" : this.mode.lang,
      "code" :  data
    }))
    .then((response) => {
      //responseをもらう
      console.log("response : ",response);
      this.searchResult = 0;
      this.result = response.data;

      //もしエラーが返ってきたら
      if(this.result.is_error){
        //search機能実行
        this.search({
          "language" : this.mode.lang,
          "code" :  data,
          "output" : this.result.output
        });
      }
    });
  };

  //search apiを呼ぶ
  search(query){
    console.log("search now!")
    //http post
    return this.$http.post("https://hello-world.moe/search",JSON.stringify(query))
    .then((response) => {
      console.log("search response : ",response);
      this.searchResult = {
        "title" : response.data.title.unescapeHtml(),
        "url" : response.data.url
      };
    });
  }

  //clear機能
  clear(){
    this.code.name = "new file";
    this.code.content = "";
    this.input();
  };

  //save機能
  save(data){
    var link = document.createElement('a');
    link.download = this.code.name; //filename
    link.href = 'data:text,\uFEFF' + escape(data); //content
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //editorに何らかのinputがあったときに呼ばれる関数(イベントハンドラが上にあるのでそれに切り替える予定)
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