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
  .constant('uiCodemirrorConfig', {})
  .directive('onReadFile', fileReadDirective)
  .directive('uiCodemirror', uiCodemirrorDirective)
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/");

    // Now set up the states
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