/**********************************************************************
 * Admin controller
 **********************************************************************/
app.controller('AdminCtrl', function($scope, $http) {

  var socket = io();

  $scope.progress = 0;

  socket.on('reload-start', function(total){
    $scope.total = parseInt(total);
  });

  socket.on('reload-progress', function(progress){
    $scope.progress = parseInt(progress);
    $scope.$apply();
  //  console.log(progress)
  });

  socket.on('reload-finished', function(progress){
    console.log('finito')
    $scope.progress = parseInt(progress);
    console.log(progress)
    $scope.done = true;
    $scope.$apply();
  });

  socket.on('reload-error', function(error){
  //  $scope.progress = parseInt(progress);
  //  $scope.$apply();
    console.log(error)
  });

  $scope.reload = function(){
    $http.get('/api/reload/')
    .success(function (res){

      console.log(res)
    })
  }

//  var socket = io.connect('http://localhost');

});
