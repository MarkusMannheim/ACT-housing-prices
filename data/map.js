const d3 = require("d3"),
      fs = require("fs");

fs.readFile("./housingData.csv", "utf8", function(error, data) {
  data = data.slice(1);
  priceData = d3.csvParse(data)
    .filter(function(d) {
      return +d.value;
    })
    .map(function(d) {
      return {
        sa2: d.suburb,
        type: d.type,
        value: +d.value,
        old: +d.oldValue,
        change: +d.changeValue
      };
    });

  fs.readFile("./sa2.geojson", "utf8", function(error, data) {
    nullAreas = ["Black Mountain", "Kowen", "Majura", "ACT - South West", "Molonglo Corridor", "Namadgi", "Tuggeranong", "Gungahlin - East", "Gungahlin - West", "Gooromon", "West Belconnen", "Mount Taylor", "Tuggeranong - West", "Canberra East", "Molonglo - North", "Arboretum", "Scrivener", "Lake Burley Griffin"];

    geoData = JSON.parse(data)
      .features
      .filter(function(d) {
        return d.properties.STE_CODE16 == "8"
          && d.properties.AREASQKM16 > 0
          && !nullAreas.includes(d.properties.SA2_NAME16)
          && d.properties.SA3_NAME16 !== "Canberra East";
      })
      .map(function(d) {
        return {
          type: "Feature",
          geometry: d.geometry,
          properties: {
            sa2: d.properties.SA2_NAME16.replace(" (ACT)", ""),
            sa3: d.properties.SA3_NAME16.replace(" (ACT)", "")
          }
        };
      });

    finalData = {
      type: "FeatureCollection",
      features: []
    };

    geoData.forEach(function(d) {

      let matches = priceData
        .filter(function(e) {
          return e.sa2 == d.properties.sa2;
        });

      if (matches.length == 2) {
        let match = matches.filter(function(e) {
          return e.type == "houses";
        })[0];

        console.log(d.properties.sa2, d.properties.sa3);

        finalData.features.push({
          type: "Feature",
          geometry: d.geometry,
          properties: {
            sa2: match.sa2.replace(" (ACT)", ""),
            sa3: d.properties.sa3,
            value: match.value,
            old: match.old,
            change: match.change,
            centroid: d3.geoCentroid(d)
          }
        });

      } else if (matches.length == 1 && matches[0].type == "houses") {
        let match = matches[0];

        console.log(d.properties.sa2, d.properties.sa3);

        finalData.features.push({
          type: "Feature",
          geometry: d.geometry,
          properties: {
            sa2: match.sa2.replace(" (ACT)", ""),
            sa3: d.properties.sa3,
            value: match.value,
            old: match.old,
            change: match.change,
            centroid: d3.geoCentroid(d)
          }
        });

      } else {

        console.log(d.properties.sa2, d.properties.sa3);

        finalData.features.push({
          type: "Feature",
          geometry: d.geometry,
          properties: {
            sa2: d.properties.sa2.replace(" (ACT)", ""),
            sa3: d.properties.sa3,
            value: null,
            old: null,
            change: null,
            centroid: d3.geoCentroid(d)
          }
        });
      }

    });

    fs.writeFile("./mapData.geojson", JSON.stringify(finalData), function(error) {
      console.log("mapData.geojson written");
    });
  });
});
