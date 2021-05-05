const fs = require("fs"),
      d3 = require("d3");

fs.readFile("./million_data.csv", "utf8", function(error, data) {

  millionData = d3.csvParse(data)
    .map(function(d) {
      d.count = +d.count;
      return d;
    });

  millionData = Array.from(d3.groups(millionData,
      function(d) {
        return d.suburb;
      }, function(d) {
        return d.month;
      }),
      function([key, value]) {
        return ({key, value});
      }
    );

  cleanData = [];

  millionData.forEach(function(d, i) {
    cleanData.push({
      suburb: d.key,
      centroid: d3.geoCentroid(d)
    });
    cleanData[i].data = [];
    d.value.forEach(function(e) {
      cleanData[i].data.push({
        month: new Date(e[1][0].month.slice(0, 4), e[1][0].month.slice(5, 7), e[1][0].month.slice(-2)),
        count: e[1][0].count
      });
    });
  });

  fs.readFile("actSuburbs.geojson", "utf8", function(error, data) {

    geoData = JSON.parse(data)
      .features
      .map(function(d) {
        d.properties.suburb = d.properties.suburb.replace(" (ACT)", "");
        return d;
      });

    finalData = {
      type: "FeatureCollection",
      features: []
    };

    geoData.forEach(function(d) {
      let match = cleanData.filter(function(e) {
        return e.suburb == d.properties.suburb;
      });

      if (match.length == 1) {
        finalData.features.push({
          type: "Feature",
          geometry: d.geometry,
          properties: match[0]
        });

      } else if (!d.properties.suburb.includes("Remainder")) {
        finalData.features.push({
          type: "Feature",
          geometry: d.geometry,
          properties: { suburb: d.properties.suburb, data: null }
        });
      }
    });

    fs.writeFile("millionSuburbs.geojson", JSON.stringify(finalData), function(error) {
      console.log("millionSuburbs.geojson written");
    });
  });
});
