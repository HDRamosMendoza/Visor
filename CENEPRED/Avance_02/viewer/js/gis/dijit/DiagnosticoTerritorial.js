let ramos;
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
    'esri/geometry/geometryEngine',
    'esri/geometry/normalizeUtils',
    'esri/tasks/GeometryService',    
    'esri/tasks/BufferParameters',
    'esri/SpatialReference',
    'esri/toolbars/draw',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/StatisticDefinition',
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
    geometryEngine,
    normalizeUtils,
    GeometryService,
    BufferParameters,
    SpatialReference,
    Draw,
    SimpleMarkerSymbol,
    Query,
    QueryTask,
    StatisticDefinition,
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
        ramos: "",
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
        textAmbito: "",
        geometryIntersect: "",
        geometrySRV: null,
        IDTableCount_Name: "",
        IDTableBuffer_Name: "",
        lyrDefinition: [],
     
        postCreate: function () {
            this.inherited(arguments);
            /* Servicio de Geometria */
            //this.geometrySRV = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
            esriConfig.defaults.geometryService = new GeometryService("https://sigrid.cenepred.gob.pe/arcgis/rest/services/Utilities/Geometry/GeometryServer");

            const config = JSON.parse(configJSON);
            console.log("in postCreate");
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
            /* Setup List Layer DIAGNOSIS */
           
            /* Asigna en un solo nivel a confAnalysis_Temp */
            //this._loadJson(this.confAnalysis, this.confAnalysis_Temp);

            /* Asigna en un solo nivel a confAnalysis_Temp */
            this._loadJson(config.lyrDiagnosis,  this.diagnosisTemp, "diagnosisTotal");
            this._loadJson(config.lyrDiagnosis,  this.analysisTemp,  "analysisTotal");
            this._loadJson(config.lyrBuffer,     this.bufferTemp,    "bufferTotal");
            /* DownLoad Data */ 
            this._loadSelect(config.download, this.ID_Diagnosis_Format);
            this._loadSelect(config.download, this.ID_Analysis_Format);
            this._loadSelect(this.bufferTemp, this.ID_Analysis_Buffer);
            /* Asigna en un solo nivel a confReport_Temp */
            //this._reportJson(this.confReport, this.confReport_Temp);

            console.log(this.diagnosisTemp);
            /*
            let dynamicLayer = this.map.getLayer("cartografiaPeligros");
            console.log(dynamicLayer);
            var layerDefs = []; layerDefs[5010100] = "iobjectid_1=(1)";
            dynamicLayer.setLayerDefinitions(layerDefs);
            dynamicLayer.setVisibleLayers([5010100],true);
            dynamicLayer.refresh();
            */

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
                    let itemDep = selDep.get('displayedValue');
                    let queryWhere = `UPPER(${srvPro.depName}) = UPPER('${itemDep}')`;
                    selPro.store = this._ambitoUpdate(lyrDep.htmlPH, srvPro.order, srvPro.objectID, srvPro.item, srvPro.url, queryWhere);
                    selPro.attr("placeholder", lyrPro.htmlPH);
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
                    this.map.setZoom(6);
                    this.map.centerAt(new Point(-75.015152, -9.189967));
                    /* Limpiando pestaña RESULTADO */
                    this.ID_Count.innerHTML  = 0;
                    this.ID_CountText.innerHTML  = this.textAmbito = "";
                    this.ID_Table_Count.innerHTML = '';
                    this._htmlTable(this.ID_Table_Count);
                } catch (error) {
                    console.error(`Error: button/ID_Filter_Clear (click) => ${error.name} - ${error.message}`);
                }
            })));

            this.own(on(this.ID_Report, 'click', lang.hitch(this, () => {
                /* Button (click) - ID_Report */
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
                    /* Texto de Ámbito */
                    _textAmbito = _textAmbito.concat(`${selDep.get('displayedValue')} (departamento)`);
                    _textAmbito = this._validateSelect(selPro) ? _textAmbito.concat("") : _textAmbito.concat(`/${selPro.get('displayedValue')} (provincia)`);
                    _textAmbito = this._validateSelect(selDis) ? _textAmbito.concat("") : _textAmbito.concat(`/${selDis.get('displayedValue')} (distrito)`);
                    let textAmbito_Temp = _textAmbito.split("/");
                    textAmbito_Temp[textAmbito_Temp.length-1] = `${textAmbito_Temp[textAmbito_Temp.length-1]}`;
                    _textAmbito_request = textAmbito_Temp.reverse().join(", ");/* Busqueda */
                    textAmbito_Temp = textAmbito_Temp.join(" / ");                    
                    _textAmbito = `${textAmbito_Temp}`;
                    localStorage.clear();
                    localStorage.setItem("reportTitle_request", JSON.stringify(_textAmbito_request));
                    localStorage.setItem("reportTitle", JSON.stringify(_textAmbito));
                    localStorage.setItem("reportAmbito", JSON.stringify(objectLiteral));
                    localStorage.setItem("reportGeometry", JSON.stringify(this.reportGeometry));                    
                    /* Open TAB - REPORT */
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
                    console.log("DESCARGANDO");
                } catch (error) {
                    console.error(`Error: button/ID_Analisis (click) => ${error.name} - ${error.message}`);
                }
            })));*/

            /*this.own(on(this.ID_Analysis_Download, 'click', lang.hitch(this, () => {
                // Button (click) - ID_Analysis_Download. Descargar información de ANALISIS
                try {
                    console.log("DESCARGANDO");
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
        startup: function() {
            console.log("in startup");
        },
        _loadSelect(formatOption, formatId) {
            try {
                let htmlID = formatId.getAttribute("data-dojo-attach-point")

                let container = domConstruct.create("div", {
                    id: `DIV_${htmlID}`,
                    style: {width:'96.5%',color:"#555555"}
                    }, formatId
                );
                
                let buttonDownload = new Button({
                    id: `Button_${htmlID}`,
                    label: "Descargar",
                    iconClass: 'fa fa-download',
                    style: {
                        width:'120px',
                    },
                    onClick: function() {
                        console.log("BUTTON");
                    }
                });

                let tableContainer = new TableContainer({
                    cols: 2, labelWidth: "0%",
                    customClass: "labelsAndValues", /*class: "form-labels"*/
                }, container);
                let options = [];
                let booleanButton = false;
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
                    options.push({ 
                        name: item.name.replace(/<[^>]+>/g, ''),
                        id:   typeof item.value == "undefined"? index: item.value
                    });
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
                    style: { width:'100%', fontSize:'13px' }
                });
            
                tableContainer.addChild(filteringSelect);
                if(!booleanButton) {
                    tableContainer.addChild(buttonDownload);
                    filteringSelect.on("change", function(evt) {
                        console.log("DESCARGAR");
                        console.log(evt);
                        console.log(this);
                    });
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
                });                
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
                            console.log(cValue.geometry);
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
                
                lyr.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    try {
                        features.map(function(cValue) {
                            console.log("cValue.geometry");
                            console.log(cValue.geometry);
                            this.geometryIntersect = cValue.geometry;
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
                query.geometry = this.geometryIntersect;
                query.spatialRelationship = "esriSpatialRelIntersects";
                query.geometryType = "esriGeometryEnvelope";
                query.outStatistics = [ diagnosisCOUNT ];
                this.deferredDiagnosis = queryTask.execute(query);
                this.deferredDiagnosis.then(
                    (response) => {
                        try {
                            if (this.diagnosisRandom == _random) {
                                let _attr = response.features[0].attributes;
                                this.diagnosisResult = this.diagnosisResult + _attr.cantidad;
                                this.ID_Count.innerText = this.diagnosisResult;
                                this.ID_CountText.innerHTML = this.textAmbito;
                                this._elementById(`${_id}_Total`).innerText = this.diagnosisResult;
                                this.ID_Percentage.innerHTML = this._loadTime(this.diagnosisCount, _total);
                                this.diagnosisCount++;
                                _lyr.cantidad = _attr.cantidad;
                                /* Ordena por cantidad en el JSON this.confDiagnosis_Temp */
                                this._sortJSON(_temp, 'cantidad','desc'); 
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
                            this._elementById(`${_id}_Tbody`).innerHTML = "";
                            _temp.map(function(current, index) { /* Inserta a la tabla */
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
                            this.ID_Load.style.display = "none";
                            this.ID_Table_Count.style.display = "block";
                        }
                    } catch (error) {
                        console.error(`Error: _intersectLaye/queryTask always => ${error.name} - ${error.message}`);
                    } 
                }.bind(this)));

                this.deferredDiagnosisMap = queryTask.executeForIds(query);
                this.deferredDiagnosisMap.then(
                    (ids) => {
                        try {
                            //if (this.diagnosisRandom == _random && (ids ?? false)) {
                            if (ids ?? false) {
                                console.log(_lyr.id);
                                let lyr = this.map.getLayer(_lyr.id);
                                /*if(_lyr.type == "ArcGISDynamicMapServiceLayer") {
                                console.log(_lyr.type);console.log(_lyr.id);console.log(lyr);console.log(_lyr.url);console.log(_lyr.objectid);
                                console.log(_lyr.position);console.log(ids.toString()); lyr.setVisibleLayers([_lyr.position],true);*/
                                this.lyrDefinition[_lyr.position] = `${_lyr.objectid} IN (${ids.toString()})`;
                                lyr.setLayerDefinitions(this.lyrDefinition);
                                lyr.show();
                                lyr.refresh();
                            }
                        } catch (error) {
                            console.error(`Error: _queryTask RESPONSE => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: _queryTask ERROR - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                    }
                );
                
            } catch (error) { 
                console.error(`Error: _intersectLaye => ${error.name} - ${error.message}`); 
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
                            //console.log(sizeFeature);
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
                                //console.log(query_1k);
                                queryTask_1k.execute(query_1k).then(
                                    (result_geo) => {
                                        console.log("===> " + result_geo.features.length);
                                        console.log(result_geo.features.length);
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