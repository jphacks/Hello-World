/*
いろいろ依存性のあるファイルを読み込んでいる。
angularを使うのでangularを読み込むとか、
ui-routerを用いるので読み込むとか。
新たなcomponentを作ったりすると、
以下で新たに追加して読み込んで、
以下で設定を行う必要がある。
*/
import angular from 'angular';
import uirouter from 'angular-ui-router';
import uiCodemirrorDirective from './components/room/room.uicodemirror.directive.js';
import fileReadDirective from './components/room/room.fileRead.directive.js';
import root from './components/main/root.html';
import main from './components/main/main.html';
import rootController from './components/main/root.controller.js';
import room from './components/room/room.html';
import roomController from './components/room/room.controller.js';


angular
  .module('myApp', [uirouter])
  .constant('uiCodemirrorConfig', {
        "lineWrapping" : true,
        "lineNumbers": true,
        "mode": "javascript",
        "theme": "midnight"
    })
  .directive('onReadFile', fileReadDirective)
  .directive('uiCodemirror', uiCodemirrorDirective)
  .config(function ($stateProvider, $urlRouterProvider) {
    /*
    以下でroutingルールを決める。
    ui-router : https://github.com/angular-ui/ui-router
    */

    // statesの設定をする。
    $stateProvider
      .state('root', {
        template: root,
        controller: rootController,
        controllerAs: 'rootCtrl'
      })
      .state('root.main', {
        url: "/",
        template: main
      })
      .state('root.room', {
        url: "/:roomKey",
        template: room,
        controller: roomController,
        controllerAs: 'roomCtrl'
      })

  });