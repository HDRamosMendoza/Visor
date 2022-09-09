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
  "dojo/text!./json/config.json",
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
    const config = JSON.parse(configJSON);
    let configReport = config.lyrReport;
    let configReport_Temp = [];

    let reportItemTotal = 0;
    let reportItemRandom = null;
    let reportItemResult = 0;
    
    map = new Map("map", {
        center: [-76, -10], 
        zoom: 6,
        basemap: "topo",
    });

    let _elementById = function (paramId) {
        try { /* Valida el ID */
            let id = document.getElementById(paramId);
            if(id !== null && id !== undefined){
                return id;
            } else {
                console.log(`Error: ID(${paramId}) => null || undefined`);
            }
        } catch(error) {
            console.error(`_elementById: ${error.name} - ${error.message}`);
        }
    };
    _elementById("ID_Alert").style.display = "none";


    //JSON.parse(localStorage.getItem("geometryIntersect"))

    let _title = function(_title) {
        try {
            console.log(JSON.parse(localStorage.getItem("reportAmbito")));
            _elementById("ID_ReportTitle").innerHTML = "";
            _elementById("ID_ReportTitle").innerHTML = `<i class="fa fa-line-chart" aria-hidden="true"></i>&nbsp; ${_title || ''}`;
        } catch (error) {
            console.error(`Error: _title => ${error.name} - ${error.message}`);
        }
    };
    _title(JSON.parse(localStorage.getItem("reportTitle")));

    let _htmlTable = function(ID_Table) {
        try { /* Se crea la tabla de resumen */
            const idTable = ID_Table.getAttribute("id"); 
            const tbl = document.createElement("table");
            tbl.className = "tbl";
            /* Head */
            const tblHead = document.createElement("thead");
            const rowHead = document.createElement("tr");
            const rowHeadTH_Item = document.createElement("th");
            const rowHeadTH_ItemNode = document.createTextNode("#");
            rowHeadTH_Item.appendChild(rowHeadTH_ItemNode);
            const rowHeadTH_Name = document.createElement("th");
            const rowHeadTH_NameNode = document.createTextNode("Capas / Temáticas");
            rowHeadTH_Name.appendChild(rowHeadTH_NameNode);
            const rowHeadTH_Count = document.createElement("th");
            const rowHeadTH_CountSize = document.createTextNode("Cantidad");
            rowHeadTH_Count.appendChild(rowHeadTH_CountSize);
            rowHead.appendChild(rowHeadTH_Item);
            rowHead.appendChild(rowHeadTH_Name);
            rowHead.appendChild(rowHeadTH_Count);
            tblHead.appendChild(rowHead);
            /* Body */
            const tblBody = document.createElement("tbody");
            tblBody.id = `${idTable}_Tbody`;
            const row = document.createElement("tr");
            const rowTD = document.createElement("td");
            rowTD.colSpan = "3";
            rowTD.style.textAlign = "center";
            const rowTD_Node = document.createTextNode("Sin Coincidencias");
            rowTD.appendChild(rowTD_Node);
            row.appendChild(rowTD);
            tblBody.appendChild(row);
            tbl.appendChild(tblHead);
            tbl.appendChild(tblBody);
            /* Foot */
            const tblFoot = document.createElement("tfoot");
            const rowFoot = document.createElement("tr");
            const rowFootTD = document.createElement("td");
            rowFootTD.colSpan = "2";
            rowFootTD.style.textAlign = "right";
            rowFootTD.style.fontWeight = "800";
            const rowFootTD_Text = document.createTextNode("Total");
            rowFootTD.appendChild(rowFootTD_Text);
            const rowFootTDCant = document.createElement("td");
            rowFootTDCant.style.textAlign = "right";                
            const rowFootTD_Cant = document.createTextNode("0");
            rowFootTDCant.id = `${idTable}_Total`;
            rowFootTDCant.appendChild(rowFootTD_Cant);
            rowFoot.appendChild(rowFootTD);
            rowFoot.appendChild(rowFootTDCant);
            tblFoot.appendChild(rowFoot);
            tbl.appendChild(tblFoot);
            /* ID */
            ID_Table.appendChild(tbl);
        } catch (error) {
            console.error(`Error: _htmlTable => ${error.name} - ${error.message}`);
        }
    };    
    _htmlTable(_elementById("ID_TABLE_Resumen"));

    let _sortJSON = function(data, key, orden) {
        try { /* Ordenando el json de capas */
            return data.sort(function (a, b) {
                var x = a[key], y = b[key];
        
                if (orden === 'asc') { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        
                if (orden === 'desc') { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
            });
        } catch (error) { 
            console.error(`Error: _sortJSON => ${error.name} - ${error.message}`); 
        }
    };

    //let _queryTask = function(lyr, _ambito, _index, _random) {
    let _queryTask = function(lyr, _ambito, _index) {
        try {
            let queryTask = new QueryTask(lyr.url);
            let query = new Query();
            query.outFields = lyr.fields.map(x => x.field);
            //query.geometry = _ambito;
            query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
            query.returnGeometry = true;
            query.where ="1=1";
            this.deferredReport = queryTask.executeForCount(query);
            this.deferredReport.then(
                (count) => {
                    try {
                        //if (reportItemRandom == _random) {
                            reportItemResult = reportItemResult + count;
                            _elementById(`ID_TABLE_Resumen_Total`).innerText = reportItemResult;
                            lyr.cantidad = count;
                        //}
                    } catch (error) {
                        console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                    }                    
                },
                (error) => {  
                    console.error(`Error: _queryTask ERROR - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                }
            ).always(lang.hitch(this, function() {
                try {
                    /* Se limpiar TABLE */
                    _elementById(`ID_TABLE_Resumen_Tbody`).innerHTML = "";
                    /* Se ordena JSON */
                    _sortJSON(configReport_Temp, 'cantidad','desc'); 
                    /* Se lista capas */
                    configReport_Temp.map(function(cValue, index){
                        let fragment = document.createDocumentFragment();
                        let row = document.createElement("tr");
                        let cell_0 = document.createElement("td");
                        let cellText_0 = document.createTextNode(index + 1);
                        cell_0.appendChild(cellText_0);
                        let cell_1 = document.createElement("td");
                        cell_1.innerHTML = cValue.name;
                        let cell_2 = document.createElement("td");
                        let cellText_2 = document.createTextNode(cValue.cantidad || 0);
                        cell_2.appendChild(cellText_2);
                        row.appendChild(cell_0);
                        row.appendChild(cell_1);
                        row.appendChild(cell_2);
                        fragment.appendChild(row);
                        _elementById(`ID_TABLE_Resumen_Tbody`).appendChild(fragment);
                        /* if(typeof cValue.cantidad !== undefined && typeof cValue.name !== undefined) {
                            updateChartData("ID_TABLE_Graphic", configReport_Temp.map(x=>x.cantidad),configReport_Temp.map(x=>x.name));
                        } */
                    }.bind(this)); 
                } catch (error) {
                    console.error(`Error: _queryTask always => ${error.name} - ${error.message}`);
                } 
            }.bind(this)));
        } catch (error) { 
            console.error(`Error: _queryTask => ${error.name} - ${error.message}`); 
        }
    };
    /*
    let countItem = 0;
    let _jsonTravelTree = function(json) {
        try {
            let type; let resul;
            for (var i=0; i < json.length; i++) {
                type = typeof json[i].srv;
                if (type == "undefined") {
                    resul = true;
                    
                    _queryTask(json[i], json[i].url, abc, countItem);
                } else {
                    resul += _jsonTravelTree(json[i].srv);
                }
            }            
            return resul;
        } catch (error) {
            console.error(`Error: _jsonTravelTree => ${error.name} - ${error.message}`);
        }
    };
    */
    let _featureTable = function(srv) {
        try {            
            let _idTable = "ID_TableDetail";
            let myFeatureLayer = new FeatureLayer(srv, {
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ["*"],
                visible: true,
                id: `ID_FL${_idTable}`
            });
            /*
            let selectionSymbol = new PictureMarkerSymbol("https://sampleserver6.arcgisonline.com/arcgis/rest/services/RedlandsEmergencyVehicles/FeatureServer/1/images/3540cfc7a09a7bd66f9b7b2114d24eee", 48 ,48);
            myFeatureLayer.setSelectionSymbol(selectionSymbol);
            */
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
                    callback: function(evt) {
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
            }, _idTable);
              
            myFeatureTable.startup();
          
              // listen to refresh event 
            myFeatureTable.on("refresh", function(evt) {
                console.log("refresh event - ", evt);
            });

        } catch(error) {
            console.error(`_featureTable: ${error.name} - ${error.message}`);
        }
    };

    // _analysisJson
    let _reportJson = function(json, _conf, _name = "") {
        try { /* Recorre un arból de n hijos */
            let type; let resul; let layer;
            for (var i=0; i < json.length; i++) {
                type = typeof json[i].srv;
                if (type == "undefined") {
                    reportItemTotal = reportItemTotal + 1;
                    resul = true;
                    layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name} / <strong>${json[i].name}</strong>`;

                    _conf.push({ name:layer , url:json[i].url , fields:json[i].fields , default:typeof json[i].default !== "undefined" ? true: false });

                } else {
                    resul += _reportJson(json[i].srv, _conf, _name || json[i].name);
                }
            }            
            return resul;
        } catch (error) {
            console.error(`Error: _reportJson => ${error.name} - ${error.message}`);
        }
    };    
  
    let _summaryGeneral = function(_ambito) {
        try {
            console.log(_ambito);
            if(typeof _ambito === 'undefined') {
                _elementById("ID_Alert").style.display = "block";
            } else {
                _elementById("ID_Alert").style.display = "none";
                _reportJson(configReport, configReport_Temp);                
                //console.log(configReport_Temp);
                //_jsonTravelTree(configReport);                
                //let itemRandom = _getRandom();
                //reportItemRandom = itemRandom;
                let geometryIntersect = JSON.parse(localStorage.getItem("geometryIntersect"));
                configReport_Temp.map(function(lyr, index) {
                    _queryTask(lyr, geometryIntersect, index);
                    !lyr.default || _featureTable(lyr.url);                    
                });
            }
        } catch(error) {
            console.error(`_summaryGeneral: ${error.name} - ${error.message}`);
        }
    };    
    _summaryGeneral(JSON.parse(localStorage.getItem("geometryIntersect")));

    /*
    const updateChartData = (chartId, data, label) => {
        const chart = Chart.getChart(chartId)
        chart.data.datasets[0].data = data
        chart.data.datasets[0].label = label
        chart.update()
    }
    */
    

    
/*
    configReport_Temp.map(function(cValue, index){
        
    }.bind(this));
    */

    let _graphicPie = function() {
        try {
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
                            display: false,
                            position: 'left',
                        },
                        title: {
                            display: false,
                            text: 'GRÁFICO DE RESUMEN'
                        }
                    }
                }
            });
        } catch(error) {
            console.error(`_graphicPie: ${error.name} - ${error.message}`);
        }
    };

    let _jsonTravelTree = function(_json, _name = "") {
		try {
            _json.map(function(lyr, index) {
                const divHeader = document.createElement("div");
                divHeader.innerHTML = lyr.name;
                divHeader.className = !lyr.default || "active";
                let fragmentHeader = document.createDocumentFragment();
                fragmentHeader.appendChild(divHeader);                
                _elementById("ID_TAB_Header").appendChild(fragmentHeader);
                
                const divContent = document.createElement("div");
                divContent.className = !lyr.default || "active";
                const divTitle = document.createElement("section");
                divTitle.innerHTML = lyr.name;
                const divHR = document.createElement("section");
                divHR.className = "div-hr";
                const divAside = document.createElement("section");
                divAside.className = "report-table";
                divAside.id = `IDTable_${index}`;
                divContent.appendChild(divTitle);
                divContent.appendChild(divHR);
                divContent.appendChild(divAside);
                let fragmentContent = document.createDocumentFragment();
                fragmentContent.appendChild(divContent);

                _elementById("ID_TAB_Content").appendChild(fragmentContent);
            }.bind(this));
		} catch (error) {
			console.error(`Error: _jsonTravelTree => ${error.name} - ${error.message}`);
		}
	};
	_jsonTravelTree(configReport_Temp);

    /*_elementById("ID_TAB_Header").childNodes[3].className = "active";
	_elementById("ID_TAB_Content").childNodes[3].className = "active";*/
    
    let _class = function(name) { return document.getElementsByClassName(name); };
	let tabPanes = _class("tab-header")[0].getElementsByTagName("div");	
	for(let i=0;i<tabPanes.length;i++) {
		tabPanes[i].addEventListener("click", function() {		
			_class("tab-header")[0].getElementsByClassName("active")[0].classList.remove("active");
			tabPanes[i].classList.add("active");			
			/*_class("tab-indicator")[0].style.top = `calc(80px + ${i*50}px)`;*/			
			_class("tab-content")[0].getElementsByClassName("active")[0].classList.remove("active");
			_class("tab-content")[0].getElementsByTagName("div")[i].classList.add("active");
		});
	}

    let loadTable = function() { _graphicPie(); }
    map.on("load", loadTable); 
});