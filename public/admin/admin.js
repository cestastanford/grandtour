/**********************************************************************
 * Admin controller
 **********************************************************************/
app.controller('AdminCtrl', function($scope, $http) {

  $scope.view = 'data';
  $scope.user = {};

  var count = 0;

  $scope.defaults = {
    sheets : [
      // Fullnames
      { info: true, value: 'fullName', multiple : false, label : 'Fullnames', sheetName: 'Fullnames', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      // Dates
      { info: true, value: 'dates', multiple : true, label : 'Dates', sheetName: 'Dates', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      // Places
      { info: true, value: 'places', multiple : true, label : 'Places', sheetName: 'Places', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      // Gender
      { info: true, value: 'type', multiple : false, label : 'Type', sheetName: 'Type', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      // Pursuits
      { info: true, value: 'pursuits', multiple : true, label : 'Pursuits & Situations', sheetName: 'Pursuits & Situations', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'occupations', multiple : true, label : 'Occupations & Posts', sheetName: 'Occupations & Posts', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'parents', multiple : false, label : 'Parents', sheetName: 'Parents', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'marriages', multiple : true, label : 'Marriages', sheetName: 'Marriages', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'mistress', multiple : true, label : 'Mistresses', sheetName: 'Mistresses', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'societies', multiple : true, label : 'Societies', sheetName: 'Societies', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'exhibitions', multiple : true, label : 'Exhibitions & Awards', sheetName: 'Exhibitions & Awards', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'education', multiple : true, label : 'Education', sheetName: 'Education', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'military', multiple : true, label : 'Military Career', sheetName: 'Military career', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
      { info: true, value: 'travels', multiple : true, label : 'Travels', sheetName: 'Travels', spreadsheetId : '1w8LD2RkdyPcMq7ffv4YlUKx5PAWAlQpzgw7A-9tbVvg', reload : true },
    ]
  }

  $scope.allReload = true;
  $scope.loading = false;

  $scope.$watch('view', function(){
    $scope.user = {};
    $scope.message = null;
  })

  $scope.setReload = function(allReload){
    d3.values($scope.defaults.sheets).forEach(function(d){
      d.reload = allReload;
    })
  }

  var socket = io();

  socket.on('reload-start', function(res){
    var s = d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    })[0];
    s.info = false;
    s.started = true;
    s.rows = res.metadata.rowCount;
    s.count = 0;
    s.total = 5292;
    s.columns = res.metadata.colCount;
    $scope.$apply();
  });

  socket.on('reload-progress', function(res){
    var s = d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    })[0];
    s.started = false;
    s.loading = true;
    s.count = +res.count;
    $scope.$apply();
  });

  socket.on('reload-finished', function(res){
    var s = d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    })[0];
    s.loading = false;
    s.finished = true;
    s.count = s.total;
    $scope.$apply();
  });

  socket.on('reload-finished-all', function(res){
    $scope.loading = false;
    $('#reload').button('reset');
  });

  socket.on('reload-error', function(res){
    var s = d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    })[0];
    s.started = true;
    s.error = res.error;
    $scope.$apply();
  });

  $scope.reload = function(){
    if ($scope.loading) return;
    $scope.loading = true;
    $('#reload').button('loading')
    $http.post('/api/reload/', $scope.defaults)
    .success(function (res){
      $scope.message = res;
    })
  }

  $http.get('/api/users/')
  .success(function (res){
    $scope.users = res.users;
  })

  $scope.remove = function(username){
    $http.post('/api/users/remove', {username:username})
    .success(function(res){
      $scope.message = 'User ' + username + ' successfully removed!';
      // reload users again
      $http.get('/api/users/')
      .success(function (res){
        $scope.users = res.users;
      })
    })
    .error(function(error){
      console.log(error);
      $scope.message = error.message;
    });
  };

  $scope.update = function(user){
    $http.post('/api/users/update', user)
    .success(function(res){
      $scope.message = 'User ' + user.username + ' successfully updated!';
      // reload users again
      $http.get('/api/users/')
      .success(function (res) {
        $scope.users = res.users;
      })
    })
    .error(function(error){
      console.log(error);
      $scope.message = error.message;
    });
  };

  $scope.register = function(){
    $scope.user.role = $scope.user.role == true ? 'admin' : 'viewer';
    $http.post('/api/users/add', $scope.user)
    .success(function(res){
      $scope.message = 'User ' + res.user.username + ' successfully created!';
      $scope.user = {};
      // reload users again
      $http.get('/api/users/')
      .success(function (res){
        $scope.users = res.users;
      })
    })
    .error(function(error){
      $scope.message = error.message;
    });
  };

//  var socket = io.connect('http://localhost');

  $scope.counting = false;

  $scope.recount = function() {
    $scope.counting = true;
    $http.get('/api/recount')
    .then(function(res) {
      $scope.counting = false;
      if (res.data.error) console.error(res.data.error);
      else {
        getCount();
      }
    }, function(res) { console.error(res); });
  };

  function getCount() {
    $http.get('/api/getcount')
    .then(function(res) {
      if (res.data.error) console.error(res.data.error);
      else $scope.counts = res.data.counts;
    })
  };

  getCount();

});
