var app=angular.module('mapservice', ["firebase",'ngCordova']);
app.service('authenticationservice', function($firebaseArray ){
	var ref = new Firebase("https://friendfinder123.firebaseio.com");
    var listuser = $firebaseArray(ref);
	this.facebook= function(){
		var usernew=true;
		ref.authWithOAuthPopup("facebook", function(error, authData) {
						if (error) {
								alert("Login Failed!");
								return null;
						} else {
									ref.orderByChild("DisplayName").equalTo(authData.facebook.displayName).on("child_added", function(snapshot) {
										console.log(snapshot.key());
										usernew=false; 
										return snapshot.key();
									}
								);
								alert("Authenticated successfully");
								if(usernew){
									alert("New User");
									var user={};
									user.DisplayName=authData.facebook.displayName;
									user.dp=authData.facebook.cachedUserProfile.picture.data.url;
    							    listuser.$add(user).then(function(ref) {
									  var userid = ref.key();
									  return userid;
									 // console.log("added record with id " + userid);									
									});									
								}								
					 }						
			});      
    }; 
	this.google= function(text){
        return "Service says \"Hellog " + text + "\"";
    };     
	this.twitter= function(text){
        return "Service says \"Hellot " + text + "\"";
    };  
	this.adduser=function(authdata){
		listuser.$add(authData);		
		return 
		
	}      	
});
app.service('geolocationservice', function($firebaseArray,$cordovaGeolocation ){
	this.getlocation= function(){
		var posOptions = {timeout: 10000, enableHighAccuracy: true};
		$cordovaGeolocation
		.getCurrentPosition(posOptions)
		.then(function (position) {
			var data=new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			console.log(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
			return data;
		}, function(err) {
			alert("Unable to get location");
		});		         
    }; 
	this.google= function(text){
        return "Service says \"Hellog " + text + "\"";
    };     
	this.twitter= function(text){
        return "Service says \"Hellot " + text + "\"";
    };  
	this.adduser=function(authdata){
		listuser.$add(authData);		
		return 
		
	}      	
});