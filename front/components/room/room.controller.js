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
    //codeMirrorのOption
    this.uiCodemirrorConfig = {
        "onLoad" : this.codemirrorLoaded,
        "lineWrapping" : true,
        "lineNumbers": true,
        "mode": "javascript",
        "theme": "midnight",
        "extraKeys": {"Ctrl-Space":"autocomplete"}
    };
    //現在のmember数
    this.roomMember = 0;
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
    //これらはアルゴリズム実装のために必要
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
    this.editor.focus();

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

  //editorに何らかのinputがあったときに呼ばれる関数(イベントハンドラが上にあるのでそれに切り替える予定)
  input(){
    console.log("changed! send data!");
    //mode themeが変更された場合、それを自分のeditorに反映する。
    this.uiCodemirrorConfig.mode = this.mode.lang;
    this.uiCodemirrorConfig.theme = this.theme;
    //pastCursor,newString,newCursorを送る。
    this.room.send({
      "pastCursor" : this.pastCursor,
      "newString" : this.code.content,
      "newCursor" : angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor(),
      "mode" : this.mode,
      "theme" : this.theme
    });

    this.pastCursor = angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()
  };

  //この関数はeditorに何らかのアップデートが生じた時に呼ぶように自分が作ったものではあるが、上でイベントハンドラをつける方がより良いので今後削除すると思う。
  update(data){
    //mode, themeを同期化
    this.mode = data.mode;
    this.theme = data.theme;
    this.uiCodemirrorConfig.mode = data.mode.lang;
    this.uiCodemirrorConfig.theme = data.theme;
    console.log(this.uiCodemirrorConfig)

    this.$scope.$apply(() => {
      /*
        this.code.contentとdataをうまく比較してrememberから修正を加えて、cursorの位置を更新
      */
      this.pastCursor = angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()
      this.newCursor = this.pastCursor;
      console.log("before update",this.code.content);
      console.log("recieved data is : ",data);
      console.log("data.pastCursor,this.newCursor : ",data.pastCursor,this.newCursor);

      if((data.pastCursor.line == this.newCursor.line) && (data.pastCursor.ch == this.newCursor.ch)){
        //変更の前にお互いのカーサーの位置が一緒の場合にはそのまま追いかければ良い。
        this.newCursor = data.newCursor;
        console.log("same",this.newCursor)
      }else if(data.pastCursor.line < this.newCursor.line || ((data.pastCursor.line == this.newCursor.line) && (data.pastCursor.ch < this.newCursor.ch))){
        //相手のカーサーが前にあった場合
        var behindString = this.code.content.slice(this.cursorIndex(this.code.content,this.pastCursor));
        console.log("behindString",behindString);
        var duplicated_length = 0;
        for(var i = 0;i < behindString.length;i++){
          if(data.newString[data.newString.length - i] != behindString[behindString.length -i]){
            break;
          }else{
            duplicated_length++;
          }
        };
        console.log("duplicated_length",duplicated_length);
        this.newCursor = this.indexCursor(data.newString, data.newString.length - duplicated_length);
      }else{
        var beforeString = this.code.content.slice(0,this.cursorIndex(this.code.content,angular.element('.CodeMirror')[0].CodeMirror.getDoc().getCursor()));
        console.log("beforeString",beforeString);
        var duplicated_length = 0;
        for(var i = 0;i < beforeString.length;i++){
          if(data.newString[i] != beforeString[i]){
            break;
          }else{
            duplicated_length++;
          }
        };
        console.log("duplicated_length",duplicated_length);
        this.newCursor = this.indexCursor(data.newString, duplicated_length);
      };
      this.code.content = data.newString;
    });

    angular.element('.CodeMirror')[0].CodeMirror.focus();
    angular.element('.CodeMirror')[0].CodeMirror.getDoc().setCursor(this.newCursor);
    console.log("newCursor position",this.newCursor);
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

  //自分がroomに参加したり、他の人たちがroomに参加したりする時のロジックをここに書く。
  connect() {
    //まずは自分が参加したときこの関数を始めて呼ぶ
    console.log("roomに参加できました。")
    this.$scope.$apply(()=>{
      this.roomMember++;
    });

    this.room.on('data', (message) => {
      console.log(message.src + "からのデータ：",message)
      this.update(message.data);
    });

    this.room.on('peerJoin', (peerId) => {
      console.log(peerId + 'has joined the room');
      this.input();
    });

    this.room.on('peerLeave', (peerId) => {
      console.log(peerId + 'has left the room');
    });

    // 他のmemberのstreamを管理
    this.room.on('stream', (stream) =>{
      const streamURL = URL.createObjectURL(stream);
      const peerId = stream.peerId;
      //div class="video"の中にvideoをappendしていく。
      $('.videos').append($(
          '<video id="video_' + peerId + '" class="videoBox" width="300" height="200" autoplay="autoplay" class="remoteVideos" src="' + streamURL + '" > </video> <br>'
      ));
    });

    //他のmemberがroomから離れる時は該当するvideoタグを除去
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

  //save機能
  save(data){
    var link = document.createElement('a');
    link.download = this.code.name + this.mode.ex; //filename
    link.href = 'data:text,\uFEFF' + escape(data); //content
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

};