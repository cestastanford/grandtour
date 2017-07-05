/**********************************************************************
 * Admin controller
 **********************************************************************/
app.controller('AdminCtrl', function($scope, $http) {

  $scope.view = 'revisions';


  /*
  * Sets up Revisions tab.
  */

  function markActiveRevision(activeIndex) {
    $scope.revisions.forEach(function(revision) { revision.active = revision.index === activeIndex })
    $scope.revisions = $scope.revisions
  }

  function reloadRevisions() {
    $scope.revisions = [ { index: null, name: 'Latest', latest: true } ]
    $http.get('/api/revisions')
    .then(function(response) {
      console.log(response.data)
      $scope.revisions = $scope.revisions.concat(response.data)
    })
    .then(function() { return $http.get('/loggedin') })
    .then(function(response) {
      console.log(response)
      markActiveRevision(response.data.activeRevisionIndex)
    })
    .catch(console.error.bind(console))
  }

  $scope.editRevision = function(revision) {
    revision.newName = revision.name
    revision.editing = true
  }

  $scope.cancelRevisionEdit = function(revision) {
    delete revision.newName
    revision.editing = false
  }

  $scope.saveRevisionEdit = function(revision) {
    revision.name = revision.newName
    revision.editing = false
    $http.patch('/api/revisions/' + revision.index, { name: revision.name })
    .then(function(response) {
      console.log(response)
      revision.name = response.data.name
      $scope.revisions = $scope.revisions
    })
    .catch(console.error.bind(console))
  }

  $scope.setActiveRevision = function(revision) {
    markActiveRevision(revision.index)
    $http.post('/api/users/update', { activeRevisionIndex: revision.index })
    .then(function(response) {
      console.log(response)
      markActiveRevision(response.data.activeRevisionIndex)
    })
    .catch(console.error.bind(console))
  }

  $scope.deleteRevision = function(revision) {
    revision.deleting = true
    $scope.revisions = $scope.revisions
    $scope.revisions = $scope.revisions.filter(function(r) { return r !== revision })
    $http.delete('/api/revisions/' + revision.index)
    .then(function(response) { console.log(response) })
    .then(function() {
      revision.deleting = false
      $scope.revisions = $scope.revisions
      if (revision.active) return $scope.setActiveRevision({ index: null })
    })
    .catch(console.error.bind(console))
  }

  $scope.clearLatest = function() {
    $scope.revisions[0].clearing = true
    $scope.revisions = $scope.revisions
    $http.delete('/api/revisions/latest')
    .then(function(response) {
      console.log(response)
      $scope.revisions[0].clearing = false
      $scope.revisions = $scope.revisions
    })
    .catch(console.error.bind(console))
  }

  $scope.saveNewRevision = function() {
    var newRevision = { name: 'Saving...', temporary: true }
    $scope.revisions.splice(1, 0, newRevision)
    $scope.revisions = $scope.revisions
    $http.post('/api/revisions', {})
    .then(function(response) {
      console.log(response)
      $scope.revisions[$scope.revisions.indexOf(newRevision)] = response.data
      $scope.revisions = $scope.revisions
    })
    .catch(console.error.bind(console))
  }

  reloadRevisions()

  

  $scope.user = {};

  var count = 0;

  $scope.defaults = {
    sheets : [
      // Entries
      { info: true, value: 'entries', multiple : false, label : 'Entries', sheetName: 'Entries', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      // Fullnames
      { info: true, value: 'fullName', multiple : false, label : 'Fullnames', sheetName: 'Fullnames', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      // Alternate names
      { info: true, value: 'alternateNames', multiple : true, label : 'Alternate Names', sheetName: 'Alternate Names', spreadsheetId: '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload: true },
      // Dates
      { info: true, value: 'dates', multiple : true, label : 'Dates', sheetName: 'Dates', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      // Places
      { info: true, value: 'places', multiple : true, label : 'Places', sheetName: 'Places', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      // Gender
      { info: true, value: 'type', multiple : false, label : 'Type', sheetName: 'Type', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      // Pursuits
      { info: true, value: 'pursuits', multiple : true, label : 'Pursuits & Situations', sheetName: 'Employments and Identifiers', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'occupations', multiple : true, label : 'Occupations & Posts', sheetName: 'Occupations & Posts', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'parents', multiple : false, label : 'Parents', sheetName: 'Parents', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'marriages', multiple : true, label : 'Marriages', sheetName: 'Marriages', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'mistress', multiple : true, label : 'Mistresses', sheetName: 'Mistresses', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'societies', multiple : true, label : 'Societies', sheetName: 'Societies', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'exhibitions', multiple : true, label : 'Exhibitions & Awards', sheetName: 'Exhibitions & Awards', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'education', multiple : true, label : 'Education', sheetName: 'Education', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'military', multiple : true, label : 'Military Career', sheetName: 'Military career', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
      { info: true, value: 'travels', multiple : true, label : 'Travels', sheetName: 'Travels', spreadsheetId : '1dXckjpjDbGcGxpFS9M1ndQDjoIK5hEwTZqJznqbwRS8', reload : true },
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
    var sheets = res.sheet ? d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    }) : $scope.defaults.sheets
    sheets.forEach(function(s) {
      s.info = false;
      s.started = true;
      s.loading = false;
      s.finished = false;
      s.count = 1;
      s.total = 1;
      s.message = res.message;
    });
    $scope.$apply();
  });

  socket.on('reload-progress', function(res){
    var sheets = res.sheet ? d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    }) : $scope.defaults.sheets
    sheets.forEach(function(s) {
      s.info = false;
      s.started = false;
      s.loading = true;
      s.finished = false;
      s.count = res.count;
      s.total = res.total;
    });
    $scope.$apply();
  });

  socket.on('reload-finished', function(res){
    $scope.defaults.sheets.forEach(function(s) {
      s.info = false;
      s.started = false;
      s.loading = false;
      s.finished = true;
      s.count = s.total;
      s.message = 'Reloaded!';
    });
    $('#reload').button('reset');
    $scope.$apply();
  });

  socket.on('reload-error', function(res){
    var sheets = res.sheet ? d3.values($scope.defaults.sheets).filter(function(d){
      return d.value == res.sheet.value;
    }) : $scope.defaults.sheets
    sheets.forEach(function(s) {
      s.info = false;
      s.started = false;
      s.loading = false;
      s.finished = false;
      s.error = res.error;
    });
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

  $scope.clearAll = function() {
    $scope.clearing = true;
    $http.get('/api/clear-all')
    .then(function(res) {
      $scope.clearing = false;
      if (res.data.error) console.error(res.data.error);
    }, console.error.bind(console));
  }

});
