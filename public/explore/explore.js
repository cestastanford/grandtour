/**********************************************************************
 * Explore controller
 **********************************************************************/
app.controller('ExploreCtrl', function($scope, $http, $location, $stateParams) {


  $http.get('/api/entries')
  .success(function(res){

    res.entries.forEach(function(d){
      d.pursuits = d.pursuits ? d.pursuits.map(function(d){ return d.pursuit; }) : [];
      d.occupations = d.occupations ? d.occupations.map(function(d){ return d.group; }) : [];
    })

    var entries = crossfilter(res.entries)
      , all = entries.groupAll()

      , occupation = entries.dimension(function(d){ return d.occupations; })
      , occupations = occupation.group(function(d){ return d; })


      , pursuit = entries.dimension(function(d){ return d.pursuits; })
      , pursuits = pursuit.group(function(d){ return d; })

    pursuit.filter(function(d){ return d.indexOf('writer') != -1; });
    console.log(occupations.size())

  });



  $('.tooltip').remove();

});
