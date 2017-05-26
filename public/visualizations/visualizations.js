/*
*   Runs the Dots visualization.
*/

const Dots = entries => {


    /*
    *   Exposes variables for development.
    */

    window.entries = entries


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
    const MIN_DOT_SPACING = 1
    const SIZING_COEFFICIENT = .75

    
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
        // entries = entries.filter(e => e.type !== 'Man')
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
    }

    
    /*
    *   Gives dots random locations.
    */

    const assignRandomLocations = () => {
        const boundsX = d3.interpolate(EDGE_PADDING + (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT), CANVAS_WIDTH - EDGE_PADDING - (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT))
        const boundsY = d3.interpolate(EDGE_PADDING + (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT), CANVAS_HEIGHT - EDGE_PADDING - (baseDotRadius * MAX_DOT_SIZE_COEFFICIENT))
        entries.sort((a, b) => a.r > b.r ? -1 : 1)
        entries.forEach((e, i) => {
            let x, y, overlaps
            do {
                x = boundsX(Math.random())
                y = boundsY(Math.random())
                overlaps = entries.filter(e2 => Math.hypot(x - e2.x, y - e2.y) < (MIN_DOT_SPACING + e.r + e2.r))
            } while (overlaps.length)
            e.x = x
            e.y = y
            if (i % 100 === 0) console.log(`Placed ${i} dots of ${entries.length}`)
        })
        console.log(`Placed all ${entries.length} dots!`)
    }

    
    /*
    *   Renders dots on the SVG.
    */

    const render = () => {
        
        svg.selectAll('circle')
        .data(entries)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.r)
        .attr('fill', d => d.color)

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
    assignRandomLocations()
    render()

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
