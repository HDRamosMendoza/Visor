let map; let featureTable = null;
require([
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',
  'esri/SpatialReference',
  'esri/layers/FeatureLayer',
  'esri/dijit/FeatureTable',
  'esri/geometry/Polygon',
  'esri/geometry/geometryEngine',
  'esri/tasks/GeometryService',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/tasks/StatisticDefinition',
  'esri/config',
  'esri/map',
  'dojo/text!./json/config.json',
  'dojo/_base/lang',
  'dojo/ready',
  'dojo/on',
  'dojo/domReady!'
], function(
    Chart,
    SpatialReference,
    FeatureLayer,
    FeatureTable,
    Polygon,
    geometryEngine,
    GeometryService,
    Query,
    QueryTask,
    StatisticDefinition,
    esriConfig,
    Map,
    configJSON,
    lang,
    dom,
    ready,
    on
) {
    esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.geometryService = new GeometryService("https://sigrid.cenepred.gob.pe/arcgis/rest/services/Utilities/Geometry/GeometryServer");

    const config = JSON.parse(configJSON);
    let configDiagnosis = config.lyrDiagnosis;
    let configDiagnosis_Temp = [];
    let configAnalysis = config.lyrAnalysis;
    let configAnalysis_Temp = [];
    let configSummary_Temp = [];    
    //let reportItemTotal = 0;
    let reportItemResult = 0;
    let chartLabel = [];
    let chartData = [];
    let chartBackgroundColor = [];
    let chartID = "ID_TABLE_Graphic";
    let graphicID = "ID_CR_Graphic";
    let summaryID = "ID_CR_Summary";
    
    this.analysisTotal = 0;
    this.diagnosisTotal = 0;
    this.diagnosisCount = 1;

    this.summaryTotal = 0;
    this.summaryCount = 0;
    
    map = new Map("map", { center: [-76, -10], zoom: 6, basemap: "topo" });
    /* Load GEOMETRY */
    let _geometryAmbito = JSON.parse(localStorage.getItem("reportGeometry"));
    let _ambitoLS = JSON.parse(localStorage.getItem("reportTitle_request")).replace(" (distrito)", "");
    _ambitoLS = _ambitoLS.replace(" (provincia)", "");
    _ambitoLS = _ambitoLS.replace(" (departamento)", "");
    /* Create QUERY */
    let _ambitoName = JSON.parse(localStorage.getItem("reportTitle"));
    let _ambitoArr = _ambitoLS.split(",");
    let _ambitoQuery =  _ambitoArr.length == 3 ? `DEPA = '${_ambitoArr[2].trim()}' AND PROV = '${_ambitoArr[1].trim()}' AND DIST = '${_ambitoArr[0].trim()}'`: 
                        _ambitoArr.length == 2 ? `DEPA = '${_ambitoArr[1].trim()}' AND PROV = '${_ambitoArr[0].trim()}' AND DIST IS NULL`: 
                        `DEPA = '${_ambitoArr[0].trim()}' AND PROV IS NULL AND DIST IS NULL`;

    /* Validated ID */
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
    /* Sort JSON - QUANTITY */
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
    /* Load TITLE */
    let _title = function(_title) {
        try {
            _elementById("ID_ReportTitle").innerHTML = "";
            _elementById("ID_ReportTitle").innerHTML = `<i class="fa fa-line-chart" aria-hidden="true"></i>&nbsp; ${_title || ''}`;
        } catch (error) {
            console.error(`Error: _title => ${error.name} - ${error.message}`);
        }
    };
    _title(_ambitoName);
    /* Create GRAPHIC */
    let _graphic = function(_id) {
        try {
            const data = { labels:[], datasets:[{ data:[], backgroundColor:[],borderWidth: 1 }]};
            new Chart(_id, { 
                type: 'doughnut',
                data,
                options: {
                    responsive: false,
                    plugins: {
                        legend: { display:false, position:'bottom' },
                        title: { display:false, text:'GRÁFICO DE RESUMEN' }
                    }
                }
            });
        } catch(error) {
            console.error(`_graphicPie: ${error.name} - ${error.message}`);
        }
    };
    //_graphic(graphicID);
    /* Load LIST JSON */
    let _reportJson = function(json, _conf, _count, _name = "") {
        try { /* Recorre un arból de n hijos */
            let type; let resul; let layer;             
            for (var i=0; i < json.length; i++) {
                type = typeof json[i].srv;
                if (type == "undefined") {
                    //reportItemTotal = reportItemTotal + 1;
                    this[_count] = this[_count] + 1;
                    tag= this[_count],
                    resul = true;
                    //layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name} / <strong>${json[i].name}</strong>`;
                    layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name}<strong>${json[i].name}</strong>`;
                    _conf.push({
                        name:layer ,
                        tag: this[_count],
                        url:json[i].url,
                        fields:json[i].fields,
                        objectid:json[i].objectid,
                        rgb:json[i].rgb,
                        default:typeof json[i].default !== "undefined" ? true: false,
                        content:json[i].content,
                        cantidad: 0
                    });
                } else {
                    if(_name.length == 0) { /* Se filtra solo las cabeceras una vez */
                        _conf.push({ name:json[i].name });
                    }
                    resul += _reportJson(json[i].srv, _conf, _count, _name.concat(json[i].name + " / "));
                }
            }            
            return resul;
        } catch (error) {
            console.error(`Error: _reportJson => ${error.name} - ${error.message}`);
        }
    };
    /* List DIAGNOSIS */
    _reportJson(configDiagnosis,configDiagnosis_Temp,"diagnosisTotal");
    configSummary_Temp = JSON.parse(JSON.stringify(configDiagnosis_Temp));
    configSummary_Temp.map(function(lyr, index) {
        if(typeof lyr.url === "undefined") {
            configSummary_Temp.splice(index, 1);
        }
    });
    /* List ANALYSIS */
    _reportJson(configAnalysis,configAnalysis_Temp,"analysisTotal");
    configAnalysis_Temp.map(function(lyr, index) {
        if(typeof lyr.url === "undefined") {
            configAnalysis_Temp.splice(index, 1);
        }
    });    
    /* Lista de DIAGNOSIS */
    //_reportJson(configDiagnosis,configSummary_Temp,"summaryTotal");
    
    /* Crear TABLE */
    let _htmlTable = function(ID_Table) {
        try { /* Se crea la tabla de resumen */
            ID_Table.innerHTML = "";
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
            const rowHeadTH_NameNode = document.createTextNode("Información");
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
            const rowTD_Node = document.createTextNode("Sin coincidencias");
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
    /* Add row TABLE */
    let _htmlTable_ADD = function(_id,_arr) {
        try {
            _arr.forEach(element => {
                let fragment = document.createDocumentFragment();
                let row = document.createElement("tr");
                let cell_0 = document.createElement("td"); 
                let cellText_0 = document.createTextNode(element.index);
                cell_0.appendChild(cellText_0);
                let cell_1 = document.createElement("td");
                cell_1.style.textAlign = "left";
                cell_1.innerHTML = element.item;
                let cell_2 = document.createElement("td");
                cell_2.style.textAlign = "right";
                let cellText_2 = document.createTextNode(element.val);
                cell_2.appendChild(cellText_2);
                row.appendChild(cell_0);
                row.appendChild(cell_1);
                row.appendChild(cell_2);
                fragment.appendChild(row);
                _elementById(`${_id}_Tbody`).appendChild(fragment);
            });            
        } catch (error) {
            console.error(`Error: _htmlTable_ADD => ${error.name} - ${error.message}`);
        }
    }; 
    /* Se crea la tabla de resumen */
    let _htmlTableTAB = function(ID_Table, _header01, _header02) {
        try {
            ID_Table.innerHTML = "";
            const idTable = ID_Table.getAttribute("id"); 
            const tbl = document.createElement("table");
            tbl.className = "tbl";
            tbl.style.margin = "10px 0px";
            /* Head */
            const tblHead = document.createElement("thead");
            const rowHead = document.createElement("tr");
            const rowHeadTH_Name = document.createElement("th");
            rowHeadTH_Name.style.textAlign = "center";
            rowHeadTH_Name.style.width = "60%";
            const rowHeadTH_NameNode = document.createTextNode(_header01);
            rowHeadTH_Name.appendChild(rowHeadTH_NameNode);
            const rowHeadTH_Count = document.createElement("th");
            rowHeadTH_Count.style.textAlign = "center";
            const rowHeadTH_CountSize = document.createTextNode(_header02);
            rowHeadTH_Count.appendChild(rowHeadTH_CountSize);
            //rowHead.appendChild(rowHeadTH_Item);
            rowHead.appendChild(rowHeadTH_Name);
            rowHead.appendChild(rowHeadTH_Count);
            tblHead.appendChild(rowHead);
            /* Body */
            const tblBody = document.createElement("tbody");
            tblBody.id = `${idTable}_Tbody`;
            const row = document.createElement("tr");
            const rowTD = document.createElement("td");
            rowTD.colSpan = "2";
            rowTD.style.textAlign = "center";
            const rowTD_Node = document.createTextNode("Sin coincidencias");
            rowTD.appendChild(rowTD_Node);
            row.appendChild(rowTD);
            tblBody.appendChild(row);
            tbl.appendChild(tblHead);
            tbl.appendChild(tblBody);
            /* Foot */
            const tblFoot = document.createElement("tfoot");
            const rowFoot = document.createElement("tr");
            const rowFootTD = document.createElement("td");
            rowFootTD.colSpan = "1";
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
            console.error(`Error: _htmlTableTAB => ${error.name} - ${error.message}`);
        }
    }; 
    /* Add row TABLE */
    let _htmlTableTAB_ADD = function(_id,_arr) {
        try {
            _arr.forEach(element => {
                let fragment = document.createDocumentFragment();
                let row = document.createElement("tr");
                let cell_1 = document.createElement("td");
                let cellText_1 = document.createTextNode(element.item);
                cell_1.appendChild(cellText_1);
                let cell_2 = document.createElement("td");
                cell_2.style.textAlign= "right";
                let cellText_2 = document.createTextNode(element.val);
                cell_2.appendChild(cellText_2);
                row.appendChild(cell_1);
                row.appendChild(cell_2);
                fragment.appendChild(row);
                _elementById(`${_id}_Tbody`).appendChild(fragment);
            });            
        } catch (error) {
            console.error(`Error: _htmlTableTAB_ADD => ${error.name} - ${error.message}`);
        }
    };    
    //_htmlTable(_elementById("ID_CR_Summary"));
    /* Carga de la funcional del acordion */
    let _acordion = function() {
        try {
            let acc = document.getElementsByClassName("accordion"); let i;
            for (i = 0; i < acc.length; i++) {
                acc[i].addEventListener("click", function() {
                    this.classList.toggle("active");
                    var panel = this.nextElementSibling;
                    if (panel.style.maxHeight) {
                        panel.style.maxHeight = null;
                    } else {
                        panel.style.maxHeight = panel.scrollHeight + "px";
                    } 
                });
            }
        } catch (error) {
            console.error(`_acordion: ${error.name} - ${error.message}`);
        }
    };
    _acordion();
    /*configSummary_Temp.map(function(lyr, index) {
        if(typeof lyr.url === "undefined") {
            configSummary_Temp.splice(index, 1);
        }
    });*/
    /* Carga de datos al acordion 
    let _acordionLoad = function(_summaryID,_graphicID) {
        try {//summaryID,graphicID
            this.ID_CR_Summary.style.display = "none";
            this.ID_CR_Load.style.display = "block";
            let _count = 0;
            configSummary_Temp.map(function(lyr) {
                if(typeof lyr.url !== "undefined") {
                    let queryTaskSummary = new QueryTask(lyr.url);
                    let querySummary = new Query();
                    querySummary.geometry = new Polygon(this.geometryAmbito);
                    querySummary.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                    querySummary.returnGeometry = false;
                    queryTaskSummary.executeForCount(querySummary).then(
                        (response) => {
                            try {
                                _count = _count + response;
                                this.summaryCount++;
                                _elementById(`${_summaryID}_Total`).innerText = _count;
                                lyr.cantidad = response;
                            } catch (error) {
                                console.error(`Response: _acordionLoad => ${error.name} - ${error.message}`);
                            }                    
                        },
                        (error) => {  
                            console.error(`Error: _acordionLoad => ${error.name} - ${error.message}`);
                        }
                    ).always(lang.hitch(this, function() {
                        try {
                            if(this.summaryTotal == this.summaryCount) {
                                // Se lista capas
                                let _index = 0;
                                // Se limpiar TABLE
                                _sortJSON(configSummary_Temp, 'cantidad','desc');
                                _elementById(`${_summaryID}_Tbody`).innerHTML = "";
                                configSummary_Temp.map(function(_lyr) {
                                    if(_lyr.cantidad > 0) {
                                        // Load TABLE
                                        _index = _index + 1;
                                        let fragment = document.createDocumentFragment();
                                        let row = document.createElement("tr");
                                        let cell_0 = document.createElement("td");
                                        let cellText_0 = document.createTextNode(_index);
                                        cell_0.appendChild(cellText_0);
                                        let cell_1 = document.createElement("td");
                                        cell_1.innerHTML = _lyr.name;
                                        let cell_2 = document.createElement("td");
                                        let cellText_2 = document.createTextNode(_lyr.cantidad || 0);
                                        cell_2.appendChild(cellText_2);
                                        row.appendChild(cell_0);
                                        row.appendChild(cell_1);
                                        row.appendChild(cell_2);
                                        fragment.appendChild(row);
                                        _elementById(`${_summaryID}_Tbody`).appendChild(fragment);
                                        // Load GRAPHIC
                                        let chart = Chart.getChart(_graphicID);
                                        chartData.push(_lyr.cantidad);
                                        chartLabel.push(_lyr.name.replace(/<[^>]+>/g, ''));
                                        chartBackgroundColor.push(_lyr.rgb);                                
                                        chart.data.datasets[0].data = chartData;
                                        chart.data.datasets[0].backgroundColor = chartBackgroundColor;
                                        chart.data.labels = chartLabel;
                                        chart.update();
                                    }
                                }.bind(this));
                                this.ID_CR_Load.style.display = "none";
                                this.ID_CR_Summary.style.display = "block";
                            }  
                        } catch (error) {
                            console.error(`Error: _acordionLoad always => ${error.name} - ${error.message}`);
                        } 
                    }.bind(this)));
                    
                }
            }.bind(this));            
        } catch (error) {
            console.error(`_acordionLoad: ${error.name} - ${error.message}`);
        }
    };
    */
    /*_acordionLoad(summaryID,graphicID);*/
    let _queryTask = function(lyr, _count, _ambito, _index) {
        try {
            /* Se filtra para que no entre la cabeceras de grupos */
            if(Object.keys(lyr).length !== 1) {
                this.ID_Load.style.display = "block";    
                this.ID_TABLE_Resumen.style.display = "none";                
                /* Statistic Diagnosis */
                let diagnosisSUM = new StatisticDefinition();
                diagnosisSUM.statisticType = "count";
                diagnosisSUM.onStatisticField = "shape";
                //diagnosisSUM.onStatisticField = lyr.objectid;
                diagnosisSUM.outStatisticFieldName = "cantidad";
                /* Statistic Diagnosis Response */
                let queryTask = new QueryTask(lyr.url);
                let query = new Query();
                query.outFields = lyr.fields.map(x => x.name);
                query.geometry = new Polygon(_ambito)
                query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                query.returnGeometry = false;
                query.outStatistics = [ diagnosisSUM ];
                //this.deferredReport = queryTask.executeForCount(query);
                this.deferredReport = queryTask.execute(query);
                this.deferredReport.then(
                    (response) => {
                        try {
                            
                            let _attr = response.features[0].attributes;
                            reportItemResult = reportItemResult + _attr.cantidad;
                            _elementById(`ID_TABLE_Resumen_Total`).innerText = reportItemResult;
                            this.diagnosisCount++;
                            lyr.cantidad = _attr.cantidad;
                            if(_attr.cantidad === 0) {
                                _elementById(`Header_${lyr.tag}`).style.display="none";
                                _elementById(`Content_${lyr.tag}`).style.display="none";
                                //_elementById("ID_TAB_Header").childNodes[5+_index].style.display="none";
                                //_elementById("ID_TAB_Content").childNodes[5+_index].style.display="none";
                            } else {
                                let chart = Chart.getChart(chartID);
                                // Se detecto que la ejecución carga antes que la librería CHARTJS
                                if(chart ?? false) {
                                    chartData.push(lyr.cantidad);
                                    chartLabel.push(lyr.name.replace(/<[^>]+>/g, ''));
                                    chartBackgroundColor.push(lyr.rgb);
                                    chart.data.datasets[0].data = chartData;
                                    chart.data.datasets[0].backgroundColor = chartBackgroundColor;
                                    chart.data.labels = chartLabel;
                                    chart.update();
                                }
                            }
                        } catch (error) {
                            console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                        }
                    },
                    (error) => {  
                        console.error(`Error: _queryTask ERROR - Oops! => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, function() {
                    try {
                        if( this.diagnosisCount == _count) {
                            this.ID_Load.style.display = "none";
                            this.ID_TABLE_Resumen.style.display = "block";
                            /* Sort JSON */
                            _sortJSON(configSummary_Temp, 'cantidad','desc');
                            /* Se limpiar TABLE */
                            _elementById(`ID_TABLE_Resumen_Tbody`).innerHTML = "";
                            configSummary_Temp.map(function(_lyr) {
                                _elementById("ID_GraphicSummary").click();
                                if(_lyr.cantidad > 0 && typeof _lyr.cantidad !== "undefined") {
                                    /*_index = _index + 1;*/
                                    let fragment = document.createDocumentFragment();
                                    let row = document.createElement("tr");
                                    let cell_0 = document.createElement("td");
                                    /*let cellText_0 = document.createTextNode(_index);*/
                                    cell_0.innerHTML = `<span style="color: ${_lyr.rgb}">■</span>`;
                                    /*cell_0.appendChild(cellText_0);*/
                                    let cell_1 = document.createElement("td");
                                    cell_1.innerHTML = _lyr.name;
                                    let cell_2 = document.createElement("td");
                                    let cellText_2 = document.createTextNode(_lyr.cantidad || 0);
                                    cell_2.appendChild(cellText_2);
                                    row.appendChild(cell_0);
                                    row.appendChild(cell_1);
                                    row.appendChild(cell_2);
                                    fragment.appendChild(row);
                                    _elementById(`ID_TABLE_Resumen_Tbody`).appendChild(fragment);
                                }
                            }.bind(this)); 
                        }                         
                    } catch (error) {
                        console.error(`Error: _queryTask always => ${error.name} - ${error.message}`);
                    } 
                }.bind(this)));
            }
        } catch (error) { 
            console.error(`Error: _queryTask => ${error.name} - ${error.message}`); 
        }
    };
    
    let _featureTable = function(srv,objectid,fields) {
        try {   
            let idTable = _elementById("ID_TableDetail");
            let tbl = document.createElement("div");
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
                        showAttachments: false,
                        showDataTypes: false,
                        showFeatureCount: true,
                        showGridHeader: true,
                        showColumnHeaderTooltips: false,
                        showGridMenu: false,
                        showRelatedRecords: false,
                        showStatistics: false,
                        syncSelection: false,
                        dateOptions: {
                            datePattern: 'M/d/y', 
                            timeEnabled: true,
                            timePattern: 'H:mm',
                        },
                        outFields: fields.map(x => x.name),
                        fieldInfos: fields,
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
        } catch(error) {
            console.error(`_featureTable: ${error.name} - ${error.message}`);
        }
    };
  
    let _summaryGeneral = function(_ambito) {
        try { /* if(_ambito ?? true) { */
            if(Object.keys(_ambito).length === 0) {
                _elementById("ID_Alert").style.display = "block";
            } else {
                _elementById("ID_Alert").style.display = "none";
                this.diagnosisCount = 1;
                _elementById("ID_GraphicSummary").click();
                configSummary_Temp.map(function(lyr, index) {
                    //!lyr.default || _featureTable(lyr.url,lyr.objectid,lyr.fields);
                    _queryTask(lyr, this.diagnosisTotal, _ambito, index);
                });
            }
        } catch(error) {
            console.error(`_summaryGeneral: ${error.name} - ${error.message}`);
        }
    };    
    _summaryGeneral(JSON.parse(localStorage.getItem("reportGeometry")));

    let _graphicPie = function() {
        try {
            /*const data = { labels:[], datasets:[{ data:[], backgroundColor:[],borderWidth: 1 }]};*/
            new Chart(chartID, { 
                type: 'doughnut',
                data: { labels:[], datasets:[{ data:[], backgroundColor:[],borderWidth: 1 }]},
                options: {
                    responsive: false,
                    plugins: {
                        legend: { display:false, position:'bottom' },
                        title: { display:false, text:'GRÁFICO DE RESUMEN' }
                    }
                }
            });
        } catch(error) {
            console.error(`_graphicPie: ${error.name} - ${error.message}`);
        }
    };

    let _jsonTravelTree = function(_json, _name = "") {
		try {/* Se crea dinamicamente el TAB y CONTENT del TAB */
            

            let jsonLS = JSON.parse(localStorage.getItem("reportTitle_request"));
            let litAmbito = jsonLS.search("(distrito)") > 0 ? "DISTRITO" : 
            jsonLS.search("(provincia)") > 0 ? "PROVINCIA" : "DEPARTAMENTO";

            /* ANALIZAR */
            let _nameTemp = "";
            _json.map(function(lyr, index) {
                //console.log(lyr.tag);
                const divHeader = document.createElement("div");
                divHeader.innerHTML = lyr.name;
                if(Object.keys(lyr).length === 1) {
                    divHeader.className = "header-group";
                    _nameTemp = lyr.name;
                } else {
                    //divHeader.id = `Header_${index}`;
                    divHeader.id = `Header_${lyr.tag}`;
                    divHeader.className = "tablinks";
                    divHeader.onclick = function(){
                        /*let HeaderID = `Header_${index}`;*/
                        let HeaderID = `Header_${lyr.tag}`;
                        let ContentID = HeaderID.replace("Header_","Content_"); 
                        let i, tabcontent, tablinks;                        
                        tabcontent = document.getElementsByClassName("tabcontent");
                        for (i = 0; i < tabcontent.length; i++) {
                            tabcontent[i].style.display = "none";
                        }

                        tablinks = document.getElementsByClassName("tablinks");
                        for (i = 0; i < tablinks.length; i++) {
                            tablinks[i].className = tablinks[i].className.replace(" active", "");
                        }

                        let nodeHeader = document.getElementById(HeaderID);
                        nodeHeader.classList.add("active"); /* HEADER */
                        document.getElementById(ContentID).style.display = "block"; /* CONTENT */
                        document.getElementById(ContentID).classList.add("active"); /* CONTENT */
                        
                        //featureTable.destroy();
                        if(featureTable !== null) {
                            featureTable.destroy();
                        }
                        _featureTable(
                            nodeHeader.getAttribute("data-url"),
                            nodeHeader.getAttribute("data-objectid"),
                            JSON.parse(nodeHeader.getAttribute("data-fields"))
                        );
                        
                        if(lyr.content ?? false) {

                            /* <PPRRD> */
                            if(typeof lyr.content[0].version_01 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _boolean = false;
                                let _version = lyr.content[0].version_01[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                let queryTask_PPRD = new QueryTask(lyr.url);
                                let query_PPRD = new Query();
                                query_PPRD.outFields = ["*"];
                                query_PPRD.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")))
                                query_PPRD.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                query_PPRD.returnGeometry = false;
                                queryTask_PPRD.execute(query_PPRD).then(
                                    (response) => {
                                        try {
                                            let _features = "", _ambito = "";
                                            let _length = response.features.length;
                                            for (let i = 0; i < _length; i++) {
                                                _features = response.features[i];
                                                _ambito = _features.attributes[_version.field];                                        
                                                _ambito = _ambito.replace("DISTRITO ","");
                                                _ambito = _ambito.replace("PROVINCIA ","");
                                                _ambito = _ambito.replace("DEPARTAMENTO ","");
                                                if(_ambito == _ambitoLS) {
                                                    const divOBS = document.createElement("p");
                                                    divOBS.className = "sect-nota-info";
                                                    divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion}`;
                                                    divColumn_01.appendChild(divOBS);
                                                    const divNota = document.createElement("p");
                                                    divNota.className = "sect-nota";
                                                    divNota.innerHTML = _version.nota;
                                                    divColumn_01.appendChild(divNota);                                            
                                                    const divImg = document.createElement("img");
                                                    divImg.setAttribute("src", `${_version.imagen}/${_features.attributes[_version.documento]}_img.jpg`);
                                                    divColumn_02.appendChild(divImg);
                                                    _boolean = false;
                                                    break;
                                                }
                                                _boolean = true;
                                                
                                            }

                                            if(_boolean) {
                                                const divOBS = document.createElement("p");
                                                divOBS.className = "sect-nota-warning";
                                                divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                                divColumn_01.appendChild(divOBS);                                        
                                                const divNota = document.createElement("p");
                                                divNota.className = "sect-nota";
                                                divNota.innerHTML = _version.nota;
                                                divColumn_01.appendChild(divNota);                                        
                                                const divImg = document.createElement("img");
                                                divImg.setAttribute("src", `./images/documento.png`);
                                                divColumn_02.appendChild(divImg);
                                            }
                                            
                                        } catch (error) {
                                            console.error(`Count: PPRRD => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: PPRRD => ${error.name} - ${error.message}`);
                                    }
                                );
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 
                            }
                            /* </PPRRD> */

                            /* <EVAR> */
                            if(typeof lyr.content[0].version_02 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _boolean = false;
                                let _version = lyr.content[0].version_02[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let queryTask_EVAR = new QueryTask(lyr.url);
                                let query_EVAR = new Query();
                                query_EVAR.outFields = ["*"];
                                query_EVAR.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")))
                                query_EVAR.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                query_EVAR.returnGeometry = false;
                                queryTask_EVAR.execute(query_EVAR).then(
                                    (response) => {
                                        try {
                                            let _features = "", _ambito = "";
                                            let _length = response.features.length;
                                            for (let i = 0; i < _length; i++) {
                                                _features = response.features[i];
                                                _ambito = _features.attributes[_version.field];                                        
                                                _ambito = _ambito.replace("DISTRITO ","");
                                                _ambito = _ambito.replace("PROVINCIA ","");
                                                _ambito = _ambito.replace("DEPARTAMENTO ","");
                                                if(_ambito == _ambitoLS) {
                                                    
                                                    const divNota = document.createElement("p");
                                                    divNota.className = "sect-nota";
                                                    divNota.innerHTML = _version.nota;
                                                    divColumn_01.appendChild(divNota);                                            
                                                    const divImg = document.createElement("img");
                                                    divImg.setAttribute("src", `${_version.imagen}/${_features.attributes[_version.documento]}_img.jpg`);
                                                    divColumn_02.appendChild(divImg);
                                                    _boolean = false;
                                                    break;
                                                }
                                                _boolean = true;                                                
                                            }

                                            if(_length == 0) {
                                                const divOBS = document.createElement("p");
                                                divOBS.className = "sect-nota-warning";
                                                divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                                divColumn_01.prepend(divOBS);  
                                            } else {
                                                const divOBS = document.createElement("p");
                                                divOBS.className = "sect-nota-info";
                                                divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}.`;
                                                divColumn_01.prepend(divOBS);
                                            }

                                            if(_boolean) {                            
                                                const divNota = document.createElement("p");
                                                divNota.className = "sect-nota";
                                                divNota.innerHTML = _version.nota;
                                                divColumn_01.appendChild(divNota);                                        
                                                const divImg = document.createElement("img");
                                                divImg.setAttribute("src", `./images/documento.png`);
                                                divColumn_02.appendChild(divImg);
                                            }                                         
                                        } catch (error) {
                                            console.error(`Count: EVAR => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: EVAR => ${error.name} - ${error.message}`);
                                    }
                                );
                                
                                /* HEADER */
                                lyr.content[0].version_02[0].fields.map(function(current) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    if(typeof current.default !== "undefined") {
                                        inputText.setAttribute("checked","");
                                    }
                                    const label = document.createElement("label");
                                    label.innerText = current.alias;
                                    label.setAttribute("for",`tab${lyr.tag}${current.name}`);                                    
                                    divMain.appendChild(inputText);
                                    divMain.appendChild(label);                            
                                }.bind(this));
                                
                                /* CONTENT */
                                lyr.content[0].version_02[0].fields.map(function(current) {
                                    //let _version = lyr.content[0].version_02[0];
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    //div.innerText = current.alias;
                                    const divCenter = document.createElement("center");
                                    const divCanvas = document.createElement("canvas");
                                    divCanvas.setAttribute("id",`IDcontent${lyr.tag}${current.name}`);
                                    divCanvas.setAttribute("height","120");
                                    divCanvas.setAttribute("width","370");
                                    divCenter.appendChild(divCanvas);
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    div.appendChild(divCenter);
                                    div.appendChild(divTable);
                                    sect.appendChild(div);
                                    divMain.appendChild(sect);
                                }.bind(this));

                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_02[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                }
                                
                                divColumn_01.appendChild(divMain);
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                //if(litAmbito == "DISTRITO") {
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Nivel de Riesgo", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Nivel de Riesgo", "Vivienda");
                                /*  pma = población en riesgo muy alto; pa = población en riesgo alto
                                    vma = viviendas en riesgo muy alto; va = viviendas en riesgo alto */
                                let poblacionSD_PA = new StatisticDefinition();
                                poblacionSD_PA.statisticType = "sum";
                                poblacionSD_PA.onStatisticField = _version.fields[0].item[0].name;/* pma */
                                poblacionSD_PA.outStatisticFieldName = "sumPA";
                                let poblacionSD_PMA = new StatisticDefinition();
                                poblacionSD_PMA.statisticType = "sum";
                                poblacionSD_PMA.onStatisticField = _version.fields[0].item[1].name;/* pma */
                                poblacionSD_PMA.outStatisticFieldName = "sumPMA";                                    
                                let poblacionSD_VA = new StatisticDefinition();
                                poblacionSD_VA.statisticType = "sum";
                                poblacionSD_VA.onStatisticField = _version.fields[1].item[0].name;/* pma */
                                poblacionSD_VA.outStatisticFieldName = "sumVA";
                                let poblacionSD_VMA = new StatisticDefinition();
                                poblacionSD_VMA.statisticType = "sum";
                                poblacionSD_VMA.onStatisticField = _version.fields[1].item[1].name;/* pma */
                                poblacionSD_VMA.outStatisticFieldName = "sumVMA";
                                let queryTask_EVAR_EST = new QueryTask(lyr.url);
                                let query_EVAR_EST = new Query();
                                query_EVAR_EST.outFields = ["*"];                                    
                                query_EVAR_EST.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")))
                                query_EVAR_EST.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                query_EVAR_EST.outStatistics = [ poblacionSD_PA, poblacionSD_PMA, poblacionSD_VA, poblacionSD_VMA];
                                query_EVAR_EST.returnGeometry = false;
                                queryTask_EVAR_EST.execute(query_EVAR_EST).then(
                                    (response) => {
                                        try {
                                            let _attr = response.features[0].attributes;
                                            /* POBLACION */
                                            new Chart(_elementById(`IDcontent${lyr.tag}${_version.fields[0].name}`), { 
                                                type: 'bar',
                                                data: {
                                                    labels: [_version.fields[0].item[0].alias, _version.fields[0].item[1].alias],
                                                    datasets: [{
                                                    label: 'Cantidad',
                                                    data: [_attr.sumpa,_attr.sumpma],
                                                    backgroundColor: ['rgba(255, 205, 86, 0.2)','rgba(255, 99, 132, 0.2)'],
                                                    borderColor: ['rgb(255, 205, 86)','rgb(255, 99, 132)'],
                                                    borderWidth: 1
                                                    }]
                                                },
                                                options: {
                                                    indexAxis: 'y',
                                                    responsive: false,
                                                    plugins: {
                                                        legend: { display:false, position:'bottom' },
                                                        title: { display:false, text:'GRÁFICO DE RESUMEN' }
                                                    }
                                                }
                                            });
                                            let _contentTab01 = [];
                                            _contentTab01.push({"item": _version.fields[0].item[0].alias,"val": _attr.sumpa});
                                            _contentTab01.push({"item": _version.fields[0].item[1].alias,"val": _attr.sumpma});
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpa + _attr.sumpma;
                                            _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                            /* VIVIENDA */
                                            new Chart(_elementById(`IDcontent${lyr.tag}${_version.fields[1].name}`), { 
                                                type: 'bar',
                                                data: {
                                                    labels: [_version.fields[1].item[0].alias, _version.fields[1].item[1].alias],
                                                    datasets: [{
                                                    label: 'Cantidad',
                                                    data: [_attr.sumva,_attr.sumvma],
                                                    backgroundColor: ['rgba(255, 205, 86, 0.2)','rgba(255, 99, 132, 0.2)'],
                                                    borderColor: ['rgb(255, 205, 86)','rgb(255, 99, 132)'],
                                                    borderWidth: 1
                                                    }]
                                                },
                                                options: {
                                                    indexAxis: 'y',
                                                    responsive: false,
                                                    plugins: {
                                                        legend: { display:false, position:'bottom' },
                                                        title: { display:false, text:'GRÁFICO DE RESUMEN' }
                                                    }
                                                }
                                            });
                                            let _contentTab02 = [];
                                            _contentTab02.push({"item": _version.fields[1].item[0].alias,"val": _attr.sumva});
                                            _contentTab02.push({"item": _version.fields[1].item[1].alias,"val": _attr.sumvma});
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumva + _attr.sumvma;
                                            _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                        } catch (error) {
                                            console.error(`Count: EVAR => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: EVAR => ${error.name} - ${error.message}`);
                                    }
                                );
                                //}
                                /*
                                if(litAmbito == "PROVINCIA") {
                                    _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Número de Distritos", "Poblacion");
                                    _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Número de Distritos", "Vivienda");
                                }
                                */
                            }
                            /* </EVAR> */
                            
                            /* <ZRNM> */
                            if(typeof lyr.content[0].version_03 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_03[0];
                                let _boolean = true;
                                let unionGeometry = [];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                let queryTask_ZRNM = new QueryTask(lyr.url);
                                let query_ZRNM = new Query();
                                query_ZRNM.returnGeometry = true;
                                query_ZRNM.geometry = new Polygon(_geometryAmbito);
                                query_ZRNM.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                queryTask_ZRNM.execute(query_ZRNM).then(
                                    (response) => {
                                        try {
                                            let _length = response.features.length;
                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }

                                            if(_length == 0) {
                                                const divOBS = document.createElement("p");
                                                divOBS.className = "sect-nota-warning";
                                                divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                                divColumn_01.prepend(divOBS);  
                                            } else {
                                                const divOBS = document.createElement("p");
                                                divOBS.className = "sect-nota-info";
                                                divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}.`;
                                                divColumn_01.prepend(divOBS);
                                            }
                                            
                                            if(_boolean) {                            
                                                const divNota = document.createElement("p");
                                                divNota.className = "sect-nota";
                                                divNota.innerHTML = _version.nota;
                                                divColumn_01.appendChild(divNota);
                                                /*
                                                const divImg = document.createElement("img");
                                                divImg.setAttribute("src", `./images/documento.png`);
                                                divColumn_02.appendChild(divImg);*/
                                            }                             
                                        } catch (error) {
                                            console.error(`Count: ZRNM => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: ZRNM => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1;
                                    let countTabItemTotal = 0;
                                    /* Union Geometry */
                                    let _geometry = geometryEngine.union(unionGeometry);
                                    /* Statistic Poblacion */
                                    let poblacionSUM = new StatisticDefinition();
                                    poblacionSUM.statisticType = "sum";
                                    poblacionSUM.onStatisticField = _version.fields[0].name;
                                    poblacionSUM.outStatisticFieldName = "sumpoblacion";
                                    /* Statistic Vivienda */
                                    let viviendaSUM = new StatisticDefinition();
                                    viviendaSUM.statisticType = "sum";
                                    viviendaSUM.onStatisticField = _version.fields[1].name;
                                    viviendaSUM.outStatisticFieldName = "sumvivienda";
                                    /* Statistic Response */
                                    let queryTask_Engine = new QueryTask(_version.url);
                                    let query_Engine = new Query();
                                    query_Engine.outFields = _version.fields.map(x => x.name);
                                    query_Engine.geometry = _geometry;
                                    query_Engine.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                    query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                    query_Engine.returnGeometry = false;
                                    queryTask_Engine.execute(query_Engine).then(
                                        (response) => {
                                            try {
                                                let _contentTab01 = []; let _contentTab02 = [];
                                                let _attr = response.features[0].attributes;
                                                /* Poblacion */
                                                _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumpoblacion;
                                                _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion});
                                                _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion;
                                                _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                /* Vivienda */
                                                _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda;   
                                                _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda});
                                                _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda;
                                                _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                            } catch (error) {
                                                console.error(`Count: Statistic ZRNM => ${error.name}`);
                                            }                    
                                        },
                                        (error) => {
                                            console.error(`Error: Statistic ZRNM => ${error.name}`);
                                        }
                                    );                                    
                                    _elementById(`ID_TBcontent${lyr.tag}_Tbody`).innerHTML = "";
                                    configAnalysis_Temp.forEach(function(cValue) {
                                       /* Statistic Analysis */
                                        let analysisSUM = new StatisticDefinition();
                                        analysisSUM.statisticType = "count";
                                        analysisSUM.onStatisticField = _version.analysis[0].field;
                                        analysisSUM.outStatisticFieldName = "cantidad";                                    
                                        /* Statistic Analysis */
                                        let queryTask_Analysis = new QueryTask(cValue.url);
                                        let query_Analysis = new Query();
                                        query_Analysis.outFields = cValue.fields.map(x => x.name)
                                        query_Analysis.geometry = _geometry;
                                        query_Analysis.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                        query_Analysis.outStatistics = [ analysisSUM ];
                                        queryTask_Analysis.execute(query_Analysis).then(
                                            (response) => {
                                                try {
                                                    let _attr = response.features[0].attributes;
                                                    if(_attr.cantidad > 0) {
                                                        let _contentTab = [];
                                                        let _id = `ID_TBcontent${lyr.tag}`;
                                                        _contentTab.push({ "index":countTabItem++, "item":cValue.name, "val":_attr.cantidad });
                                                        _htmlTable_ADD(`${_id}`,_contentTab);
                                                        _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + _attr.cantidad;
                                                    }
                                                } catch (error) {
                                                    console.error(`Count: Statistic Analysis => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic Analysis => ${error.name}`);
                                            }
                                        );
                                    });
                                }));
                                
                                const divTable = document.createElement("div");
                                divTable.id = `ID_TBcontent${lyr.tag}`;
                                divTable.className = "form-scroll-resumen2";
                                divColumn_02.appendChild(divTable);
                                
                                /* HEADER */
                                lyr.content[0].version_03[0].fields.map(function(current) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    if(typeof current.default !== "undefined") {
                                        inputText.setAttribute("checked","");
                                    }
                                    const label = document.createElement("label");
                                    label.innerText = current.alias;
                                    label.setAttribute("for",`tab${lyr.tag}${current.name}`);                                    
                                    divMain.appendChild(inputText);
                                    divMain.appendChild(label);                            
                                }.bind(this));
                                /* CONTENT */
                                lyr.content[0].version_03[0].fields.map(function(current) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    const divCenterTotal = document.createElement("center");
                                    const divTotal = document.createElement("p");
                                    divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                    divTotal.style.fontSize = "65px";
                                    divTotal.style.margin = "5px 0px";
                                    divTotal.innerText = 0;
                                    divCenterTotal.appendChild(divTotal);
                                    div.appendChild(divCenterTotal);
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_03[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 
                                divColumn_01.appendChild(divMain);
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Zona de Riesgo", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Zona de Riesgo", "Vivienda");

                                _htmlTable(_elementById(`ID_TBcontent${lyr.tag}`));
                            }
                            /* </ZRNM> */

                        }
                        //_elementById(`IDTable_${lyr.tag}`).appendChild(); 

                    };
                    divHeader.innerHTML = lyr.name.replace(_nameTemp + " /", "");
                    divHeader.dataset.url = lyr.url;
                    divHeader.dataset.objectid = lyr.objectid;
                    divHeader.dataset.fields = JSON.stringify(lyr.fields);
                    //divHeader.className = !lyr.default || "active";
                }
                
                let fragmentHeader = document.createDocumentFragment();
                fragmentHeader.appendChild(divHeader);                
                _elementById("ID_TAB_Header").appendChild(fragmentHeader);

                const divContent = document.createElement("div");
                divContent.className="tabcontent";
                divContent.id = `Content_${lyr.tag}`;

                //divContent.className = !lyr.default || "active";
                const divTitle = document.createElement("section");
                divTitle.innerHTML = lyr.name;
                const divHR = document.createElement("section");
                divHR.className = "div-hr";
                const divAside = document.createElement("section");
                divAside.className = "report-table";
                divAside.id = `IDTable_${lyr.tag}`;
                divAside.style.backgroundColor = "#FFFFFF";
                /*
                if(lyr.content ?? false) {
                    
                    
                    if(typeof lyr.content[0].version_01 !== "undefined") {
                        let _boolean = false;
                        let _version = lyr.content[0].version_01[0];
                        const divColumn_01 = document.createElement("section");
                        divColumn_01.className = "column_01";
                        const divColumn_02 = document.createElement("section");
                        divColumn_02.className = "column_02";
                        
                        let queryTask_PPRD = new QueryTask(lyr.url);
                        let query_PPRD = new Query();
                        query_PPRD.outFields = ["*"];
                        query_PPRD.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")))
                        query_PPRD.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                        query_PPRD.returnGeometry = false;

                        queryTask_PPRD.execute(query_PPRD).then(
                            (response) => {
                                try {
                                    let _features = "", _ambito = "";
                                    let _length = response.features.length;
                                    for (let i = 0; i < _length; i++) {
                                        _features = response.features[i];
                                        _ambito = _features.attributes[_version.field];                                        
                                        _ambito = _ambito.replace("DISTRITO ","");
                                        _ambito = _ambito.replace("PROVINCIA ","");
                                        _ambito = _ambito.replace("DEPARTAMENTO ","");
                                        if(_ambito == _ambitoLS) {
                                            const divOBS = document.createElement("p");
                                            divOBS.className = "sect-nota-info";
                                            divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion}`;
                                            divColumn_01.appendChild(divOBS);
                                            const divNota = document.createElement("p");
                                            divNota.className = "sect-nota";
                                            divNota.innerHTML = _version.nota;
                                            divColumn_01.appendChild(divNota);                                            
                                            const divImg = document.createElement("img");
                                            divImg.setAttribute("src", `${_version.imagen}/${_features.attributes[_version.documento]}_img.jpg`);
                                            divColumn_02.appendChild(divImg);
                                            _boolean = false;
                                            break;
                                        }
                                        _boolean = true;
                                        
                                    }

                                    if(_boolean) {
                                        const divOBS = document.createElement("p");
                                        divOBS.className = "sect-nota-warning";
                                        divOBS.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                        divColumn_01.appendChild(divOBS);                                        
                                        const divNota = document.createElement("p");
                                        divNota.className = "sect-nota";
                                        divNota.innerHTML = _version.nota;
                                        divColumn_01.appendChild(divNota);                                        
                                        const divImg = document.createElement("img");
                                        divImg.setAttribute("src", `./images/documento.png`);
                                        divColumn_02.appendChild(divImg);
                                    }
                                    
                                } catch (error) {
                                    console.error(`Count: PPRRD => ${error.name} - ${error.message}`);
                                }                    
                            },
                            (error) => {  
                                console.error(`Error: PPRRD => ${error.name} - ${error.message}`);
                            }
                        );
                        divAside.appendChild(divColumn_01);
                        divAside.appendChild(divColumn_02);
                    }
                   


                
                    if(typeof lyr.content[0].version_02 !== "undefined") {
                        const divMain = document.createElement("main");
                    //if(typeof lyr.content[0].tab[0].url == "undefined") {
                        //console.log("CAMPOS");
                        //console.log(lyr.content[0].tab[0].fields);
                        lyr.content[0].version_02[0].fields.map(function(current, ind) {
                            //ind = ind + 1;
                            const inputText = document.createElement("input");
                            inputText.type = "radio";
                            inputText.className = "tabs-horiz";
                            inputText.id = `tab${lyr.tag}${current.name}`;
                            inputText.name = `tabs-2${lyr.tag}`;
                            if(typeof current.default !== "undefined") {
                                inputText.setAttribute("checked","");
                            }
                            const label = document.createElement("label");
                            label.innerText = current.alias;
                            label.setAttribute("for",`tab${lyr.tag}${current.name}`);
                            
                            divMain.appendChild(inputText);
                            divMain.appendChild(label);                            
                        }.bind(this));
                    //}
                 
                    //if(typeof lyr.content[0].version_02 !== "undefined") {
                        //console.log("CAMPOS");
                        //console.log(lyr.content[0].tab[0].fields);
                        lyr.content[0].version_02[0].fields.map(function(current, ind) {
                            //ind = ind + 1;                            
                            const sect = document.createElement("section");
                            sect.id = `content${lyr.tag}${current.name}`;
                            const div = document.createElement("div");
                            div.innerText = current.alias;
                            sect.appendChild(div);                            
                            divMain.appendChild(sect);                            
                        }.bind(this));
                    //}

                    const tagStyle = document.createElement("style");
                    let abc = "";
                    //if(typeof lyr.content[0].version_02 !== "undefined") {
                        //console.log("STYLE");
                        //console.log(lyr.content[0].tab[0].fields);
                        lyr.content[0].version_02[0].fields.map(function(current, ind) {
                            //ind = ind + 1;
                            //console.log(current.name);
                            abc += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;
                            //console.log(abc);                            
                        }.bind(this));
              
                    //if(typeof lyr.content[0].version_02 !== "undefined") {
                        if(abc !== "") {
                            let abc_2 = abc.substring(0, abc.length - 1);
                            //console.log(abc_2);
                            tagStyle.textContent = abc_2.concat("{display: block;};");
                            divMain.appendChild(tagStyle);
                        }
                        divAside.appendChild(divMain); 
                    }
              
                }
                */

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
	_jsonTravelTree(configDiagnosis_Temp);
    
    /*
    _elementById("ID_TAB_Header").childNodes[4].className += "active";
	_elementById("ID_TAB_Content").childNodes[4].className = "active";
    */
    /*
    _elementById("ID_TAB_Header").childNodes[4].classList.add("active");
	_elementById("ID_TAB_Content").childNodes[4].style.display = "block";
    _elementById("ID_TAB_Content").childNodes[4].classList.add("active");
    */
   
    /*
    let _class = function(name) { return document.getElementsByClassName(name); };
	let tabPanes = _class("tab-header")[0].getElementsByTagName("div");	
	for(let i=0;i<tabPanes.length;i++) {
		tabPanes[i].addEventListener("click", function() {
            if(typeof tabPanes[i].getAttribute("data-url") == "string") {
                _class("tab-header")[0].getElementsByClassName("active")[0].classList.remove("active");
                tabPanes[i].classList.add("active");
                
                _class("tab-content")[0].getElementsByClassName("active")[0].classList.remove("active");
                _class("tab-content")[0].getElementsByTagName("div")[i].classList.add("active");
                featureTable.destroy();
                _featureTable(tabPanes[i].getAttribute("data-url"), tabPanes[i].getAttribute("data-objectid"), JSON.parse(tabPanes[i].getAttribute("data-fields")));
            }
		});
	} 
    */   
    map.on("load", () => { _graphicPie(); });
});
//https://sigrid.cenepred.gob.pe/sigridv3/storage/biblioteca/6495_img.jpg