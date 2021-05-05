function formatData(data) {
  console.log("call formatData()");

  let borderData = topojson
    .feature(data[0], data[0].objects.areas);
  let suburbData = topojson
    .feature(data[1], data[1].objects.suburbs);
  let waterData = topojson
    .feature(data[2], data[2].objects.areas);

  return [borderData, suburbData, waterData];
}

function mapLayout() {
  console.log("call mapLayout()");

  border.datum(borderData)
    .classed("border", true);

  suburbs = suburbGroup
    .selectAll(".suburb")
      .data(suburbData.features)
    .enter().append("path")
      .classed("suburb", true);

  water.datum(waterData)
    .classed("water", true);
}

function mapFunctions() {
  console.log("call mapFunctions()");

  projection = d3.geoConicEqualArea()
    .parallels([-26.3, -44.3])
    .rotate([-149.1, 0]);

  path = d3.geoPath()
    .projection(projection);

  rScale = d3.scaleLinear()
    .domain([
      0,
      d3.max(suburbData.features, function(d) {
        return d.properties.data ?
          d3.max(d.properties.data, function(e) {
            return e.count;
          }) : null;
      })
    ]);

  
}

function resizer() {
  console.log("call resizer()");

  [width, height, mobile] = getDimensions();
  adjustFunctions();
  plotMap();
}

function getDimensions() {
  console.log("call getDimensions()");

  let dimensions = document.getElementById("map")
    .getBoundingClientRect();
  let width = dimensions.width;
  let height = dimensions.height;
  let mobile = width < 500 ? true : false;

  return [width, height, mobile];
}

function adjustFunctions() {
  console.log("call adjustFunctions()");

  mobile ?
    projection.fitSize([width, height], suburbData) :
    projection.fitSize([width * .75, height], suburbData);
}

function plotMap() {
  console.log("call plotMap()");

  mapGroup.selectAll("path")
    .attr("d", path);
}

function openViz() {
  console.log("call openViz()");

  // 0.5sec delay to load fonts
  d3.timeout(function() {

    // measure dimensions
    resizer();

    // fade in
    map.transition()
      .duration(500)
      .style("opacity", 1);

  }, 500);
}
