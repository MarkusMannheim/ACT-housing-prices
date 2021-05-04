const fs = require("fs"),
      d3 = require("d3");

// fs.readFile("./housingData.csv", "utf8", function(error, data) {
//
//   housingData = d3.csvParse(data)
//     .map(function(d) {
//
//     });
//
//   console.log(housingData);
//
//
// });

fs.readFile("actSuburbs.geojson", "utf8", function(error, data) {

  suburbData = JSON.parse(data)
    .features
    .filter(function(d) {
      return !d.properties.suburb.includes("Remainder");
    })
    .map(function(d) {
      return {
        suburb: d.properties.suburb.replace(" (ACT)", "")
      };
    });

  fs.writeFile("./actSuburbs.csv", d3.csvFormat(suburbData), function(error) {
    console.log("actSuburbs.csv written");
  });
});
