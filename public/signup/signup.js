/**********************************************************************
 * Login controller
 **********************************************************************/
export default ['$scope', '$rootScope', '$http', '$location', '$state', function($scope, $rootScope, $http, $location, $state) {
  // This object will be filled by the form
  $scope.user = {};

  $scope.signup = function(){
    if ($scope.user.password !== $scope.user.password2) {
      $scope.message = "Passwords must match.";
      $scope.user.password = "";
      $scope.user.password2 = "";
      return;
    }
    $http.post('/signup', $scope.user)
    .success(function(res){
      $scope.message = "User successfully created!";
      $state.go("login");
    })
    .error(function(error){
      $scope.message = error.message;
    });
  };
}];