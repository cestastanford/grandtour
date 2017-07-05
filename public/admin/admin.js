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

  $scope.$watch('view', function(){
    $scope.user = {};
    $scope.message = null;
  })

  var socket = io();

  socket.on('sheets-import-status', function(response) {
    console.log(response)
    $scope.reloadStatus = response
    if (response.done) {
      $('#reload').button('reset');
    }
    $scope.$apply()
  });

  $scope.reload = function() {
    if ($scope.reloadStatus) return;
    $scope.reloadStatus = {};
    $('#reload').button('loading')
    $http.post('/api/import/from-sheets')
    .then(function(res) {
      $scope.message = 'Reload initiated.';
    })
    .catch(console.error.bind(console))
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

});
