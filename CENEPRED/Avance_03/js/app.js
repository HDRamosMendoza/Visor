let map;   
require([
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',
  "esri/layers/FeatureLayer",
  "esri/dijit/FeatureTable",
  "esri/geometry/Extent",
  "esri/graphicsUtils",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/symbols/PictureMarkerSymbol",
  "esri/map",
  "dojo/text!./js/config.json",
  'dojo/_base/lang',
  "dojo/dom",
  "dojo/parser",
  "dojo/ready",
  "dojo/on",
  "dijit/layout/ContentPane",
  "dijit/layout/BorderContainer",
  "dojo/domReady!"
], function(Chart,
  FeatureLayer, FeatureTable, Extent, graphicsUtils, Query, QueryTask, PictureMarkerSymbol,
  Map, configJSON,lang, dom, parser, ready, on, ContentPane, BorderContainer
) {
  /* First map */
  /* map = new Map("map", {center: [-76, -10],zoom: 8,basemap: "topo"}); */
  /* Second map */
  map = new Map("map", {
    //basemap: "dark-gray-vector"
    basemap: "topo"
  });

  

  //Extent object JSON.
  var extent = new Extent({
      "type": "extent",
      "xmin": -8645721.19,
      "ymin": -1370434.35,
      "xmax": -8500337.96,
      "ymax": -1324572.13,
      "spatialReference": {
        "wkid": 102100,
        "latestWkid": 3857
      }
  });
  map.setExtent(extent);
  // Note: Map: Extent Change
  // => https://developers.arcgis.com/javascript/3/samples/map_currentextent/
        
  let loadTable = function() {
    let myFeatureLayer = new FeatureLayer("https://sampleserver6.arcgisonline.com/arcgis/rest/services/RedlandsEmergencyVehicles/FeatureServer/1", {
      mode: FeatureLayer.MODE_ONDEMAND,
      outFields: ["*"],
      visible: true,
      id: "fLayer2"
    });

    let selectionSymbol = new PictureMarkerSymbol("https://sampleserver6.arcgisonline.com/arcgis/rest/services/RedlandsEmergencyVehicles/FeatureServer/1/images/3540cfc7a09a7bd66f9b7b2114d24eee", 48 ,48);
    myFeatureLayer.setSelectionSymbol(selectionSymbol);
    myFeatureLayer.on("click", function(evt) {
      var idProperty = myFeatureLayer.objectIdField,
        feature,
        featureId,
        query;

      if (evt.graphic && evt.graphic.attributes && evt.graphic.attributes[idProperty]) {
        feature = evt.graphic,
        featureId = feature.attributes[idProperty];

        query = new Query();
        query.returnGeometry = false;
        query.objectIds = [featureId];
        query.where = "1=1";

        myFeatureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
      }
    });

    map.addLayer(myFeatureLayer);

    let myFeatureTable = new FeatureTable({
      featureLayer : myFeatureLayer,
      map : map, 
      editable: true,
      syncSelection: true,
      dateOptions: {
        datePattern: 'M/d/y', 
        timeEnabled: true,
        timePattern: 'H:mm',
      },
      fieldInfos: [
        {
          name: 'callnumber', 
          alias: 'Call Number', 
          editable: false //disable editing on this field 
        },
        {
          name: 'speed', 
          alias: 'Current Speed', 
          format: {
            template: "${value} mph" //add mph at the of the value
          }
        },
        {
          name: 'type', 
          alias: 'Vehicle Type'
        },
        {
          name: 'unitname', 
          alias: 'Unit Name'
        }
      ],
      // add custom menu functions to the 'Options' drop-down Menu 
      menuFunctions: [
      {
        label: "Filter Available Emergency Vehicles", 
        callback: function(evt){
          console.log(" -- evt: ", evt);
          // set definition expression on the layer
          // show only available emergency vehicles 
          myFeatureLayer.setDefinitionExpression("status = 0");

          // call FeatureTable.refresh() method to re-fetch features
          // from the layer. Table will only show records that meet 
          // layer's definition expression creteria.  
          myFeatureTable.refresh();
        }
      },{
        label: "Show All Emergency Vehicles", 
        callback: function(evt){
          console.log(" -- evt: ", evt);
          myFeatureLayer.setDefinitionExpression("1=1");
          myFeatureTable.refresh();
        }
      }]
    }, 'ID_TableDetail');

    myFeatureTable.startup();

    // listen to refresh event 
    myFeatureTable.on("refresh", function(evt){
      console.log("refresh event - ", evt);
    });
  }

  map.on("load", loadTable);      


  /* Grafico de Chart JS */
  /*
  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
    datasets: [
      {
      //axis: 'y',
      label: 'Cantidad',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(201, 203, 207, 0.2)'
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
      ],
      borderWidth: 1
    }]
  };

  new Chart('yearsChart', { 
    type: 'bar',
    data,
    options: {
      indexAxis: 'y',
      plugins: {
          legend: {
              display: false,
              position: 'bottom',
              labels: {
                fontColor: "#000080",
              }
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
      }
    }
  });
  */

  const data = {
    labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [4,5,4,7,8],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)'
        ],
      }
    ]
  };

  new Chart('ID_TABLE_Graphic', { 
    type: 'pie',
    data,
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'left',
        },
        title: {
          display: false,
          text: 'Chart.js Pie Chart'
        }
      }
    }
  });
  
  let _queryTask = function(lyr, srv) {
    try {
        let queryTask = new QueryTask(srv);
        let query = new Query();
        query.outFields = lyr.fields.map(x => x.field);
        query.geometry = Window.geometryAmbito;
        query.SpatialRelationship = "esriSpatialRelIntersects";
        query.geometryType = "esriGeometryEnvelope";
        queryTask.executeForCount(query).then(
            (count) => {
                try {
                    console.log(count);
                } catch (error) {
                    console.error(`Error: _queryTask/queryTask.executeForCount response => ${error.name} - ${error.message}`);
                }                    
            },
            (error) => {  
                console.error(`Error: _queryTask/queryTask.executeForCount - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
            }
        ).always(lang.hitch(this, function() {
           
        }.bind(this)));
    } catch (error) { 
        console.error(`Error: _queryTask => ${error.name} - ${error.message}`); 
    }
    /*
    this.queryTaskDeferred = queryTask.execute(query);
    this.queryTaskDeferred.then(
        (response) => { console.log(response); }
    ).catch(
        (error) => { console.error(`Error: Oops! Es tu servidor esta desconectado => ${error.name} - ${error.message}`); }
    ).always(lang.hitch(this, function() { console.log("Always"); }));
    */
  };

  let _jsonTravelTree = function(json) {
    /* Recorre un arból de n hijos */
    try {
      let type; let resul;
      for (var i=0; i < json.length; i++) {
          type = typeof json[i].srv;
          if (type == "undefined") {
              resul = true;
              _queryTask(json[i], json[i].url);
          } else {
              resul += _jsonTravelTree(json[i].srv);
          }
      }            
      return resul;
    } catch (error) {
        console.error(`Error: _jsonTravelTree => ${error.name} - ${error.message}`);
    }
  };


  let _summaryGeneral = function(_ambito) {
    try {
      if(typeof _ambito === 'undefined') {
        _elementById("ID_Alert").style.display = "block";
      } else {
        const config = JSON.parse(configJSON);
        _jsonTravelTree(config.lyrList);
        _elementById("ID_Alert").style.display = "none";
      }
    } catch(error) {
        console.error(`_summaryGeneral: ${error.name} - ${error.message}`);
    }
  };

  _summaryGeneral(Window.geometryAmbito);

});