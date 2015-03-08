/**
 * Jan 18, 2015
 * app.css 
 * @author mzereba
 */

var app = angular.module('Todo', ['ui.bootstrap.modal', 'ui.bootstrap.tooltip']);

app.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
});

app.controller('TodoCtrl', function ($scope, $http, $sce) {
	$scope.todos = [];
    $scope.validUser = "no";
    $scope.setView = "all";
    
    $scope.userProfile = '';
    $scope.storage = '';	
    $scope.path = 	
    $scope.prefix = "task_";
    
    var CREATE = 0;
    var UPDATE = 1;
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
    // Define the appuri, used as key when saving to sessionStorage
    $scope.appuri = window.location.hostname+window.location.pathname;
    
    // Save profile object in sessionStorage after login
    $scope.saveCredentials = function () {
        var app = {};
        var _user = {};
        app.userProfile = $scope.userProfile;
        sessionStorage.setItem($scope.appuri, JSON.stringify(app));
    };

    // Clear sessionStorage on logout
    $scope.clearLocalCredentials = function () {
        sessionStorage.removeItem($scope.appuri);
    };
     
    $scope.openAuthenticationModal = function() {
    	$scope.authenticationModal = true;	 
    };
    
    $scope.closeAuthenticationModal = function() {
    	$scope.authenticationModal = false;
    };
   
    $scope.logout = function() {
    	$scope.clearLocalCredentials();
    	$scope.validUser = "no";
    	$scope.todos = [];
    };

    $scope.hasAuthenticated = function(value) {
    	return "yes"==value;
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
        	$scope.validUser = "yes";
            notify('Success', 'Authenticated user.');
        } else {
            notify('Failed', 'Authentication failed.');
        }
    };
    
    $scope.focus = function(){
    	$scope.isFocused = true;
    };
    
    // Simply search todos list for given id
    // and returns the todo object if found
    $scope.get = function (id) {
        for (i in $scope.todos) {
            if ($scope.todos[i].id == id) {
                return $scope.todos[i];
            }
        }
    };
        
    $scope.add = function(e, newtodo) {
        //if this is new todo, add it in todos array
		//generate unique id
    	newtodo.id = new Date().getTime();
        newtodo.isCompleted = "" + false;
        $scope.insertTodo(newtodo, CREATE);
    };
        
    $scope.edit = function(todo, isEditing) {
	    //for existing todo, find this todo using id
	    //and update it.
    	$scope.isFocused = false;
	    for (i in $scope.todos) {
	        if ($scope.todos[i].id == todo.id) {
	        	$scope.insertTodo(todo, UPDATE);
	        }
	    }
	    
	    $scope.isFocused = false;
    };
    
    $scope.complete = function(todo) {
    	$scope.insertTodo(todo, UPDATE);
    };
    
    $scope.completeAll = function() {
    	for(i in $scope.todos) {
    		$scope.todos[i].isCompleted = "" + $scope.checkAll;
    		$scope.complete($scope.todos[i]);
    	}
    };
    
    $scope.removeCompleted = function() {
    	for(i in $scope.todos) {
    		if($scope.todos[i].isCompleted == 'true'){
    			$scope.remove($scope.todos[i]);
    		}
    	}
    };
    
    $scope.showView = function(status) {
	    if(status == 'all'){
	    	$scope.view = function(todo) {
		        return todo.isCompleted == 'true' || todo.isCompleted == 'false';
		    }
		    $scope.setView = "all";
	    }
	    if(status == 'active'){
	    	$scope.view = function(todo) {
		        return todo.isCompleted == 'false';
		    }
		    $scope.setView = "active";
	    }
	    if(status == 'completed'){
	    	$scope.view = function(todo) {
		        return todo.isCompleted == 'true';
		    }
		    $scope.setView = "completed";
	    }
    };
        
    // Listing todo resources
    $scope.load = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched($scope.path + '*',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var TODO = $rdf.Namespace('http://user.pds.org/ontology/');
	
			var evs = g.statementsMatching(undefined, RDF('type'), TODO('task'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					var sId = id.split("_"); 
					var t = g.anyStatementMatching(evs[e]['subject'], DC('title'))['object']['value'];
					var completed = g.anyStatementMatching(evs[e]['subject'], TODO('completed'))['object']['value'];

					var todo = {
						id: sId[1],
					    title: t,
					    isCompleted: completed
					};
					
					$scope.todos.push(todo);
                    $scope.$apply();
                }
			}
	    });
    };
    
    // Gets user storage
    $scope.getStorage = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    //var uri = $scope.userProfile.slice(0,$scope.userProfile.length-3);
	    var uri = ($scope.userProfile.indexOf('#') >= 0)?$scope.userProfile.slice(0, $scope.userProfile.indexOf('#')):$scope.userProfile;
	    
	    f.nowOrWhenFetched(uri ,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
			var FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
	
			var evs = g.statementsMatching(undefined, RDF('type'), FOAF('Person'));
			if (evs != undefined) {
				for (var e in evs) {
					var s = g.anyStatementMatching(evs[e]['subject'], SPACE('storage'))['object']['value'];
					
					$scope.storage = s;
                    $scope.$apply();
                }
			}
			
			$scope.isTodoContainer();
	    });
    };
    
    // Insert or update a todo resource
    $scope.insertTodo = function (todo, operation) {
	    var uri = $scope.path + $scope.prefix + todo.id;
        var resource = $scope.composeRDFResource(todo, uri);
        $http({
          method: 'PUT', 
          url: uri,
          data: resource,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            if(operation == CREATE){
            	notify('Success', 'Resource created.');
            	//update view
            	$scope.newtodo = {};
            	$scope.todos.push(todo);
          	}else
            	notify('Success', 'Resource updated.');
          }
        }).
        error(function(data, status) {
          if (status == 401) {
        	  notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
        	  notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
        	  notify('Failed '+ status + data);
          }
        });
    };
    
    // Iterate through todos list and delete
    // todo if found
    $scope.remove = function (todo) {
        var uri = $scope.path + $scope.prefix + todo.id;
    	$http({
    	      method: 'DELETE',
    	      url: uri,
    	      withCredentials: true
    	    }).
    	    success(function(data, status, headers) {
    	      if (status == 200) {
    	    	notify('Success', 'Resource deleted.');
    	        //update view
    	    	var indexOf = $scope.todos.indexOf(todo);
    	    	if (indexOf !== -1) {
    	    		$scope.todos.splice(indexOf, 1);
    	    	}
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  notify('Forbidden', 'Authentication required to delete '+uri);
    	      } else if (status == 403) {
    	    	  notify('Forbidden', 'You are not allowed to delete '+uri);
    	      } else if (status == 409) {
    	    	  notify('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  notify('Failed '+status, data);
    	      }
    	});
    	
        //if ($scope.newtodo.id == todo.id) $scope.newtodo = {};
    };
    
    // Create todos container
    $scope.createTodosContainer = function (str) {
    	var uri = str.slice(0, str.length-1);
		$http({
          method: 'PUT', 
	      url: uri,
          data: '',
          headers: {
            'Content-Type': 'text/turtle',
			'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            notify('Success', 'Your todos container has been created at '+str);
            $scope.path = str;
            //fetch user data
            $scope.load();
          }
        }).
        error(function(data, status) {
          if (status == 401) {
        	  notify('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
        	  notify('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
        	  notify('Failed: '+ status + data);
          }
        });
    };
    
    // Check if todos dir exists, if not create it
    $scope.isTodoContainer = function () {
    	var uri = $scope.storage + "todos/";
        $http({
          method: 'HEAD',
          url: uri,
          withCredentials: true
        }).
        success(function(data, status, headers) {
          //add dir to storage
          //notify("Todos container found");
          $scope.path = uri;
          //fetch user data
          $scope.load();
       
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create a directory for: '+$scope.user);
          } else if (status == 403) {
        	  notify('Forbidden', 'You are not allowed to access storage for: '+$scope.user);
          } else if (status == 404) {
        	  //notify('Contacts container not found...', 'creating it');
        	  //create todos container
        	  $scope.createTodosContainer(uri);
          } else {
        	  notify('Failed - HTTP '+status, data, 5000);
          }
        });
    };
      
    // Composes an RDF resource to send to the server
    $scope.composeRDFResource = function (todo, uri) {
       var rdf =   "<" + uri + ">\n" +
          "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://user.pds.org/ontology/task> ;\n" +
          "<http://purl.org/dc/elements/1.1/title> \"" + todo.title + "\" ;\n" +
          "<http://user.pds.org/ontology/completed> \"" + todo.isCompleted + "\" .\n";
       return rdf;
    };
       
    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
            $scope.authenticate(e.data.slice(5, e.data.length));
            $scope.userProfile = e.data.slice(5);
            $scope.saveCredentials();
            //get user storage and assign todos dir
            $scope.getStorage();
        }
        
        $scope.closeAuthenticationModal();
    },false);
    
    // Retrieve from sessionStorage
    if (sessionStorage.getItem($scope.appuri)) {
        var app = JSON.parse(sessionStorage.getItem($scope.appuri));
        if (app.userProfile) {
          //if (!$scope.userProfile) {
          //  $scope.userProfile = {};
          //}
          $scope.userProfile = app.userProfile;
          $scope.loggedin = true;
        } else {
          // clear sessionStorage in case there was a change to the data structure
          sessionStorage.removeItem($scope.appuri);
        }
    }

});