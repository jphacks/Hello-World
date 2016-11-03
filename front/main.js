import angular from 'angular';
import uirouter from 'angular-ui-router';
import home from './components/home/home.html';
import driver from './components/driver/driver.html';
import driverController from './components/driver/driver.controller.js';

var myApp = angular
  .module('myApp', [uirouter])
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/main");

    // Now set up the states
    $stateProvider
      .state('index', {
        templateUrl: "view/index.html",
        controller: 'indexController',
        controllerAs: 'indexCtrl'
      })
      .state('index.main', {
        url: "/main",
        templateUrl: "view/main.html"
      })
      .state('index.teacher', {
        url: "/teacher",
        templateUrl: "view/teacher.html",
        controller: 'teacherController',
        controllerAs: 'teacherCtrl'
      })
      .state('index.student', {
        url: "/student",
        templateUrl: "view/student.html",
        controller: 'studentController',
        controllerAs: 'studentCtrl'
      })
	});