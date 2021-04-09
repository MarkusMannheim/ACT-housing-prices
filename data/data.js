const d3 = require("d3"),
      fs = require("fs");

fs.readFile("./sa2.geojson", "utf8", function(error, data1) {
  if (error) throw error;
  geoData = JSON.parse(data1)
    .features
    .filter(function(d) {
      return d.properties.STE_CODE16 == "8"
        && !d.properties.SA2_NAME16.includes("Remainder")
        && d.properties.AREASQKM16 > 0;
    })
    .map(function(d) {
      return {
        type: "Feature",
        geometry: d.geometry,
        properties: {
          sa2: d.properties.SA2_NAME16.replace(" (ACT)", ""),
          region: d.properties.SA3_NAME16
        }
      };
    });
  geoData = {
    type: "FeatureCollection",
    features: geoData
  };

  fs.readFile("./housingData.csv", "utf8", function(error, data2) {
    if (error) throw error;
    priceData = d3.csvParse(data2)
      .map(function(d) {
        return {
          sa2: d[Object.keys(d)[0]].replace(" (ACT)", ""),
          type: d.type,
          rent: +d.rent,
          value: +d.value,
          changeRent: +d.changeRent,
          changeValue: +d.changeValue
        };
      });

    housingData = {
      type: "FeatureCollection",
      features: []
    };

    geoData.features
      .forEach(function(d) {
        let matches = priceData
          .filter(function(e) {
            return e.sa2 == d.properties.sa2;
          });
        if (matches.length > 0) {
          let datum = {
            type: "Feature",
            geometry: d.geometry,
            properties: {
              sa2: d.properties.sa2
            }
          };
          matches.forEach(function(e) {
            datum.properties[e.type] = {
              rent: e.rent,
              value: e.value,
              changeRent: e.changeRent,
              changeValue: e.changeValue
            };
          });
          housingData.features.push(datum);
        } else {
          console.log("problem with", d.properties.sa2, "—", matches.length, "matches");
        };
      });

    fs.writeFile("./housingData.geojson", JSON.stringify(housingData), function(error) {
      console.log("housingData.geojson written");
    });
  });
});
