/*
*   Runs the Dots visualization.
*/

const Dots = entries => {


    /*
    *   Colors
    */

    const COLORS = {
        green: 'rgba(125, 225, 200, 1)',
        orange: 'rgba(250, 175, 125, 1)',
        blue: 'rgba(150, 150, 200, 1)',
        grey: 'rgba(221, 221, 221, .75)',
    }
    
    
    /*
    *   Constants
    */

    const CANVAS_WIDTH = 840
    const CANVAS_HEIGHT = 715
    const EDGE_PADDING = 10
    const MAX_DOT_SIZE_COEFFICIENT = 2
    const MIN_DOT_SPACING = 2.5
    const SIZING_COEFFICIENT = 1

    
    /*
    *   Assigns dot colors based on gender.
    */

    const assignColors = () => {
        entries.forEach(e => {
            if (e.type === 'Man') e.color = COLORS.green
            else e.color = COLORS.orange
            // e.color = COLORS.blue
        })
    }

    
    /*
    *   Deselects dots.
    */

    const deselectDots = () => {
        // entries = entries.filter(e => e.entry.length < 50)
        // entries.forEach(e => e.color = (e.entry.length > 5000 ? COLORS.grey : e.color))
    }

    
    /*
    *   Assigns dot radius based on entry length.
    */

    let baseDotRadius
    const assignRadii = () => {
        const availableWidth = CANVAS_WIDTH - 2 * EDGE_PADDING
        const availableHeight = CANVAS_HEIGHT - 2 * EDGE_PADDING
        baseDotRadius = SIZING_COEFFICIENT * (Math.sqrt(availableWidth * availableHeight / entries.length) - MIN_DOT_SPACING) / (2 * MAX_DOT_SIZE_COEFFICIENT)
        const radius = d3.interpolate(baseDotRadius, MAX_DOT_SIZE_COEFFICIENT * baseDotRadius)
        entries.sort((a, b) => a.entry.length < b.entry.length ? -1 : 1)
        entries.forEach((e, i) => {
            e.r = radius(i / entries.length)
            // e.r = radius(.5)
        })
        entries.sort(() => Math.random() * 2 - 1)
    }


    /*
    *   Applies force simulation to dots.
    */

    let simulation
    const applyForceSimulation = () => {

        //  Applies an initial position in the center.
        const boundsX = d3.interpolate(EDGE_PADDING + (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT), CANVAS_WIDTH - EDGE_PADDING - (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT))
        const boundsY = d3.interpolate(EDGE_PADDING + (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT), CANVAS_HEIGHT - EDGE_PADDING - (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT))
        entries.forEach(e => {
            e.x = boundsX(Math.random())
            e.y = boundsY(Math.random())
        })

        const repulsionForce = d3.forceCollide()
        .radius(d => d.r + MIN_DOT_SPACING / 2)
        .strength(1)

        const centeringXForce = d3.forceX()
        .x(d => d.type !== 'Man' ? 3 * CANVAS_WIDTH / 20 : 13 * CANVAS_WIDTH / 20)
        .strength(d => d.type !== 'Man' ? .05 : .05)
        
        const centeringYForce = d3.forceY(CANVAS_HEIGHT / 2).strength(.01)

        //  Sets up simulation with forces.
        simulation = d3.forceSimulation()
        .force('repulsion', repulsionForce)
        .force('centeringX', centeringXForce)
        .force('centeringY', centeringYForce)

    }

    
    /*
    *   Renders dots on the SVG.
    */

    const setup = () => {
        
        svg.selectAll('circle')
        .data(entries)
        .enter()
        .append('circle')
        .attr('r', 0)
        .attr('fill', d => COLORS.grey)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

        simulation.nodes(entries)
        .stop()

        const repulsionForce = simulation.force('repulsion')
        simulation.force('repulsion', null)
        for (var i = 0; i < 100; i++) simulation.tick()
        simulation.force('centeringX', null)
        simulation.force('centeringY', null)
        simulation.force('repulsion', repulsionForce)
        for (var i = 0; i < 500; i++) simulation.tick()

        svg.selectAll('circle')
        .data(entries)
        .attr('r', d => d.r)
        .attr('fill', d => d.color)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

    }

    
    /*
    *   Execution entry point.
    */

    const svg = d3.select('svg')
    .attr('width', CANVAS_WIDTH)
    .attr('height', CANVAS_HEIGHT)
    .style('border', '1px solid #ccc')
    .style('margin', '1em')

    assignColors()
    deselectDots()
    assignRadii()
    applyForceSimulation()

    setup()

}


/*
*   Registers the simple wrapper for the D3-based visualization.
*/

app.controller('VisualizationsCtrl', function($scope) {

    const downloadEntries = async () => {

        const response = await fetch('/api/entries/all', { credentials: 'same-origin' })
        if (!response.ok) { throw new Error(response) }
        return response.json()

    }

    const selectedVisualization = Dots
    downloadEntries()
    .then(selectedVisualization)
    .catch(console.error.bind(console))
    $scope.prepareDownload = () => {
        const button = document.querySelector('button.prepare-download')
        const svg = document.querySelector('svg')
        const downloadLink = document.createElement('a')
        downloadLink.setAttribute('href-lang', 'image/svg+xml')
        downloadLink.setAttribute('href', 'data:image/svg+xml;utf8,' + svg.outerHTML)
        downloadLink.setAttribute('download', '')
        downloadLink.innerText = 'Download'
        button.parentElement.appendChild(downloadLink)
    }

})
