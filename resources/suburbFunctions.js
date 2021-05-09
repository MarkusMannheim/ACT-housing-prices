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

  suburbLabels = labelDiv
    .selectAll(".suburbLabel")
      .data(suburbData.features)
    .enter().append("p")
      .classed("suburbLabel", true)
      .text(function(d) { return d.properties.sa2; });

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

  abcColours.forEach(function(d, i) {
    gradient.append("stop")
      .attr("stop-color", d)
      .attr("offset", (i / (abcColours.length - 1) * 100) + "%");
  });

  scale = d3.scaleLinear()
    .domain(abcColourRange);
  axis = d3.axisLeft(scale)
    .tickSizeOuter(0)
    .ticks(5, ".0%");
}

function resize() {
  console.log("call resize()");

  [width, height, mobile] = getDimensions();

  touchScreen.attr("width", width)
    .attr("height", height);

  mobile ?
    scale.range([200, 0]) :
    scale.range([250, 0]);

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
    margin = { top: 30, right: width * .2, bottom: 75, left: 10 } :
    margin = { top: 35, right: width * .2, bottom: 60, left: 10 };

    projection.fitExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]], zoomData);
}

function plotMap() {
  console.log("call plotMap()");

  mapGroup.selectAll("path")
    .transition()
      .duration(500)
      .attr("d", path);

  suburbLabels.each(function(d) {
    let coordinates = projection(d.properties.centroid);
    let labelWidth = parseFloat(d3.select(this).style("width"));
    let labelHeight = parseFloat(d3.select(this).style("height"));
    d3.select(this).transition()
      .duration(500)
        .style("top", (coordinates[1] - labelHeight / 2) + "px")
        .style("left", (coordinates[0] - labelWidth / 2) + "px");
  });

  legendLabel.attr("x", function() {
      return mobile ? 30 : 40;
    })
    .attr("y", -10);

  legendBar.attr("x", function() {
      return mobile ? width - 40 : width - 50;
    })
    .attr("y", function() {
      return mobile ? height - margin.bottom - 210 : height - margin.bottom - 260;
    })
    .attr("width", function() {
      return mobile ? 30 : 40;
    })
    .attr("height", function() {
      return mobile ? 200 : 250;
    });

  axisGroup.attr("transform", function() {
      return mobile ? "translate(" + (width - 40) + ", " + (height - margin.bottom - 210) + ")" : "translate(" + (width - 50) + ", " + (height - margin.bottom - 260) + ")";
    })
    .call(axis);
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
  tip.style("opacity", 0);

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

  suburbLabels.each(function(e) {
    if (e.properties.sa3 == d.properties.sa3) {
      d3.select(this).classed("zoom", true);
    }
  });

  adjustProjection();
  plotMap();
}

function regionBack() {
  console.log("call regionBack()");
  tip.style("opacity", 0);

  if (zoom) {
    changeLabel((mobile ? "touch region for details" : "click region for details"));

    zoom = false;
    zoomData = suburbData;
    regions.classed("zoom", false);
    suburbs.classed("zoom", false)
      .classed("fade", false);
    suburbLabels.classed("zoom", false);

    adjustProjection();
    plotMap();
  }
}

function suburbInfo(event, d) {
  console.log("call suburbInfo()");

  if (d.properties.value) {
    tip.style("opacity", 0)
      .style("top", "0px")
      .style("left", "0px")
      .html("<h1>" + d.properties.sa2 + "</h1>"
        + "<p>2021 price: <span>" + d3.format("$,.0f")(d.properties.value) + "</span></p>"
        + "<p>2019 price: <span>" + (d.properties.old ? d3.format("$,.0f")(d.properties.old) : "n/a") + "</span></p>"
        + "<p>growth: <span>" + (d.properties.change ? d.properties.change > 0 ? "+" + d3.format(".1%")(d.properties.change) : d3.format(".1%")(d.properties.change) : "n/a") + "</span></p>");

    let tipWidth = parseFloat(tip.style("width"));
    let tipHeight = parseFloat(tip.style("height"));

    let coordinates = projection(d.properties.centroid);
    tip.style("top", function() {
        return coordinates[1] + 20 + tipHeight > height - margin.bottom ?
          (coordinates[1] - tipHeight - 20) + "px" :
          (coordinates[1] + 10) + "px";
      })
      .style("left", function() {
        return coordinates[0] - tipWidth / 2 - 5 < margin.left ?
          margin.left + "px" :
          coordinates[0] + tipWidth / 2 + 5 > width - margin.right ?
          (width - margin.right - tipWidth - 5) + "px" :
          (coordinates[0] - tipWidth / 2) + "px";
      })
      .style("opacity", 1);
  }
}
