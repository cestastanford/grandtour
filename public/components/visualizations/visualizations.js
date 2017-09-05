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
            applyDotEffect: function(selection, dotRadiusScale) {

                selection
                .attr('r', function(d) { return dotRadiusScale(d.size) })

            },
        
        },

        groupingOnly: {
            label: 'Grouping Only',
            applyDotEffect: function() {}
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
                        match: function(entry) { return entry.gender !== 'Man' && entry.gender !== 'Woman' },
                    },
                    
                    {
                        label: 'Male',
                        sampleEntry: { gender: 'Man' },
                        match: function(entry) { return entry.gender === 'Man' },
                    },
                    
                    {
                        label: 'Female',
                        sampleEntry: { gender: 'Woman' },
                        match: function(entry) { return entry.gender === 'Woman' },
                    },
                
                ]
            
            },


            /*
            *   Formats relevant entry data for the dimension and
            *   applies it to the backing dot object.
            */

            getAttributeSetter: function() {

                return function(entry, dot) {

                    if (entry.gender === 'Man') dot.color = d3.color('darkturquoise')
                    else if (entry.gender === 'Woman') dot.color = d3.color('lightsalmon')
                    else dot.color = d3.color('silver')

                }

            }
        
        },

        entryLength: {
            
            label: 'Entry Length',
            dotEffect: 'size',
            getGroupings: function(entries) {

                //  Constant: number of groups
                const N_GROUPS = 5

                //  Generates array of entry length intervals from entries
                var min = d3.min(entries, function(entry) { return entry.entryLength })
                var max = d3.max(entries, function(entry) { return entry.entryLength })
                var ticks = d3.ticks(min, max, N_GROUPS - 1)
                if (ticks[0] !== min) ticks.unshift(min)
                if (ticks[ticks.length - 1] !== max) ticks.push(max)
                var intervals = ticks.reduce(function(accum, next, index) {

                    if (index !== 0) {
                        accum[index - 1].end = next
                    }

                    if (index !== ticks.length - 1) {
                        accum[index] = { start: next }
                    }

                    return accum

                }, [])

                var groupings = intervals.map(function(interval, index) {

                    return {
                        
                        label: interval.start + ' – ' + interval.end + ' characters',
                        sampleEntry: { entryLength: (interval.start + interval.end) / 2 },
                        match: (
                            index === 0
                            ? function(entry) { return entry.entryLength >= interval.start && entry.entryLength <= interval.end }
                            : function(entry) { return entry.entryLength > interval.start && entry.entryLength <= interval.end }
                        ),
                    
                    }

                })

                groupings.unshift({
                        
                    label: 'No Data',
                    sampleEntry: {},
                    deselected: true,
                    match: function(entry) { return !(entry.entryLength > min - 1) && !(entry.entryLength < max + 1) },
               
                })

                return groupings

            },

            getAttributeSetter: function(entries) {

                var min = d3.min(entries, function(entry) { return entry.entryLength })
                var max = d3.max(entries, function(entry) { return entry.entryLength })
                var scale = d3.scaleLinear()
                .domain([ min, max ])

                return function(entry, dot) {

                    dot.size = entry.entryLength ? scale(entry.entryLength) : scale(min)

                }

            }

        },

        travelLength: {
            
            label: 'Travel Length',
            dotEffect: 'size',
            getGroupings: function(entries) {

                //  Constant: number of groups
                const N_GROUPS = 5

                //  Generates array of entry length intervals from entries
                var min = d3.min(entries, function(entry) { return entry.travelLength })
                var max = d3.max(entries, function(entry) { return entry.travelLength })
                var ticks = d3.ticks(min, max, N_GROUPS - 1)
                if (ticks[0] !== min) ticks.unshift(min)
                if (ticks[ticks.length - 1] !== max) ticks.push(max)
                var intervals = ticks.reduce(function(accum, next, index) {

                    if (index !== 0) {
                        accum[index - 1].end = next
                    }

                    if (index !== ticks.length - 1) {
                        accum[index] = { start: next }
                    }

                    return accum

                }, [])

                var groupings = intervals.map(function(interval, index) {

                    return {
                        
                        label: interval.start + ' – ' + interval.end + ' years',
                        sampleEntry: { travelLength: (interval.start + interval.end) / 2 },
                        match: (
                            index === 0
                            ? function(entry) { return entry.travelLength >= interval.start && entry.travelLength <= interval.end }
                            : function(entry) { return entry.travelLength > interval.start && entry.travelLength <= interval.end }
                        ),
                    
                    }

                })

                groupings.unshift({
                        
                    label: 'No Data',
                    sampleEntry: {},
                    deselected: true,
                    match: function(entry) { return !(entry.travelLength > min - 1) && !(entry.travelLength < max + 1) },
               
                })

                return groupings

            },

            getAttributeSetter: function(entries) {

                var min = d3.min(entries, function(entry) { return entry.travelLength })
                var max = d3.max(entries, function(entry) { return entry.travelLength })
                var scale = d3.scaleLinear()
                .domain([ min, max ])

                return function(entry, dot) {

                    dot.size = entry.travelLength ? scale(entry.travelLength) : scale(min)

                }

            }

        },

        dateOfFirstTravel: {
            
            label: 'Date of First Travel',
            dotEffect: 'groupingOnly',
            getGroupings: function(entries) {

                //  Constant: number of groups
                const N_GROUPS = 5

                //  Generates array of entry length intervals from entries
                var min = d3.min(entries, function(entry) { return entry.dateOfFirstTravel })
                var max = d3.max(entries, function(entry) { return entry.dateOfFirstTravel })
                var ticks = d3.ticks(min, max, N_GROUPS - 1)
                if (ticks[0] !== min) ticks.unshift(min)
                if (ticks[ticks.length - 1] !== max) ticks.push(max)
                var intervals = ticks.reduce(function(accum, next, index) {

                    if (index !== 0) {
                        accum[index - 1].end = next
                    }

                    if (index !== ticks.length - 1) {
                        accum[index] = { start: next }
                    }

                    return accum

                }, [])

                var groupings = intervals.map(function(interval, index) {

                    return {
                        
                        label: interval.start + ' – ' + interval.end,
                        sampleEntry: { dateOfFirstTravel: (interval.start + interval.end) / 2 },
                        match: (
                            index === 0
                            ? function(entry) { return entry.dateOfFirstTravel >= interval.start && entry.dateOfFirstTravel <= interval.end }
                            : function(entry) { return entry.dateOfFirstTravel > interval.start && entry.dateOfFirstTravel <= interval.end }
                        ),
                    
                    }

                })

                groupings.unshift({
                        
                    label: 'No Data',
                    sampleEntry: {},
                    deselected: true,
                    match: function(entry) { return !(entry.dateOfFirstTravel > min - 1) && !(entry.dateOfFirstTravel < max + 1) },
               
                })

                return groupings

            },

            getAttributeSetter: function(entries) {
                return function() {}
            }

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

                scope.$watch('allEntries', function() {


                    dimensions.forEach(function(dimension) {
                        if (scope.allEntries && scope.allEntries.length) {
                            dimension.groupings = VISUALIZABLE_DIMENSIONS[dimension.key].getGroupings(scope.allEntries)
                        }
                    })

                    updateVisualization()

                })
                
                var viewModel = {

                    dimensionCategories: dimensionCategories,
                    dimensions: dimensions,
                    groupedBy: null,
                    hideDeselectedEntries: false,

                }

                scope.viewModel = viewModel
                scope.$watch('viewModel', updateVisualization, true)
                var dots = []
                
                /*
                *   Executes an update of the visualization.
                */

                function updateVisualization() {

                    //  Retrieves all entries that haven't been deselected
                    var selectedEntries = viewModel.hideDeselectedEntries ? filterEntries(scope.allEntries, dimensions) : scope.allEntries

                    //  Updates attribute setters based on selected entries
                    if (scope.allEntries && scope.allEntries.length) dimensions.forEach(function(dimension) {
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
                    console.log(selectedEntries && selectedEntries.length)

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

                    //  Constants
                    var MIN_DOT_RADIUS = 5
                    var MAX_DOT_RADIUS = 10

                    //  Creates a sample dot object, based off of all entries
                    var dot = {}
                    VISUALIZABLE_DIMENSIONS[dimension.key].getAttributeSetter(scope.allEntries)(grouping.sampleEntry, dot)
                    
                    //  Creates a little SVG
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                    
                    //  Selects circles in the SVG and joins the sample dot object
                    var selection = d3.select(svg)
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .attr('viewBox', [ -MAX_DOT_RADIUS, -MAX_DOT_RADIUS, 2 * MAX_DOT_RADIUS, 2 * MAX_DOT_RADIUS].join(' '))
                        .selectAll('circle')
                        .data([ dot ])
                    
                    //  Sets initial attributes for the dot
                    selection = selection.enter()
                        .append('circle')
                        .attr('cx', 0)
                        .attr('cy', 0)
                        .attr('r', 10)
                        .attr('fill', d3.color('silver'))

                    //  Applies the dot effect to the dot
                    DOT_EFFECTS[dimension.dotEffect].applyDotEffect(selection, d3.scaleLinear().range([ MIN_DOT_RADIUS, MAX_DOT_RADIUS ]))

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

        return entries.filter(function(entry) {

            var excluded = false
            dimensions.filter(function(dimension) { return dimension.enabled }).forEach(function(dimension) {

                if (!excluded) {
                    
                    dimension.groupings.filter(function(grouping) { return grouping.deselected }).forEach(function(grouping) {

                        if (!excluded) excluded = grouping.match(entry)
                    
                    })

                }

            })

            return !excluded

        })

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
