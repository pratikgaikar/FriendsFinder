
var app=angular.module('starter', ['ionic','ngCordova',"firebase",'mapservice'])
var userid,watch;
var tracefrd=null;
var mymarker,marker;
var rootref = new Firebase("https://friendfinder123.firebaseio.com");
app.config(['$ionicConfigProvider', function($ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom'); // other values: top

}]);
app.config(function($stateProvider, $urlRouterProvider) {
$stateProvider
    .state('signin', {
      url: '/sign-in',
      templateUrl: 'templates/sign-in.html',
      controller: 'SignInCtrl'
    })
    .state('tabs', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })
    .state('tabs.home', {
	 url: '/home',
 
	 views: {
        'home-tab': {
          templateUrl: 'templates/home.html',
          controller: 'HomeTabCtrl'
        }
      }
    })
    .state('tabs.about', {
      url: '/about',
	  cache:false,
      views: {
        'about-tab': {
          templateUrl: 'templates/about.html',
		  controller:'FrindsCtrl'
        }
      }
    }) 
	.state('tabs.notification', {
      url: '/notification',
	  cache:false,
      views: {
        'notification-tab': {
          templateUrl: 'templates/notification.html',
		  controller:'notificationCtrl'
        }
      }
    })
	.state('tabs.signout', {
	 url: '/sign-out',
	 cache:false,	 
	 views: {
        'signout-tab': {
           controller: 'signoutCtrl'
        }
      }
    })	
   $urlRouterProvider.otherwise('/sign-in');
})
app.controller('SignInCtrl', function($scope,$ionicLoading,$state,authenticationservice,$firebaseArray) {
  var listuser = $firebaseArray(rootref);
  $scope.signIn = function(provider) {	
  $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>'
  });  
  switch(provider){		
		case 'facebook': var usernew=true;
						rootref.authWithOAuthPopup("facebook", function(error, authData) {
						if (error) {
							    $ionicLoading.hide();
								alert("Login Failed!");
								
						} else {    $ionicLoading.hide();
									rootref.orderByChild("DisplayName").equalTo(authData.facebook.displayName).on("child_added", function(snapshot) {
									    userid=snapshot.key();
										usernew=false; 
									}
								);
								//alert("Authenticated successfully");
								if(usernew){
									alert("New User");
									var user={};
									user.DisplayName=authData.facebook.displayName;
									user.dp=authData.facebook.cachedUserProfile.picture.data.url;
    							    listuser.$add(user).then(function(rootref) {
									  userid = rootref.key();
									 									
									});									
								}
								$state.go('tabs.home');
							}						
						});		
		break;
		case "google":var usernew=true;
					 rootref.authWithOAuthPopup("google", function(error, authData) {		
							if (error) {
								$ionicLoading.hide();
								alert("Login Failed!", error);							
							} else {		
									 $ionicLoading.hide();
									rootref.orderByChild("DisplayName").equalTo(authData.google.displayName).on("child_added", function(snapshot) {
											userid=snapshot.key();
											usernew=false; 
										}
									);
									alert("Authenticated successfully");
									if(usernew){
										alert("New User");
										var user={};
										user.DisplayName=authData.google.displayName;
										user.dp=authData.google.cachedUserProfile.picture.url;
										listuser.$add(user).then(function(rootref) {
										  userid = rootref.key();
																			
									});								
								}
								$state.go('tabs.home');
							}		
						});
		break;
		case 'twitter': console.log( authenticationservice.twitter("World"));
		break;		
	}  
  };
  
})
app.controller('signoutCtrl', function($scope, $state,authenticationservice,$firebaseArray,$cordovaGeolocation) {
  rootref.unauth();
  if(watch){
	  watch.clearWatch();
	  watch=null;
  }
  if(marker){	  
	  marker.setMap(null);	  
  }
  if(tracefrd){
	  tracefrd=null;
  }
  $state.go('signin');  
})
app.run(function($ionicPlatform) { 
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
app.controller('HomeTabCtrl', function($scope, $ionicLoading, $compile,$firebase,$firebaseArray,$cordovaGeolocation,$ionicPopup,$firebaseObject,geolocationservice ) { 
    
	var loginUserref = rootref.child(userid);
	var loginuserobject=$firebaseObject(loginUserref);
	loginuserobject.$loaded(
	  function(data) {	
	   	$scope.loginuser=data;
	  },
	  function(error) {
		console.error("Error:", error);
	  }
	); 
   
	var frdlistref = rootref.child(userid+"/frdlist");
  	var userfrdlist=$firebaseArray(frdlistref);
	userfrdlist.$loaded().then(function(data) {
		$scope.userdata=userfrdlist;
	  }).catch(function(error) {
		console.error("Error:", error);
	});

    var watchOptions = {
			frequency : 1000,
			timeout : 10000,
			enableHighAccuracy: true // may cause errors if true
	};
    $scope.initialize=function() {	
	    $ionicLoading.show({
				template: '<ion-spinner></ion-spinner>'
		})           		
	    var mapOptions = {			
			zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	    var map = new google.maps.Map(document.getElementById("map"),mapOptions);		
		var posOptions = {timeout: 10000, enableHighAccuracy: false};
		$cordovaGeolocation
		.getCurrentPosition(posOptions)
		.then(function (position) {
			$ionicLoading.hide();
			map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));  
			var myLatlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
			var contentString = "<div><a ng-click='clickTest()'>"+$scope.loginuser.DisplayName+"</a></div>";
			var compiled = $compile(contentString)($scope);
    		var infowindow = new google.maps.InfoWindow({
				content: compiled[0]
			});
			mymarker = new google.maps.Marker({
			  position: myLatlng,
			  map: map,			
			  animation: google.maps.Animation.DROP
			});  
			google.maps.event.addListener(mymarker, 'click', function() {
				infowindow.open(map,mymarker);
			});			
			$scope.map = map;
			SaveUserLocation(myLatlng);					
		}, function(err) {
            $ionicLoading.hide();			
			var alertPopup = $ionicPopup.alert({
				title: 'Please turn on GPS'
			});	           			
		});		         
      }
      $scope.centerOnMe = function() {
        if(!$scope.map){
          loadmap();		  
		  return;
        }      
		if(watch){			
		    	 var confirmPopup = $ionicPopup.confirm({
				 title: 'Are you sure you want to turn off GPS?'
				  // template: 'Are you sure you want to eat this ice cream?'
				 });
				 confirmPopup.then(function(res) {
				   if(res) {					    	
						watch.clearWatch();
						watch=null;					
				   } else {
				
				   }
				 });			   
		}
		else{
			watch = $cordovaGeolocation.watchPosition(watchOptions);
			  watch.then(
				null,
				function(err) {
					alert('Unable to get location: ' + err.message);
				},
				function(position) {              					
				  mymarker.position=new google.maps.LatLng(position.coords.latitude, position.coords.longitude); 	
				  mymarker.setMap($scope.map);				  		  
				  SaveUserLocation(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));				  
			}); 
		}			
      }; 
	  $scope.locatefrd=function(user){
        if(!$scope.map){
          loadmap();		  
		  return;
        }
        if(!tracefrd){
			    tracefrd=[];
			    var temp={};
				temp.id=user.id;
					
				if(marker){
				  //marker.setMap(null);
				}		
			var frdlistref=rootref.child(user.id);	
			var userfrdlist=$firebaseArray(frdlistref);
			userfrdlist.$loaded().then(function(data) {		
				var contentString = "<div><a ng-click='clickTest()'>"+user.DisplayName+"</a></div>";
				var compiled = $compile(contentString)($scope);
				var infowindow = new google.maps.InfoWindow({
					content: compiled[0]
			});
			var myLatlng = new google.maps.LatLng(data[3].A,data[3].F);
			 var marker= new google.maps.Marker({
				  position: myLatlng,
				  map: $scope.map,			
				  animation: google.maps.Animation.DROP	  
			 });	 
			google.maps.event.addListener(marker, 'click', function() {
				infowindow.open($scope.map,marker);
			});	
			$scope.map.setCenter(new google.maps.LatLng(data[3].A,data[3].F));
			temp.marker=marker;
            temp.mark=1;
			tracefrd.push(temp);			
			}).catch(function(error) {
					console.error("Error:", error);
			});	
			userfrdlist.$watch(function(event) {		
			if(event.event=="child_changed"){
				  if(event.key=="position"){			
				  marker.position=new google.maps.LatLng(userfrdlist[3].A,userfrdlist[4].F); 
				  marker.setMap($scope.map);
				  $scope.map.setCenter(new google.maps.LatLng(userfrdlist[3].A,userfrdlist[4].F));	 
				}
			  }
		    });
		}
		else{
			var flag=true;
			for(i=0;i<tracefrd.length;i++){				
				if(tracefrd[i].id==user.id){
					flag=false;
					break;
				}				
			}
			if(flag){
				var temp={},tempmark;
				temp.id=user.id;			
				tracefrd.push(temp);							
			    for(i=0;i<tracefrd.length;i++){
					if(tracefrd[i].mark!=1){
				
						var frdlistref=rootref.child(tracefrd[i].id);	
						var userfrdlist=$firebaseArray(frdlistref);
						userfrdlist.$loaded().then(function(data) {		
							var contentString = "<div><a ng-click='clickTest()'>"+user.DisplayName+"</a></div>";
							var compiled = $compile(contentString)($scope);
							var infowindow = new google.maps.InfoWindow({
								content: compiled[0]
							});
							var myLatlng = new google.maps.LatLng(data[3].A,data[3].F);
							var marker= new google.maps.Marker({
								  position: myLatlng,
								  map: $scope.map,			
								  animation: google.maps.Animation.DROP	  
							 });
							tempmark=marker;							 
							google.maps.event.addListener(marker, 'click', function() {
								infowindow.open($scope.map,marker);
							});	
							
							$scope.map.setCenter(new google.maps.LatLng(data[3].A,data[3].F));	
						//tracefrd[i].mark=1;						
						}).catch(function(error) {
								console.error("Error:", error);
						});
						
						tracefrd[i].mark=1;	
						tracefrd[i].marker=tempmark;	
						
                      	userfrdlist.$watch(function(event) {		
							if(event.event=="child_changed"){
						
							if(event.key=="position"){			
							  marker.position=new google.maps.LatLng(userfrdlist[3].A,userfrdlist[4].F); 
							  marker.setMap($scope.map);
							  $scope.map.setCenter(new google.maps.LatLng(userfrdlist[3].A,userfrdlist[4].F));	 
							}
						  }
						});									
					}						
				}
			}
		}	
	}
	 function SaveUserLocation(myLatlng){		
		$scope.loginuser.position=$scope.loginuser.position|| null;
		$scope.loginuser.position=myLatlng;
		$scope.loginuser.$save();				
	} 
	 function loadmap(){
		console.log("loadmap");
		var mapOptions = {			
			zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	    var map = new google.maps.Map(document.getElementById("map"),mapOptions);		
		var posOptions = {timeout: 10000, enableHighAccuracy: false};
		$cordovaGeolocation
		.getCurrentPosition(posOptions)
		.then(function (position) {
			map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));  
			var myLatlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
			var contentString = "<div><a ng-click='clickTest()'>"+$scope.loginuser.DisplayName+"</a></div>";
			var compiled = $compile(contentString)($scope);
    		var infowindow = new google.maps.InfoWindow({
				content: compiled[0]
			});
			mymarker = new google.maps.Marker({
			  position: myLatlng,
			  map: map,			
			  animation: google.maps.Animation.DROP
			});  
			google.maps.event.addListener(mymarker, 'click', function() {
				infowindow.open(map,mymarker);
			});			
			$scope.map = map;
			SaveUserLocation(myLatlng);					
		}, function(err) {
			alert("Please turn on GPS");
			
		});
	}	
 }); 
 app.controller('FrindsCtrl', function($scope,$firebase,$firebaseArray,$ionicPopup,$firebaseObject) {	
	var listuser = $firebaseArray(rootref);
	$scope.data=listuser;	
	var loginUserref = rootref.child(userid);
	var loginuser=$firebaseObject(loginUserref);
	
	var loginuserfrd=rootref.child(userid+"/frdlist");
	var loginuserfrddata=$firebaseArray(loginuserfrd);
	$scope.userfrd=loginuserfrddata; 	
    $scope.filterresult=null;		
	$scope.sendrequest=function(receiveruser){
		var Receiverref=rootref.child(receiveruser.$id+"/request");
		var Receiveruserobj=$firebaseArray(Receiverref);
		Receiveruserobj.$loaded(
			  function(data) {
				var user={};
				user.DisplayName=loginuser.DisplayName;
				user.dp=loginuser.dp;
				user.id=loginuser.$id;
				var flag=false;
				for(i=0;i<Receiveruserobj.length;i++){
					flag=false;					
					if(Receiveruserobj[i].id==userid){
						flag=true;
						break;
					}					
				} 		
				if(!flag){
					Receiverref.push(user);				
				}				
			  },
			  function(error) {
				console.error("Error:", error);
			}
		);		
    }
	 $scope.removefrd=function(index){
        //console.log(user);		 
		loginuserfrddata.$remove(0);		
	}
	
}); 
 app.controller('notificationCtrl', function($scope, $ionicLoading, $compile,$firebase,$firebaseArray,$cordovaGeolocation,$ionicPopup,$firebaseObject) {
	 
    var loginUserref=rootref.child(userid);
	var loginuser=$firebaseObject(loginUserref);
	loginuser.$loaded(
	  function(data) {	
		$scope.loginuser=data;
	  },
	  function(error) {
		console.error("Error:", error);
	  }
	);
	var UserFrdRequestlistref = rootref.child(userid+"/request");
	var userfrdrequestlist = $firebaseArray(UserFrdRequestlistref);
	userfrdrequestlist.$loaded(
		function(data) {		
		  $scope.data=data;
		},
		function(error) {
			console.error("Error:", error);
		}
	); 	
	$scope.addfrd=function(id,index){
		$scope.data.$remove(index);
		var ref = new Firebase("https://friendfinder123.firebaseio.com/"+id+"/frdlist");
		var userobj1 = $firebaseArray(ref);
			userobj1.$loaded(
			  function(data) {				
				var user={};
				user.DisplayName=$scope.loginuser.DisplayName;
				user.dp=$scope.loginuser.dp;
				user.id=$scope.loginuser.$id;	
				var flag=false;
			 	for(i=0;i<userobj1.length;i++){
					flag=false;
					if(userobj1[i].id==userid){
						flag=true;
						break;
					}					
				}
				if(!flag){
					 ref.push(user);				
				}													
			  },
			  function(error) {
				console.error("Error:", error);
			}
		);		
	}
	$scope.rejectreq=function(index){		
		$scope.data.$remove(index);		
	}
	userfrdrequestlist.$watch(function(event) {	
			console.log(event); 	
			
	});	
   
   	
	
}); 

 