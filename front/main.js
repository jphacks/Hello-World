import angular from 'angular';
import uirouter from 'angular-ui-router';

import fileReadDirective from './components/room/fileRead.directive.js';

import root from './components/main/root.html';
import main from './components/main/main.html';
import rootController from './components/main/root.controller.js';

import room from './components/room/room.html';
import roomController from './components/room/room.controller.js';

angular
  .module('myApp', [uirouter])
  .directive('onReadFile', fileReadDirective)
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/main");

    // Now set up the states
    $stateProvider
      .state('root', {
        template: root,
        controller: rootController,
        controllerAs: 'rootCtrl'
      })
      .state('root.main', {
        url: "/main",
        template: main
      })
      .state('root.room', {
        url: "/room",
        template: room,
        controller: roomController,
        controllerAs: 'roomCtrl'
      })
	});