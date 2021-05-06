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
  adjustSales();
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
    projection.fitSize([width * .7, height], suburbData);
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
      .style("opacity", 1)

      .on("end", startLoop);

  }, 500);
}

function startLoop() {
  console.log("call startLoop()");

  month = 0;
  illustrateMonth(month);

  timer = d3.timer(function(elapsed) {
    if (elapsed >= month * loopTime + loopTime) {
      month = month + 1;

      if (month > 119) {
        timer.stop();

      } else {
        illustrateMonth(month);
      }
    }
  });
}

function monthToDateString(month) {
  console.log("call monthToDateString()");

  let dateString = (2011 + (Math.floor(month / 12))) + "-" + String((month % 12) + 1).padStart(2, 0) + "-01";

  return dateString;
}

function illustrateMonth(month) {
  console.log("call illustrateMonth()");

  let dateString = monthToDateString(month);
  changeMonthLabel(dateString);
  drawSales(dateString);
}

function changeMonthLabel(dateString) {
  console.log("call changeMonthLabel(dateString)");

  header.select("p")
    .text(d3.timeFormat("%b %Y")(d3.timeParse("%Y-%m-%d")(dateString)));
}

function drawSales(dateString) {
  console.log("call drawSales(dateString)");

  // find sales
  let saleData = [];
  suburbData.features
    .forEach(function(d) {
      if (d.properties.data) {
        d.properties.data.forEach(function(e) {
          if (e.month == dateString) {
            saleData.push({
              count: e.count,
              centroid: d.properties.centroid
            });
          };
        });
      }
    });

  saleData.forEach(function(d) {
    mapGroup.append("circle")
      .datum(d)
      .classed("sale", true)
      .attr("cx", projection(d.centroid)[0])
      .attr("cy", projection(d.centroid)[1])
      .attr("r", 0)
      .transition()
        .duration(loopTime / 2)
        .attr("r", d.count)
      .transition()
        .duration(loopTime * 2)
        .attr("r", 0)
      .remove();
  });
}

function adjustSales() {
  console.log("call adjustSales(dateString)");

  d3.selectAll(".sale")
    .attr("cx", function(d) { return projection(d.centroid)[0]; })
    .attr("cy", function(d) { return projection(d.centroid)[1]; });
}
