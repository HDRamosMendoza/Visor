define([
    'dojo/_base/declare',
    'dojo/on',
    'dojo/_base/lang',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/FilteringSelect',
    'dijit/form/TextBox',
    'dijit/form/Button',
    'dojo/text!./DiagnosticoTerritorial/templates/DiagnosticoTerritorial.html',
    'dojo/json',
    'dojo/dom',
    "dojo/_base/array",
    'dojo/text!./DiagnosticoTerritorial/config.json',
    'dojo/aspect',
    'dojo/dom-construct',
    'esri/config',
    'esri/graphic',
    'esri/geometry/Polygon',
    'esri/geometry/geometryEngine',
    'esri/geometry/normalizeUtils',
    'esri/geometry/projection',
    'esri/geometry/webMercatorUtils',
    'esri/tasks/GeometryService',    
    'esri/tasks/BufferParameters',
    'esri/SpatialReference',
    'esri/toolbars/draw',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/StatisticDefinition',
    'esri/tasks/Geoprocessor',
    'esri/tasks/FeatureSet',
    'esri/layers/FeatureLayer',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/TextSymbol',
    'esri/geometry/Point',
    'esri/renderers/SimpleRenderer',
    'esri/layers/LabelClass',
    'dojo/_base/Color',
    'dojox/layout/TableContainer',
    'dojo/store/Memory',
    'dojo/topic',
    'xstyle/css!./DiagnosticoTerritorial/css/DiagnosticoTerritorial.css'
], function (
    declare,
    on,
    lang,
    _WidgetBase, 
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    FilteringSelect,
    TextBox,
    Button,
    drawTemplate,
    JSON,
    dom,
    array,
    configJSON,    
    aspect,
    domConstruct,
    esriConfig,
    Graphic,
    Polygon,
    geometryEngine,
    normalizeUtils,
    projection,
    webMercatorUtils,
    GeometryService,
    BufferParameters,
    SpatialReference,
    Draw,
    SimpleMarkerSymbol,
    Query,
    QueryTask,
    StatisticDefinition,
    Geoprocessor,
    FeatureSet,
    FeatureLayer,
    SimpleLineSymbol,
    SimpleFillSymbol,
    TextSymbol,
    Point,
    SimpleRenderer,
    LabelClass,
    Color,
    TableContainer,
    Memory,    
    topic    
) {
    return declare([
        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin
    ], {
        widgetsInTemplate: true,
        templateString: drawTemplate,
        baseClass: 'hdrm_dt',
        lyrTotal: 0,
        confDiagnosis: [],
        confDiagnosis_Temp: [],
        confAnalysis: [],
        confAnalysis_Temp: [],
        reportItemCount: 1,
        reportItemTotal: 0,
        reportItemRandom: null,
        reportItemResult: 0,
        reportGeometry: null,
        reportGeometryIntersect: null,
        diagnosisCount: 1,
        diagnosisTotal: 0,
        diagnosisRandom: null,
        diagnosisResult: 0,
        diagnosisTemp: [],
        analysisCount: 1,
        analysisTotal: 0,
        analysisRandom: null,
        analysisResult: 0,
        analysisTemp: [],
        bufferCount: 1,
        bufferTotal: 0,
        bufferRandom: null,
        bufferResult: 0,
        bufferTemp: [],
        bufferSelect_id: "",
        bufferSelect_name: "",
        bufferSelect_long: "",
        bufferSelect_color: "",
        bufferSelect_url: "",
        bufferSelect_geometry: null,
        countAnalysis_Cantidad: 0,
        countAnalysis_Km: [],
        countAmbito: 0,
        textAmbito: "",
        geometryIntersect: "",
        geometrySRV: null,
        IDTableCount_Name: "",
        IDTableBuffer_Name: "",
        lyrDefinition: [],
        gpExtractData: null,
        groupLayer: null,
        groupLayer_count: 1,
        groupActived: [],
        selectItem: null,
        _listLayer: [],
        
     
        postCreate: function () {
            this.inherited(arguments);
            this._pathDownload = "https://sigrid.cenepred.gob.pe/arcgis/rest/directories/";
            //this.geometrySRV = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
            /* Servicio de Geometria */
            esriConfig.defaults.geometryService = new GeometryService("https://sigrid.cenepred.gob.pe/arcgis/rest/services/Utilities/Geometry/GeometryServer");
            esriConfig.defaults.io.timeout = 240000;
            /* Servicio de Geoproceso */
            this.gpExtractData = new Geoprocessor("https://sigrid.cenepred.gob.pe/arcgis/rest/services/Geoprocesamiento/ExtraerDatos/GPServer/ExtraerDatos");
            const config = JSON.parse(configJSON);     
            this.ID_Nota.innerHTML = config.nota;
            this._htmlTable(this.ID_Table_Count);
            this._htmlTableAnalysis(this.ID_Table_Buffer);
            this._htmlTable(this.ID_Table_Analysis);

            this.IDTableCount_Name  = this.ID_Table_Count.getAttribute("data-dojo-attach-point");
            this.IDTableBuffer_Name = this.ID_Table_Buffer.getAttribute("data-dojo-attach-point");
            this.IDTableAnalysis_Name = this.ID_Table_Analysis.getAttribute("data-dojo-attach-point");
            /* Setup DEPARTAMENTO */
            const lyrDep = config.lyrFilter[0];
            const srvDep = lyrDep.srv[0];
            /* Setup PROVINCIA */
            const lyrPro = config.lyrFilter[1];
            const srvPro = lyrPro.srv[0];
            /* Setup DISTRITO */
            const lyrDis = config.lyrFilter[2];
            const srvDis = lyrDis.srv[0];
            
            /* Asigna en un solo nivel a confAnalysis_Temp */
            //this._loadJson(this.confAnalysis, this.confAnalysis_Temp);

            /* Asigna en un solo nivel a confAnalysis_Temp */
            this._loadJson(config.lyrDiagnosis,  this.diagnosisTemp, "diagnosisTotal");
            this._loadJson(config.lyrDiagnosis,  this.analysisTemp,  "analysisTotal");
            this._loadJson(config.lyrBuffer,     this.bufferTemp,    "bufferTotal");
            /* DownLoad Data */ 
            this._loadSelect(config.download, this.ID_Diagnosis_Format);
            //this._loadSelect(config.download, this.ID_Analysis_Format);
            //this._loadSelect(this.bufferTemp, this.ID_Analysis_Buffer);
            /* Asigna en un solo nivel a confReport_Temp */
            //this._reportJson(this.confReport, this.confReport_Temp);            
            /* Create group */
            this.groupLayer = this._activedLayer(this);            
            /* Load DEPARTAMENTO */
            let fillDep = this._fillLineColor("solid", "solid", "#04EDFE", 2.5, [255,97,97,0]);
            let featureLayerDep = this._loadLayer(lyrDep.srv[0].objectID, srvDep.url, fillDep, lyrDep.srv[0].depName);
            /* Load PROVINCIA */
            let fillPro = this._fillLineColor("solid", "solid", "#04EDFE", 2.5, [127,53,104,0]);
            let featureLayerPro = this._loadLayer(lyrPro.srv[0].objectID, srvPro.url, fillPro, lyrPro.srv[0].proName);
            /* Load DISTRITO */
            let fillDis = this._fillLineColor("solid", "solid", "#04EDFE", 2.5, [255,255,255,0]);
            let featureLayerDis = this._loadLayer(lyrDis.srv[0].objectID, srvDis.url, fillDis, lyrDis.srv[0].disName);
                     
            /* Filter DEPARTAMENTO */            
            let selDep = this._ambito(lyrDep.htmlID, lyrDep.htmlPH, lyrDep.htmlPH, lyrDep.htmlLBL, srvDep.order, srvDep.objectID, srvDep.item, srvDep.url, '1=1');
            selDep.on("change", function(evt) {
                try {
                    if(evt == '00') {
                        /* Option TODOS - DEPARTAMENTO */
                        this.ID_Clear.click();
                        return false;
                    }         
                    selPro.reset(); 
                    selDis.reset();                            
                    let itemDep = selDep.get('displayedValue');
                    let queryWhere = `UPPER(${srvPro.depName}) = UPPER('${itemDep}')`;
                    selPro.store = this._ambitoUpdate(lyrDep.htmlPH, srvPro.order, srvPro.objectID, srvPro.item, srvPro.url, queryWhere);
                    selPro.attr("placeholder", lyrPro.htmlPH);
                    selDis.attr("placeholder", lyrPro.htmlPH_Alias);
                    this._zoomLayer(featureLayerDep, evt);
                } catch (error) {
                    console.error(`Error: selDep change => ${error.name} - ${error.message}`);
                }
            }.bind(this));

            /* Filter PROVINCIA */            
            let selPro = this._ambito(lyrPro.htmlID, lyrPro.htmlPH, lyrDep.htmlPH, lyrPro.htmlLBL, srvPro.order, srvPro.objectID, srvPro.item, srvPro.url, '1=2');
            selPro.on("change", function(evt) {
                try {
                    featureLayerDis.clearSelection();                    
                    if(evt == '00') {
                        /* Option TODOS - PROVINCIA */
                        selDis.reset();
                        selDis.store = this._ambitoUpdate(lyrPro.htmlPH_Alias, srvDis.order, srvDis.objectID, srvDis.item, srvDis.url, "1=2");
                        featureLayerPro.clearSelection();
                        this._zoomLayer(featureLayerDep, selDep.get('value'));                        
                        selDis.attr("placeholder", lyrPro.htmlPH_Alias);
                        return false;
                    }
                    selDis.reset();
                    featureLayerDep.clearSelection();                
                    let nameDep = selDep.get('displayedValue');
                    let namePro = selPro.get('displayedValue');
                    let queryWhere = `UPPER(${srvDis.depName}) = UPPER('${nameDep}') AND UPPER(${srvDis.proName}) = UPPER('${namePro}')`;
                    selDis.store = this._ambitoUpdate(lyrPro.htmlPH, srvDis.order, srvDis.objectID, srvDis.item, srvDis.url, queryWhere);
                    selDis.attr("placeholder", lyrDis.htmlPH);
                    this._zoomLayer(featureLayerPro, evt);
                } catch (error) {
                    console.error(`Error: selPro change => ${error.name} - ${error.message}`);
                }
            }.bind(this));
            selPro.attr("placeholder", lyrDep.htmlPH_Alias);

            /* Filter DISTRITO */   
            let selDis = this._ambito(lyrDis.htmlID, lyrDis.htmlPH, lyrPro.htmlPH, lyrDis.htmlLBL, srvDis.order, srvDis.objectID, srvDis.item, srvDis.url, '1=2');            
            selDis.on("change", function(evt) {
                try {
                    /* Option TODOS - DISTRITO */
                    if(evt == '00') {
                        featureLayerDis.clearSelection();
                        this._zoomLayer(featureLayerPro, selPro.get('value'));
                        return false;
                    }
                    featureLayerDep.clearSelection();
                    featureLayerPro.clearSelection();
                    this._zoomLayer(featureLayerDis, evt);
                } catch (error) {
                    console.error(`Error: selDis change => ${error.name} - ${error.message}`);
                }
            }.bind(this));
            selDis.attr("placeholder", lyrPro.htmlPH_Alias);
            
            this.own(on(this.ID_Clear, 'click', lang.hitch(this, () => {
                /* Button (click) - ID_Filter_Clear */
                try {
                    selDis.reset(); selPro.reset(); selDep.reset(); 
                    setTimeout(() => {
                        try {
                            selPro.attr("placeholder", lyrDep.htmlPH_Alias);
                            selDis.attr("placeholder", lyrPro.htmlPH_Alias);
                        } catch (error) {
                            console.error(`Error: button/ID_Filter_Clear setTimeout => ${error.name} - ${error.message}`);
                        }
                    }, 300);
                    featureLayerDep.clearSelection();
                    featureLayerPro.clearSelection();
                    featureLayerDis.clearSelection();
                    this.ID_Percentage.innerHTML = "";
                    this.map.setZoom(6);
                    this.map.centerAt(new Point(-75.015152, -9.189967));
                    /* Limpiando pestaña RESULTADO */
                    /*this.ID_Count.innerHTML  = 0;*/
                    this.ID_CountText.innerHTML  = this.textAmbito = "";
                    this.ID_Table_Count.innerHTML = '';
                    this._htmlTable(this.ID_Table_Count);
                    /* Clean group layer */
                    this.groupLayer.forEach(element => {
                        if(config.lyrGroup.indexOf(element.group.name) !== -1) {
                            element.group.lyr().setDefaultLayerDefinitions();
                            element.group.lyr().setDefaultVisibleLayers();
                        }
                    });
                } catch (error) {
                    console.error(`Error: button/ID_Filter_Clear (click) => ${error.name} - ${error.message}`);
                }
            })));

            this.own(on(this.ID_Report, 'click', lang.hitch(this, () => {
                // Button (click) - ID_Report
                try {
                    let disp = this.ID_Alert;
                    let objectLiteral = false == this._validateSelect(selDis) ? [selDis.get('value'),srvDis.url] :
                                        false == this._validateSelect(selPro) ? [selPro.get('value'),srvPro.url] :
                                        false == this._validateSelect(selDep) ? [selDep.get('value'),srvDep.url] :
                                        true;
                    if(objectLiteral == true) {
                        disp.style.display = "block";
                        this._elementById("ID_Tab_Filter").click();
                        setTimeout(() => { disp.style.display = "none"; }, 3000);
                        return false;
                    }
                    let _textAmbito = "";
                    let _textAmbito_request = [];
                    // Texto de Ámbito
                    _textAmbito = _textAmbito.concat(`${selDep.get('displayedValue')} (departamento)`);
                    _textAmbito = this._validateSelect(selPro) ? _textAmbito.concat("") : _textAmbito.concat(`/${selPro.get('displayedValue')} (provincia)`);
                    _textAmbito = this._validateSelect(selDis) ? _textAmbito.concat("") : _textAmbito.concat(`/${selDis.get('displayedValue')} (distrito)`);
                    let textAmbito_Temp = _textAmbito.split("/");
                    textAmbito_Temp[textAmbito_Temp.length-1] = `${textAmbito_Temp[textAmbito_Temp.length-1]}`;
                    _textAmbito_request = textAmbito_Temp.reverse().join(", ");// Busqueda
                    textAmbito_Temp = textAmbito_Temp.join(" / ");                    
                    _textAmbito = `${textAmbito_Temp}`;
                    localStorage.clear();
                    localStorage.setItem("reportTitle_request", JSON.stringify(_textAmbito_request));
                    localStorage.setItem("reportTitle", JSON.stringify(_textAmbito));
                    localStorage.setItem("reportAmbito", JSON.stringify(objectLiteral));
                    localStorage.setItem("reportGeometry", JSON.stringify(this.reportGeometry));                    
                    // Open TAB - REPORT
                    window.open('../../Avance_03/', '_blank');
                } catch (error) {
                    console.error(`Error: button/ID_Report (click) => ${error.name} - ${error.message}`);
                }
            })));

            this.own(on(this.ID_Diagnosis, 'click', lang.hitch(this, () => {
                /* Button (click) - ID_Diagnosis */
                try {
                    let disp = this.ID_Alert;
                    this.textAmbito = "";
                    let objectLiteral = false == this._validateSelect(selDis) ? [selDis.get('value'),srvDis.url] :
                                        false == this._validateSelect(selPro) ? [selPro.get('value'),srvPro.url] :
                                        false == this._validateSelect(selDep) ? [selDep.get('value'),srvDep.url] :
                                        true;
                    if(objectLiteral == true) {
                        disp.style.display = "block";
                        setTimeout(() => { disp.style.display = "none"; }, 3000);
                        return false;
                    }
                    /* Texto de Ámbito */
                    this.textAmbito = this.textAmbito.concat(`${selDep.get('displayedValue')} (departamento)`);
                    this.textAmbito = this._validateSelect(selPro) ? this.textAmbito.concat("") : this.textAmbito.concat(`/${selPro.get('displayedValue')} (provincia)`);
                    this.textAmbito = this._validateSelect(selDis) ? this.textAmbito.concat("") : this.textAmbito.concat(`/${selDis.get('displayedValue')} (distrito)`);                    
                    let textAmbito_Temp = this.textAmbito.split("/");
                    textAmbito_Temp[textAmbito_Temp.length-1] = `<span style="padding: 10px 5px;color:#2a2929;font-weight:760;">${textAmbito_Temp[textAmbito_Temp.length-1]}</span>`;
                    textAmbito_Temp = textAmbito_Temp.join(" / ");
                    this.textAmbito = `<p style="line-height:20px;background-color:rgba(0,0,0,0.1);padding:5px;">${textAmbito_Temp}</p>`;                    
                    /* Reinicia contador */
                    this.diagnosisCount = 1;
                    this.diagnosisResult = 0;
                    /* Reinicia el grupo de capas */
                    this.confDiagnosis_Temp = [];
                    /* Muestra la pestaña RESULTADO (segunda pestaña) */
                    this._elementById("ID_Tab_Diagnosis").click();
                    this.ID_Table_Count.style.display = "none";
                    this.ID_Load.style.display = "block";
                    /* Eliminar contenido del resultado */
                    this._removeChild(this._elementById(`${this.IDTableCount_Name}_Tbody`), this.ID_Count/*, this.ID_CountResult*/);
                    /* Intersect layer */
                    this._diagnosisLayer(objectLiteral);
                } catch (error) {
                    console.error(`Error: button/ID_Diagnosis (click) => ${error.name} - ${error.message}`);
                }
            })));

            /* this.own(on(this.ID_Analisis, 'click', lang.hitch(this, () => {
                try {
                    this._elementById("ID_Tab_Analysis").click();
                    this._buffer();
                } catch (error) {
                    console.error(`Error: button/ID_Analisis (click) => ${error.name} - ${error.message}`);
                }
            }))); */
            
            /*this.own(on(this.ID_Diagnosis_Download, 'click', lang.hitch(this, () => {
                // Button (click) - ID_Diagnosis_Download. Descargar información de DIAGNOSTICO
                try {
                } catch (error) {
                    console.error(`Error: button/ID_Analisis (click) => ${error.name} - ${error.message}`);
                }
            })));*/

            /*this.own(on(this.ID_Analysis_Download, 'click', lang.hitch(this, () => {
                // Button (click) - ID_Analysis_Download. Descargar información de ANALISIS
                try {
                } catch (error) {
                    console.error(`Error: button/ID_Analisis (click) => ${error.name} - ${error.message}`);
                }
            })));*/

            this.own(on(this.ID_Button_BufferUpdate, 'click', lang.hitch(this, () => {
                /* Button (click) - ID_Buffer */
                try {                    
                    if(this.ID_Buffer.value < 1) { return };

                    if(this.deferredReport && (this.deferredReport > 0)) {
                        this.deferredReport.cancel();
                    }

                    /* Buffer Analysis */
                    if(this.reportGeometryIntersect !== null) {
                        this.map.graphics.remove(this.reportGeometryIntersect);
                    }
                    
                    this._buffer();
                    /*
                    this._elementById(`${this.IDTableReport_Name}_Tbody`).innerHTML = "";
                    let colorSimpleFillSymbol = this._getColorSimpleFillSymbol(lyr.color[0],lyr.color[1],lyr.color[2]);
                    
                    let geometryBuffer = geometryEngine.geodesicBuffer(this.reportGeometryUnion, [this.ID_Buffer.value], GeometryService.UNIT_KILOMETER, true);
                    
                    let graphicBuffer = new Graphic(geometryBuffer, colorSimpleFillSymbol);
                    this.reportGeometryIntersect = graphicBuffer;
                    this.map.graphics.add(graphicBuffer);
                    let _random = this._getRandom();
                    this.reportItemRandom = _random;
                    this._report(geometryBuffer, _random);
                    */
                } catch (error) {
                    console.error(`Error: button/ID_Buffer (click) => ${error.name} - ${error.message}`);
                }
            })));
        },
        startup: function() {},
        _activedLayer(_this) {
            try {
                return this.map.layerIds.map(function(item) { 
                    return {group:{ name:item , id:[], lyrDefinitions: [], lyr: function() {
                        return _this.map.getLayer(item);
                    }}} 
                });
            } catch (error) {
                console.error(`Error: _activedLayer => ${error.name} - ${error.message}`);
            }
        },
        _loadSelect(formatOption, formatId) {
            try {
                let htmlID = formatId.getAttribute("data-dojo-attach-point");
                let container = domConstruct.create("div", { id: `DIV_${htmlID}`, style: {width:'65%',color:"#555555"} }, formatId );
                let buttonDownload = new Button({
                    id: `Button_${htmlID}`,
                    label: "Descargar",
                    iconClass: 'fa fa-download',
                    style: { width:'115px', fontSize: '12px'},
                    onClick: function() {
                        let _alert = this.ID_Select_Alert;
                        if(this.selectItem ?? false) {
                            this.ID_Load_Download.style.display = "block";
                            if(this._listLayer.length < 0) {
                                _alert.innerHTML = "Seleccione un <strong>ÁMBITO</strong> en el <strong>FILTRO</strong>";
                                _alert.style.display = "block";
                                setTimeout(()=> {
                                    _alert.style.display = "none";
                                }, 2000);
                                return;
                            }
                            /* Validar el poligono */
                            try {
                                let geomtryPolygon  = this.reportGeometry.rings;
                                if (typeof(geomtryPolygon) == "undefined") {
                                    _alert.innerHTML = "Seleccione un <strong>ÁMBITO</strong> en el <strong>FILTRO</strong>";
                                    _alert.style.display = "block";
                                    setTimeout(()=> { _alert.style.display = "none"; }, 2000);
                                    return;
                                }
                            } catch (error) {
                                _alert.innerHTML = "Seleccione un <strong>ÁMBITO</strong> en el <strong>FILTRO</strong>";
                                _alert.style.display = "block";
                                setTimeout(()=> {
                                    _alert.style.display = "none";
                                }, 2000);
                                return;
                            }
                            /* Extraer data */

                            console.log(this.reportGeometry);
                            let geometryExtracData = webMercatorUtils.webMercatorToGeographic(this.reportGeometry);
                            this.gpExtractData.submitJob ({
                                    "Layers_to_Clip": this._listLayer.toString(),
                                    "Area_of_Interest": `{"type": "Polygon", "coordinates":${JSON.stringify(geometryExtracData.rings)},"spatialReference":{"wkid":4326}}`,
                                    "Feature_Format": this.selectItem
                                    /*"Layers_to_Clip": this._listLayer.toString(),
                                    "Area_of_Interest": `{ "type": "Polygon", "coordinates": [[[-79.8486328125,-7.1663003819031825],[-78.22265625,-8.993600464280018],[-75.52001953125,-6.271618064314864],[-79.16748046874999,-5.615985819155327],[-79.8486328125,-7.1663003819031825]]],"spatialReference" : { "wkid" : 4326 }}`,
                                    "Feature_Format": this.selectItem"PRUEBA"*/
                                }, _completeCallback = function(jobInfo) {
                                    try {
                                        if ( jobInfo.jobStatus !== "esriJobFailed" ) {
                                            this.gpExtractData.getResultData(jobInfo.jobId, "Result", function(outputFile) {
                                                try {
                                                    this.ID_Load_Download.style.display = "none";
                                                    let _URL = outputFile.value;
                                                    let _URL_Temp = _URL.substring(_URL.indexOf("arcgisjobs"), _URL.length);
                                                    window.location = this._pathDownload + _URL_Temp;
                                                } catch (error) {
                                                    console.error("Error: _downloadFile " + error.message);
                                                }
                                            }.bind(this));
                                        }
                                    } catch (error) {
                                      console.error("Error: _completeCallback " + error.message);
                                    }
                                }.bind(this),      
                                _statusCallback = function(jobInfo) {
                                    try {
                                        let status = jobInfo.jobStatus;
                                        if ( status === "esriJobFailed" ) {
                                            this.ID_Load_Download.style.display = "none";
                                        } else if (status === "esriJobSucceeded"){
                                            this.ID_Load_Download.style.display = "none";
                                        }
                                    } catch (error) {
                                        console.error("Error: _statusCallback " + error.message);
                                    }
                                }.bind(this),    
                                _errorCallback = function(jobInfo) {
                                    try {
                                        this.ID_Load_Download.style.display = "none";
                                    } catch (error) {
                                        console.error("Error: _errorCallback " + error.message);
                                    }
                                }.bind(this)
                            );                            
                        } else {
                            _alert.innerHTML = "Seleccione un <strong>FORMATO</strong>";
                            _alert.style.display = "block";
                            setTimeout(() => { _alert.style.display = "none"; }, 2000);
                            return;
                        }
                    }.bind(this)
                });
                /*<div class="form-count" style="position: relative; height:25px;">
                    <button type="button" data-dojo-attach-point="ID_Report" style="position:absolute; left:0; top:5px; height:25px;font-size: 14px !important;">
                        <i class="fa fa-file-text" aria-hidden="true"></i>&nbsp; Reporte
                    </button>
                </div>*/
                let tableContainer = new TableContainer({ cols: 3, labelWidth: "0%", customClass: "labelsAndValues" }, container);
                let options = []; let booleanButton = false;
                formatOption.map(function(item, index) {
                    /* let fragment = document.createDocumentFragment();
                    let row = document.createElement("option");
                    row.value = typeof item.value == "undefined"? item.url: item.value;
                    row.dataset.long = typeof item.long == "undefined"? "": item.long;
                    row.dataset.name = typeof item.name == "undefined"? "": item.name;
                    row.dataset.color = typeof item.color == "undefined"? "": JSON.stringify(item.color);
                    row.dataset.id = typeof item.id == "undefined"? "": item.id;
                    let optionText = document.createTextNode(item.name.replace(/<[^>]+>/g, ''));
                    row.appendChild(optionText);
                    fragment.appendChild(row);
                    formatId.appendChild(fragment); */
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
                    style: { width:'100%'}
                });
            
                tableContainer.addChild(filteringSelect);
                if(!booleanButton) {
                    tableContainer.addChild(buttonDownload);
                    filteringSelect.on("change", (evt) => { this.selectItem = evt; });
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
        },        
        _ambito: function(htmlID, htmlPH, htmlPHAlter, htmlLBL, order, oID, item, svr, queryWhere) {
            try { /* Carga de los SELECTOR del ámbito */
                let options = [];
                let container = domConstruct.create("div", {
                        id: `DIV_${htmlID}`,
                        style: { width:'100%' }
                    }, this.ID_HDRM
                );

                let tableContainer = new TableContainer({
                    cols: 2,
                    labelWidth: "35%",
                    customClass: "labelsAndValues", /*class: "form-labels"*/
                }, container);

                const queryTask = new QueryTask(svr);
                const querySQL = new Query();
                querySQL.where = queryWhere;
                querySQL.orderByFields = [`${order} ASC`];
                querySQL.outFields = [oID, item];
                querySQL.returnGeometry = false;

                queryTask.execute(querySQL, function(results) {
                    try {
                        results.features.length > 0 ? options.unshift({ name:`- TODOS -`,id:'00' }) : options.push({ name:`- ${htmlPHAlter} -`,id:'000' });
                        results.features.map(function (cValue) {
                            const name = cValue.attributes[item];
                            const id = cValue.attributes[oID];
                            options.push({ name:`${name}`, id:id });
                        });
                    } catch (error) {
                        console.error(`Error: _ambito/queryTask execute => ${error.name} - ${error.message}`);
                    }
                });
                
                const stateStore = new Memory({data: options });
                const filteringSelect = new FilteringSelect({
                    id: `Node_${htmlID}`,
                    label: htmlLBL,
                    name: 'state',
                    value: "00",
                    required: false,
                    placeholder: htmlPH,
                    store: stateStore,
                    autoComplete: false,
                    searchAttr: "name",
                    style: { width:'100%', fontSize:'13px' }
                });
        
                tableContainer.addChild(filteringSelect);
                tableContainer.startup();
                return filteringSelect;
            } catch (error) {
                console.error(`Error: _ambito => ${error.name} - ${error.message}`);
            }
        },
        _ambitoUpdate: function(htmlPHAlter, order, oID, item, svr, queryWhere) {
            try { /* Actualización del SELECTOR dependiente y no dependiente */
                let options = [];
                const queryTask = new QueryTask(svr);
                const querySQL = new Query();
                querySQL.where = queryWhere;
                querySQL.orderByFields = [`${order} ASC`];
                querySQL.outFields = [oID, item];
                querySQL.returnGeometry = false;                
                queryTask.execute(querySQL, function(results) {
                    try {
                        results.features.length > 0 ? options.unshift({ name:`- TODOS -`,id:'00' }) : options.push({ name:`- ${htmlPHAlter} -`,id:'000' });
                        
                        results.features.map(function (cValue) {
                            const name = cValue.attributes[item];
                            const id = cValue.attributes[oID];
                            options.push({ name: `${name}`, id: id });
                        });
                    } catch (error) {
                        console.error(`Error: _ambitoUpdate/queryTask execute => ${error.name} - ${error.message}`);
                    }
                }.bind(this));                
                return new Memory({ data:options });
            } catch (error) {
                console.error(`Error: _ambitoUpdate => ${error.name} - ${error.message}`);
            }
        },
        _loadLayer: function(objectID, srv, renderColor, lbl) {
            try { /* Carga de capa al mapa principal */
                let layer = new FeatureLayer(srv, {
                    mode: FeatureLayer.MODE_SELECTION,
                    outFields: [objectID]
                });
                let lblStates = new TextSymbol();
                lblStates.font.setSize("13pt");
                lblStates.font.setWeight("bold");
                lblStates.font.setFamily("arial");
                lblStates.setColor(new Color("#000000"));
                lblStates.setHaloColor(new Color("#FFFFFF"));
                lblStates.setHaloSize(2);
                let lblClass = new LabelClass({"labelExpressionInfo":{ "value": `{${lbl}}` }});
                lblClass.symbol = lblStates;
                layer.setRenderer(renderColor); 
                layer.setScaleRange(0,0);
                layer.setLabelingInfo([lblClass]);
                this.map.addLayer(layer);
                return layer;
            } catch (error) {
                console.error(`Error: _loadLayer => ${error.name} - ${error.message}`);
            }
        },
        _fillLineColor: function(fill1,line1,line2,line3,color) {
            try { /* Retorno del color de borde del polígono */
                return (
                        new SimpleRenderer(
                            new SimpleFillSymbol(
                                fill1, 
                                new SimpleLineSymbol(line1,this._lineColor(line2),line3),
                                this._lineColor(color)
                            )
                        )
                    );
            } catch (error) {
                console.error(`Error: _fillLineColor => ${error.name} - ${error.message}`);
            }
        },
        _lineColor: function(color) {
            try { /* Retorno del borde de color */
                if(color == null) {
                    return color;
                } else {
                    return (color = new Color(color));
                }
            } catch (error) {
                console.error(`Error: _lineColor => ${error.name} - ${error.message}`);
            }
        },
        _zoomLayer: function(lyr, id) {
            try { /* Acercamiento a la capas seleccionadas del SELECTOR */
                id = id || 0; 
                let query = new Query();
                query.objectIds = [id];
                lyr.clearSelection();
                lyr.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    try {
                        features.map(function(cValue) {
                            this.reportGeometry = cValue.geometry;
                            this.map.setExtent(cValue.geometry.getExtent().expand(1.4));
                        }.bind(this));
                    } catch (error) {
                        console.error(`Error: _zoomLayer/selectFeatures ${error.name} - ${error.message}`);
                    }
                }.bind(this));
            } catch (error) {
                console.error(`Error: _zoomLayer => ${error.name} - ${error.message}`);
            }
        },
        _validateSelect: function(objSelect) {
            try { /* Validar la selección del ámbito */
                const VALUE_SELECT = { '00': true, '000': true, '': true };
                VALUE_SELECT_DEFAULT = false;
                return VALUE_SELECT[objSelect.get('value')] || VALUE_SELECT_DEFAULT;
            } catch (error) {
                console.error(`Error: _validateSelect => ${error.name} - ${error.message}`);
            }
        },
        _diagnosisLayer: function(GPL) {
            try { /* Intersección de las capas operativas */
                this.groupLayer_count = 1;
                this.map.graphics.remove(this.bufferSelect_geometry);
                this._htmlTable(this.ID_Table_Analysis);                
                let [id, srv] = GPL;
                let query = new Query();
                query.objectIds = [id];
                const lyr = new FeatureLayer(srv, { mode: FeatureLayer.MODE_SELECTION });
                let itemRandom = this._getRandom();
                this.diagnosisRandom = itemRandom;
                
                if(this.deferredDiagnosis && (this.deferredDiagnosis > 0)) { this.deferredDiagnosis.cancel(); }

                if(this.deferredDiagnosisMap && (this.deferredDiagnosisMap > 0)) { this.deferredDiagnosisMap.cancel(); }
                
                this.ID_Percentage.innerHTML = "";

                lyr.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    try {
                        this._listLayer = [];
                        features.map(function(cValue) {
                            this.geometryIntersect = new Polygon(cValue.geometry.rings,new SpatialReference({wkid:102100}));
                            let graphic = new Graphic(
                                cValue.geometry.rings,
                                new SimpleFillSymbol(
                                    SimpleFillSymbol.STYLE_SOLID,
                                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([55,55,55,0.9]),4),new Color([55,55,55,0.5])
                                )
                            );
                            this.map.graphics.add(graphic)
                            this.diagnosisTemp.map(function(lyr) {
                                this._intersectDiagnosis(
                                    this.IDTableCount_Name,
                                    this.diagnosisTemp,
                                    lyr,
                                    this.diagnosisTotal,
                                    itemRandom
                                );
                            }.bind(this));
                        }.bind(this));
                    } catch (error) {
                        console.error(`Error: _diagnosisLayer/selectFeatures => ${error.name} - ${error.message}`);
                    }
                }.bind(this));                
            } catch (error) {
                console.error(`Error: _diagnosisLayer => ${error.name} - ${error.message}`);
            }
        },
        _intersectDiagnosis: function(_id, _temp, _lyr, _total, _random) {
            try {
                /*this.ID_Table_Count.style.display = "none";
                this.ID_Load.style.display = "block";*/                 
                let diagnosisCOUNT = new StatisticDefinition();
                diagnosisCOUNT.statisticType = "count";
                diagnosisCOUNT.onStatisticField = "shape";
                diagnosisCOUNT.outStatisticFieldName = "cantidad";

                let queryTask = new QueryTask(_lyr.url);
                let query = new Query();
                query.outFields = _lyr.fields.map(x => x.field);
                query.geometry = new Polygon(this.geometryIntersect);
                query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                query.outStatistics = [ diagnosisCOUNT ];
                this.deferredDiagnosis = queryTask.execute(query);
                this.deferredDiagnosis.then(
                    (response) => {
                        try {
                            if (this.diagnosisRandom == _random) {
                                this.groupActived = [];
                                //console.log(response);
                                let _attr = response.features[0].attributes;
                                this.diagnosisResult = this.diagnosisResult + _attr.cantidad;
                                /*this.ID_Count.innerText = this.diagnosisResult = this.diagnosisResult + _attr.cantidad;*/
                                this.ID_CountText.innerHTML = this.textAmbito;
                                this._elementById(`${_id}_Total`).innerText = this.diagnosisResult;
                                this.ID_Percentage.innerHTML = this._loadTime(this.diagnosisCount, _total);
                                this.diagnosisCount++;
                                _lyr.cantidad = _attr.cantidad;
                                if(_attr.cantidad > 0) {
                                    this._listLayer.push(_lyr.table);
                                }
                                /* Delete Tbody */
                                this._elementById(`${_id}_Tbody`).innerHTML = "";
                                /* Ordena por cantidad en el JSON this.confDiagnosis_Temp */
                                //console.log(_temp)
                                this._sortJSON(_temp, 'cantidad','desc');
                                //console.log(_temp)
                                /*  let cell_0 = document.createElement("td");let cell_0_input = document.createElement("input");cell_0_input.setAttribute("type", "checkbox");cell_0.appendChild(cell_0_input); */

                                /* Inserta a la tabla */
                                _temp.map(function(current) {
                                    if(current.cantidad > 0) {
                                        let fragment = document.createDocumentFragment();
                                        let row = document.createElement("tr");
                                        let cell_0 = document.createElement("td");                                        
                                        let cell_0_input = document.createElement("input");
                                        cell_0_input.style.display = "none";
                                        cell_0_input.setAttribute("type", "checkbox");
                                        cell_0_input.setAttribute("data-idName", current.id);
                                        cell_0_input.setAttribute("data-idLayer", current.position);
                                        cell_0.onclick = function(_this) {
                                            try{
                                                let _ds = _this.target.dataset;
                                                if((_ds.idlayer ?? false) && (_ds.idname ?? false)) {
                                                    if(_this.target.checked) {
                                                        this._validatedGroupLayer(this.groupActived,_ds.idname,_ds.idlayer,true);
                                                    } else {
                                                        this._validatedGroupLayer(this.groupActived,_ds.idname,_ds.idlayer,false);
                                                    }
                                                    this.groupLayer.forEach(element => {                                                        
                                                        if(element.group.name == _ds.idname) {
                                                            let _temp = [];
                                                            this._idLayer(this.groupActived,_ds.idname).forEach(_id => {
                                                                _temp[_id] = element.group.lyrDefinitions[_id];
                                                            });
                                                            element.group.lyr().setLayerDefinitions(_temp);
                                                            element.group.lyr().setVisibleLayers(this._idLayer(this.groupActived,_ds.idname));
                                                        }
                                                    });                                                  
                                                    /*
                                                    this.groupLayer.forEach(element => {                                                        
                                                        if(element.group.name == _ds.idname) {
                                                            console.log(element.group.name);
                                                            console.log(_ds.idlayer);
                                                            console.log(this.groupActived,_ds.idname);
                                                            console.log(element.group.lyr);
                                                            console.log(element.group.lyrDefinitions);
                                                            let _temp = [];
                                                            
                                                            //this._idLayer(this.groupActived,_ds.idname).forEach(_id => {_temp[_id] = element.group.lyrDefinitions[_id];});
                                                            
                                                            console.log(_temp);
                                                            //_temp[_ds.idlayer] = element.group.lyrDefinitions[_ds.idlayer];
                                                            _temp[5010200] = "objectid_12 IN (29127,33466,31894,31900,29040,30601,29038,29037,4232,4233,29039,29036,4235,29134,4237,4236,4234,4238,29044,9830,30574,29043,9831,33473,33474,33949,33950,33472,30572,30573,29035,29041,31893,30599,30600,31899,22184,33948,38886,38887,38888,38889,38890,38891,38892,38893,22183,32124,29137,25982,7472,7470,30570,25105,32322,7471,2002,7469,634,7473,29131,31481,29130,25110,29136,25108,5205,25106,31482,29135,25112,29138,7474,33476,33470,33471,25107,25109,25111,30571,30597,30598,9833,5211,29128,33475,25971,5178,969,1692,1673,1611,352,2218,696,41,2137,2293,2339,597,1674,1694,9832,546,1632,1555,8686,8683,8684,30297,13997,35934,17722,32236,17282,1524,665,29972,29129,32238,29971,32237,29133,29970,745,2509,5183,29979,32123,1876,33946,33947,32122,4219,5202,4228,4222,4223,4218,4221,4225,30568,30595,4227,4226,5201,33469,990,29132,4220,4217,30596,5204,4224,35931,35933,35932,33468,31013,30569,29976,32121,1652,173,5182,15610,15607,15604,15608,247,15603,2071,32120,15609,15606,57,103,646,5180,2399,611,1672,1963,29978,29974,9693,29977,33945,33944,2580,1518,2577,1822,2578,909,2576,2575,5203,2579,2581,691,984,29975,473,2042,323,747,927,514,804,2542,987,1565,261,466,1649,1638,5181,2107,1587,5184,29973,35980)";
                                                            _temp[5010300] = "objectid IN (681,5619,22578,7046,7043,7045,674,675,7042,5618,7048,24581,7047,7044)";
                                                            //_temp[5010400] = "objectid IN (3254)";
                                                            //_temp[5020200] = "objectid IN (59802,61107,61113,61106,61118,61114,61119,61123,61105,61120,61122,61115,61121,61110,61116,61117,61109,61111,61112,61108,46993,46992,46990,50420,52620,50412,57669,1061,57675,57670,52619,1059,52595,51817,57681,63814,63822,63830,63838,52593,63836,63824,63835,52592,63841,63829,63820,63816,63812,63811,63831,63815,63840,63834,52594,63823,63833,63818,61569,63810,63826,63839,63837,63813,63827,63821,63817,63832,63825,63828,63819,1058,52612,52615,52617,60221,60220,52618,53062,52628,52616,55604,73272,60209,1060,60210,60211,60213,60212,73274,73271,73273,53059,53058,74077,55603,57687,64664,64665,64666,50418,57678,50411,46991,52610,52611,53061,72815,72816,72817,72818,52597,52599,52629,59803,61568,62468,68735,68738,68739,68734,68737,68736,62526,62527,63344,63345,63346)";
                                                            //_temp[5020500] = "objectid_1 IN (172,173,174,102,144,145,170,171,175,176,177,178,204,205,206,207,208,209,210,211,239,240,241,242,243,244,245,246,272,297,298,300,301,302,303,304,305,332,333,335,336,337,338,339,340,341,368,372,437,460,461,463,5,35,36,37,38,39,40,41,42,43,69,70,71,72,73,74,75,76,77,103,104,105,106,107,108,109,110,111,137,138,139,140,141,142,143,299,369,370,371,373,374,375,376,400,401,402,403,404,405,406,407,408,431,432,433,434,435,436,458,459,462,464,488,681)";
                                                            //_temp[5080200] = "objectid IN (6828,12441,7037,7469,7546,7556,7720,7792,7827,7977,8063,8212,8216,8265,8275,8303,8316,8410,8415,6827,6826,8673,8675,7423)";
                                                            //_temp[5090100] = "objectid IN (5526,5528,5529,5532,5533,5539,5524,5525,5531,5537,5538,1773,1774,1775,1776,1809,1810,1812,1813,1817,1818,1819,1820,1821,1860,1861,1862,1863,1864,1865,1866,1877,1878,1879,1880,1881,1882,1883,1885,1887,1927,1935,1936,1937,1951,1960,1961,1962,1963,1964,1965,1966,1967,1968,1971,1975,1976,1977,1978,7551,1811,1814,1815,1816,1915,1921,1922,1923,1924,1925,1926,1928,1929,1930,1931,1932,1933,1934,1942,1943,1944,1945,1946,1947,1948,1949,1950,1954,1970,1822,1823,1867,1868,1869,1870,1871,1872,1873,1874,1875,1876,1896,1897,1898,1899,1900,1901,1902,1903,1904,1905,1906,1907,1908,1909,1910,1911,1912,1913,1914,1916,1917,1918,1919,1920,1938,1939,1940,1941,1952,1953,1955,1956,1957,1958,1959,1969,1972,1973,1974,1979,5527,5530,5534,5535,5536)";
                                                            //_temp[5090200] = "objectid IN (522)";

                                                            element.group.lyr().setLayerDefinitions(_temp);
                                                            console.log(this._idLayer(this.groupActived,_ds.idname));
                                                            element.group.lyr().setVisibleLayers([5090013,5010200,5010300]);
                                                            //element.group.lyr().setVisibleLayers([5010200,5010300,5010400,5020200,5020500,5080200,5090100,5090200]);
                                                            //element.group.lyr().setVisibleLayers([5010400,5090200]);
                                                            //element.group.lyr().setVisibleLayers(this._idLayer(this.groupActived,_ds.idname));
                                                            element.group.lyr().setVisibleLayers([_ds.idlayer]);
                                                            //element.group.lyr().setVisibleLayers(this._idLayer(this.groupActived,_ds.idname), true);
                                                            //element.group.lyr().refresh();   
                                                        }
                                                    });
                                                    */
                                                }
                                            } catch (error) {
                                                console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                                            }                                            
                                        }.bind(this);
                                        cell_0.appendChild(cell_0_input);
                                        let cell_1 = document.createElement("td");
                                        cell_1.innerHTML = current.name;
                                        let cell_2 = document.createElement("td");
                                        let cellText_2 = document.createTextNode(current.cantidad || 0);
                                        cell_2.appendChild(cellText_2);
                                        row.appendChild(cell_0);
                                        row.appendChild(cell_1);
                                        row.appendChild(cell_2);
                                        fragment.appendChild(row);
                                        this._elementById(`${_id}_Tbody`).appendChild(fragment);
                                    } 
                                }.bind(this)); 
                            }
                        } catch (error) {
                            console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: _queryTask ERROR - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, function() {
                    try {
                        if((this.diagnosisCount == _total) && (this.diagnosisRandom == _random)) {   
                            this.ID_Load.style.display = "none";
                            this.ID_Table_Count.style.display = "block";                            
                        }
                    } catch (error) {
                        console.error(`Error: _intersectLaye/queryTask always => ${error.name} - ${error.message}`);
                    } 
                }.bind(this)));

                let queryTask_ID = new QueryTask(_lyr.url);
                let query_ID = new Query();
                query_ID.outFields = _lyr.fields.map(x => x.field);
                query_ID.geometry = new Polygon(this.geometryIntersect);
                query_ID.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                this.deferredDiagnosisMap = queryTask_ID.executeForIds(query_ID);
                this.deferredDiagnosisMap.then(
                    (ids) => {
                        try {
                            this.groupLayer_count++;
                            if (ids ?? false) {
                                this.groupLayer.forEach(element => {
                                    if(element.group.name == _lyr.id) {
                                        element.group.id.push(_lyr.position);
                                        element.group.lyrDefinitions[_lyr.position] = `${_lyr.objectid} IN (${ids.toString()})`;
                                    }
                                });
                            }
                        } catch (error) {
                            console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: _queryTask ERROR - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, () => {
                    if ((this.diagnosisRandom == _random) && (this.groupLayer_count == this.diagnosisTotal)) {
                        this.groupLayer.forEach(element => {
                            //if(element.group.name == _lyr.id) {
                            if(element.group.lyrDefinitions.length > 0) {
                                //element.group.lyr().setLayerDefinitions(element.group.lyrDefinitions);
                                /*element.group.lyr().setVisibleLayers(element.group.id);
                                element.group.lyr().refresh();*/
                            }
                        });
                    }
                }));
            } catch (error) { 
                console.error(`Error: _intersectLaye => ${error.name} - ${error.message}`); 
            }
        },
        _validatedGroupLayer: function(_json, _name, _id, _row) {
            try {
                let _len = _json.length;
                let _pos = "";
                if(_row) {
                    for (let da = 0; da < _len; da++) {
                        let element = _json[da];
                        if(typeof element.group !== "undefined") {
                            if(element.group.name == _name) {
                                _json[da].group.id.push(parseInt(_id));
                                return true;
                            }
                        } else {
                            _json.push({group:{ name: _name, id:[parseInt(_id)]}});
                        }
                    }
                    _json.push({group:{ name: _name, id:[parseInt(_id)]}});
                    return false;
                } else {
                    for (let da = 0; da < _len; da++) {
                        let element = _json[da];
                        if(element.group.name == _name) {
                            let _ind = _json[da].group.id.indexOf(parseInt(_id));
                            if(_ind != -1) {
                                _json[da].group.id.splice(_ind,1);
                                return true;
                            }
                            _pos = da;
                        }
                    }
                    _json.splice(_pos,1);
                    return false;
                }
            } catch (error) { 
                console.error(`Error: _validatedGroupLayer => ${error.name} - ${error.message}`); 
            }
        },
        _idLayer: function(_json, _name) {
            try {
                let _len = _json.length;
                for (let da = 0; da < _len; da++) {
                    let element = _json[da];
                    if(element.group.name == _name) {
                        return _json[da].group.id;
                    }   
                }
            } catch (error) { 
                console.error(`Error: _validatedGroupLayer => ${error.name} - ${error.message}`); 
            }
        },
        _loadTime: function(_item, _total) {
            try { /* Tiempo de carga */
                return `Procesado al ${Math.round((_item*100)/_total)} %`;
            } catch (error) { 
                console.error(`Error: _loadTime => ${error.name} - ${error.message}`); 
            }
        },
        _buffer: function() {
            try {                
                this._elementById(`${this.IDTableBuffer_Name}_Tbody`).innerHTML = "";
                this.ID_Table_Buffer.style.display = "none";
                this.ID_Load_Buffer.style.display = "block";
              
                let _count = 0;
                let unionGeometry = [];
                const _id    = this.bufferSelect_id;
                const _name  = this.bufferSelect_name;
                const _long  = this.bufferSelect_long;
                const _field = this.bufferSelect_fields;
                const _color = this.bufferSelect_color;
                const _url   = this.bufferSelect_url;
                const _geometry = this.geometryIntersect;                
                const colorSimpleFillSymbol = this._getColorSimpleFillSymbol(_color[0],_color[1],_color[2]);
               
                    let fragment = document.createDocumentFragment();
                    let row = document.createElement("tr");
                    let cell_0 = document.createElement("td");
                    cell_0.style.width = "70%";
                    cell_0.innerHTML = _name;
                    let cell_1 = document.createElement("td");
                    cell_1.id = `ID_1_${_id}`;
                    cell_1.style.width = "20%";
                    cell_1.style.textAlign = "right";
                    let cell_2 = document.createElement("td");
                    let cellText_2 = document.createTextNode("0");
                    cell_2.id = `ID_2_${_id}`;
                    cell_2.appendChild(cellText_2);
                    row.appendChild(cell_0);
                    row.appendChild(cell_1);
                    row.appendChild(cell_2);
                    fragment.appendChild(row);
                    this._elementById(`${this.IDTableBuffer_Name}_Tbody`).appendChild(fragment);

                    let queryTask = new QueryTask(_url);
                    let query = new Query();
                    query.outFields =_field.map(x => x.field);
                    query.geometry = _geometry;
                    query.spatialRelationship = "esriSpatialRelIntersects";
                    query.geometryType = "esriGeometryEnvelope";
                    query.returnGeometry = false;

                    queryTask.executeForCount(query).then(
                        (count) => {
                            _count = count;
                            this.countAnalysis_Cantidad = this.countAnalysis_Cantidad + count;
                            this._elementById(`ID_1_${_id}`).innerText = count;
                        },
                        (error) => {  
                            console.error(`Error: Analisis - Oops! executeForCount => ${error.name} - ${error.message}`); 
                        }
                    ).always(lang.hitch(this, function() { 
                        if(_count == 0) {
                            this.ID_Load_Analysis.style.display = "none";
                            this.ID_Table_Analysis.style.display = "block";  
                            this.map.graphics.remove(this.bufferSelect_geometry);
                            this.bufferSelect_geometry = null;
                            this._htmlTable(this.ID_Table_Analysis);                            
                            return false;
                        }

                        if(_count > 1000) {
                            let arrLong = [];
                            this.bufferCount = 0;
                            const sizeFeature = Math.ceil(_count/500);
                            for (let H = 0; H < sizeFeature; H++) {
                                let queryTask_1k = new QueryTask(_url);
                                let query_1k = new Query();
                                query_1k.outFields =_field.map(x => x.field);
                                query_1k.geometry = _geometry;
                                query_1k.spatialRelationship = "esriSpatialRelIntersects";
                                query_1k.geometryType = "esriGeometryEnvelope";
                                query_1k.num = 500;
                                query_1k.start = (H*500);
                                query_1k.returnGeometry = true;
                                queryTask_1k.execute(query_1k).then(
                                    (result_geo) => {
                                        result_geo.features.map(function(feature) {
                                            this.bufferCount = this.bufferCount + 1;
                                            console.log(this.bufferCount);
                                            if(feature.geometry.type == "polyline") {                                                
                                                arrLong.push(feature.attributes[_long]);
                                                unionGeometry.push(feature.geometry);
                                            }
                                        }.bind(this));
                                    },
                                    (error) => {
                                        console.error(`Error: Analisis - Oops! 1 => ${error.name} - ${error.message}`);                                
                                    }
                                ).always(lang.hitch(this, function() {
                                    /* Condicional para el total */
                                    console.log(_count);
                                    console.log(this.bufferCount);
                                    /*
                                    if(_count == this.bufferCount) {
                                        console.log("ENTRO");
                                        let longKm = arrLong.reduce((a, b) => a + b, 0);
                                        this._elementById(`ID_2_${_id}`).innerText = parseFloat(longKm).toFixed(3);
                                        
                                        this.ID_Load_Analysis.style.display = "none";
                                        this.ID_Table_Analysis.style.display = "block";                                             
                                        
                                        let geometryBuffer = geometryEngine.geodesicBuffer(
                                            geometryEngine.union(unionGeometry),
                                            [this.ID_Buffer.value],
                                            GeometryService.UNIT_KILOMETER, true
                                        );
                                        // UNIT_KILOMETER, UNIT_METER
    
                                        // Geometry Graphic
                                        let graphicBuffer = new Graphic(geometryBuffer, colorSimpleFillSymbol);
                                        this.bufferSelect_geometry = graphicBuffer;
                                        this.map.graphics.add(graphicBuffer);
                                        let itemRandom = this._getRandom();
                                        this.analysisRandom = itemRandom;
    
                                        setTimeout(() => {
                                            this.analysisTemp.map(function(lyr) {
                                                this._intersectAnalysis(
                                                    this.IDTableAnalysis_Name,
                                                    this.analysisTemp,
                                                    lyr,
                                                    this.analysisTotal,
                                                    itemRandom
                                                );
                                            }.bind(this));
                                        },1000);
                                    }
                                    */
                                   
                                    
                                }));
                            }
                        } else {
                            // Sin Paginación
                            if(_count !== 0) {
                                let arrLong = [];
                                query.outFields = _field.map(x => x.field);
                                query.returnGeometry = true;
                                queryTask.execute(query).then(
                                    (response) => {
                                        response.features.map(function(feature) {
                                            if(feature.geometry.type == "polyline") {
                                                arrLong.push(feature.attributes[_long]);
                                                unionGeometry.push(feature.geometry);
                                            }
                                        }.bind(this));
                                    },
                                    (error) => {
                                        console.error(`Error: Analisis - Oops! 2 => ${error.name} - ${error.message}`);                                
                                    }
                                ).always(lang.hitch(this, () => {                                    
                                    let longKm = arrLong.reduce((a, b) => a + b, 0);
                                    this._elementById(`ID_2_${_id}`).innerText = parseFloat(longKm).toFixed(3);
                                    // Bloque LOAD
                                    this.ID_Load_Buffer.style.display = "none";
                                    // Bloque TABLE
                                    this.ID_Table_Buffer.style.display = "block";                                             
                                    /* Geometry Union */
                                    //let geometryUnion = geometryEngine.union(unionGeometry);
                                    //this.reportGeometryUnion = geometryUnion;
                                    /* Geometry Buffer */
                                    let geometryBuffer = geometryEngine.geodesicBuffer(
                                        geometryEngine.union(unionGeometry),
                                        [this.ID_Buffer.value],
                                        GeometryService.UNIT_KILOMETER, true
                                    );/* UNIT_KILOMETER, UNIT_METER */

                                    /* Geometry Graphic */
                                    let graphicBuffer = new Graphic(geometryBuffer, colorSimpleFillSymbol);
                                    this.bufferSelect_geometry = graphicBuffer;
                                    this.map.graphics.add(graphicBuffer);
                                    //this._report(geometryBuffer, _random);
                                    let itemRandom = this._getRandom();
                                    this.analysisRandom = itemRandom;
                                    setTimeout(() => {
                                        this.analysisTemp.map(function(lyr) {
                                            this._intersectAnalysis(
                                                this.IDTableAnalysis_Name,
                                                this.analysisTemp,
                                                lyr,
                                                this.analysisTotal,
                                                itemRandom
                                            );
                                        }.bind(this));
                                    },1000);                                    
                                }));
                            }
                        }
                    }));
                  
            } catch (error) {
                console.error(`Error: _buffer => ${error.name} - ${error.message}`);
            }
        },
        _intersectAnalysis: function(_id, _temp, _lyr, _total, _random) {
            try {      
                let queryTask_analysis = new QueryTask(_lyr.url);
                let query_analysis = new Query();
                query_analysis.outFields = _lyr.fields.map(x => x.field);
                //query.geometry = this.bufferSelect_geometry.geometry;
                query_analysis.where = "1=1";
                query_analysis.spatialRelationship = "esriSpatialRelIntersects";
                query_analysis.geometryType = "esriGeometryEnvelope";
                query_analysis.returnGeometry = true;
                queryTask_analysis.executeForCount(query_analysis).then(
                    (count) => {
                        try {
                            if (this.analysisRandom == _random) {
                                this.analysisResult = this.analysisResult + count;
                                this._elementById(`${_id}_Total`).innerText = this.analysisResult;
                                this.ID_Percentage_analysis.innerHTML = this._loadTime(this.analysisCount, _total);
                                this.analysisCount++;
                                _lyr.cantidad = count;
                            }
                        } catch (error) {
                            console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: _queryTask ERROR - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, function() {
                    try {
                        if((this.analysisCount == _total) && (this.analysisRandom == _random)) {
                            this.ID_Load_Analysis.style.display = "none";
                            this.ID_Table_Analysis.style.display = "block";
                            // Ordena por cantidad en el JSON this.confDiagnosis_Temp
                            this._elementById(`${_id}_Tbody`).innerHTML = "";
                            this._sortJSON(_temp, 'cantidad','desc');
                            // Inserta a la tabla
                            _temp.map(function(current, index) {
                                if(current.cantidad > 0) {
                                    let fragment = document.createDocumentFragment();
                                    let row = document.createElement("tr");
                                    let cell_0 = document.createElement("td");
                                    let cellText_0 = document.createTextNode(index + 1);
                                    cell_0.appendChild(cellText_0);
                                    let cell_1 = document.createElement("td");
                                    cell_1.innerHTML = current.name;
                                    let cell_2 = document.createElement("td");
                                    let cellText_2 = document.createTextNode(current.cantidad || 0);
                                    cell_2.appendChild(cellText_2);
                                    row.appendChild(cell_0);
                                    row.appendChild(cell_1);
                                    row.appendChild(cell_2);
                                    fragment.appendChild(row);
                                    this._elementById(`${_id}_Tbody`).appendChild(fragment);
                                }
                            }.bind(this));   
                        }
                    } catch (error) {
                        console.error(`Error: _intersectAnalysis/queryTask always => ${error.name} - ${error.message}`);
                    } 
                }.bind(this)));
                
            } catch (error) { 
                console.error(`Error: _intersectAnalysis => ${error.name} - ${error.message}`); 
            }
        },
        _getColorSimpleFillSymbol: function(_R,_G,_B) {
            try { /* Obtiene el color */
                return new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(
                        SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                        new Color([_R,_G,_B]),
                        2
                    ),
                    new Color([_R,_G,_B,0.1])
                )
            } catch (error) {
                console.error(`Error: _getColorSimpleFillSymbol => ${error.name} - ${error.message}`);
            }
        },
        _loadJson: function(json, _conf, _count, _name="", _id="", _type="FeatureLayer") {
            try { /* Recorre un arból de n hijos */
                let type; let resul; let layer;
                for (var i=0; i < json.length; i++) {
                    type = typeof json[i].srv;
                    if (type == "undefined") {
                        resul = true;
                        this[_count] = this[_count] + 1;
                        layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name}<strong>${json[i].name}</strong>`;
                        _conf.push({ 
                            name:layer,
                            url:json[i].url,
                            fields:json[i].fields,
                            id:_id,
                            table: json[i].table,
                            color:json[i].color,
                            long:json[i].long,
                            type: _type,
                            objectid:json[i].objectid,
                            position:json[i].position
                        });
                    } else {
                        resul += this._loadJson(
                            json[i].srv,
                            _conf,
                            _count,
                            _name.concat(json[i].name + " / "),
                            typeof json[i].id == "undefined"? _id: json[i].id,
                            json[i].id,
                            "ArcGISDynamicMapServiceLayer"
                        );
                    }
                }            
                return resul;
            } catch (error) {
                console.error(`Error: _loadJson => ${error.name} - ${error.message}`);
            }
        },
        _showBuffer: function(bufferedGeometries) {
            let symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,0,0,0.65]),
                    2
                ),
                new Color([255,0,0,0.35])
            );                      
            bufferedGeometries.map((currentValue) => {
                try {
                    if (typeof(currentValue) !== 'undefined') {
                        this.map.graphics.add(new Graphic(currentValue, symbol));    
                    }
                } catch (error) {
                    console.error(`Error: bufferedGeometries => ${error.name} - ${error.message}`);
                }
            });
        },        
        _validatedData: function(_group,_name) {
            /* Se valida la data */
            try {
                let padreVal = false
                for (let index = 0; index < _group.length; index++) {                
                    if(_group[index].capa == _name) {
                        padreVal = index; break;
                    }                
                }            
                return padreVal;
            } catch (error) { 
                console.error(`Error: _validatedData => ${error.name} - ${error.message}`); 
            }
        },
        _sortJSON: function(data, key, orden) {
            try { /* Ordenando el json de capas */
                return data.sort(function (a, b) {
                    var x = a[key], y = b[key];
            
                    if (orden === 'asc') { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
            
                    if (orden === 'desc') { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
                });
            } catch (error) { 
                console.error(`Error: _sortJSON => ${error.name} - ${error.message}`); 
            }
        },
        _htmlTable: function(ID_Table) {
            try { /* Se crea la tabla de resumen */            
                ID_Table.innerHTML = "";
                const idTable = ID_Table.getAttribute("data-dojo-attach-point"); 
                const tbl = document.createElement("table");
                tbl.className = "tbl";
                /* Head */
                const tblHead = document.createElement("thead");
                const rowHead = document.createElement("tr");
                const rowHeadTH_Item = document.createElement("th");
                //const rowHeadTH_ItemNode = document.createTextNode("#");
                //rowHeadTH_Item.appendChild(rowHeadTH_ItemNode);
                rowHeadTH_Item.innerHTML = "<i class='fa fa-check-square' style='margin-right:-10px; display:none;'></i>";
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
        },
        _htmlTableAnalysis: function(ID_Table) {
            try { /* Se crea la tabla de resumen */
                ID_Table.innerHTML = "";
                const idTable = ID_Table.getAttribute("data-dojo-attach-point"); 
                const tbl = document.createElement("table");
                tbl.className = "tbl";
                /* Head */
                const tblHead = document.createElement("thead");
                const rowHead = document.createElement("tr");
                const rowHeadTH_Item = document.createElement("th");                
                const rowHeadTH_Name = document.createElement("th");
                const rowHeadTH_NameNode = document.createTextNode("Capa / Temática");
                rowHeadTH_Name.appendChild(rowHeadTH_NameNode);
                const rowHeadTH_Count = document.createElement("th");
                const rowHeadTH_CountSize = document.createTextNode("Cant.");
                rowHeadTH_Count.appendChild(rowHeadTH_CountSize);
                const rowHeadTH_ItemNode = document.createTextNode("Km.");
                rowHeadTH_Item.appendChild(rowHeadTH_ItemNode);
                rowHead.appendChild(rowHeadTH_Name);
                rowHead.appendChild(rowHeadTH_Count);
                rowHead.appendChild(rowHeadTH_Item);
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
                /* Foot              
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
                rowFootTDCant.id = `${idTable}_Cantidad`;
                rowFootTDCant.appendChild(rowFootTD_Cant);                
                const rowFootTDKm = document.createElement("td");
                rowFootTDKm.style.textAlign = "right";
                const rowFootTD_Km = document.createTextNode("0");
                rowFootTDKm.id = `${idTable}_Km`;
                rowFootTDKm.appendChild(rowFootTD_Km);                
                rowFoot.appendChild(rowFootTD);
                rowFoot.appendChild(rowFootTDCant);
                rowFoot.appendChild(rowFootTDKm);
                tblFoot.appendChild(rowFoot);
                tbl.appendChild(tblFoot);               
                ID */
                ID_Table.appendChild(tbl);
            } catch (error) {
                console.error(`Error: _htmlTableAnalysis => ${error.name} - ${error.message}`);
            }
        },
        _removeChild: function(listDiv, divCount) {
            try { /* Se limpia la estructura */
                divCount.innerText = "0";
                while(listDiv.firstChild) {
                    listDiv.removeChild(listDiv.firstChild);
                }
            } catch (error) {
                console.error(`Error: _removeChild => ${error.name} - ${error.message}`);
            } 
        },
        _elementById: function (paramId) {
            try { /* Se valida el ID */
                let id = document.getElementById(paramId);
                if(id !== null && id !== undefined)
                    return id;
                else
                    console.error(`Error: ID (${paramId}) => null || undefined`);
            } catch(error) {
                console.error(`_elementById => ${error.name} - ${error.message}`);
            }
        },
        _getRandom() {
            try { /* Get Random - Deferred */
                return Math.floor(Math.random() * 5000000);
            } catch(error) {
                console.error(`__getRandomInt => ${error.name} - ${error.message}`);
            }
        },     
        _queryTaskReport: function(lyr, srv, _geometryIntersect, _random){
            try {
                /* if(this.deferredReport && (this.deferredReport > 0)) {
                    this.deferredReport.cancel();
                } */
                let queryTask = new QueryTask(srv);
                let query = new Query();
                query.outFields = lyr.fields.map(x => x.field);
                query.geometry = _geometryIntersect;
                query.spatialRelationship = "esriSpatialRelIntersects";
                query.geometryType = "esriGeometryEnvelope";
                this.deferredReport = queryTask.executeForCount(query)
                this.deferredReport.then(
                    (count) => {
                        try {
                            if (this.diagnosisRandom == _random) {
                                lyr.cantidad = count;
                            }
                        } catch (error) {
                            console.error(`Error: _queryTaskReport - count => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: _queryTaskReport - error => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, function() {
                    try {
                        if(((this.diagnosisCount - 1) == this.lyrTotal) && (this.diagnosisRandom == _random)) {
                            /* Recorrer el JSON y asignamos a un nuevo array - this.confDiagnosis_Temp*/
                            this._jsonTravelTree_Temp(this.confDiagnosis);
                            /* Ordena por cantidad en el JSON this.confDiagnosis_Temp */
                            this._sortJSON(this.confDiagnosis_Temp,'cantidad','desc'); 
                            /* Inserta a la tabla */
                            this.confDiagnosis_Temp.map(function(cValue, index){
                                let fragment = document.createDocumentFragment();
                                let row = document.createElement("tr");
                                let cell_0 = document.createElement("td");
                                let cellText_0 = document.createTextNode(index + 1);
                                cell_0.appendChild(cellText_0);
                                let cell_1 = document.createElement("td");
                                cell_1.innerHTML = cValue.layer;
                                let cell_2 = document.createElement("td");
                                let cellText_2 = document.createTextNode(cValue.cantidad || 0);
                                cell_2.appendChild(cellText_2);
                                row.appendChild(cell_0);
                                row.appendChild(cell_1);
                                row.appendChild(cell_2);
                                fragment.appendChild(row);
                                this._elementById(`${this.IDTableReport_Name}_Tbody`).appendChild(fragment);
                            }.bind(this));   
                        }
                    } catch (error) {
                        console.error(`Error: _queryTask/queryTask always => ${error.name} - ${error.message}`);
                    } 
                }.bind(this)));
            } catch (error) {
                console.error(`Error: _report => ${error.name} - ${error.message}`);
            }
        }
    });
});