let map; let featureTable;
require([
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',
  "esri/layers/FeatureLayer",
  "esri/dijit/FeatureTable",
  "esri/geometry/Polygon",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/map",
  "dojo/text!./json/config.json",
  'dojo/_base/lang',
  "dojo/parser",
  "dojo/ready",
  "dojo/on",
  "dojo/domReady!"
], function(
    Chart,
    FeatureLayer,
    FeatureTable,
    Polygon,
    Query,
    QueryTask,
    Map,
    configJSON,
    lang,
    dom,
    parser,
    ready,
    on
) {
    const config = JSON.parse(configJSON);
    let configReport = config.lyrReport;
    let configReport_Temp = [];
    let reportItemTotal = 0;
    let reportItemResult = 0;
    
    map = new Map("map", { center: [-76, -10], zoom: 6, basemap: "topo" });

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

    let _title = function(_title) {
        try {
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

    let _queryTask = function(lyr, _ambito, _index) {
        try {
            let queryTask = new QueryTask(lyr.url);
            let query = new Query();
            query.outFields = lyr.fields.map(x => x.field);
            query.geometry = new Polygon(_ambito)
            query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
            query.returnGeometry = false;
            this.deferredReport = queryTask.executeForCount(query);
            this.deferredReport.then(
                (count) => {
                    try {
                        reportItemResult = reportItemResult + count;
                        _elementById(`ID_TABLE_Resumen_Total`).innerText = reportItemResult;
                        lyr.cantidad = count;
                    } catch (error) {
                        console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                    }
                },
                (error) => {  
                    console.error(`Error: _queryTask ERROR - Oops! => ${error.name} - ${error.message}`);
                }
            ).always(lang.hitch(this, function() {
                try {
                    /* Se limpiar TABLE */
                    _elementById(`ID_TABLE_Resumen_Tbody`).innerHTML = "";
                    /* Se ordena JSON */
                    _sortJSON(configReport_Temp, 'cantidad','desc'); 
                    /* Se lista capas */
                    configReport_Temp.map(function(cValue, index){
                        if(cValue.cantidad) {
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
                        }
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
    
    let _featureTable = function(srv,objectid) {
        try {   
            const idTable = _elementById("ID_TableDetail");
            const tbl = document.createElement("div");
            tbl.id = "ID_TableDynamic";
            idTable.appendChild(tbl);

            let _idTable = "ID_TableDynamic";
            let featureLayer = new FeatureLayer(srv, {
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ["*"],
                definitionExpression: "1=2",
                /*definitionExpression : `${objectid} IN (10982, 6495, 10157)`,
                definitionExpression : "objectid IN (10982, 6495, 10157)",*/
                visible: false,
                id: `ID_FL${_idTable}`
            });
            map.addLayer(featureLayer);

            let queryTask = new QueryTask(srv);
            let _idQueryTask = null;
            let query = new Query();
            query.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")))
            query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
            query.returnGeometry = false;
            query.where = "1=1";
            queryTask.executeForIds(query).then(
                (response) => {
                    try {
                        _idQueryTask = response.toString();
                    } catch (error) {
                        console.error(`Count: _queryTask => ${error.name} - ${error.message}`);
                    }                    
                },
                (error) => {  
                    console.error(`Error: _queryTask => ${error.name} - ${error.message}`);
                }
            ).always(lang.hitch(this, function() {
                try {
                    featureLayer.setDefinitionExpression(`${objectid} IN (${_idQueryTask})`);
                    featureTable = new FeatureTable({
                        featureLayer : featureLayer,
                        map : map,
                        showAttachments: true,
                        showDataTypes: true,
                        showFeatureCount: true,
                        showGridHeader: true,
                        showGridMenu: true,
                        showRelatedRecords: true,
                        showStatistics: true,
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
                                featureLayer.setDefinitionExpression("status = 0");
                
                                // call FeatureTable.refresh() method to re-fetch features
                                // from the layer. Table will only show records that meet 
                                // layer's definition expression creteria.  
                                featureTable.refresh();
                            }
                        },{
                            label: "Show All Emergency Vehicles", 
                            callback: function(evt){
                                console.log(" -- evt: ", evt);
                                featureLayer.setDefinitionExpression("1=1");
                                featureTable.refresh();
                            }
                        }]
                    }, _idTable);            
                    featureTable.startup();
                } catch (error) {
                    console.error(`Error: _queryTask/queryTask always => ${error.name} - ${error.message}`);
                } 
            }.bind(this)));
            /* featureTable.on("refresh", function(evt) { console.log("refresh event - ", evt); }); */
        } catch(error) {
            console.error(`_featureTable: ${error.name} - ${error.message}`);
        }
    };

    let _reportJson = function(json, _conf, _name = "") {
        try { /* Recorre un arból de n hijos */
            let type; let resul; let layer;
            for (var i=0; i < json.length; i++) {
                type = typeof json[i].srv;
                if (type == "undefined") {
                    reportItemTotal = reportItemTotal + 1;
                    resul = true;
                    layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name} / <strong>${json[i].name}</strong>`;
                    _conf.push({ name:layer , url:json[i].url , fields:json[i].fields , objectid:json[i].objectid , default:typeof json[i].default !== "undefined" ? true: false });
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
        try { /* if(_ambito ?? true) { */
            if(Object.keys(_ambito).length === 0) {
                _elementById("ID_Alert").style.display = "block";
            } else {
                _elementById("ID_Alert").style.display = "none";
                _reportJson(configReport, configReport_Temp);
                configReport_Temp.map(function(lyr, index) {
                    !lyr.default || _featureTable(lyr.url,lyr.objectid);
                    _queryTask(lyr, _ambito, index);
                });
            }
        } catch(error) {
            console.error(`_summaryGeneral: ${error.name} - ${error.message}`);
        }
    };    
    _summaryGeneral(JSON.parse(localStorage.getItem("reportGeometry")));

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
                divHeader.dataset.url = lyr.url,
                divHeader.dataset.objectid = lyr.objectid,
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
            featureTable.destroy();
            _featureTable(tabPanes[i].getAttribute("data-url"), tabPanes[i].getAttribute("data-objectid"));
		});
	}
    let loadTable = function() { _graphicPie(); }
    map.on("load", loadTable); 
});