(function() {


    /*
    *   Describes the different ways dots' appearances can be manipulated.
    */

    var DOT_EFFECTS = {

        color: {
            
            label: 'Dot Color',
            applyDotEffect: function(selection) {

                selection
                .attr('fill', function(d) { return d.color })

            }
        
        },

        size: {
            
            label: 'Dot Size',
            applyDotEffect: function(selection) {

                selection
                .attr('r', function(d) { return d.size })

            },
        
        },

        groupingOnly: {
            label: 'Grouping Only',
        },

    }


    /*
    *   Describes the different data dimensions that can be visualized.
    */

    var VISUALIZABLE_DIMENSIONS = {

        gender: {
            
            label: 'Gender',
            dotEffect: 'color',


            /*
            *   Returns an array of groupings for the dimension,
            *   each with a label, a sample entry (used to create
            *   the dimension key) and a function to determine if
            *   an entry belongs in the group.
            */

            getGroupings: function() {
                
                return [
                    
                    {
                        label: 'No Data',
                        sampleEntry: {},
                        deselected: true,
                        match: function(entry) { return entry.type !== 'Man' && entry.type !== 'Woman' },
                    },
                    
                    {
                        label: 'Male',
                        sampleEntry: { type: 'Man' },
                        match: function(entry) { return entry.type === 'Man' },
                    },
                    
                    {
                        label: 'Female',
                        sampleEntry: { type: 'Woman' },
                        match: function(entry) { return entry.type === 'Woman' },
                    },
                
                ]
            
            },


            /*
            *   Formats relevant entry data for the dimension and
            *   applies it to the backing dot object.
            */

            getAttributeSetter: function() {

                return function(entry, dot) {

                    if (entry.type === 'Man') dot.color = d3.color('darkturquoise')
                    else if (entry.type === 'Woman') dot.color = d3.color('lightsalmon')
                    else dot.color = d3.color('silver')

                }

            }
        
        },

        entryLength: {
            
            label: 'Entry Length',
            dotEffect: 'size',

        travelLength: {
            label: 'Travel Length',
            dotEffect: 'size',
        },

        dateOfFirstTravel: {
            label: 'Date of First Travel',
            dotEffect: 'groupingOnly',
        },

    }


    /*
    *   Registers the 'visualization' directive.
    */

    app.directive('visualizations', function($sce) {
        
        return {
        
            restrict: 'E',
            templateUrl: 'components/visualizations',
            scope: true,
            link: function(scope, element, attributes) {


                /*
                *   Retrieves visualization dimension definitions.
                */

                var dimensionNames = scope.$eval(attributes.dimensions)
                var dimensions = dimensionNames.map(function(name) {

                    var dimension = VISUALIZABLE_DIMENSIONS[name]
                    return {

                        key: name,
                        label: dimension.label,
                        dotEffect: dimension.dotEffect,
                        enabled: false,

                    }

                })


                /*
                *   Updates groupings when source entry list changes.
                */

                scope.$watch('allEntries', function() {

                    dimensions.forEach(function(dimension) {
                        if (scope.allEntries && scope.allEntries.length) {
                            dimension.groupings = VISUALIZABLE_DIMENSIONS[dimension.key].getGroupings(scope.allEntries)
                        }
                    })

                })
                
                
                /*
                *   Creates view model for header categorized dimension toggle buttons.
                */

                var dimensionCategories = Object.keys(DOT_EFFECTS).map(function(effectKey) {

                    return {
                        key: effectKey,
                        label: DOT_EFFECTS[effectKey].label,
                        dimensions: dimensions.filter(function(dimension) { return dimension.dotEffect === effectKey }),
                    }

                })


                /*
                *   Updates the visualization if the dimensions,
                *   entries or other state values change.
                */

                var viewModel = {

                    dimensionCategories: dimensionCategories,
                    dimensions: dimensions,
                    groupedBy: null,
                    hideDeselectedEntries: false,

                }

                scope.viewModel = viewModel
                scope.$watch('viewModel', updateVisualization, true)
                scope.$watch('allEntries', updateVisualization)
                var dots = []
                
                /*
                *   Executes an update of the visualization.
                */

                function updateVisualization() {

                    //  Retrieves all entries that haven't been deselected
                    var selectedEntries = filterEntries(scope.allEntries, dimensions, viewModel.hideDeselectedEntries)

                    //  Updates attribute setters based on selected entries
                    dimensions.forEach(function(dimension) {
                        dimension.setAttributes = VISUALIZABLE_DIMENSIONS[dimension.key].getAttributeSetter(selectedEntries)
                    })

                    //  Applies updates to dots
                    initializeVisualization(selectedEntries, viewModel.groupedBy)
                    setDotAttributes(dots, selectedEntries, dimensions)
                    updateDots(dots)
                    if (viewModel.groupedBy) {
                        
                        var grid = calculateDotGrid(dots, viewModel.groupedBy)
                        placeLabelsAndLines(grid)
                        moveDotsToGridLocation(grid, dots)
                    
                    } else {

                        moveDotsToInitialLocation(dots)
                        respaceDots(dots)

                    }

                    //  Saves selected entries in parent controller
                    scope.updateEntries(selectedEntries)

                }


                /*
                *   Toggles a dimension in the header, ensuring that only
                *   one from each effect group is selected.
                */

                scope.toggleDimensionEnabled = function(dimension, category) {

                    var newValue = !dimension.enabled
                    if (newValue && category.key !== 'groupingOnly') category.dimensions.forEach(function(dimension) {
                        dimension.enabled = false
                    })

                    if (!newValue && viewModel.groupedBy === dimension) viewModel.groupedBy = null
                    dimension.enabled = newValue

                }


                /*
                *   Creates a single dot for a grouping in the dimension
                *   key, returning SVG code.
                */

                scope.getKeyDot = function(dimension, grouping) {

                    //  Creates a sample dot object
                    var dot = {}
                    dimension.setAttributes(grouping.sampleEntry, dot)
                    
                    //  Creates a little SVG
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                    
                    //  Selects circles in the SVG and joins the sample dot object
                    var selection = d3.select(svg)
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .attr('viewBox', '-10 -10 20 20')
                        .selectAll('circle')
                        .data([ dot ])
                    
                    //  Sets initial attributes for the dot
                    selection = selection.enter()
                        .append('circle')
                        .attr('cx', 0)
                        .attr('cy', 0)
                        .attr('r', 10)

                    //  Applies the dot effect to the dot
                    DOT_EFFECTS[dimension.dotEffect].applyDotEffect(selection)

                    //  Returns SVG code
                    return $sce.trustAsHtml(svg.outerHTML)

                }


            },
        
        }

    })


    /*
    *   Returns entries that match the currently-selected dimension
    *   filter options.
    */

    function filterEntries(entries, dimensions) {

        // console.log('filtering entries')
        return entries

    }


    /*
    *   Sets initial visualization parameters (dot size, etc) and
    *   clears elements no longer needed.
    */

    function initializeVisualization(groupedBy) {

        // console.log('initializing visualization')

    }


    /*
    *   Updates the array of objects, each representing a dot in
    *   the visualiztion, with new attribute data based on the dimensions
    *   currently enabled.
    */

    function setDotAttributes(dots, entries, dimensions) {

        // console.log('setting dot attributes')

    }


    /*
    *   Using the updated dot data, updates the SVG dot elements
    *   based on their updated attribute values.
    */

    function updateDots(dots) {

        // console.log('updating dots')

    }


    /*
    *   Calculates the extents of the grid used when dots are grouped,
    *   setting dot and label locations.
    */

    function calculateDotGrid(dots, groupedBy) {

        // console.log('calculating dot grid')
        return {}

    }


    /*
    *   Places labels and lines for the grouped dots.
    */

    function placeLabelsAndLines(grid) {

        // console.log('placing labels and lines')

    }


    /*
    *   Places labels and lines for the grouped dots.
    */

    function moveDotsToGridLocation(grid, dots) {

        // console.log('moving dots to grid location')

    }


    /*
    *   Moves dots to their initial (random) locations.
    */

    function moveDotsToInitialLocation(dots) {

        // console.log('moving dots to initial location')

    }


    /*
    *   Performs a force simulation to space dots appropriately
    *   based on their random locations.
    */

    function respaceDots(dots) {

        // console.log('respacing dots')

    }


})()
