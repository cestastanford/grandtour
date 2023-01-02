/**********************************************************************
 * Login controller
 **********************************************************************/
export default ['$scope', '$rootScope', '$http', '$location', '$state', function($scope, $rootScope, $http, $location, $state) {
  // This object will be filled by the form
  $scope.user = {};

  // Register the login() function
  $scope.login = function(){
    $http.post('/login', {
      username: $scope.user.username,
      password: $scope.user.password,
    })
    .success(function(user){
      // No error: authentication OK
      $scope.message = 'Authentication successful!';
      //$location.url('/');
      $state.go('home')
    })
    .error(function(error){
      // Error: authentication failed
      $scope.message = error.message;
      console.log(error)
      //$location.url('/login');
      $state.go('login')
    });
  };
}];