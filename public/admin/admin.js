/**********************************************************************
 * Admin controller
 **********************************************************************/
export default function($scope, $http, $window) {

  $scope.view = 'revisions';


  /*
  * Sets up Revisions tab.
  */

  function processRevisions(activeIndex) {
    
    $scope.revisions.forEach(function(revision, i) {

      revision.latest = i === 0
      revision.active = revision.index === activeIndex || (revision.latest && !activeIndex)
    
    })

    $scope.revisions = $scope.revisions
  
  }


  function reloadRevisions() {
    $http.get('/api/revisions')
    .then(function(response) {
      $scope.revisions = response.data
    })
    .then(function() { return $http.get('/loggedin') })
    .then(function(response) {
      processRevisions(response.data.activeRevisionIndex)
    })
    .catch(console.error.bind(console))
  }


  $scope.editRevision = function(revision) {
    revision.editing = true
    revision.newName = revision.name
  }


  $scope.cancelRevisionEdit = function(revision) {
    revision.editing = false
    delete revision.newName
  }


  $scope.saveRevisionEdit = function(revision) {
    
    revision.savingEdit = true
    $http.patch('/api/revisions/' + revision.index, { name: revision.newName })
    .then(function(response) {
      revision.savingEdit = false
      revision.editing = false
      revision.name = response.data.name
      $scope.revisions = $scope.revisions
    })
    .catch(console.error.bind(console))
  
  }


  $scope.setActiveRevision = function(revision) {
    
    revision.activating = true
    $http.post('/api/users/update', { activeRevisionIndex: revision.latest ? null : revision.index })
    .then(function(response) {
      revision.activating = false
      processRevisions(response.data.activeRevisionIndex)
    })
    .catch(console.error.bind(console))
  
  }


  $scope.deleteRevision = function(revision) {
    
    if ($window.confirm('Are you sure you want to delete this revision, erasing all entry updates contained within?')) {
      revision.deleting = true
      $http.delete('/api/revisions/' + revision.index)
      .then(function() {
        revision.deleting = false
        $scope.revisions = $scope.revisions.filter(function(r) { return r !== revision })
        if (revision.active) return $scope.setActiveRevision($scope.revisions[0])
      })
      .catch(console.error.bind(console))
    }
  
  }


  $scope.createNewRevision = function() {
    
    $scope.creating = true
    $http.post('/api/revisions', {})
    .then(function(response) {
      $scope.creating = false
      $scope.revisions.unshift(response.data)
      $scope.revisions = $scope.revisions
      return $scope.setActiveRevision($scope.revisions[0])
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
    $scope.importStatus = response
    if ($scope.importStatus.done) {
      $('#import').button('reset')
      delete $scope.importStatus
      reloadRevisions()
    }
    $scope.$apply()
  });

  $scope.import = function() {
    if ($scope.importStatus) return;
    $scope.importStatus = {}
    $('#import').button('loading')
    $http.post('/api/import/from-sheets')
    .catch(console.error.bind(console))
  }

  socket.on('sheets-export-status', function(response) {
    $scope.exportStatus = response
    if ($scope.exportStatus.done) {
      $('#export').button('reset')
      delete $scope.exportStatus
    }
    $scope.$apply()
  });

  $scope.export = function(revisionIndex) {
    if ($scope.exportStatus) return;
    $scope.exportStatus = {}
    $('#export').button('loading')
    $http.post('/api/export/to-sheets', { revisionIndex: revisionIndex })
    .catch(console.error.bind(console))
  }

  socket.on('linked-footnotes-import-status', function(response) {
    $scope.linkedFootnotesImportStatus = response
    if ($scope.linkedFootnotesImportStatus.done) {
      $('#import-linked-footnotes').button('reset')
      delete $scope.linkedFootnotesImportStatus
    }
    $scope.$apply()
  });

  $scope.importLinkedFootnotes = function(sheetId) {
    if ($scope.linkedFootnotesImportStatus) return;
    $scope.linkedFootnotesImportStatus = {}
    $('#import-linked-footnotes').button('loading')
    $http.post('/api/import/linked-footnotes-from-sheets', { sheetId: sheetId })
    .catch(console.error.bind(console))
  }

  $scope.clearLinkedFootnotes = function() {
    $('#clear-linked-footnotes').button('loading')
    $http.delete('/api/linked-footnotes')
    .then(function() { $('#clear-linked-footnotes').button('reset') })
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

};
