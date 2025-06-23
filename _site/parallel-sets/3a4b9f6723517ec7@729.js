function _1(md){return(
md`## Grand Tour Explorer Data: Gaps and Interconnections`
)}

function _chart(d3,width,height,sankey,graph,colorScale)
{
  const axis_name = {
    "dates": "Has biographical dates?",
    "origin": "Source of the entry",
    "events": "Has occupation/education data?",
    "travels": "No. of visits to places"
  }
  const colorAxisLabels = {
  "Male": "Male",
  "Female": "Female",
  "Unknown": "Data Not Available"
};
  
  const svg = d3.create("svg")
      .attr("viewBox", [0, -15, width, height+45]);

  const { nodes, links } = sankey({
    nodes: graph.nodes.map(d => Object.assign({}, d)),
    links: graph.links.map(d => Object.assign({}, d))
  });

  const link = svg.append("g")
    .attr("fill", "none")
    .selectAll("g")
    .data(links)
    .join("g");

  // Set up the links
  link.append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => colorScale(d.names[0]))
    .attr("stroke-width", d => d.width)
    .style("mix-blend-mode", "multiply")
    .style("opacity", 1) // Set initial opacity to 1

link.append("title")
  .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

// Add color axis label

  function changeLinks(link, d) {
    link.style("opacity", linkData => (linkData === d ? 1 : 0.2));
    // Set opacity of ancestors and children links to 1
    setAncestorLinksOpacity(d, 1);
    setDescendantLinksOpacity(d, 1);

  }

  // Event listeners for link hover
  link.on("mouseover", function (event, d) {
    changeLinks(link, d);

  })
    .on("mouseout", function () {
      link.style("opacity", 1);
    });

  // Function to set opacity of ancestor links
  function setAncestorLinksOpacity(d, opacity) {
    link.filter(linkData => isAncestorLink(linkData, d)).style("opacity", opacity);
  }

  // Function to set opacity of descendant links
  function setDescendantLinksOpacity(d, opacity) {
    link.filter(linkData => isDescendantLink(linkData, d)).style("opacity", opacity);
  }

  // Function to check if link is an ancestor link
  function isAncestorLink(linkData, d) {
    let flag = true
    for (let i = 0; i < linkData.names.length; ++i) {
      if (linkData.names[i] !== d.names[i]) 
        flag = false;
    }
    return flag;
  }

  // Function to check if link is a descendant link
  function isDescendantLink(linkData, d) {
    let flag = true
    for (let i = 0; i < d.names.length; ++i) {
      if (linkData.names[i] !== d.names[i]) 
        flag = false;
    }
    return flag;
  }

  svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .append("title")
    .text(d => `${d.name}\n${d.value.toLocaleString()}`);
  
  
  svg.append("g")
    .selectAll("legend")
    .data(Object.keys(colorAxisLabels))
    .join("rect")
    .attr("fill", d => colorScale(d))
    .attr("opacity", 0.4)
    .attr("x", function(d,i){ return (width / 3 * i) + ((width/6)-60)})
    .attr("y", d => height)
    .attr('rx', 5)
    .attr('z', -100)
    .attr("height", 22)
    .attr("width", 120)
    
  .join('g')

    svg.append("g")
    .style("font", "13px serif")
    .style("font-weight", "bold")
    .selectAll("text")
    .data(Object.keys(colorAxisLabels))
    .attr("class", "legend-item")
    .join("text")
    .attr("x", function(d,i){ return (width / 3 * i) + (width/6)})
    .attr("y", d => height+10)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(d => colorAxisLabels[d])


  svg.append("g")
    .style("font", "13px serif")
    .style("font-weight", "bold")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => -10)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.key == 'origin' || d.key == 'events' ? "middle" :  d.key == 'dates' ? "start": "end" )
    .text(d => axis_name[d.key])

  svg.append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.name)
    .append("tspan")
    .attr("fill-opacity", 0.7)
    .text(d => ` ${d.value.toLocaleString()}`);

  return svg.node();
}


function _width(){return(
975
)}

function _height(){return(
720
)}

function _sankey(d3,width,height){return(
d3.sankey()
    .nodeSort(null)
    .linkSort(null)
    .nodeWidth(4)
    .nodePadding(20)
    .extent([[0, 5], [width, height - 5]])
)}

function _graph(keys,data)
{
  let index = -1;
  const nodes = [];
  const nodeByKey = new Map;
  const indexByKey = new Map;
  const links = [];

  for (const k of keys.slice(1)) {
    for (const d of data) {
      const key = JSON.stringify([k, d[k]]);
      if (nodeByKey.has(key)) continue;
      const node = {name: d[k], key: k};
      nodes.push(node);
      nodeByKey.set(key, node);
      indexByKey.set(key, ++index);
    }
  }

  for (let i = 2; i < keys.length; ++i) {
    const a = keys[i - 1];
    const b = keys[i];
    const prefix = keys.slice(0, i + 1);
    const linkByKey = new Map;
    for (const d of data) {
      const names = prefix.map(k => d[k]);
      const key = JSON.stringify(names);
      const value = d.value || 1;
      let link = linkByKey.get(key);
      if (link) { link.value += value; continue; }
      link = {
        source: indexByKey.get(JSON.stringify([a, d[a]])),
        target: indexByKey.get(JSON.stringify([b, d[b]])),
        names,
        value
      };
      links.push(link);
      linkByKey.set(key, link);
    }
  }

  return {nodes, links};
}


function _colorScale(d3){return(
d3.scaleOrdinal(["Male", "Female"], ["#ACD1AF","#FFC000"]).unknown("#ccc")
)}

function _keys(){return(
["gender", "dates", "origin", "events", "travels"]
)}

async function _data(d3,FileAttachment){return(
d3.csvParse(await FileAttachment("data_new_gte (2)@2.csv").text(), d3.autoType)
)}

function _d3(require){return(
require("d3@6", "d3-sankey@0.12")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["data_new_gte (2)@2.csv", {url: new URL("./files/b4e95d0bfcc338a1bcb990a0e516b943d9b239c05d50e27f2fbf260efccf2cd7da1e484b5534dda54565affd4bd91982ec41584a10ebb99957de47de9abe0d84.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","width","height","sankey","graph","colorScale"], _chart);
  main.variable(observer("width")).define("width", _width);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("sankey")).define("sankey", ["d3","width","height"], _sankey);
  main.variable(observer("graph")).define("graph", ["keys","data"], _graph);
  main.variable(observer("colorScale")).define("colorScale", ["d3"], _colorScale);
  main.variable(observer("keys")).define("keys", _keys);
  main.variable(observer("keys2")).define("keys2", _keys);

  main.variable(observer("data")).define("data", ["d3","FileAttachment"], _data);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
