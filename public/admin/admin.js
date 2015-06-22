/**********************************************************************
 * Admin controller
 **********************************************************************/
app.controller('AdminCtrl', function($scope, $http) {

  $scope.defaults = {
    spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg',
    entries : 'Entries'
  }

  var socket = io();

  $scope.progress = 0;

  $scope.loading = false;
  $scope.type = 'info';

  socket.on('reload-start', function(total){
    $scope.total = parseInt(total);
    $scope.loading = true;
  });

  socket.on('reload-progress', function(progress){
    $scope.progress = parseInt(progress);
  //  $scope.$apply();
  //  console.log(progress)
  });

  socket.on('reload-finished', function(progress){
    $scope.progress = parseInt(progress);
    $scope.finished = true;
    $scope.loading = false;
    $scope.type = 'success';
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
