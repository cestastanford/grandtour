/**********************************************************************
 * Register controller
 **********************************************************************/
app.controller('RegisterCtrl', function($scope, $rootScope, $http, $location, $state) {
  // This object will be filled by the form
  $scope.user = {};

  // Register the login() function
  $scope.register = function(){
    $http.post('/register', {
      username: $scope.user.username,
      password: $scope.user.password,
    })
    .success(function(user){
      // No error: authentication OK
      $rootScope.currentUser = user;
      $state.go('home');
    })
    .error(function(error){
      // Error: authentication failed
      $scope.message = error.message;
      $state.go('register');
    });
  };
});
