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

    nullAreas = ["Kowen", "Majura", "ACT - South West", "Molonglo Corridor", "Namadgi", "Tuggeranong", "Gungahlin - East", "Gungahlin - West", "Gooromon", "West Belconnen", "Mount Taylor", "Tuggeranong - West", "Canberra East"];

    geoData = JSON.parse(data)
      .features
      .filter(function(d) {
        return d.properties.STE_CODE16 == "8"
             & d.properties.AREASQKM16 > 0
             & !nullAreas.includes(d.properties.SA2_NAME16);
      })
      .map(function(d) {
        d.properties = {
          sa2: d.properties.SA2_NAME16
        };
        return d;
      });

    matchedData = {
      type: "FeatureCollection",
      features: []
    };

    geoData.forEach(function(geo) {
      let matches = priceData
        .filter(function(data) {
          return geo.properties.sa2 == data.sa2;
        });

      if (matches.length == 2) {
        let match = matches
          .filter(function(data) {
            return data.type == "houses";
          })[0];
        matchedData.features
          .push({
            type: "Feature",
            geometry: geo.geometry,
            properties: {
              sa2: match.sa2,
              value: match.value,
              old: match.old,
              change: match.change
            }
          });

      } else if (matches.length == 1) {
        let match = matches[0];

        if (match.type == "houses") {
          matchedData.features
            .push({
              type: "Feature",
              geometry: geo.geometry,
              properties: {
                sa2: match.sa2,
                value: match.value,
                old: match.old,
                change: match.change
              }
            });
        }
      } else {
        matchedData.features
          .push({
            type: "Feature",
            geometry: geo.geometry,
            properties: {
              sa2: geo.properties.sa2,
              value: null,
              old: null,
              change: null
            }
          });
      }
    });

    fs.writeFile("./mapData.geojson", JSON.stringify(matchedData), function(error) {
      console.log("mapData.geojson written");
    });
  });
});
