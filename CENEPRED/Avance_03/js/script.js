let map; let featureTable = null;
require([
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',
    'dijit/form/FilteringSelect',
    'dijit/form/Button',
    'dijit/registry',
    'esri/SpatialReference',
    'esri/layers/FeatureLayer',
    'esri/dijit/FeatureTable',
    'esri/geometry/Polygon',
    'esri/geometry/geometryEngine', 
    'esri/geometry/projection',
    'esri/geometry/webMercatorUtils', 
    'esri/tasks/GeometryService',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/StatisticDefinition',
    'esri/tasks/Geoprocessor',
    'dojo/dom-construct',
    'esri/config',
    'esri/map',
    'dojo/text!./json/config.json',
    'dojo/_base/lang',
    'dojox/layout/TableContainer',
    'dojo/store/Memory',
    'dojo/on',
    'dojo/domReady!'
], function(
    Chart,
    FilteringSelect,
    Button,
    registry,
    SpatialReference,
    FeatureLayer,
    FeatureTable,
    Polygon,
    geometryEngine,
    projection,
    webMercatorUtils,
    GeometryService,
    Query,
    QueryTask,
    StatisticDefinition,
    Geoprocessor,
    domConstruct,
    esriConfig,
    Map,
    configJSON,
    lang,
    TableContainer,
    Memory,
    on
) {
    this._pathDownload = "https://sigrid.cenepred.gob.pe/arcgis/rest/directories/";
    esriConfig.defaults.io.proxyUrl = 'https://sigrid.cenepred.gob.pe/sigridv3/php/proxy.php';
    /*esriConfig.defaults.io.alwaysUseProxy = false;*/
    esriConfig.defaults.geometryService = new GeometryService("https://sigrid.cenepred.gob.pe/arcgis/rest/services/Utilities/Geometry/GeometryServer");    
    esriConfig.defaults.io.timeout = 2400000;
    this.gpExtractData = new Geoprocessor("https://sigrid.cenepred.gob.pe/arcgis/rest/services/Geoprocesamiento/ExtraerDatos/GPServer/ExtraerDatos");
    const config = JSON.parse(configJSON);
    let configBackgroundColor = config.backgroundColor;
    let configBorderColor = config.borderColor;
    let configDiagnosis = config.lyrDiagnosis;
    let configDiagnosis_Temp = [];
    let configAnalysis = config.lyrAnalysis;
    let configAnalysis_Temp = [];
    let configSummary_Temp = [];
    let reportItemResult = 0;
    let chartLabel = [];
    let chartData = [];
    let chartBackgroundColor = [];
    let chartID = "ID_TABLE_Graphic";
    let graphicID = "ID_CR_Graphic";
    let summaryID = "ID_CR_Summary";
    let _tabName = null
    
    this.analysisTotal = 0;
    this.diagnosisTotal = 0;
    this.diagnosisCount = 1;
    this.summaryTotal = 0;
    this.summaryCount = 0;
    this._listLayer = [];
    let _cssLoad = "<div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
    
    map = new Map("map", { center: [-76, -10], zoom: 6, basemap: "topo" });
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

    let _validatedStorage = function(_ambito) {
        try { /* if(_ambito ?? true) { */
            if(Object.keys(_ambito).length === 0) {
                _elementById("ID_Alert").style.display = "block";
            } else {
                _elementById("ID_Alert").style.display = "none";
            }
        } catch(error) {
            _elementById("ID_Alert").style.display = "block";
        }
    };
    _validatedStorage(JSON.parse(localStorage.getItem("reportTitle_request")));
    _validatedStorage(JSON.parse(localStorage.getItem("reportTitle")));

    /* Load GEOMETRY */
    let _geometryAmbito = JSON.parse(localStorage.getItem("reportGeometry"));
    let _ambitoLS = JSON.parse(localStorage.getItem("reportTitle_request")).replace(" (distrito)", "");
    _ambitoLS = _ambitoLS.replace(" (provincia)", "");
    _ambitoLS = _ambitoLS.replace(" (departamento)", "");
    /* Create QUERY */
    let _ambitoName = JSON.parse(localStorage.getItem("reportTitle"));
    let _ambitoArr = _ambitoLS.split(",");    
    /*let _ambitoQuery =  _ambitoArr.length == 3 ? `DEPA = '${_ambitoArr[2].trim()}' AND PROV = '${_ambitoArr[1].trim()}' AND DIST = '${_ambitoArr[0].trim()}'`: 
                        _ambitoArr.length == 2 ? `DEPA = '${_ambitoArr[1].trim()}' AND PROV = '${_ambitoArr[0].trim()}' AND DIST IS NULL`: 
                        `DEPA = '${_ambitoArr[0].trim()}' AND PROV IS NULL AND DIST IS NULL`;*/   
    let _ambitoQueryAmbito =    _ambitoArr.length == 3 ? false: 
                                _ambitoArr.length == 2 ? `UPPER(${config.lyrFilter[2].dep}) = UPPER('${_ambitoArr[1].trim()}') AND UPPER(${config.lyrFilter[2].pro}) = UPPER('${_ambitoArr[0].trim()}')`:
                                `UPPER(${config.lyrFilter[1].dep}) = UPPER('${_ambitoArr[0].trim()}')`;
    /* Generate Array 0 */
    let _generateArray = function(_length) {
        try {
            let _arr = [];
            for (let index = 0; index < _length; index++) {
                _arr.push[0];                
            }
            return _arr;
        } catch(error) {
            console.error(`_generateArray: ${error.name} - ${error.message}`);
        }
    };
    /* Sort JSON - QUANTITY */
    let _sortJSON = function(data, key, orden) {
        try { /* Ordenando el json de capas */
            return data.sort(function (a, b) {
                let x = a[key], y = b[key];
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
            _elementById("ID_ReportTitle").innerHTML = `<i class="fa fa-pie-chart"></i>&nbsp; ${_title || ''} - REPORTE`;
        } catch (error) {
            console.error(`Error: _title => ${error.name} - ${error.message}`);
        }
    };
    _title(_ambitoName);

    let _ambitoPie = function(lyr,_url,_where, _cantidad) {
        try {
            let queryTask = new QueryTask(_url);
            let query = new Query();
            query.where = _where;
            query.outFields = ["*"];
            query.returnGeometry = false;
            queryTask.executeForCount(query).then(
                (response) => {
                    try {
                        let _porcentaje = Math.round((_cantidad/response)*100);
                        let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                        chart.data.datasets[0].data = [_porcentaje,(100-_porcentaje)];
                        chart.data.labels = ["Cuenta con PPRRD (%)","NO cuenta con PPRRD (%)"];
                        chart.update();
                    } catch (error) {
                        console.error(`Count: PPRRD => ${error.name} - ${error.message}`);
                    }                  
                },
                (error) => {  
                    console.error(`Error: PPRRD => ${error.name} - ${error.message}`);
                }
            );
        } catch (error) {
            console.error(`Error: _ambitoPie => ${error.name} - ${error.message}`);
        }
    };

    let _loadSelect = (formatOption, formatId, _Layers, _area) => {
        try {
            let selectItem = ""; let htmlID = formatId.getAttribute("id");
            let container = domConstruct.create("div", {
                id: `DIV_${htmlID}`, style: {width:'96.5%',color:"#555555"}
            }, htmlID);
            
            if(registry.byId(`Button_${htmlID}`)) {
                registry.byId(`Button_${htmlID}`).destroyRecursive();
            }

            if(registry.byId(`DIV_${htmlID}`)) {
                registry.byId(`DIV_${htmlID}`).destroyRecursive();
            }

            let buttonDownload = new Button({
                id: `Button_${htmlID}`,
                label: "Descargar Datos Espaciales",
                iconClass: 'fa fa-download',
                onClick: function() {
                    let ID_Load_Download = _elementById("ID_Load_Download");
                    this.ID_Load_Download.style.display = "block";
                    let geometryExtracData = webMercatorUtils.webMercatorToGeographic(new Polygon(_area));
                    this.gpExtractData.submitJob({
                            "Layers_to_Clip": _Layers.toString(),
                            "Area_of_Interest": `{"type": "Polygon", "coordinates":${JSON.stringify(geometryExtracData.rings)},"spatialReference":{"wkid":4326}}`,
                            "Feature_Format": selectItem
                        }, _completeCallback = function(jobInfo) {
                            try {
                                if ( jobInfo.jobStatus !== "esriJobFailed" ) {
                                    this.gpExtractData.getResultData(jobInfo.jobId, "Result", function(outputFile) {
                                        try {
                                            ID_Load_Download.style.display = "none";
                                            let _URL = outputFile.value;
                                            let _URL_Temp = _URL.substring(_URL.indexOf("arcgisjobs"), _URL.length);
                                            window.location = this._pathDownload + _URL_Temp;
                                        } catch (error) {
                                            console.log("Error: _downloadFile " + error.message);
                                        }
                                    }.bind(this));
                                }
                            } catch (error) {
                                console.log("Error: _completeCallback " + error.message);
                            }
                        }.bind(this),      
                        _statusCallback = function(jobInfo) {
                            try {
                                var status = jobInfo.jobStatus;
                                if ( status === "esriJobFailed" ) {
                                    ID_Load_Download.style.display = "none";
                                } else if (status === "esriJobSucceeded"){
                                    ID_Load_Download.style.display = "none";
                                }
                            } catch (error) {
                                console.log("Error: _statusCallback " + error.message);
                            }
                        }.bind(this),    
                        _errorCallback = function(jobInfo) {
                            try {
                                ID_Load_Download.style.display = "none";
                            } catch (error) {
                                console.log("Error: _errorCallback " + error.message);
                            }
                        }.bind(this)
                    );
                }.bind(this)
            });

            let tableContainer = new TableContainer({
                cols: 2, labelWidth: "0%",
                customClass: "labelsAndValues",
                style: { width:'290px', fontSize:'13px', position: "absolute", marginTop: "-5px" } /*class: "form-labels"*/
            }, container);
            let options = [];
            let booleanButton = false;
            formatOption.map(function(item, index) {
                booleanButton = typeof item.long == "undefined" && !booleanButton == true ? false: true;
                /* Filtra su visualización */
                if(item.boolean) {
                    options.push({ 
                        name: item.name.replace(/<[^>]+>/g, ''),
                        id:   typeof item.value == "undefined"? index: item.value
                    });
                }                    
            }); 

            const stateStore = new Memory({data: options });
            const filteringSelect = new FilteringSelect({
                id: `Node_${htmlID}`,
                /*label: "Descargar",*/
                name: 'state',
                value: "00",
                required: false,
                placeholder: "Seleccione Formato",
                store: stateStore,
                autoComplete: false,
                searchAttr: "name",
                style: { width:'100%', fontSize:'13px', padding: "2px 0 2px 0", fontWeight: "700" }
            });
        
            tableContainer.addChild(filteringSelect);
            if(!booleanButton) {
                tableContainer.addChild(buttonDownload);
                filteringSelect.on("change", (evt) => { selectItem = evt; });
                filteringSelect.set('value', "SHP");
            } else {
                filteringSelect.on("change", function(evt) {
                    let lyrJson = this.bufferTemp[evt];
                    this.bufferSelect_id     = lyrJson.id;
                    this.bufferSelect_name   = lyrJson.name;
                    this.bufferSelect_long   = lyrJson.long;
                    this.bufferSelect_fields = lyrJson.fields;
                    this.bufferSelect_color  = lyrJson.color;
                    this.bufferSelect_url    = lyrJson.url;
                }.bind(this));
                filteringSelect.set('value', 1);
            }             
            tableContainer.startup();
        } catch (error) {
            console.error(`Error: _loadSelect => ${error.name} - ${error.message}`);
        }
    };

    
    /* Number Formatter */
    let _numberFormatter = function (value) {
        try {
            value = value.toString();
            value = value.split(/(?=(?:...)*$)/);
            value = value.join(',');
            return value;
        } catch (error) {
            console.error(`Error: _numberFormatter => ${error.name} - ${error.message}`);
        }
    };

    /* Create graphic BAR */
    let _graphicChartBar = function(_node, _label, _data/*, _backgroundColor = null, _borderColor = null*/ ) {
        try {
            new Chart(_node, { 
                type: 'bar',
                data: {
                    labels: _label,
                    datasets: [{
                    label: 'Cantidad',
                    data: _data,
                    /*backgroundColor: _backgroundColor ?? configBackgroundColor,
                    borderColor: _borderColor ?? configBorderColor,*/
                    backgroundColor: configBackgroundColor,
                    borderColor: configBorderColor,
                    borderWidth: 1
                    }]
                },
                options: {
                    locale: "en-ES",
                    indexAxis: 'y',
                    responsive: false,
                    plugins: {
                        legend: { display:false, position:'bottom' },
                        title: { display:false, text:'GRÁFICO DE RESUMEN' }
                    }
                }              
            });
        } catch(error) {
            console.error(`_graphicChartBar: ${error.name} - ${error.message}`);
        }
    };
    /* Create graphic DOUGHNOUT */
    let _graphicPie = function(_node, _backgroundColor = null) {
        try {
            new Chart(_node, { 
                type: 'doughnut',
                data: { labels:[], datasets:[{ data:[], backgroundColor:_backgroundColor ?? configBackgroundColor, borderWidth: 1 }]},
                options: {
                    responsive: false,
                    plugins: {
                        legend: { display:false, position:'bottom' },
                        title: { display:false, text:'GRÁFICO DE RESUMEN' }
                    }
                },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) =>{
                            let value = data.datasets[0].data[tooltipItem.index];
                            return `${data.datasets[0].label}: ${self._userCallback(value)}`;
                        }
                    }
                }
            });
        } catch(error) {
            console.error(`_graphicPie: ${error.name} - ${error.message}`);
        }
    };
    /* Create Graphic DOUGHNOUT MAIN */
    _graphicPie(chartID,configBackgroundColor,_generateArray(1));
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
                        table: json[i].table,
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
    
    /* Crear Table */
    let _htmlTable = function(ID_Table, _lyrTitle = "Elementos Expuestos") {
        try { /* Se crea la tabla de resumen */
            ID_Table.innerHTML = "";
            const idTable = ID_Table.getAttribute("id"); 
            const tbl = document.createElement("table");
            tbl.className = "tbl";
            /* Head */
            const tblHead = document.createElement("thead");
            const rowHead = document.createElement("tr");
            const rowHeadTH_Item = document.createElement("th");
            //const rowHeadTH_ItemNode = document.createTextNode("#");
            //rowHeadTH_Item.appendChild(rowHeadTH_ItemNode);
            rowHeadTH_Item.innerHTML = `<i class="fa fa-pie-chart" style="margin-right:-10px;"></i>`;
            const rowHeadTH_Name = document.createElement("th");
            const rowHeadTH_NameNode = document.createTextNode(_lyrTitle);
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
            const rowFootTD_Text = document.createTextNode("TOTAL");
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
    _htmlTable(_elementById("ID_TABLE_Resumen"), "Diagnóstico");
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
            /*tbl.style.margin = "10px 0px";*/
            /* Head */
            const tblHead = document.createElement("thead");
            const rowHead = document.createElement("tr");
            const rowHeadTH_Name = document.createElement("th");
            rowHeadTH_Name.style.textAlign = "center";
            rowHeadTH_Name.style.width = "70%";
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
            const rowFootTD_Text = document.createTextNode("TOTAL");
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
                //let cellText_1 = document.createTextNode(element.item);
                //cell_1.appendChild(cellText_1);
                cell_1.innerHTML = element.item;
                let cell_2 = document.createElement("td");
                cell_2.style.textAlign = "right";
                cell_2.style.paddingRight = "10px";
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
                    querySummary.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
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
                /*console.log(_ambito);*/ /* DANIEL */
                query.geometry = new Polygon(_ambito);
                query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
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
                            } else {
                                this._listLayer.push(lyr.table);
                                /* Se limpiar TABLE */
                                _elementById(`ID_TABLE_Resumen_Tbody`).innerHTML = "";
                                /* Sort JSON */
                                _sortJSON(configSummary_Temp, 'cantidad','desc');                                
                                configSummary_Temp.map(function(_lyr) {
                                    if(_lyr.cantidad > 0 && typeof _lyr.cantidad !== "undefined") {
                                        /*_index = _index + 1;*/
                                        let fragment = document.createDocumentFragment();
                                        let row = document.createElement("tr");
                                        let cell_0 = document.createElement("td");
                                        /*let cellText_0 = document.createTextNode(_index);*/
                                        cell_0.style.textAlign = "center";
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
                                /* Graphic Chart */
                                let chart = Chart.getChart(chartID);
                                chartData.push(lyr.cantidad);
                                chartLabel.push(lyr.name.replace(/<[^>]+>/g, ''));
                                chartBackgroundColor.push(lyr.rgb);
                                chart.data.datasets[0].data = chartData;
                                chart.data.datasets[0].backgroundColor = chartBackgroundColor;
                                chart.data.labels = chartLabel;
                                chart.update();
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
                            _elementById("ID_GraphicLoad").remove();
                            this.ID_Load.style.display = "none";
                            this.ID_TABLE_Resumen.style.display = "block";
	                        let tabPanes = document.getElementsByClassName("tablinks");	
                            let _len = tabPanes.length;
                            /* Actived first TAB */
	                        for(let i=0; i<_len; i++) {
                                if(typeof tabPanes[i].style["0"] === "undefined") {
                                    tabPanes[i].click(); break;
                                }
                            } 
                            /* Remove load */
                            let tabHeaderGroup = document.getElementsByClassName("header-group");	
                            let _leng = tabHeaderGroup.length;
	                        for(let i=0; i<_leng; i++) {
                                tabHeaderGroup[i].childNodes[0].remove();
                            } 
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

    let _removeAccents = function(_text) {
        _text = String(_text);
        const acentos = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','ñ':'ni'};
        return _text.split('').map( letra => acentos[letra] || letra).join('').toString();
    };
    
    let _featureTable = function(lyr,_name,srv,objectid,fields) {
        try {/*  S => Distrito, P => Provincia, D => Departamental */
            let tipoAmbito = null;
            if(typeof lyr.content[0].version_01 !== "undefined") { 
                let _tipo = lyr.content[0].version_01[0].tipo;
                tipoAmbito = _ambitoArr.length == 3 ? `and ${_tipo[2].field} = '${_tipo[2].type}'`:
                             _ambitoArr.length == 2 ? `and (${_tipo[1].field} = '${_tipo[1].type}' or ${_tipo[2].field} = '${_tipo[2].type}')`:
                             ``;/*and ${abc[0].field} = '${abc[0].type}'*/
            }
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
            let _fields = fields.map(x => x.name);
            let queryTask = new QueryTask(srv);
            /*console.log(_fields);
            console.log(srv);*/
            let _idQueryTask = null;
            let queryFT = new Query();
            queryFT.outFields = _fields;
            queryFT.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")));
            queryFT.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
            queryFT.returnGeometry = false;
            /*query.where = "1=1";*/
            queryTask.executeForIds(queryFT).then(
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
                    featureLayer.setDefinitionExpression(`${objectid} IN (${_idQueryTask}) ${tipoAmbito ?? ""}`);
                    featureTable = new FeatureTable({
                        featureLayer : featureLayer,
                        showAttachments: false,
                        showDataTypes: false,
                        showFeatureCount: true,
                        showGridHeader: true,
                        showColumnHeaderTooltips: false,
                        showGridMenu: false,
                        showRelatedRecords: false,
                        showStatistics: true,
                        zoomToSelection:  false,
                        syncSelection: false,
                        dateOptions: {
                            noDataMessage: "No existe coincidencias",
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
                    featureTable.on("refresh", function (evt) {
                        document.querySelectorAll('.esri-feature-table-title').forEach(function (element, index, arr) {
                            try {
                                let countFeature = element.innerText.substring(
                                    element.innerText.indexOf("Entidades"),
                                    element.innerText.length
                                ).replace(", Seleccionado: 0)","");
                                element.innerText = `${_name} - ${countFeature}`.replace("Entidades","Registros");
                            } catch(error) { 
                                console.error(`ERROR: .esri-feature-table-title => ${error.name} - ${error.message}`);
                            }
                        });
                    });
                    featureTable.startup();
                } catch (error) {
                    console.error(`Error: _queryTask/queryTask always => ${error.name} - ${error.message}`);
                } 
            }.bind(this)));

            /* Export EXCEL */
            const _documento = "https://sigrid.cenepred.gob.pe/sigridv3/documento/";
            queryTask.execute(queryFT).then(
                (response) => {
                    try {
                        _elementById(`ID_BTN_EXCEL_TB`).innerHTML = "";
                        let fragment = document.createDocumentFragment();

                        let rowHeader = document.createElement("tr"); 
                        _fields.map((item, index) => {
                            let rowCol = document.createElement("td");
                            rowCol.innerText = _removeAccents(fields[index].alias);
                            rowHeader.appendChild(rowCol);
                        });
                        fragment.appendChild(rowHeader);
                        
                        response.features.forEach((element, index, arr) => {
                                let row = document.createElement("tr"); 
                                _fields.map((item) => {
                                    let rowCol = document.createElement("td");
                                    rowCol.innerText = item == "id_documento" ? _documento+arr[index].attributes[item] :_removeAccents(arr[index].attributes[item]) ?? "";
                                    row.appendChild(rowCol);
                                });
                                fragment.appendChild(row);
                                _elementById(`ID_BTN_EXCEL_TB`).appendChild(fragment);
                            }
                        );
                    } catch (error) {
                        console.error(`Execute: _queryTask => ${error.name} - ${error.message}`);
                    }
                },
                (error) => {  
                    console.error(`Error: Execute => ${error.name} - ${error.message}`);
                }
            );
        } catch(error) {
            console.error(`_featureTable: ${error.name} - ${error.message}`);
        }
    };

    let _exportTableToExcel = function(tableID, filename = '') {
        let d = new Date();
        let downloadLink;
        let dataType = 'application/vnd.ms-excel';
        let tableSelect = document.getElementById(tableID);
        let tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');
        filename = filename?`${filename}_${d.getDate()}${d.getMonth()+1}${d.getFullYear()}_${d.getHours()}${d.getMinutes()}${d.getSeconds()}.xls`:'excel_data.xls';
        downloadLink = document.createElement("a");        
        document.body.appendChild(downloadLink);
        if(navigator.msSaveOrOpenBlob) {
            var blob = new Blob(['ufeff', tableHTML], {
                type: dataType
            });
            navigator.msSaveOrOpenBlob( blob, filename);
        } else {
            downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
            downloadLink.download = filename;
            downloadLink.click();
        }        
    }

    _elementById("ID_BTN_EXCEL").onclick = function() {
        _exportTableToExcel("ID_BTN_EXCEL_TB", _tabName);
    }
  
    let _summaryGeneral = function(_ambito) {
        try { /* if(_ambito ?? true) { */
            if(Object.keys(_ambito).length === 0) {
                _elementById("ID_Alert").style.display = "block";
            } else {
                _elementById("ID_Alert").style.display = "none";
                this.diagnosisCount = 1;
                this._listLayer = [];
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
    /* Se crea dinamicamente el TAB y CONTENT del TAB */
    let _jsonTravelTree = function(_json, _name = "") {
		try {
            let jsonLS = JSON.parse(localStorage.getItem("reportTitle_request"));
            let litAmbito = jsonLS.search("(distrito)") > 0 ? "DISTRITO" : 
            jsonLS.search("(provincia)") > 0 ? "PROVINCIA" : "DEPARTAMENTO";
            /* ANALIZAR */
            let _nameTemp = "";
            _json.map(function(lyr, index) {
                //console.log(lyr.tag);
                const divHeader = document.createElement("div");
                divHeader.innerHTML = `<span class="fa fa-refresh fa-spin" style="font-size:12px; color: #FFFFFF; margin: 0 10px 10px 0;"></span>` + lyr.name;
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
                        
                        /*if(featureTable !== null) { featureTable.destroy(); }*/
                        if(registry.byId(`ID_TableDynamic`)) {
                            registry.byId(`ID_TableDynamic`).destroyRecursive();
                        }
                        
                        _tabName = nodeHeader.innerText;
                        let _buttonName = _tabName.substring((_tabName.lastIndexOf("/") +1), _tabName.length);
                        _elementById("ID_BTN_EXCEL").innerHTML = `<i class="fa fa-download"></i>&nbsp; Descargar tabla - ${_buttonName}`;
                        _tabName = nodeHeader.innerText.split("/").join('');                        
                        _tabName = _tabName.split(" ").join('');                         
                        _featureTable(
                            lyr,
                            nodeHeader.innerText,
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
                                query_PPRD.outFields = lyr.fields.map(x => x.name);
                                query_PPRD.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")));
                                query_PPRD.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_PPRD.returnGeometry = false;
                                queryTask_PPRD.execute(query_PPRD).then(
                                    (response) => {
                                        try {
                                            const _txtPlus = _version.cuenta_adicional;
                                            let _features = "", _ambito = "";
                                            let _length = response.features.length;
                                            let _note   = _elementById(`IDNote_${lyr.tag}`);
                                            let _img    = _elementById(`IDImg_${lyr.tag}`);
                                            let _countAmbito = 0;
                                            _boolean = true;
                                            let _queryFilter =  _ambitoArr.length == 3 ? config.lyrFilter[2]:
                                                                _ambitoArr.length == 2 ? config.lyrFilter[2]:
                                                                config.lyrFilter[1];
                                            for (let i = 0; i < _length; i++) {                                                
                                                _features = response.features[i];
                                                _ambito = _features.attributes[_version.field]; 
                                                if(_ambito.split(",").length == (_ambitoArr.length + 1)) {
                                                    _countAmbito = _countAmbito + 1;
                                                }
                                                _ambito = _ambito.replace("DISTRITO ","");
                                                _ambito = _ambito.replace("PROVINCIA ","");
                                                _ambito = _ambito.replace("DEPARTAMENTO ","");                                                
                                                if(_ambito == _ambitoLS) {
                                                    _note.className = "sect-nota-info";
                                                    _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion} ${_ambitoArr.length == 1 || _ambitoArr.length == 2? _txtPlus:""}`;
                                                    _img.className = "sect-nota-info";
                                                    _img.setAttribute("src", `${_version.imagen}/${_features.attributes[_version.documento]}_img.jpg`);
                                                    _boolean = false;
                                                }
                                            }
                                            
                                            if(_boolean) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion} ${_ambitoArr.length == 1 || _ambitoArr.length == 2? _txtPlus : ""}`;
                                                _img.setAttribute("src", `./images/PPRRD.png`);
                                            }

                                            if(_ambitoQueryAmbito != false){
                                                _ambitoPie(lyr,_queryFilter.url,_ambitoQueryAmbito,_countAmbito);
                                            }

                                            if(litAmbito == "DEPARTAMENTO") {   
                                                _elementById(`IDTitle_${lyr.tag}`).innerHTML = _version.title[0].departamento;
                                            } else if(litAmbito == "PROVINCIA") {
                                                _elementById(`IDTitle_${lyr.tag}`).innerHTML = _version.title[0].provincia;
                                            }                                            
                                        } catch (error) {
                                            console.error(`Count: PPRRD => ${error.name} - ${error.message}`);
                                        }             
                                    },
                                    (error) => {  
                                        console.error(`Error: PPRRD => ${error.name} - ${error.message}`);
                                    }
                                );

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);
                                
                                const divCenter = document.createElement("center");
                                const divTitle = document.createElement("p");
                                divTitle.style.fontSize = "14px";
                                divTitle.id = `IDTitle_${lyr.tag}`;
                                /*divTitle.innerHTML = _version.title;*/
                                divCenter.appendChild(divTitle);
                                divColumn_01.appendChild(divCenter);

                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","180");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);

                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.style.marginTop = "20px";
                                divNota.innerHTML = _version.nota;
                                divColumn_01.appendChild(divNota);

                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                                const divImg = document.createElement("img");
                                divImg.id = `IDImg_${lyr.tag}`;
                                divColumn_02.appendChild(divImg);

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
                                query_EVAR.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")));
                                query_EVAR.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_EVAR.returnGeometry = false;
                                queryTask_EVAR.execute(query_EVAR).then(
                                    (response) => {
                                        try {
                                            let _features = "", _ambito = "";
                                            let _length = response.features.length;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _img = _elementById(`IDImg_${lyr.tag}`);
                                            for (let i = 0; i < _length; i++) {
                                                _features = response.features[i];
                                                _ambito = _features.attributes[_version.field];                                        
                                                _ambito = _ambito.replace("DISTRITO ","");
                                                _ambito = _ambito.replace("PROVINCIA ","");
                                                _ambito = _ambito.replace("DEPARTAMENTO ","");
                                                if(_ambito == _ambitoLS) {
                                                    _img.setAttribute("src", `${_version.imagen}/${_features.attributes[_version.documento]}_img.jpg`);
                                                    _boolean = false;
                                                    break;
                                                }
                                                _boolean = true;                                                
                                            }

                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}.`;
                                            }

                                            if(_boolean) { _img.setAttribute("src", `./images/EVARD.png`); }                                         
                                        } catch (error) {
                                            console.error(`Count: EVAR => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: EVAR => ${error.name} - ${error.message}`);
                                    }
                                );

                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle); 

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
                                    divCanvas.setAttribute("width","420");
                                    _graphicChartBar(
                                        divCanvas,
                                        [current.item[0].alias,current.item[1].alias],
                                        _generateArray(3)
                                    );

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

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);

                                divColumn_01.appendChild(divMain);

                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_01.appendChild(divNota); 

                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);

                                const divImg = document.createElement("img");
                                divImg.id = `IDImg_${lyr.tag}`;
                                divColumn_02.appendChild(divImg);

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
                                query_EVAR_EST.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_EVAR_EST.outStatistics = [ poblacionSD_PA, poblacionSD_PMA, poblacionSD_VA, poblacionSD_VMA];
                                query_EVAR_EST.returnGeometry = false;
                                queryTask_EVAR_EST.execute(query_EVAR_EST).then(
                                    (response) => {
                                        try {
                                            let _attr = response.features[0].attributes;
                                            /* POBLACION */
                                            let chart_01 = Chart.getChart(`IDcontent${lyr.tag}${_version.fields[0].name}`);
                                            chart_01.data.datasets[0].data = [_attr.sumpa ?? 0,_attr.sumpma ?? 0];
                                            chart_01.data.datasets[0].backgroundColor = ['rgba(255, 205, 86, 0.2)','rgba(255, 99, 132, 0.2)'];
                                            chart_01.data.datasets[0].borderColor = ['rgb(255, 205, 86)','rgb(255, 99, 132)'];
                                            chart_01.data.labels = [_version.fields[0].item[0].alias, _version.fields[0].item[1].alias];
                                            chart_01.update();                                            
                                            let _contentTab01 = [];
                                            _contentTab01.push({"item": _version.fields[0].item[0].alias,"val": _attr.sumpa ?? 0});
                                            _contentTab01.push({"item": _version.fields[0].item[1].alias,"val": _attr.sumpma ?? 0});
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = (_attr.sumpa ?? 0) + (_attr.sumpma ?? 0);
                                            _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                            /* VIVIENDA */
                                            let chart_02 = Chart.getChart(`IDcontent${lyr.tag}${_version.fields[1].name}`);
                                            chart_02.data.datasets[0].data = [_attr.sumva ?? 0,_attr.sumvma ?? 0];
                                            chart_02.data.datasets[0].backgroundColor = ['rgba(255, 205, 86, 0.2)','rgba(255, 99, 132, 0.2)'];
                                            chart_02.data.datasets[0].borderColor = ['rgb(255, 205, 86)','rgb(255, 99, 132)'];
                                            chart_02.data.labels = [_version.fields[1].item[0].alias, _version.fields[1].item[1].alias];
                                            chart_02.update();
                                            let _contentTab02 = [];
                                            _contentTab02.push({"item": _version.fields[1].item[0].alias,"val": _attr.sumva ?? 0});
                                            _contentTab02.push({"item": _version.fields[1].item[1].alias,"val": _attr.sumvma ?? 0});
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = (_attr.sumva ?? 0) + (_attr.sumvma ?? 0);
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
                                let countLayer = 0;
                                this._listLayerAnalysis = [];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                /*
                                const divTable = document.createElement("div");
                                divTable.id = `ID_TBcontent${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divColumn_02.appendChild(divTable);*/

                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);
                                
                                /* HEADER */
                                lyr.content[0].version_03[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById("DOW_3").style.display = "none";
                                        } else {
                                            _elementById("DOW_3").style.display = "block";
                                        }
                                    }
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
                                lyr.content[0].version_03[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    if(index != 2) {
                                        const divCenterTotal = document.createElement("center");
                                        const divTotal = document.createElement("p");
                                        divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                        divTotal.style.fontSize = "65px";
                                        divTotal.style.margin = "5px 0px";
                                        divTotal.innerHTML = _cssLoad;
                                        divCenterTotal.appendChild(divTotal);
                                        div.appendChild(divCenterTotal);    
                                    }
                                    
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "215px";
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

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS); 

                                divColumn_01.appendChild(divMain);

                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);

                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);

                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);
                                divColumn_01.appendChild(divRow);

                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);
                                
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Zona de Riesgo", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Zona de Riesgo", "Vivienda");
                                
                                /*_htmlTable(_elementById(`ID_TBcontent${lyr.tag}`)); */
                                /* _htmlTableTAB(_elementById(`ID_TBcontent${lyr.tag}`),"OTROS EE","CANTIDAD"); */
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");

                                let queryTask_ZRNM = new QueryTask(lyr.url);
                                let query_ZRNM = new Query();  
                                query_ZRNM.outFields = ['*'];/*_version.fields.map(x => x.name);*/
                                query_ZRNM.geometry = new Polygon(JSON.parse(localStorage.getItem("reportGeometry")));
                                query_ZRNM.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_ZRNM.returnGeometry = true;
                                queryTask_ZRNM.execute(query_ZRNM).then(
                                    (response) => {
                                        try {
                                            let _length = response.features.length;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);

                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }

                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}.`;
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
                                    if(_geometry ?? false) {
                                        
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        );
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
                                        query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Engine.returnGeometry = false;
                                        queryTask_Engine.execute(query_Engine).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    /* Poblacion */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumpoblacion ?? 0;
                                                    _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    /* Vivienda */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda ?? 0;
                                                    _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic ZRNM => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic ZRNM => ${error.name}`);
                                            }
                                        ); 

                                        configAnalysis_Temp.forEach(function(cValue) {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            /* Statistic Analysis */
                                             let analysisCOUNT = new StatisticDefinition();
                                             analysisCOUNT.statisticType = "count";
                                             analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                             analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                             /* Statistic Analysis */
                                             let queryTask_Analysis = new QueryTask(cValue.url);
                                             let query_Analysis = new Query();
                                             query_Analysis.outFields = cValue.fields.map(x => x.name)
                                             query_Analysis.geometry = _geometry;
                                             query_Analysis.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                             query_Analysis.outStatistics = [ analysisCOUNT ];
                                             queryTask_Analysis.execute(query_Analysis).then(
                                                 (response) => {
                                                     try {
                                                         let _attr = response.features[0].attributes;
                                                         countLayer++;
                                                         if(_attr.cantidad > 0) {
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            this._listLayerAnalysis.push(cValue.table);
                                                             let _contentTab = [];
                                                             /*let _id = `ID_TBcontent${lyr.tag}`;*/
                                                             let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                             _contentTab.push({ "index":countTabItem++, "item":cValue.name, "val":_attr.cantidad });
                                                             _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                             _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + _attr.cantidad;
                                                         }
                                                     } catch (error) {
                                                         console.error(`Count: Statistic Analysis => ${error.name}`);
                                                     }                    
                                                 },
                                                 (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                 }
                                             ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                } catch (error) {
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));
                                         });
                                    }                                  
                                    _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                    
                                }));
                            }
                            /* </ZRNM> */

                            /* <PCI> */
                            if(typeof lyr.content[0].version_04 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_04[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                /* Statistic Total */
                                let ambitoCOUNT = new StatisticDefinition();
                                ambitoCOUNT.statisticType = "count";
                                ambitoCOUNT.onStatisticField = "shape";
                                ambitoCOUNT.outStatisticFieldName = "countAmbito";
                                /* Statistic Familia */
                                let familiaSUM = new StatisticDefinition();
                                familiaSUM.statisticType = "sum";
                                familiaSUM.onStatisticField = _version.fields[0].name;
                                familiaSUM.outStatisticFieldName = "sumfamilia";
                                /* Statistic Vivienda */
                                let viviendaSUM = new StatisticDefinition();
                                viviendaSUM.statisticType = "count";
                                viviendaSUM.onStatisticField = _version.fields[1].name;
                                viviendaSUM.outStatisticFieldName = "sumvivienda";
                                /* Statistic Response */
                                let queryTask_Engine = new QueryTask(lyr.url);
                                let query_Engine = new Query();
                                query_Engine.outFields = _version.fields.map(x => x.name);
                                query_Engine.geometry = new Polygon(_geometryAmbito);
                                query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_Engine.outStatistics = [ familiaSUM, viviendaSUM, ambitoCOUNT ];
                                query_Engine.returnGeometry = false;
                                queryTask_Engine.execute(query_Engine).then(
                                    (response) => {
                                        try {
                                            let _contentTab01 = []; let _contentTab02 = [];
                                            let _attr = response.features[0].attributes;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            if(_attr.countambito == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _attr.countambito)}`;
                                            }
                                            /* Poblacion */
                                            _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumfamilia ?? 0;
                                            _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumfamilia ?? 0});
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumfamilia ?? 0;
                                            _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                            /* Vivienda */
                                            _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda ?? 0;   
                                            _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                            _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                        } catch (error) {
                                            console.error(`Count: Statistic ZRNM => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic ZRNM => ${error.name}`);
                                    }
                                );
                                /* MENSAJE */
                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);
                                /* Detalle */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);
                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);                                
                                /* HEADER */
                                lyr.content[0].version_04[0].fields.map(function(current) {
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
                                lyr.content[0].version_04[0].fields.map(function(current) {
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
                                    divTotal.innerHTML = _cssLoad;
                                    divCenterTotal.appendChild(divTotal);
                                    div.appendChild(divCenterTotal);
                                    
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                                
                                lyr.content[0].version_04[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 
                                
                                divColumn_01.appendChild(divMain);

                                const divNota_2 = document.createElement("p");
                                divNota_2.className = "sect-nota";
                                divNota_2.innerHTML = _version.nota_2;
                                divColumn_01.appendChild(divNota_2);

                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                                
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Puntos Críticos", "Familias");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Puntos Críticos", "Viviendas");
                            }
                            /* </PCI> */

                            /* <AEI> */
                            if(typeof lyr.content[0].version_05 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_05[0];
                                let unionGeometry = [];
                                let countLayer = 0;
                                this._listLayerAnalysis = [];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");                                
                                /*
                                const divTable = document.createElement("div");
                                divTable.id = `ID_TBcontent${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divColumn_02.appendChild(divTable);*/
                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);
                                /* Detalle */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);                                
                                /* HEADER */
                                lyr.content[0].version_05[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "none";
                                        } else {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "block";
                                        }
                                    }
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
                                lyr.content[0].version_05[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    if(index != 2) {
                                        const divCenterTotal = document.createElement("center");
                                        const divTotal = document.createElement("p");
                                        divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                        divTotal.style.fontSize = "65px";
                                        divTotal.style.margin = "5px 0px";
                                        divTotal.innerHTML = _cssLoad;
                                        divCenterTotal.appendChild(divTotal);
                                        div.appendChild(divCenterTotal);    
                                    }

                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "212px";
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_05[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 

                                divColumn_01.appendChild(divMain);
                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                                /* TABLA */
                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);
                                divColumn_01.appendChild(divRow);
                                /* CARGA */
                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Áreas de Exposición", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Áreas de Exposición", "Viviendas");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");
                                /*_htmlTableTAB(_elementById(`ID_TBcontent${lyr.tag}`),"OTROS EE","CANTIDAD");*/
                                
                                let queryTask_AEI = new QueryTask(lyr.url);
                                let query_AEI = new Query();
                                query_AEI.returnGeometry = true;
                                query_AEI.geometry = new Polygon(_geometryAmbito);
                                query_AEI.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                queryTask_AEI.execute(query_AEI).then(
                                    (response) => {
                                        try {
                                            let _length = response.features.length;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }

                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}`;
                                            }                                                                   
                                        } catch (error) {
                                            console.error(`Count: AEI => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: AEI => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1;
                                    let countTabItemTotal = 0;
                                    /* Union Geometry */
                                    let _geometry = geometryEngine.union(unionGeometry);
                                    if(_geometry ?? false) {
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        );
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
                                        query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Engine.returnGeometry = false;
                                        queryTask_Engine.execute(query_Engine).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    /* Poblacion */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerHTML = _attr.sumpoblacion ?? 0;
                                                    _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    /* Vivienda */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerHTML = _attr.sumvivienda ?? 0;
                                                    _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic AEI => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic AEI => ${error.name}`);
                                            }
                                        );                                    
                                        /*_elementById(`ID_TBcontent${lyr.tag}_Tbody`).innerHTML = "";*/
                                        _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                        configAnalysis_Temp.forEach(function(cValue) {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            /* Statistic Analysis */
                                            let analysisCOUNT = new StatisticDefinition();
                                            analysisCOUNT.statisticType = "count";
                                            analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                            analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                            /* Statistic Analysis */
                                            let queryTask_Analysis = new QueryTask(cValue.url);
                                            let query_Analysis = new Query();
                                            query_Analysis.outFields = cValue.fields.map(x => x.name)
                                            query_Analysis.geometry = _geometry;
                                            query_Analysis.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                            query_Analysis.outStatistics = [ analysisCOUNT ];
                                            queryTask_Analysis.execute(query_Analysis).then(
                                                (response) => {
                                                    try {
                                                        let _attr = response.features[0].attributes;
                                                        countLayer++;
                                                        if(_attr.cantidad > 0) {
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            this._listLayerAnalysis.push(cValue.table);
                                                            let _contentTab = [];
                                                            /*let _id = `ID_TBcontent${lyr.tag}`;*/
                                                            let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                            _contentTab.push({ "index":countTabItem++, "item":cValue.name, "val":_attr.cantidad });
                                                            _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                            _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + _attr.cantidad;
                                                        }
                                                    } catch (error) {
                                                        console.error(`Count: Statistic Analysis => ${error.name}`);
                                                    }                    
                                                },
                                                (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                }
                                            ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                } catch (error) {
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));
                                        });
                                    }
                                }));
                            }
                            /* </AEI> */

                            /* <FM> */
                            if(typeof lyr.content[0].version_06 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_06[0];
                                let unionGeometry = [];
                                let countLayer = 0;
                                this._listLayerAnalysis = [];                                
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);

                                /* Detalle */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);
                                                                
                                /* HEADER */
                                lyr.content[0].version_06[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "none";
                                        } else {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "block";
                                        }
                                    }

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
                                lyr.content[0].version_06[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    if(index != 2) {
                                        const divCenterTotal = document.createElement("center");
                                        const divTotal = document.createElement("p");
                                        divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                        divTotal.style.fontSize = "65px";
                                        divTotal.style.margin = "5px 0px";
                                        divTotal.innerHTML = _cssLoad;
                                        divCenterTotal.appendChild(divTotal);
                                        div.appendChild(divCenterTotal);    
                                    }
                                    
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "215px";
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_06[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 
                                divColumn_01.appendChild(divMain);

                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);

                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);

                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);
                                divColumn_01.appendChild(divRow);

                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Fajas marginales", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Fajas marginales", "Viviendas");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");

                                let queryTask_FM = new QueryTask(lyr.url);
                                let query_FM = new Query();
                                query_FM.returnGeometry = true;
                                query_FM.geometry = new Polygon(_geometryAmbito);
                                query_FM.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                queryTask_FM.execute(query_FM).then(
                                    (response) => {
                                        try {
                                            let _length = response.features.length;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }

                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}`;
                                            }                          
                                        } catch (error) {
                                            console.error(`Count: AEI => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: AEI => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1;
                                    let countTabItemTotal = 0;
                                    /* Union Geometry */
                                    let _geometry = geometryEngine.union(unionGeometry);
                                    if(_geometry ?? false) {
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        );
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
                                        //query_Engine.outFields = _version.fields.map(x => x.name);
                                        query_Engine.outFields = ['*'];
                                        query_Engine.geometry = _geometry;
                                        query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Engine.returnGeometry = true;
                                        queryTask_Engine.execute(query_Engine).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    /* Poblacion */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumpoblacion ?? 0;
                                                    _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    /* Vivienda */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda ?? 0;
                                                    _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic FM => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic FM => ${error.name}`);
                                            }
                                        );   
                                        
                                        _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                        configAnalysis_Temp.forEach(function(cValue) {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            /* Statistic Analysis */
                                            let analysisCOUNT = new StatisticDefinition();
                                            analysisCOUNT.statisticType = "count";
                                            analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                            analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                            /* Statistic Analysis */
                                            let queryTask_Analysis = new QueryTask(cValue.url);
                                            let query_Analysis = new Query();
                                            query_Analysis.outFields = cValue.fields.map(x => x.name)
                                            query_Analysis.geometry = _geometry;
                                            query_Analysis.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                            query_Analysis.outStatistics = [ analysisCOUNT ];
                                            queryTask_Analysis.execute(query_Analysis).then(
                                                (response) => {
                                                    try {
                                                        let _attr = response.features[0].attributes;
                                                        countLayer++;
                                                        if(_attr.cantidad > 0) {
                                                            this._listLayerAnalysis.push(cValue.table);
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            let _contentTab = [];
                                                            let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                            _contentTab.push({"item":cValue.name, "val":_attr.cantidad ?? 0 });
                                                            _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                            _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + (_attr.cantidad ?? 0);
                                                        }
                                                    } catch (error) {
                                                        console.error(`Count: Statistic Analysis => ${error.name}`);
                                                    }                    
                                                },
                                                (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                }
                                            ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                } catch (error) {
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));;
                                        });
                                    }
                                }));
                            }
                            /* </FM> */

                            /* <ZC> */
                            if(typeof lyr.content[0].version_07 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_07[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                let cantCOUNT = new StatisticDefinition();
                                cantCOUNT.statisticType = "count";
                                cantCOUNT.onStatisticField = _version.static;
                                cantCOUNT.outStatisticFieldName = "cantidad";
                              
                                let queryTask_MM = new QueryTask(lyr.url);
                                let query_MM = new Query();
                                query_MM.geometry = new Polygon(_geometryAmbito);
                                query_MM.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_MM.outStatistics = [ cantCOUNT ];
                                query_MM.orderByFields = [`COUNT(${_version.static}) DESC`];
                                query_MM.groupByFieldsForStatistics = [_version.static];
                                query_MM.returnGeometry = false;
                                queryTask_MM.execute(query_MM).then(
                                    (response) => {
                                        try {
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _contentTab = []; let _contentTotal = 0; let _chartData = []; let _chartLabel = [];
                                            let _features = response.features; 
                                            if(_features.length > 0) {
                                                _note.className = "sect-nota-info";
                                                _features.forEach(function(_item,_index) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static]} <span style="font-size: 15px;color:${configBackgroundColor[_index]}">■</span>`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + (_item.attributes["cantidad"] ?? 0);
                                                    _chartData.push(_item.attributes["cantidad"] ?? 0);
                                                    _chartLabel.push(_item.attributes[_version.static]);
                                                });
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _contentTotal)}`;
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chartBackgroundColor.push(lyr.rgb);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic ZRNM => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic ZRNM => ${error.name}`);
                                    }
                                );
                                const divOBSP = document.createElement("p");
                                divOBSP.id = `IDNote_${lyr.tag}`;
                                divOBSP.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBSP);

                                const divCenter = document.createElement("center");
                                const divOBS = document.createElement("p");
                                divOBS.style.fontSize = "14px";
                                divOBS.innerHTML = _version.title;
                                divCenter.appendChild(divOBS);
                                divColumn_01.appendChild(divCenter);

                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","190");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);

                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "130px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable);
                                
                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);

                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                              
                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Peligro", "Cantidad");
                            }
                            /* </ZC> */

                            /* <AE> */
                            if(typeof lyr.content[0].version_08 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_08[0];
                                let unionGeometry = [];
                                let countLayer = 0;
                                this._listLayerAnalysis = [];                                
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");                                
                                /*
                                const divTable = document.createElement("div");
                                divTable.id = `ID_TBcontent${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divColumn_02.appendChild(divTable);*/
                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);                                                                
                                /* Detalle */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);                                
                                /* HEADER */
                                lyr.content[0].version_08[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "none";
                                        } else {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "block";
                                        }
                                    }
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
                                lyr.content[0].version_08[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    if(index != 2) {
                                        const divCenterTotal = document.createElement("center");
                                        const divTotal = document.createElement("p");
                                        divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                        divTotal.style.fontSize = "65px";
                                        divTotal.style.margin = "5px 0px";
                                        divTotal.innerHTML = _cssLoad;
                                        divCenterTotal.appendChild(divTotal);
                                        div.appendChild(divCenterTotal);    
                                    }

                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "212px";
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_08[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 
                                divColumn_01.appendChild(divMain);                                                                
                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                                /* TABLA */
                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);
                                divColumn_01.appendChild(divRow);
                                /* CARGA */
                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Áreas de Exposición por Movimiento en Masa", "Población Expuesta");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Áreas de Exposición por Movimiento en Masa", "Viviendas Expuestas");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");
                                
                                let queryTask_AE = new QueryTask(lyr.url);
                                let query_AE = new Query();
                                query_AE.geometry = new Polygon(_geometryAmbito);
                                query_AE.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_AE.returnGeometry = true;
                                queryTask_AE.execute(query_AE).then(
                                    (response) => {
                                        try {
                                            let _length = response.features.length;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}`;
                                            }

                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }
                                        } catch (error) {
                                            console.error(`Count: AE => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: AE => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1;
                                    let countTabItemTotal = 0;
                                    /* Union Geometry */
                                    let _geometry = geometryEngine.union(unionGeometry);
                                    if(_geometry ?? false) {
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        );
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
                                        query_Engine.geometry = new Polygon(_geometry);
                                        query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Engine.returnGeometry = false;
                                        queryTask_Engine.execute(query_Engine).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    /* Poblacion */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumpoblacion ?? 0;
                                                    _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    /* Vivienda */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda ?? 0;
                                                    _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic AE => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                console.error(`Error: Statistic AE => ${error.name}`);
                                            }
                                        );                                    
                                        /*_elementById(`ID_TBcontent${lyr.tag}_Tbody`).innerHTML = "";*/
                                        _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                        configAnalysis_Temp.forEach(function(cValue) {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            /* Statistic Analysis */
                                            let analysisCOUNT = new StatisticDefinition();
                                            analysisCOUNT.statisticType = "count";
                                            analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                            analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                            /* Statistic Analysis */
                                            let queryTask_Analysis = new QueryTask(cValue.url);
                                            let query_Analysis = new Query();
                                            query_Analysis.outFields = cValue.fields.map(x => x.name)
                                            query_Analysis.geometry = new Polygon(_geometry);
                                            query_Analysis.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                            query_Analysis.outStatistics = [ analysisCOUNT ];
                                            query_Analysis.returnGeometry = false;
                                            queryTask_Analysis.execute(query_Analysis).then(
                                                (response) => {
                                                    try {
                                                        let _attr = response.features[0].attributes;
                                                        countLayer++;
                                                        if(_attr.cantidad > 0) {
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            this._listLayerAnalysis.push(cValue.table);
                                                            let _contentTab = [];
                                                            let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                            _contentTab.push({ "index":countTabItem++, "item":cValue.name, "val":_attr.cantidad ?? 0 });
                                                            _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                            _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + (_attr.cantidad ?? 0);
                                                        }
                                                    } catch (error) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                        console.error(`Count: Statistic Analysis => ${error.name}`);
                                                    }
                                                },
                                                (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                }
                                            ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                } catch (error) {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));
                                        });
                                    }
                                }));
                            }
                            /* </AE> */

                            /* <AET> */
                            if(typeof lyr.content[0].version_09 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_09[0];
                                let unionGeometry = [];
                                this._listLayerAnalysis = [];
                                let countLayer = 0;
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS); 

                                /* Detalle */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);
                                                                
                                /* HEADER */
                                lyr.content[0].version_09[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "none";
                                        } else {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "block";
                                        }
                                    }

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
                                lyr.content[0].version_09[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    if(index != 2) {
                                        const divCenterTotal = document.createElement("center");
                                        const divTotal = document.createElement("p");
                                        divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                        divTotal.style.fontSize = "65px";
                                        divTotal.style.margin = "5px 0px";
                                        divTotal.innerHTML = _cssLoad;
                                        divCenterTotal.appendChild(divTotal);
                                        div.appendChild(divCenterTotal);    
                                    }
                                    
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "195px";
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_09[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 

                                divColumn_01.appendChild(divMain);

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);

                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);

                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);

                                divColumn_01.appendChild(divRow);

                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Áreas de exposición a tsunami", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Áreas de exposición a tsunami", "Vivienda");

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");

                                let queryTask_AET = new QueryTask(lyr.url);
                                let query_AET = new Query();
                                query_AET.returnGeometry = true;
                                query_AET.geometry = new Polygon(_geometryAmbito);
                                query_AET.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                queryTask_AET.execute(query_AET).then(
                                    (response) => {
                                        try {
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _length = response.features.length;
                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }

                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}`;
                                            }                        
                                        } catch (error) {
                                            console.error(`Count: AEI => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: AEI => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1;
                                    let countTabItemTotal = 0;
                                    /* Union Geometry */
                                    let _geometry = geometryEngine.union(unionGeometry);
                                    if(_geometry ?? false) {
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        );
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
                                        query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Engine.returnGeometry = false;
                                        queryTask_Engine.execute(query_Engine).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    /* Poblacion */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumpoblacion ?? 0;
                                                    _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    /* Vivienda */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda ?? 0;
                                                    _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic FM => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic FM => ${error.name}`);
                                            }
                                        );                                    
                                        _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                        configAnalysis_Temp.forEach(function(cValue) {
                                            /* Statistic Analysis */
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            let analysisCOUNT = new StatisticDefinition();
                                            analysisCOUNT.statisticType = "count";
                                            analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                            analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                            /* Statistic Analysis */
                                            let queryTask_Analysis = new QueryTask(cValue.url);
                                            let query_Analysis = new Query();
                                            query_Analysis.outFields = cValue.fields.map(x => x.name)
                                            query_Analysis.geometry = _geometry;
                                            query_Analysis.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                            query_Analysis.outStatistics = [ analysisCOUNT ];
                                            queryTask_Analysis.execute(query_Analysis).then(
                                                (response) => {
                                                    try {
                                                        countLayer++;
                                                        let _attr = response.features[0].attributes;
                                                        if(_attr.cantidad > 0) {
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            this._listLayerAnalysis.push(cValue.table);
                                                            let _contentTab = [];
                                                            let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                            _contentTab.push({"index":countTabItem++, "item":cValue.name, "val":_attr.cantidad ?? 0 });
                                                            _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                            _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + (_attr.cantidad ?? 0);
                                                        }
                                                    } catch (error) {
                                                        console.error(`Count: Statistic Analysis => ${error.name}`);
                                                    }                    
                                                },
                                                (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                }
                                            ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                } catch (error) {
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));
                                        });
                                    }
                                }));
                            }
                            /* </AET> */

                            /* <NP> */
                            if(typeof lyr.content[0].version_10 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_10[0];
                                this._listLayerAnalysis = [];
                                let countLayer = 0;
                                let unionGeometryAlto = [];
                                let unionGeometryBajo = [];
                                let unionGeometryMedio = [];

                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);
                                /* Detalle */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);                                
                                /* HEADER */
                                lyr.content[0].version_10[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;                                    
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "none";
                                        } else {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "block";
                                        }
                                    }
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
                                lyr.content[0].version_10[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    if(index != 2) {
                                        const divCenterGraphic = document.createElement("center");
                                        const divCanvasGraphic = document.createElement("canvas");
                                        divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}${current.name}`);
                                        divCanvasGraphic.setAttribute("height","150");
                                        divCanvasGraphic.setAttribute("width","380");
                                        _graphicChartBar(
                                            divCanvasGraphic,
                                            [_version.graphic[0].alias,_version.graphic[1].alias,_version.graphic[2].alias],
                                            _generateArray(3)
                                        );
                                        divCenterGraphic.appendChild(divCanvasGraphic);
                                        div.appendChild(divCenterGraphic);
                                    }
                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "212px";
                                    divTable.style.marginTop = "10px";
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_10[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 
                                
                                divColumn_01.appendChild(divMain);
                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                                /* TABLA */
                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);
                                divColumn_01.appendChild(divRow);
                                /* CARGA */
                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Niveles de Peligro", "Población");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Niveles de Peligro", "Vivienda");
                                /*_htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");*/
                                
                                let queryTask_NP = new QueryTask(lyr.url);
                                let query_NP = new Query();
                                query_NP.returnGeometry = true;
                                query_NP.geometry = new Polygon(_geometryAmbito);
                                query_NP.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                queryTask_NP.execute(query_NP).then(
                                    (response) => {
                                        try {
                                            let _features = response.features;
                                            let _length = _features.length;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            for (let i = 0; i < _length; i++) {
                                                /*console.log(_features[i].attributes.nivel);*/
                                                if(_features[i].attributes.nivel == 'Alto') {
                                                    unionGeometryAlto.push(_features[i].geometry);
                                                }

                                                if(_features[i].attributes.nivel == 'Medio') {
                                                    unionGeometryMedio.push(_features[i].geometry);
                                                }

                                                if(_features[i].attributes.nivel == 'Bajo') {
                                                    unionGeometryBajo.push(_features[i].geometry);
                                                }
                                            }
                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}`;
                                            }                
                                        } catch (error) {
                                            console.error(`Count: NP => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: NP => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1; let countTabItemTotal = 0;
                                    let geometryAlto  = geometryEngine.union(unionGeometryAlto),
                                        geometryMedio = geometryEngine.union(unionGeometryMedio),
                                        geometryBajo  = geometryEngine.union(unionGeometryBajo);
                                    let _dataPobAlto = 0, _dataPobMedio = 0, _dataPobBajo = 0;
                                    let _dataVivAlto = 0, _dataVivMedio = 0, _dataVivBajo = 0;
                                    
                                    let poblacionSUM = new StatisticDefinition();
                                    poblacionSUM.statisticType = "sum";
                                    poblacionSUM.onStatisticField = _version.fields[0].name;
                                    poblacionSUM.outStatisticFieldName = "sumpoblacion";
                                        
                                    let viviendaSUM = new StatisticDefinition();
                                    viviendaSUM.statisticType = "sum";
                                    viviendaSUM.onStatisticField = _version.fields[1].name;
                                    viviendaSUM.outStatisticFieldName = "sumvivienda";

                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";

                                    if(geometryAlto ?? false) {
                                        this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                        let queryTask_Alto = new QueryTask(_version.url);
                                        let query_Alto = new Query();
                                        query_Alto.outFields = _version.fields.map(x => x.name);
                                        query_Alto.geometry = geometryAlto;
                                        query_Alto.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Alto.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Alto.returnGeometry = false;
                                        queryTask_Alto.execute(query_Alto).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    _dataPobAlto = _attr.sumpoblacion ?? 0; /* Poblacion */
                                                    _contentTab01.push({"item": _version.graphic[0].alias,"val": _dataPobAlto});                                                    
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    _dataVivAlto = _attr.sumvivienda ?? 0; /* Vivienda */
                                                    _contentTab02.push({"item": _version.graphic[0].alias,"val": _dataVivAlto});                                                    
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);                                                   
                                                } catch (error) {
                                                    console.error(`Count: Statistic geometryAlto => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic geometryAlto => ${error.name}`);
                                            }
                                        ).always(lang.hitch(this, () => {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                            let chartPob = Chart.getChart(`TB_GraphicContent_${lyr.tag}${_version.fields[0].name}`);
                                            /*chartPob.data.datasets[0].backgroundColor = ['rgba(255,205,86,0.2)','rgba(255,99,132,0.2)','rgba(218,247,166,0.2)'];
                                            chartPob.data.datasets[0].borderColor = ['rgb(255,205,86)','rgb(255,99,132)','rgb(218,247,166)'];*/
                                            chartPob.data.datasets[0].data = [_dataPobAlto,_dataPobMedio,_dataPobBajo];
                                            chartPob.update();
                                            let chartViv = Chart.getChart(`TB_GraphicContent_${lyr.tag}${_version.fields[1].name}`);
                                            chartViv.data.datasets[0].data = [_dataVivAlto,_dataVivMedio,_dataVivBajo];
                                            chartViv.update();
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _dataPobAlto+_dataPobMedio+_dataPobBajo;
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _dataVivAlto+_dataVivMedio+_dataVivBajo;
                                        }));
                                    }

                                    if(geometryMedio ?? false) {
                                        this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                        let queryTask_Medio = new QueryTask(_version.url);
                                        let query_Medio = new Query();
                                        query_Medio.outFields = _version.fields.map(x => x.name);
                                        query_Medio.geometry = geometryMedio;
                                        query_Medio.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Medio.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Medio.returnGeometry = false;
                                        queryTask_Medio.execute(query_Medio).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    _dataPobMedio = _attr.sumpoblacion ?? 0; /* Poblacion */
                                                    _contentTab01.push({"item": _version.graphic[1].alias,"val": _dataPobMedio});
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    _dataVivMedio = _attr.sumvivienda ?? 0; /* Vivienda */
                                                    _contentTab02.push({"item": _version.graphic[1].alias,"val": _dataVivMedio});
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);                                                   
                                                } catch (error) {
                                                    console.error(`Count: Statistic geometryMedio => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic geometryMedio => ${error.name}`);
                                            }
                                        ).always(lang.hitch(this, () => {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                            let chartPob = Chart.getChart(`TB_GraphicContent_${lyr.tag}${_version.fields[0].name}`);
                                            chartPob.data.datasets[0].data = [_dataPobAlto,_dataPobMedio,_dataPobBajo];
                                            chartPob.update();
                                            let chartViv = Chart.getChart(`TB_GraphicContent_${lyr.tag}${_version.fields[1].name}`);
                                            chartViv.data.datasets[0].data = [_dataVivAlto,_dataVivMedio,_dataVivBajo];
                                            chartViv.update();
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _dataPobAlto+_dataPobMedio+_dataPobBajo;
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _dataVivAlto+_dataVivMedio+_dataVivBajo;
                                        }));
                                    }

                                    if(geometryBajo ?? false) {
                                        this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                        let queryTask_Bajo = new QueryTask(_version.url);
                                        let query_Bajo = new Query();
                                        query_Bajo.outFields = _version.fields.map(x => x.name);
                                        query_Bajo.geometry = geometryBajo;
                                        query_Bajo.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Bajo.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Bajo.returnGeometry = false;
                                        queryTask_Bajo.execute(query_Bajo).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    _dataPobBajo = _attr.sumpoblacion ?? 0; /* Poblacion */
                                                    _contentTab01.push({"item": _version.graphic[2].alias,"val": _dataPobBajo});
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    _dataVivBajo = _attr.sumvivienda ?? 0; /* Vivienda */
                                                    _contentTab02.push({"item": _version.graphic[2].alias,"val": _dataVivBajo});
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic geometryBajo => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic geometryBajo => ${error.name}`);
                                            }
                                        ).always(lang.hitch(this, () => {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                            let chartPob = Chart.getChart(`TB_GraphicContent_${lyr.tag}${_version.fields[0].name}`);
                                            chartPob.data.datasets[0].data = [_dataPobAlto,_dataPobMedio,_dataPobBajo];
                                            chartPob.update();
                                            let chartViv = Chart.getChart(`TB_GraphicContent_${lyr.tag}${_version.fields[1].name}`);
                                            chartViv.data.datasets[0].data = [_dataVivAlto,_dataVivMedio,_dataVivBajo];
                                            chartViv.update();
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _dataPobAlto+_dataPobMedio+_dataPobBajo;
                                            _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _dataVivAlto+_dataVivMedio+_dataVivBajo;
                                        }));
                                    }
                                    /*
                                    if(_geometry ?? false) {
                                        console.log(_geometry);
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        ); 
                                        _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                        configAnalysis_Temp.forEach(function(cValue) {
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            let analysisCOUNT = new StatisticDefinition();
                                            analysisCOUNT.statisticType = "count";
                                            analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                            analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                            
                                            let queryTask_Analysis = new QueryTask(cValue.url);
                                            let query_Analysis = new Query();
                                            query_Analysis.outFields = cValue.fields.map(x => x.name)
                                            query_Analysis.geometry = _geometry;
                                            query_Analysis.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                                            query_Analysis.outStatistics = [ analysisCOUNT ];
                                            queryTask_Analysis.execute(query_Analysis).then(
                                                (response) => {
                                                    try {
                                                        let _attr = response.features[0].attributes;
                                                        countLayer++;
                                                        if(_attr.cantidad > 0) {
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            this._listLayerAnalysis.push(cValue.table);
                                                            let _contentTab = [];
                                                            let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                            _elementById(_id + "Tbody").innerHTML ="";
                                                            _contentTab.push({"item":cValue.name, "val":_attr.cantidad ?? 0 });
                                                            _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                            _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + _attr.cantidad ?? 0;
                                                        }
                                                    } catch (error) {
                                                        console.error(`Count: Statistic Analysis => ${error.name}`);
                                                    }                    
                                                },
                                                (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                }
                                            ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                } catch (error) {
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));
                                        });
                                    }
                                    */
                                }));
                            }
                            /* </NP> */

                            /* <AEE> */
                            if(typeof lyr.content[0].version_11 !== "undefined") {
                                this._listLayerAnalysis = [];
                                let countLayer = 0;
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_11[0];
                                let unionGeometry = [];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                /*const divTable = document.createElement("div");
                                divTable.id = `ID_TBcontent${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divColumn_02.appendChild(divTable);*/

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);

                                /* DETALLE */
                                const divDetalle = document.createElement("p");
                                divDetalle.className = "sect-detalle";
                                divDetalle.innerHTML = _version.detalle;
                                divColumn_01.appendChild(divDetalle);

                                /* HEADER */
                                lyr.content[0].version_11[0].fields.map(function(current,index) {
                                    const inputText = document.createElement("input");
                                    inputText.type = "radio";
                                    inputText.className = "tabs-horiz";
                                    inputText.id = `tab${lyr.tag}${current.name}`;
                                    inputText.name = `tabs-2${lyr.tag}`;
                                    inputText.onclick = function() {
                                        if(index == 0 || index == 1) {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "none";
                                        } else {
                                            _elementById(`DOW_${lyr.tag}`).style.display = "block";
                                        }
                                    }                                    
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
                                lyr.content[0].version_11[0].fields.map(function(current,index) {
                                    const sect = document.createElement("section");
                                    sect.id = `content${lyr.tag}${current.name}`;
                                    const div = document.createElement("div");
                                    
                                    const divCenter = document.createElement("center");
                                    const divOBS = document.createElement("p");
                                    divOBS.style.fontSize = "14px";
                                    divOBS.innerText = current.note;
                                    divCenter.appendChild(divOBS);
                                    div.appendChild(divCenter);

                                    if(index != 2) {
                                        const divCenterTotal = document.createElement("center");
                                        const divTotal = document.createElement("p");
                                        divTotal.id = `IDTOTALcontent${lyr.tag}${current.name}`;
                                        divTotal.style.fontSize = "65px";
                                        divTotal.style.margin = "5px 0px";
                                        divTotal.innerHTML = _cssLoad;
                                        divCenterTotal.appendChild(divTotal);
                                        div.appendChild(divCenterTotal);    
                                    }

                                    const divTable = document.createElement("div");
                                    divTable.id = `TBcontent${lyr.tag}${current.name}`;
                                    divTable.classList = "form-scroll-tab";
                                    divTable.style.maxHeight = "212px";
                                    div.appendChild(divTable);

                                    sect.appendChild(div);                            
                                    divMain.appendChild(sect);                            
                                }.bind(this));
                                
                                const tagStyle = document.createElement("style"); let _css = "";
                            
                                lyr.content[0].version_11[0].fields.map(function(current) {
                                    _css += `#tab${lyr.tag}${current.name}:checked ~ #content${lyr.tag}${current.name},`;  
                                }.bind(this));
                            
                                if(_css !== "") {
                                    let _cssStyle = _css.substring(0, _css.length - 1);
                                    tagStyle.textContent = _cssStyle.concat("{display: block;};");
                                    divMain.appendChild(tagStyle);
                                } 

                                divColumn_01.appendChild(divMain);
                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);

                                const divRow = document.createElement("div");
                                divRow.className = "row-excel";
                                const divDownload = document.createElement("div");
                                divDownload.id = `DOW_${lyr.tag}`;
                                divDownload.style.display = "none";
                                divRow.appendChild(divDownload);
                                divColumn_01.appendChild(divRow);

                                const divLOAD = document.createElement("div");
                                divLOAD.id = `IDLOAD_${lyr.tag}`;
                                divLOAD.innerHTML = _cssLoad;
                                divColumn_01.appendChild(divLOAD);
                                
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[0].name}`), "Áreas de Exposición por Otros Peligros Geológicos", "Población Expuesta");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[1].name}`), "Áreas de Exposición por Otros Peligros Geológicos", "Viviendas Expuestas");
                                _htmlTableTAB(_elementById(`TBcontent${lyr.tag}${_version.fields[2].name}`),"OTROS EE","CANTIDAD");
                                
                                let queryTask_AEE = new QueryTask(lyr.url);
                                let query_AEE = new Query();
                                query_AEE.returnGeometry = true;
                                query_AEE.geometry = new Polygon(_geometryAmbito);
                                query_AEE.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                queryTask_AEE.execute(query_AEE).then(
                                    (response) => {
                                        try {
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _length = response.features.length;
                                            for (let i = 0; i < _length; i++) {
                                                unionGeometry.push(response.features[i].geometry);
                                            }

                                            if(_length == 0) {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            } else {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _length)}`;
                                            }                        
                                        } catch (error) {
                                            console.error(`Count: AEE => ${error.name} - ${error.message}`);
                                        }                    
                                    },
                                    (error) => {  
                                        console.error(`Error: AEE => ${error.name} - ${error.message}`);
                                    }
                                ).always(lang.hitch(this, () => { 
                                    let countTabItem = 1;
                                    let countTabItemTotal = 0;
                                    /* Union Geometry */
                                    let _geometry = geometryEngine.union(unionGeometry);
                                    if(_geometry ?? false) {
                                        _loadSelect(
                                            config.download,
                                            this[`DOW_${lyr.tag}`],
                                            this._listLayerAnalysis,
                                            _geometry
                                        );
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
                                        query_Engine.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                        query_Engine.outStatistics = [ poblacionSUM, viviendaSUM ];
                                        query_Engine.returnGeometry = false;
                                        queryTask_Engine.execute(query_Engine).then(
                                            (response) => {
                                                try {
                                                    let _contentTab01 = []; let _contentTab02 = [];
                                                    let _attr = response.features[0].attributes;
                                                    /* Poblacion */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[0].name}`).innerText = _attr.sumpoblacion ?? 0;
                                                    _contentTab01.push({"item": _version.fields[0].td,"val": _attr.sumpoblacion ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[0].name}_Total`).innerText = _attr.sumpoblacion ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[0].name}`,_contentTab01);
                                                    /* Vivienda */
                                                    _elementById(`IDTOTALcontent${lyr.tag}${_version.fields[1].name}`).innerText = _attr.sumvivienda ?? 0;
                                                    _contentTab02.push({"item": _version.fields[1].td,"val": _attr.sumvivienda ?? 0});
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Tbody`).innerHTML = "";
                                                    _elementById(`TBcontent${lyr.tag}${_version.fields[1].name}_Total`).innerText = _attr.sumvivienda ?? 0;
                                                    _htmlTableTAB_ADD(`TBcontent${lyr.tag}${_version.fields[1].name}`,_contentTab02);
                                                } catch (error) {
                                                    console.error(`Count: Statistic FM => ${error.name}`);
                                                }                    
                                            },
                                            (error) => {
                                                console.error(`Error: Statistic FM => ${error.name}`);
                                            }
                                        );                                    
                                        /*_elementById(`ID_TBcontent${lyr.tag}_Tbody`).innerHTML = "";*/
                                        _elementById(`TBcontent${lyr.tag}${_version.fields[2].name}_Tbody`).innerHTML = "";
                                        configAnalysis_Temp.forEach(function(cValue) {                                            
                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                            /* Statistic Analysis */
                                            let analysisCOUNT = new StatisticDefinition();
                                            analysisCOUNT.statisticType = "count";
                                            analysisCOUNT.onStatisticField = _version.analysis[0].field;
                                            analysisCOUNT.outStatisticFieldName = "cantidad";                                    
                                            /* Statistic Analysis */
                                            let queryTask_Analysis = new QueryTask(cValue.url);
                                            let query_Analysis = new Query();
                                            query_Analysis.outFields = cValue.fields.map(x => x.name)
                                            query_Analysis.geometry = _geometry;
                                            query_Analysis.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                            query_Analysis.outStatistics = [ analysisCOUNT ];
                                            queryTask_Analysis.execute(query_Analysis).then(
                                                (response) => {
                                                    try {
                                                        let _attr = response.features[0].attributes;
                                                        countLayer++;
                                                        if(_attr.cantidad > 0) {                                                            
                                                            this[`IDLOAD_${lyr.tag}`].style.display = "block";
                                                            this._listLayerAnalysis.push(cValue.table);
                                                            let _contentTab = [];
                                                            /*let _id = `ID_TBcontent${lyr.tag}`;*/
                                                            let _id = `TBcontent${lyr.tag}${_version.fields[2].name}`;
                                                            _contentTab.push({ "index":countTabItem++, "item":cValue.name, "val":_attr.cantidad ?? 0 });
                                                            _htmlTableTAB_ADD(`${_id}`,_contentTab);
                                                            _elementById(`${_id}_Total`).innerText = countTabItemTotal = countTabItemTotal + _attr.cantidad ?? 0;
                                                        }
                                                    } catch (error) {
                                                        console.error(`Count: Statistic Analysis => ${error.name}`);
                                                    }                    
                                                },
                                                (error) => {
                                                    this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    console.error(`Error: Statistic Analysis => ${error.name}`);
                                                }
                                            ).always(lang.hitch(this, function() {
                                                try {
                                                    if(this.analysisTotal == countLayer) {
                                                        this[`IDLOAD_${lyr.tag}`].style.display = "none";
                                                    }
                                                } catch (error) {
                                                    console.error(`Error: configAnalysis_Temp always => ${error.name} - ${error.message}`);
                                                } 
                                            }.bind(this)));
                                        });
                                    }
                                }));
                            }
                            /* </AEE> */

                            /* <PAM> */
                            if(typeof lyr.content[0].version_12 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_12[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");
                                
                                let cantCOUNT = new StatisticDefinition();
                                cantCOUNT.statisticType = "count";
                                cantCOUNT.onStatisticField = _version.static;
                                cantCOUNT.outStatisticFieldName = "cantidad";
                              
                                let queryTask_PAM = new QueryTask(lyr.url);
                                let query_PAM = new Query();
                                query_PAM.geometry = new Polygon(_geometryAmbito);
                                query_PAM.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_PAM.outStatistics = [ cantCOUNT ];
                                query_PAM.orderByFields = [`COUNT(${_version.static}) DESC`];
                                query_PAM.groupByFieldsForStatistics = [_version.static];
                                query_PAM.returnGeometry = false;
                                queryTask_PAM.execute(query_PAM).then(
                                    (response) => {
                                        try {
                                            let _contentTab = []; let _contentTotal = 0; let _chartData = []; let _chartLabel = [];
                                            let _features = response.features;
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            if(_features.length > 0) {
                                                _note.className = "sect-nota-info";
                                                _features.forEach(function(_item,_index) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static]} <span style="font-size: 15px;color:${configBackgroundColor[_index]}">■</span>`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + _item.attributes["cantidad"] ?? 0;
                                                    _chartData.push(_item.attributes["cantidad"] ?? 0);
                                                    _chartLabel.push(_item.attributes[_version.static]);
                                                });
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _contentTotal)}`;
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();                                                
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic ZRNM => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic ZRNM => ${error.name}`);
                                    }
                                );

                                const divOBSP = document.createElement("p");
                                divOBSP.id = `IDNote_${lyr.tag}`;
                                divOBSP.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBSP);
                                
                                const divCenter = document.createElement("center");
                                const divOBS = document.createElement("p");
                                divOBS.style.fontSize = "14px";
                                divOBS.innerHTML = _version.title;
                                divCenter.appendChild(divOBS);
                                divColumn_01.appendChild(divCenter);

                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","180");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);

                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "215px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                              
                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Tipos", "Cantidad");
                            }
                            /* </PAM> */

                            /* <PAH> */
                            if(typeof lyr.content[0].version_13 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_13[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let cantCOUNT_01 = new StatisticDefinition();
                                cantCOUNT_01.statisticType = "count";
                                cantCOUNT_01.onStatisticField = _version.static_01[0].field;
                                cantCOUNT_01.outStatisticFieldName = "cantidad";
                                /*
                                let cantCOUNT_02 = new StatisticDefinition();
                                cantCOUNT_02.statisticType = "count";
                                cantCOUNT_02.onStatisticField = _version.static_02[0].field;
                                cantCOUNT_02.outStatisticFieldName = "cantidad";

                                let cantCOUNT_03 = new StatisticDefinition();
                                cantCOUNT_03.statisticType = "count";
                                cantCOUNT_03.onStatisticField = _version.static_03[0].field;
                                cantCOUNT_03.outStatisticFieldName = "cantidad";
                                */                              
                                let queryTask_PAH = new QueryTask(lyr.url);
                                let query_PAH = new Query();
                                query_PAH.geometry = new Polygon(_geometryAmbito);
                                query_PAH.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_PAH.outStatistics = [ cantCOUNT_01 ];
                                query_PAH.orderByFields = [`COUNT(${_version.static_01[0].field}) DESC`];
                                query_PAH.groupByFieldsForStatistics = [_version.static_01[0].field ];
                                query_PAH.returnGeometry = false;
                                queryTask_PAH.execute(query_PAH).then(
                                    (response) => {
                                        try {
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _contentTab = []; let _contentTotal = 0; let _chartData = []; let _chartLabel = [];
                                            let _features = response.features;
                                            if(_features.length > 0) {
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _features.length)}`;

                                                _features.forEach(function(_item) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static_01[0].field]}`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + _item.attributes["cantidad"];
                                                    _chartData.push(_item.attributes["cantidad"]);
                                                    _chartLabel.push(_item.attributes[_version.static_01[0].field]);
                                                });
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                /*new Chart(`TB_GraphicContent_${lyr.tag}`, { 
                                                    type: 'pie',
                                                    data: { labels:_chartLabel, datasets:[{ data:_chartData, backgroundColor:configBackgroundColor, borderWidth:1 }]},
                                                    options: {
                                                        responsive: false,
                                                        plugins: {
                                                            legend: { display:false, position:'bottom' },
                                                            title: { display:false, text:'GRÁFICO DE RESUMEN' }
                                                        }
                                                    }
                                                });*/
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic ZRNM => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic ZRNM => ${error.name}`);
                                    }
                                );

                                const divOBSP = document.createElement("p");
                                divOBSP.id = `IDNote_${lyr.tag}`;
                                divOBSP.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBSP);
                                
                                const divCenter = document.createElement("center");
                                const divOBS = document.createElement("p");
                                divOBS.style.fontSize = "14px";
                                divOBS.innerHTML = _version.title;
                                divCenter.appendChild(divOBS);
                                divColumn_01.appendChild(divCenter);

                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","190");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);
                                
                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "150px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota); 
                                
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                              
                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Tipos", "Cantidad");
                            }
                            /* </PAH> */

                            /* <IIFO> */
                            if(typeof lyr.content[0].version_14 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_14[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let cantCOUNT_IIFO = new StatisticDefinition();
                                cantCOUNT_IIFO.statisticType = "count";
                                cantCOUNT_IIFO.onStatisticField = "shape";
                                cantCOUNT_IIFO.outStatisticFieldName = "cantidad";
                                                            
                                let queryTask_IIFO = new QueryTask(lyr.url);
                                let query_IIFO = new Query();
                                query_IIFO.geometry = new Polygon(_geometryAmbito);
                                query_IIFO.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_IIFO.outStatistics = [ cantCOUNT_IIFO ];
                                query_IIFO.returnGeometry = false;
                                queryTask_IIFO.execute(query_IIFO).then(
                                    (response) => {
                                        try {
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _features = response.features[0].attributes;
                                            if(_features.cantidad > 0) {
                                                _elementById(`IDTOTALcontent_${lyr.tag}`).innerText = _features.cantidad;
                                                /*
                                                _contentTab.push({
                                                    "item": `${_item.attributes[_version.static]}`,
                                                    "val": _item.attributes["cantidad"]
                                                });
                                                _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + _item.attributes["cantidad"];                                                
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                */
                                                _note.className = "sect-nota-info";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _features.length)}`;
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                            
                                        } catch (error) {
                                            console.error(`Count: Statistic IIFO => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic IIFO => ${error.name}`);
                                    }
                                );

                                const divOBSP = document.createElement("p");
                                divOBSP.id = `IDNote_${lyr.tag}`;
                                divOBSP.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBSP);

                                const divCenter = document.createElement("center");
                                const divOBS = document.createElement("p");
                                divOBS.style.fontSize = "14px";
                                divOBS.innerHTML = _version.title;
                                divCenter.appendChild(divOBS);
                                divColumn_01.appendChild(divCenter);

                                const divCenterTotal = document.createElement("center");
                                const divTotal = document.createElement("p");
                                divTotal.id = `IDTOTALcontent_${lyr.tag}`;
                                divTotal.style.fontSize = "65px";
                                divTotal.style.margin = "5px 0px";
                                divTotal.innerHTML = _cssLoad;
                                divCenterTotal.appendChild(divTotal);
                                divColumn_01.appendChild(divCenterTotal);
                                
                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "150px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);

                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                              
                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Inventario de incendios forestales", "Población expuesta");
                            }
                            /* </IIFO> */

                            /* <ZAPENC> */
                            if(typeof lyr.content[0].version_15 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_15[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let cantCOUNT_ZAPENC = new StatisticDefinition();
                                cantCOUNT_ZAPENC.statisticType = "count";
                                cantCOUNT_ZAPENC.onStatisticField = _version.static;
                                cantCOUNT_ZAPENC.outStatisticFieldName = "cantidad";
                                                            
                                let queryTask_ZAPENC = new QueryTask(lyr.url);
                                let query_ZAPENC = new Query();
                                query_ZAPENC.geometry = new Polygon(_geometryAmbito);
                                query_ZAPENC.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_ZAPENC.outStatistics = [ cantCOUNT_ZAPENC ];
                                query_ZAPENC.orderByFields = [`COUNT(${_version.static}) DESC`];
                                query_ZAPENC.groupByFieldsForStatistics = [_version.static];
                                query_ZAPENC.returnGeometry = false;
                                queryTask_ZAPENC.execute(query_ZAPENC).then(
                                    (response) => {
                                        try {
                                            let _contentTab = []; let _contentTotal = 0;
                                            let _chartData = []; let _chartLabel = [];
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _features = response.features;
                                            if(_features.length > 0) {                                                
                                                _note.className = "sect-nota-info";
                                                _features.forEach(function(_item,_index) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static]} <span style="font-size: 15px;color:${configBackgroundColor[_index]}">■</span>`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + (_item.attributes["cantidad"] ?? 0);
                                                    _chartData.push(_item.attributes["cantidad"] ?? 0);
                                                    _chartLabel.push(_item.attributes[_version.static]);
                                                });
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _contentTotal)}`;
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();                 
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic ZAPENC => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic ZAPENC => ${error.name}`);
                                    }
                                );

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);
                                
                                const divCenter = document.createElement("center");
                                const divTitle = document.createElement("p");
                                divTitle.style.fontSize = "14px";
                                divTitle.innerHTML = _version.title;
                                divCenter.appendChild(divTitle);
                                divColumn_01.appendChild(divCenter);

                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","190");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);

                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "150px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente);
                              
                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Tipos", "Cantidad");
                            }
                            /* </ZAPENC> */

                            /* <PAF> */
                            if(typeof lyr.content[0].version_16 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_16[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let cantCOUNT_TCA = new StatisticDefinition();
                                cantCOUNT_TCA.statisticType = "count";
                                cantCOUNT_TCA.onStatisticField = _version.static;
                                cantCOUNT_TCA.outStatisticFieldName = "cantidad";
                                                            
                                let queryTask_PAF = new QueryTask(lyr.url);
                                let query_PAF = new Query();
                                query_PAF.geometry = new Polygon(_geometryAmbito);
                                query_PAF.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_PAF.outStatistics = [ cantCOUNT_TCA ];
                                query_PAF.orderByFields = [`COUNT(${_version.static}) DESC`];
                                query_PAF.groupByFieldsForStatistics = [_version.static];
                                query_PAF.returnGeometry = false;
                                queryTask_PAF.execute(query_PAF).then(
                                    (response) => {
                                        try {
                                            let _contentTab = []; let _contentTotal = 0;
                                            let _chartData = []; let _chartLabel = [];
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _features = response.features;
                                            if(_features.length > 0) {
                                                _note.className = "sect-nota-info";
                                                _features.forEach(function(_item,_index) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static]} <span style="font-size: 15px;color:${configBackgroundColor[_index]}">■</span>`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + (_item.attributes["cantidad"] ?? 0);
                                                    _chartData.push(_item.attributes["cantidad"] ?? 0);
                                                    _chartLabel.push(_item.attributes[_version.static]);
                                                });
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _contentTotal)}`;
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic PAF => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic PAF => ${error.name}`);
                                    }
                                );

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);
                                
                                const divCenter = document.createElement("center");
                                const divTitle = document.createElement("p");
                                divTitle.style.fontSize = "14px";
                                divTitle.innerHTML = _version.title;
                                divCenter.appendChild(divTitle);
                                divColumn_01.appendChild(divCenter);

                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","190");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);

                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "150px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divColumn_01.appendChild(divFuente); 
                              
                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Tipos", "Cantidad");
                            }
                            /* </PAF> */

                            /* <TCA> */
                            if(typeof lyr.content[0].version_17 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_17[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let cantCOUNT_TCA = new StatisticDefinition();
                                cantCOUNT_TCA.statisticType = "count";
                                cantCOUNT_TCA.onStatisticField = _version.static;
                                cantCOUNT_TCA.outStatisticFieldName = "cantidad";
                                                            
                                let queryTask_TCA = new QueryTask(lyr.url);
                                let query_TCA = new Query();
                                query_TCA.geometry = new Polygon(_geometryAmbito);
                                query_TCA.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_TCA.outStatistics = [ cantCOUNT_TCA ];
                                query_TCA.orderByFields = [`COUNT(${_version.static}) DESC`];
                                query_TCA.groupByFieldsForStatistics = [_version.static];
                                query_TCA.returnGeometry = false;
                                queryTask_TCA.execute(query_TCA).then(
                                    (response) => {
                                        try {
                                            let _contentTab = []; let _contentTotal = 0;
                                            let _chartData = []; let _chartLabel = [];
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _features = response.features;
                                            if(_features.length > 0) {
                                                _note.className = "sect-nota-info";                                                
                                                _features.forEach(function(_item,_index) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static]} <span style="font-size: 15px;color:${configBackgroundColor[_index]}">■</span>`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + (_item.attributes["cantidad"] ?? 0);
                                                    _chartData.push(_item.attributes["cantidad"] ?? 0);
                                                    _chartLabel.push(_item.attributes[_version.static]);
                                                });
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _contentTotal)}`;
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic TCA => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic TCA => ${error.name}`);
                                    }
                                );

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);

                                const divCenter = document.createElement("center");
                                const divTitle = document.createElement("p");
                                divTitle.style.fontSize = "14px";
                                divTitle.innerHTML = _version.title;
                                divCenter.appendChild(divTitle);
                                divColumn_01.appendChild(divCenter);
                                
                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","180");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);
                                
                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "150px";
                                divTable.style.marginTop = "5px";
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);

                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divFuente.style.bottom = "20px";
                                divColumn_01.appendChild(divFuente);

                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02); 

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Tipos", "Cantidad de Tramos");
                            }
                            /* </TCA> */

                            /* <OIA> */
                            if(typeof lyr.content[0].version_18 !== "undefined") {
                                _elementById(`IDTable_${lyr.tag}`).innerHTML = ""; 
                                let _version = lyr.content[0].version_18[0];
                                const divColumn_01 = document.createElement("section");
                                divColumn_01.className = "column_01";
                                const divColumn_02 = document.createElement("section");
                                divColumn_02.className = "column_02";                                
                                const divMain = document.createElement("main");

                                let cantCOUNT_OIA = new StatisticDefinition();
                                cantCOUNT_OIA.statisticType = "count";
                                cantCOUNT_OIA.onStatisticField = _version.static;
                                cantCOUNT_OIA.outStatisticFieldName = "cantidad";
                                
                                let queryTask_OIA = new QueryTask(lyr.url);
                                let query_OIA = new Query();
                                query_OIA.geometry = new Polygon(_geometryAmbito);
                                query_OIA.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                                query_OIA.outStatistics = [ cantCOUNT_OIA ];
                                query_OIA.orderByFields = [`COUNT(${_version.static}) DESC`];
                                query_OIA.groupByFieldsForStatistics = [_version.static];
                                query_OIA.returnGeometry = false;
                                queryTask_OIA.execute(query_OIA).then(
                                    (response) => {
                                        try {
                                            let _contentTab = []; let _contentTotal = 0;
                                            let _chartData = []; let _chartLabel = [];
                                            let _note = _elementById(`IDNote_${lyr.tag}`);
                                            let _features = response.features;
                                            if(_features.length > 0) {
                                                _note.className = "sect-nota-info";
                                                _features.forEach(function(_item,_index) {
                                                    _contentTab.push({
                                                        "item": `${_item.attributes[_version.static]} <span style="font-size: 15px;color:${configBackgroundColor[_index]}">■</span>`,
                                                        "val": _item.attributes["cantidad"]
                                                    });
                                                    _elementById(`TB_content${lyr.tag}_Total`).innerText = _contentTotal = _contentTotal + (_item.attributes["cantidad"] ?? 0);
                                                    _chartData.push(_item.attributes["cantidad"]) ?? 0;
                                                    _chartLabel.push(_item.attributes[_version.static]);
                                                });
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].afirmacion.replace("XX", _contentTotal)}`;
                                                _elementById(`TB_content${lyr.tag}_Tbody`).innerHTML = "";
                                                _htmlTableTAB_ADD(`TB_content${lyr.tag}`,_contentTab);
                                                let chart = Chart.getChart(`TB_GraphicContent_${lyr.tag}`);
                                                chart.data.datasets[0].data = _chartData;
                                                chart.data.labels = _chartLabel;
                                                chart.update();
                                                
                                            } else {
                                                _note.className = "sect-nota-warning";
                                                _note.innerHTML = `<strong>${litAmbito}</strong> ${_version.cuenta[0].negacion}`;
                                            }
                                        } catch (error) {
                                            console.error(`Count: Statistic OIA => ${error.name}`);
                                        }                    
                                    },
                                    (error) => {
                                        console.error(`Error: Statistic OIA => ${error.name}`);
                                    }
                                );

                                const divOBS = document.createElement("p");
                                divOBS.id = `IDNote_${lyr.tag}`;
                                divOBS.innerHTML = _cssLoad;
                                divColumn_01.prepend(divOBS);

                                const divCenter = document.createElement("center");
                                const divTitle = document.createElement("p");
                                divTitle.style.fontSize = "14px";
                                divTitle.innerHTML = _version.title;
                                divCenter.appendChild(divTitle);
                                divColumn_01.appendChild(divCenter);
                                
                                const divCenterGraphic = document.createElement("center");
                                const divCanvasGraphic = document.createElement("canvas");
                                divCanvasGraphic.setAttribute("id",`TB_GraphicContent_${lyr.tag}`);
                                divCanvasGraphic.setAttribute("height","180");
                                divCanvasGraphic.setAttribute("width","370");
                                _graphicPie(divCanvasGraphic);
                                divCenterGraphic.appendChild(divCanvasGraphic);
                                divColumn_01.appendChild(divCenterGraphic);
                                
                                /* TABLA */
                                const divTable = document.createElement("div");
                                divTable.id = `TB_content${lyr.tag}`;
                                divTable.className = "form-scroll-tab";
                                divTable.style.maxHeight = "150px";  
                                divTable.style.marginTop = "5px";                              
                                divColumn_01.appendChild(divTable); 

                                /* NOTA */
                                const divNota = document.createElement("p");
                                divNota.className = "sect-nota";
                                divNota.innerHTML = _version.nota;
                                divColumn_02.appendChild(divNota);
                                
                                /* FUENTE */
                                const divFuente = document.createElement("p");
                                divFuente.className = "sect-fuente";
                                divFuente.innerHTML = _version.fuente;
                                divFuente.style.bottom = "20px";
                                divColumn_01.appendChild(divFuente);

                                divColumn_01.appendChild(divMain);

                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_01); 
                                _elementById(`IDTable_${lyr.tag}`).appendChild(divColumn_02);

                                _htmlTableTAB(_elementById(`TB_content${lyr.tag}`), "Tipos", "Cantidad de Obras");
                            }
                            /* </OIA> */
                        }
                        //_elementById(`IDTable_${lyr.tag}`).appendChild();
                    }.bind(this);
                    divHeader.innerHTML = lyr.name.replace(_nameTemp + " /", "");
                    divHeader.dataset.url = lyr.url;
                    divHeader.dataset.objectid = lyr.objectid;
                    divHeader.dataset.fields = JSON.stringify(lyr.fields);
                    /*divHeader.className = !lyr.default || "active";*/
                }
                
                let fragmentHeader = document.createDocumentFragment();
                fragmentHeader.appendChild(divHeader);                
                _elementById("ID_TAB_Header").appendChild(fragmentHeader);

                const divContent = document.createElement("div");
                divContent.className="tabcontent";
                divContent.id = `Content_${lyr.tag}`;
                /*divContent.className = !lyr.default || "active"; */
                const divTitle = document.createElement("section");
                divTitle.style.padding = "5px 5px 0 5px";
                divTitle.innerHTML = lyr.name;
                const divHR = document.createElement("section");
                divHR.className = "div-hr";
                const divAside = document.createElement("section");
                divAside.className = "report-table";
                divAside.id = `IDTable_${lyr.tag}`;
                divAside.style.backgroundColor = "#FFFFFF";
               
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

    _loadSelect(config.download, this.ID_Diagnosis_Format, this._listLayer, _geometryAmbito);
    /*_elementById("ID_TAB_Header").childNodes[4].className += "active";
	_elementById("ID_TAB_Content").childNodes[4].className = "active"; */
    /* _elementById("ID_TAB_Header").childNodes[4].classList.add("active");
	_elementById("ID_TAB_Content").childNodes[4].style.display = "block";
    _elementById("ID_TAB_Content").childNodes[4].classList.add("active"); */   
    /* let _class = function(name) { return document.getElementsByClassName(name); };
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
	} */
});