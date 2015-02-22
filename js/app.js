/**
 * Jan 18, 2015
 * app.css 
 * @author mzereba
 */

var app = angular.module('Todo', ['ui.bootstrap.modal']);

app.controller('TodoCtrl', function ($scope, $http, $sce) {
	$scope.todos = [];
    $scope.validUser = "no";
    $scope.setView = "all";
    
    $scope.user = '';
    $scope.storage = '';	
    $scope.path = 	
    $scope.prefix = "task_";
    
    var CREATE = 0;
    var UPDATE = 1;
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
            
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
        
    $scope.edit = function(todo) {
	    //for existing todo, find this todo using id
	    //and update it.
	    for (i in $scope.todos) {
	        if ($scope.todos[i].id == todo.id) {
	        	$scope.insertTodo(todo, UPDATE);
	        }
	    }
	    
	    $scope.editing = false;
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
    
   $scope.login = function() {
    	 $scope.authenticationModal = true;	 
    };
    
    $scope.hasAuthenticated = function(value) {
        return "yes"==value;
    };
    
    $scope.closeAuthentication = function() {
    	$scope.authenticationModal = false;
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
        	$scope.validUser = "yes";
            console.log('Success', 'Authenticated user.');
        } else {
            console.log('Failed', 'Authentication failed.');
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
	    var uri = $scope.user.slice(0,$scope.user.length-3);
	    
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
            	console.log('Success', 'Resource created.');
            	//update view
            	$scope.newtodo = {};
            	$scope.todos.push(todo);
          	}else
            	console.log('Success', 'Resource updated.');
          }
        }).
        error(function(data, status) {
          if (status == 401) {
        	  console.log('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
        	  console.log('Forbidden', 'You are not allowed to create new resource.');
          } else {
        	  console.log('Failed '+ status + data);
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
    	    	console.log('Success', 'Resource deleted.');
    	        //update view
    	    	var indexOf = $scope.todos.indexOf(todo);
    	    	if (indexOf !== -1) {
    	    		$scope.todos.splice(indexOf, 1);
    	    	}
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  console.log('Forbidden', 'Authentication required to delete '+uri);
    	      } else if (status == 403) {
    	    	  notify('Forbidden', 'You are not allowed to delete '+uri);
    	      } else if (status == 409) {
    	    	  console.log('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  console.log('Failed '+status, data);
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
            console.log('Success', 'Your todos container has been created at '+str);
            $scope.path = str;
            //fetch user data
            $scope.load();
          }
        }).
        error(function(data, status) {
          if (status == 401) {
        	  console.log('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
        	  console.log('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
        	  console.log('Failed: '+ status + data);
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
          //console.log("Todos container found");
          $scope.path = uri;
          //fetch user data
          $scope.load();
       
        }).
        error(function(data, status) {
          if (status == 401) {
            console.log('Forbidden', 'Authentication required to create a directory for: '+$scope.user);
          } else if (status == 403) {
        	  console.log('Forbidden', 'You are not allowed to access storage for: '+$scope.user);
          } else if (status == 404) {
        	  //console.log('Contacts container not found...', 'creating it');
        	  //create todos container
        	  $scope.createTodosContainer(uri);
          } else {
        	  console.log('Failed - HTTP '+status, data, 5000);
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
            $scope.user = e.data.slice(5);
            //get user storage and assign todos dir
            $scope.getStorage();
        }
        
        $scope.closeAuthentication();
    },false);
});