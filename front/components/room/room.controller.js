export default class roomController {

  /*
  classのコンストラクタ
  $scope,$http,$stateParams,$stateはこのroomControllerで使うためにinjectする必要のなるものであり、
  詳細はAngularJSを参照すること。
  */
  constructor($scope,$http,$stateParams,$state) {

    // design mock
    angular.element(document).ready(function() {
        angular.element('.collapsible').collapsible();
        angular.element('.modal').modal();
    });

    //ブラウザでカメラとマイクを使用するために必要なコードライン
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    //おすすめサイトの名前を正しくstringに直すためにこの関数を具現した。
    String.prototype.unescapeHtml = function(){
        return this.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "\'");
    };

    //必要となる変数などをここで定義
    this.$scope = $scope;
    this.$http = $http;
    this.$stateParams = $stateParams;
    this.$state = $state;

    //定期同期化される必要があるかどうか
    this.needSync = true;

    //現在のmember数
    this.roomMember = 1;

    /*
    room stateでroomNameを決めてきていたらそれがroomKeyとなる。
    もし、そうでないのなら、urlからroomKeyを読み取る。
    main.jsを見ればわかるように、routing ruleにより、こうすることでroomKeyは得られる。
    */
    this.roomName = ($scope.rootCtrl.roomName) ? $scope.rootCtrl.roomName: $stateParams.roomKey;
    //現在書いているコードの情報
    this.name = "new file";
    //選択可能な言語モードの情報
    this.modes = [
      {"lang" : "javascript", "ex" : "js"},
      {"lang" : "python", "ex" : "py"},
      {"lang" : "ruby", "ex" : "rb"}
    ];
    //選択された言語モードの情報
    this.mode = this.modes[0];
    //選択可能なテーマの情報
    this.themes = ["ambiance","chaos","chrome","clouds_midnight","clouds","cobalt","crimson_editor","dawn","dreamweaver","eclipse","github","idle_fingers","iplastic","katzenmilch","kr_theme","kuroir","merbivore_soft","merbivore","mono_industrial","monokai","pastel_on_dark","solarized_dark","solarized_light","sqlserver","terminal","textmate","tomorrow_night_blue","tomorrow_night_bright","tomorrow_night_eighties","tomorrow_night","tomorrow","twilight","vibrant_ink","xcode"];
    //選択されたテーマの情報
    this.theme = this.themes[0];

    //editor with ace
    this.editor = ace.edit("editor");
    this.editor.$blockScrolling = Infinity;
    this.editor.setFontSize(14);
    this.editor.setTheme("ace/theme/monokai");
    this.editor.getSession().setMode("ace/mode/javascript");

    window.addEventListener("keydown", (e) => {
        if (this.editor.isFocused()) {
          console.log("onkeydown event")
          this.isFromMe = true;
        }
    }, true)
    this.editor.on("paste",()=>{
      console.log("paste event")
      this.isFromMe = true;
    });


    this.editor.getSession().on("change",(event)=>{
      if(this.isFromMe){
        console.log("send event : ",event)
        this.room.send({
          "name" : this.name,
          "theme" : this.theme,
          "modeNum" : this.modeNum(),
          "event" : event
        });
      }else{
        console.log("other wrote something")
      }
    });

    //このpeerが通信を可能とするオブジェクト
    this.peer = new Peer({
      //Api key(KIM GEE WOOK)
      key: '91f325de-7cf5-4036-be2b-8ebd0a5a5e17'
    });
    // peerにつながったらopenというイベントが発生し、(id)=>{...}と書かれているcallback関数が実行される。
    // もしこのCallback関数のことがわからないのなら、JSのことの勉強をすること。
    this.peer.on('open', (id) => {
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
            var streamURL = URL.createObjectURL(stream);
            var peerId = id;
            /*
              このvideo-wrapperで大きさの調整ができる
              when window resize, trigger event so that we can manage the size of video div.
              this.resizeVideo function will resize.
            */
            angular.element('#video-wrapper')[0].style.width = angular.element('.userVideo')[0].clientWidth+"px";
            angular.element('.videos')[0].style.height = angular.element(window).height()+"px";
            angular.element(window).resize(() => {
                console.log("window resize to (" + angular.element(window).width() + ", " + angular.element(window).height() + ")")
                //width will be set to col s4 size
                angular.element('#video-wrapper')[0].style.width = angular.element('.userVideo')[0].clientWidth+"px";
                //videos height should fit to the same size of window
                angular.element('.videos')[0].style.height = angular.element(window).height()+"px";
            });
            console.log("prevent howling");
            //自分のvideoを入れる。
            angular.element('#myVideo').prop('src', streamURL);

            /*
            自分のvideoを表示できてから、roomに入る準備をする。
            ここでthis.roomNameが入ろうとするroomを特定するkeyとなる。
            */
            console.log(this.roomName,"に接続します");
            //入った時に時表示
            Materialize.toast("<h3>Welcome to " + this.roomName + "!</h3>", 4000);

            this.room = this.peer.joinRoom(this.roomName, {mode: 'sfu', stream: stream});

            // 他のmemberのstreamを管理
            this.room.on('stream', (stream) =>{
              //console.log("add other stream",stream);
              var streamURL = URL.createObjectURL(stream);
              var peerId = stream.peerId;
              this.$scope.$apply(()=>{
                this.roomMember++;
              });
              //div class="video"の中にvideoをappendしていく。
              angular.element('.videosContainer').append(
                '<div class="videoBox video_' + peerId + '"><video id="video_' + peerId + '" class="remoteVideos z-depth-3" width="100%" autoplay="autoplay" src="' + streamURL + '" > </video></div>'
              );
              //show toast when other appear
              Materialize.toast("<h3>New member appeared!</h3>", 4000);
            });

            //他のmemberがroomから離れる時は該当するvideoタグを除去
            this.room.on('removeStream', (stream) => {
              //console.log("remove other stream",stream)
              this.$scope.$apply(()=>{
                this.roomMember--;
              });
              angular.element('#video_' + stream.peerId).remove();
              angular.element('.video_' + stream.peerId).remove();
            });

            this.room.on('data', (data) => {
              console.log(data.src + "からもらったデータ：",data)
              this.isFromMe = false;
              if(data.data.modeNum != null){
                this.$scope.$apply(()=>{
                  this.mode = this.modes[data.data.modeNum];
                });
                this.editor.getSession().setMode("ace/mode/" + this.mode.lang);
              };
              if(data.data.theme){
                this.$scope.$apply(()=>{
                  this.theme = data.data.theme;
                });
                this.editor.setTheme("ace/theme/" + this.theme);
              };
              this.name = (data.data.name) ? data.data.name: this.name;
              if(data.data.content && this.needSync){
                console.log("Sync now");
                this.editor.setValue(data.data.content);
                this.needSync = false;
              }
              if(data.data.event){
                console.log("receive event from other");
                if(data.data.event.action === "insert"){
                  console.log("insert event")
                  this.editor.getSession().getDocument().insertMergedLines(data.data.event.start, data.data.event.lines);
                } else if(data.data.event.action === "remove"){
                  console.log("remove event")
                  this.editor.getSession().getDocument().remove(data.data.event);
                }
              }
            });

            this.room.on('peerJoin', (peerId) => {
              console.log(peerId + 'has joined the room');

              //新たなユーザが入ってきたらcode, theme, modeを共有
              this.isFromMe = true;
              this.needSync = false;
              this.room.send({
                "name" : this.name,
                "content" : this.editor.getValue(),
                "theme" : this.theme,
                "modeNum" : this.modeNum()
              });
            });

            this.room.on('peerLeave', (peerId) => {
              console.log(peerId + 'has left the room');
            });

            this.room.on('error', function(err) {
              console.log("error : ",err);
            });
        },
        (e) => {
          console.error("error",e);
        }
      );
    });

    //アプリから抜ける時にcうあんと接続関連して、綺麗に片付けるためのコードライン
    window.onunload = window.onbeforeunload = (e) => {
      if (!!this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }
    };

  };

  //file load機能
  showContent($fileContent){
    //自分が入力するものだから
    this.isFromMe = true;
    this.name = $fileContent.name;
    this.editor.setValue($fileContent.content);
    //以下はファイルをロードしたときに拡張子が既知であればエディターがそれを反映する部分
    if($fileContent.ex){
      if($fileContent.ex === "js"){
        this.mode = this.modes[0];
      }else if($fileContent.ex === "py"){
        this.mode = this.modes[1];
      }else if($fileContent.ex === "rb"){
        this.mode = this.modes[2];
      }
      this.modeChange();
    }
    //after load close modal
    angular.element("#modal-import").modal("close");
  };

  //コード実行機能
  run(){
    //一応応答が来るまではopenしない.
    this.collapse();
    //http post
    return this.$http.post("https://hello-world.run/exec",JSON.stringify({
      "language" : this.mode.lang,
      "code" :  this.editor.getValue()
    }))
    .then((response) => {
      //openします。
      this.expand();
      
      //responseをもらう
      console.log("response : ",response);
      this.searchResult = 0;
      this.result = response.data;
      //result make collapse
      if(this.result){
        angular.element('.collapsible').collapsible({collapsed: true});
      };

      //もしエラーが返ってきたら
      if(this.result.is_error){
        //search機能実行
        this.search({
          "language" : this.mode.lang,
          "code" :  this.editor.getValue(),
          "output" : this.result.output
        });
      }
    });
  };

  //search apiを呼ぶ
  search(query){
    console.log("search now!")
    //http post
    return this.$http.post("https://hello-world.run/search",JSON.stringify(query))
    .then((response) => {
      console.log("search response : ",response);
      this.searchResult = {
        "title" : response.data.title.unescapeHtml(),
        "url" : response.data.url
      };
    });
  }

  //save機能
  save(){
    var link = document.createElement('a');
    link.download = this.name + '.' +this.mode.ex; //filename
    link.href = 'data:text,\uFEFF' + escape(this.editor.getValue()); //content
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    //after load close modal
    angular.element("#modal-save").modal("close");
  };

  modeChange(){
    console.log("mode change")
    this.editor.getSession().setMode("ace/mode/" + this.mode.lang);
    this.room.send({
      "modeNum" : this.modeNum()
    })
  };

  modeNum(){
    if(this.mode.ex === "js"){
      return 0;
    }else if(this.mode.ex === "py"){
      return 1;
    }else if(this.mode.ex === "rb"){
      return 2;
    }
  }

  themeChange(){
    console.log("theme change")
    this.editor.setTheme("ace/theme/" + this.theme);
    this.room.send({
      "theme" : this.theme
    })
  }

  openModalImport(){
    angular.element("#modal-import").modal("open");
  }

  openModalSave(){
    angular.element("#modal-save").modal("open");
  }

  expand(){
    angular.element(".collapsible-header").addClass("active");
    angular.element(".collapsible").collapsible({accordion: false});
  }

  collapse(){
    angular.element(".collapsible-header").removeClass(function(){
      return "active";
    });
    angular.element(".collapsible").collapsible({accordion: true});
    angular.element(".collapsible").collapsible({accordion: false});
  }

};
