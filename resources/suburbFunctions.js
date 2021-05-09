function dataFormat(data) {
  console.log("call formatData()");

  let borderData = topojson
    .feature(data[0], data[0].objects.areas);
  let suburbData = topojson
    .feature(data[1], data[1].objects.areas);
  let regionData = topojson
    .feature(data[2], data[2].objects.areas);
  let waterData = topojson
    .feature(data[3], data[3].objects.areas);

  return [waterData, borderData, suburbData, regionData];
}

function mapShapes() {
  console.log("call mapShapes()");

  border.datum(borderData)
    .classed("border", true);

  suburbs = suburbGroup
    .selectAll(".suburb")
      .data(suburbData.features)
    .enter().append("path")
      .classed("suburb", true)
      .style("fill", function(d) {
        return !d.properties.change ? "#e2e2e2" : abcColour(d.properties.change);
      })
      .on("click", suburbInfo);

  regions = regionGroup
    .selectAll(".region")
      .data(regionData.features)
    .enter().append("path")
      .classed("region", true)
      .on("click", regionZoom);

  water.datum(waterData)
    .classed("water", true);
}

function calculations() {
  console.log("call calculations()");

  projection = d3.geoConicEqualArea()
    .parallels([-26.3, -44.3])
    .rotate([-149.1, 0]);

  path = d3.geoPath()
    .projection(projection);

  let abcColours = [
    "#EAF2DC",
    "#BFECCF",
    "#9BDED3",
    "#7ACFD4",
    "#5EC0CE",
    "#3FB2C6",
    "#23A3BC",
    "#188CAD",
    "#0E75A0",
    "#085B96",
    "#02408D",
    "#002775",
    "#00104B"
  ];

  let abcColourRange = d3.extent(suburbData.features, function(d) {
    return d.properties.change;
  });

  abcColour = d3.scaleLinear()
    .range(abcColours)
    .domain(abcColours.map(function(d, i) {
      return i / (abcColours.length - 1) * (abcColourRange[1] - abcColourRange[0]) + abcColourRange[0];
    }))
    .interpolate(d3.interpolateRgb);
}

function resize() {
  console.log("call resize()");

  [width, height, mobile] = getDimensions();
  touchScreen.attr("width", width)
    .attr("height", height);
  adjustProjection();
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

function adjustProjection() {
  console.log("call adjustProjection()");

  // map projection
  mobile ?
    projection.fitExtent([[10, 30], [width * .8, height - 75]], zoomData) :
    projection.fitExtent([[0, 35], [width * .8, height - 60]], zoomData);
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
    resize();

    // fade in
    map.transition()
      .duration(500)
      .style("opacity", 1)

    .on("end", function() {
      changeLabel((mobile ? "touch region for details" : "click region for details"));
    });
  }, 500);
}

function cancelLabels() {
  console.log("call cancelLabels()");

  header.selectAll("p")
    .transition()
      .duration(500)
      .style("transform", "rotateX(-90deg)")
    .remove();
}

function changeLabel(text) {
  console.log("call changeLabel()");

  cancelLabels();

  header.append("p")
    .text(text)
    .transition()
      .duration(500)
      .style("transform", "rotateX(0deg)")
    .transition()
      .delay(3000)
      .duration(500)
      .style("transform", "rotateX(-90deg)")
    .remove();
}

function regionZoom(event, d) {
  console.log("call regionZoom()");

  changeLabel(d.properties.sa3);

  zoom = true;
  zoomData = d;
  regions.classed("zoom", true);
  mapGroup.classed("zoom", true);

  suburbs.each(function(e) {
    if (e.properties.sa3 == d.properties.sa3) {
      d3.select(this).classed("zoom", true);
    } else {
      d3.select(this).classed("fade", true);
    }
  });

  adjustProjection();

  mapGroup.transition()
    .duration(500)
    .selectAll("path")
    .attr("d", path);
}

function regionBack() {
  console.log("call regionBack()");

  if (zoom) {
    changeLabel((mobile ? "touch region for details" : "click region for details"));

    zoom = false;
    zoomData = suburbData;
    regions.classed("zoom", false);
    suburbs.classed("zoom", false)
      .classed("fade", false);

    adjustProjection();

    mapGroup.transition()
    .selectAll("path")
    .attr("d", path);
  }
}

function suburbInfo(event, d) {
  console.log("call suburbInfo()");

  console.log(d.properties);
}
