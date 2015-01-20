/**
 * Jan 18, 2015
 * style.css 
 * @author mzereba
 */

var app = angular.module('Todo', []);

app.controller('TodoCtrl', function($scope) {
  $scope.initData = function(){
	  $scope.newTodo = '';
	  
	  // Add here Http request GET for retrieving data
	  $scope.todos = [
	    'Maged Task', 
	    'Essam Task',
	    'Ashraf Task'
	  ];
  }
  
  $scope.done = function(todo) {
    var indexOf = $scope.todos.indexOf(todo);
    if (indexOf !== -1) {
      $scope.todos.splice(indexOf, 1);
    }
  };
  
   $scope.add = function(e) {
    if (e.which && e.which === 13) {
      // Add here Http request PUT/POST for inserting data
      $scope.todos.push($scope.newTodo);
      $scope.newTodo = '';
    }
  };
});