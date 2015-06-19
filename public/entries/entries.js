/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('EntriesCtrl', function($scope, $http) {


  $http.get('/api/entries')
  .success(function(entries){
    console.log(entries);
  });

});
