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

  // map projection
  mobile ?
    projection.fitExtent([[-width * .2, 40], [width * .8, height + 15]], suburbData) :
    projection.fitExtent([[-width * .25, 10], [width * .8, height - 25]], suburbData);

  // sale circle radius
  mobile ?
    rScale.range([1, 25]) :
    rScale.range([1, 40]);
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
    legend.transition()
      .duration(500)
      .style("opacity", 1);
    map.transition()
      .duration(500)
      .style("opacity", 1)

      .on("end", function() {
        d3.timeout(startLoop, 1000);
      });

  }, 500);
}

function startLoop() {
  console.log("call startLoop()");

  month = 0;
  illustrateMonth(month);

  timer = d3.timer(function(elapsed) {
    if (elapsed >= month * loopTime + loopTime) {
      month = month + 1;

      if (month > 59) {
        timer.stop();
        // restart loop
        d3.timeout(resetLoop, loopTime * 5);

      } else {
        illustrateMonth(month);
      }
    }
  });
}

function monthToDateString(month) {
  console.log("call monthToDateString()");

  let dateString = (2016 + (Math.floor(month / 12))) + "-" + String((month % 12) + 1).padStart(2, 0) + "-01";

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
    .transition()
      .duration(loopTime / 2)
      .style("transform", "rotateX(-90deg)")
    .remove();

  header.append("p")
    .text(d3.timeFormat("%b %Y")(d3.timeParse("%Y-%m-%d")(dateString)))
    .transition()
      .duration(loopTime / 2)
      .style("transform", "rotateX(0deg)");
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

  // draw sale circles
  saleData.forEach(function(d) {
    mapGroup.append("circle")
      .datum(d)
      .classed("sale", true)
      .attr("cx", projection(d.centroid)[0])
      .attr("cy", projection(d.centroid)[1])
      .attr("r", 0)
      .style("opacity", 0)
      .transition()
        .duration(loopTime)
        .attr("r", rScale(d.count))
        .style("opacity", .75)

      // remove sale circles
      .transition()
        .duration(loopTime * 5)
        .style("opacity", 0)
        .attr("r", 0)
      .remove();
  });
}

function adjustSales() {
  console.log("call adjustSales()");

  d3.selectAll(".sale")
    .attr("cx", function(d) { return projection(d.centroid)[0]; })
    .attr("cy", function(d) { return projection(d.centroid)[1]; });
}

function resetLoop() {
  console.log("call resetLoop()");

  // remove month
  header.select("p")
    .transition()
      .duration(loopTime / 2)
      .style("transform", "rotateX(-90deg)")
    .remove()

    // restart
    .on("end", function() {
      d3.timeout(startLoop, loopTime * 5);
    });
}
