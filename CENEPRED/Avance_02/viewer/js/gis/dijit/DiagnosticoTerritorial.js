define([
    'dojo/_base/declare',
    'dojo/on',
    'dojo/_base/lang',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/FilteringSelect',
    'dijit/form/TextBox',
    
    'dojo/text!./DiagnosticoTerritorial/templates/DiagnosticoTerritorial.html',
    'dojo/json',
    'dojo/dom',
    "dojo/_base/array",
    'dojo/text!./DiagnosticoTerritorial/config.json',
    'dojo/aspect',
    'dojo/_base/lang',
    'dojo/dom-construct',
    "esri/config",
    "esri/graphic",

    "esri/geometry/geometryEngine",

    "esri/geometry/normalizeUtils",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/toolbars/draw",
    "esri/symbols/SimpleMarkerSymbol",

    'esri/tasks/query',
    'esri/tasks/QueryTask',
    "esri/layers/FeatureLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/geometry/Point",
    "esri/renderers/SimpleRenderer",
    "esri/layers/LabelClass",
    "dojo/_base/Color",
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
    drawTemplate,
    JSON,
    dom,
    array,
    configJSON,    
    aspect,
    lang,
    domConstruct,
    esriConfig,
    Graphic,

    geometryEngine,

    normalizeUtils,
    GeometryService,
    BufferParameters,
    Draw,
    SimpleMarkerSymbol,

    Query,
    QueryTask,
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
        lyrList: "",
        lyrAnalysis: "",
        lyrGroup: [],
        lyrGraphics: [],
        countItem: 1,
        countResult: 0,
        countAnalysis: 0,
        textAmbito: "",
        geometryIntersect: "",
        geometrySRV: null,
        IDTableCount_Name: "",
        IDTableAnalysis_Name: "",
        /* RED VIAL */
/*
let symbolRedVial = new SimpleFillSymbol(
    SimpleFillSymbol.STYLE_SOLID,
    new SimpleLineSymbol(
      SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
      new Color([239,184,16]),
      2
    ),
    new Color([239,184,16,0.1])
);
*/

/* RED FERROVIARIA 
let symbolRedFerroviaria = new SimpleFillSymbol(
    SimpleFillSymbol.STYLE_SOLID,
    new SimpleLineSymbol(
      SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
      new Color([57,153,0]),
      2
    ),
    new Color([57,153,0,0.1])
);
*/
        postCreate: function () {
            this.inherited(arguments);
            /* Servicio de Geometria */
            this.geometrySRV = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
            const config = JSON.parse(configJSON);
            console.log("in postCreate");
            this._htmlTable(this.ID_Table_Count);
            this._htmlTable(this.ID_Table_Analysis);            
            this.IDTableCount_Name     = this.ID_Table_Count.getAttribute("data-dojo-attach-point");
            this.IDTableAnalysis_Name  = this.ID_Table_Analysis.getAttribute("data-dojo-attach-point");
            /* Setup DEPARTAMENTO */
            const lyrDep = config.lyrFilter[0];
            const srvDep = lyrDep.srv[0];
            /* Setup PROVINCIA */
            const lyrPro = config.lyrFilter[1];
            const srvPro = lyrPro.srv[0];
            /* Setup DISTRITO */
            const lyrDis = config.lyrFilter[2];
            const srvDis = lyrDis.srv[0];
            /* Setup CAPAS */
            this.lyrList = config.lyrList_2;
            /* Setup CAPAS DE ANÁLISIS */
            this.lyrAnalysis = config.lyrAnalysis_2;            
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
                    console.log("ID_Report");
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
                    this.textAmbito = this._validateSelect(selDis) ? this.textAmbito.concat("") : this.textAmbito.concat(`/${selDis.get('displayedValue')} (distrital)`);                    
                    let textAmbito_Temp = this.textAmbito.split("/");
                    textAmbito_Temp[textAmbito_Temp.length-1] = `<span style="padding: 5px 5px;color:#555555;font-weight:800;">${textAmbito_Temp[textAmbito_Temp.length-1]}</span>`;
                    textAmbito_Temp = textAmbito_Temp.join(" / ");
                    this.textAmbito = `<p style="line-height:20px;background-color:rgba(0,0,0,0.1);padding:5px;">${textAmbito_Temp}</p>`;                    
                    /* Reinicia contador */
                    this.countItem = 1;
                    this.countResult = 0;
                    /* Reinicia el grupo de capas */
                    this.lyrGroup = [];
                    /* Muestra la pestaña RESULTADO (segunda pestaña) */
                    this._elementById("tab2").click();
                    this.ID_Table_Count.style.display = "none";
                    this.ID_Load.style.display = "block";
                    /* Eliminar contenido del resultado */
                    this._removeChild(this._elementById(`${this.IDTableCount_Name}_Tbody`), this.ID_Count/*, this.ID_CountResult*/);
                    /* Intersect layer */
                    this._intersectLayer(objectLiteral);
                } catch (error) {
                    console.error(`Error: button/ID_Diagnosis (click) => ${error.name} - ${error.message}`);
                }
            })));

            this.own(on(this.ID_Analisis, 'click', lang.hitch(this, () => {
                /* Button (click) - ID_Analisis. Muestra la pestaña ANALISIS (segunda pestaña) */
                try {
                    this._elementById("tab3").click();
                    /* Buffer Analysis */
                    this._analysis();
                } catch (error) {
                    console.error(`Error: button/ID_Report (click) => ${error.name} - ${error.message}`);
                }
            })));


            this.own(on(this.ID_Button_Buffer, 'click', lang.hitch(this, () => {
                /* Button (click) - ID_Buffer */
                try {                    
                    if(this.ID_Buffer.value < 1) { return };
                    /* Buffer Analysis */
                    this._analysis();
                } catch (error) {
                    console.error(`Error: button/ID_Buffer (click) => ${error.name} - ${error.message}`);
                }
            })));
        },
        startup: function() {
            console.log("in startup");
        },
        _analysis: function() {
            try {                
                this.ID_Table_Analysis.style.display = "none";
                this.ID_Load_Buffer.style.display = "block";
                this.lyrGraphics.map((currentValue) => { this.map.graphics.remove(currentValue); });

                if(this.queryTaskDeferred_1k && (this.queryTaskDeferred_1k > 0)) {
                    this.queryTaskDeferred_1k.cancel();
                }

                if(this.queryTaskDeferred_1000k && (this.queryTaskDeferred_1000k > 0)) {
                    this.queryTaskDeferred_1000k.cancel();
                }

                this.countAnalysis = 0;    
                this.lyrGraphics = [];                
                this.lyrList.map(function(lyr) {
                    if(lyr.analysis) {
                        //console.log(lyr);
                        let queryTask = new QueryTask(lyr.url);
                        let query = new Query();
                        /*query.outFields = lyr.fields.map(x => x.field);*/
                        query.geometry = this.geometryIntersect;
                        query.SpatialRelationship = "esriSpatialRelIntersects";
                        query.geometryType = "esriGeometryEnvelope";
                        //query.returnGeometry = false;
                        queryTask.executeForCount(query).then(
                            (count) => {
                                try {
                                    let queryTaskSP = new QueryTask(lyr.url);
                                    let querySP = new Query();
                                    querySP.outFields = lyr.fields.map(x => x.field);
                                    querySP.geometry = this.geometryIntersect;
                                    querySP.SpatialRelationship = "esriSpatialRelIntersects";
                                    querySP.geometryType = "esriGeometryEnvelope";
                                    querySP.returnGeometry = true;
                                    if(count > 1000 ) {
                                        /* Páginación */
                                        const sizeFeature = Math.ceil(count/500);
                                        for (let H = 0; H < sizeFeature; H++) {
                                            querySP.returnGeometry = true;
                                            querySP.num = 500;
                                            querySP.start = (H*500);
                                            this.queryTaskDeferred_1000k = queryTaskSP.execute(querySP);
                                            this.queryTaskDeferred_1000k.then(
                                            (response) => {
                                                if(response.geometryType == "esriGeometryPolyline") {
                                                    response.features.map(function(currValue) {
                                                        try {
                                                            this.ID_Table_Analysis.style.display = "none"; 
                                                            this.ID_Load_Buffer.style.display = "block";

                                                            let symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
                                                            let graphic = new Graphic(currValue.geometry, symbol);
                                                            this.map.graphics.add(graphic);
                                                            
                                                            let params = new BufferParameters();
                                                            params.distances = [this.ID_Buffer.value];
                                                            params.outSpatialReference = this.map.spatialReference;
                                                            params.unit = GeometryService.UNIT_KILOMETER;
                                                            params.geometries = [ currValue.geometry ];

                                                            this.geometrySRV.buffer(params, (bufferGeometries) => {
                                                                // RED FERROVIARIA 
                                                                const symbolRedFerroviaria = new SimpleFillSymbol(
                                                                    SimpleFillSymbol.STYLE_SOLID,
                                                                    new SimpleLineSymbol(
                                                                      SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                                                      new Color([57,153,0]),
                                                                      2
                                                                    ),
                                                                    new Color([57,153,0,0.1])
                                                                );

                                                                array.forEach(bufferGeometries, (geometry) => {
                                                                    let graphic = new Graphic(geometry, symbolRedFerroviaria);
                                                                    this.lyrGraphics.push(graphic);
                                                                    this.map.graphics.add(graphic);
                                                                });
                                                            
                                                            });
                                                              
                                                        } catch (error) {
                                                            console.error(`Error: esriGeometryPolyline => ${error.name} - ${error.message}`);
                                                        }
                                                    }.bind(this));
                                                    
                                                }
                                            }
                                            ).always(lang.hitch(this, function() {
                                                M = M + 1;
                                                if(sizeFeature == M) {
                                                    this.ID_Load_Buffer.style.display = "none";
                                                    this.ID_Table_Analysis.style.display = "block";                                                     
                                                }
                                            }));                                            
                                        }
                                        

                                    } else {
                                        /* Sin Páginación */
                                        querySP.num = 1000; querySP.start = 0;
                                        this.queryTaskDeferred_1k = queryTaskSP.execute(querySP);
                                        this.queryTaskDeferred_1k.then(
                                            (response) => {
                                                try {
                                                    if(response.geometryType == "esriGeometryPolyline") {
                                                        response.features.map(function(currValue) {
                                                            try {
                                                                this.ID_Table_Analysis.style.display = "none"; 
                                                                this.ID_Load_Buffer.style.display = "block";

                                                                let symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
                                                                let graphic = new Graphic(currValue.geometry, symbol);
                                                                this.map.graphics.add(graphic);
                                                                
                                                                let params = new BufferParameters();
                                                                params.distances = [this.ID_Buffer.value];
                                                                params.outSpatialReference = this.map.spatialReference;
                                                                params.unit = GeometryService.UNIT_KILOMETER;
                                                                params.geometries = [ currValue.geometry ];

                                                                this.geometrySRV.buffer(params, (bufferGeometries) => {

                                                                    /* RED VIAL */
                                                                    let symbolRedVial = new SimpleFillSymbol(
                                                                        SimpleFillSymbol.STYLE_SOLID,
                                                                        new SimpleLineSymbol(
                                                                          SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                                                                          new Color([239,184,16]),
                                                                          2
                                                                        ),
                                                                        new Color([239,184,16,0.1])
                                                                    );
                                                                

                                                                    array.forEach(bufferGeometries, (geometry) => {
                                                                        let graphic = new Graphic(geometry, symbolRedVial);
                                                                        this.lyrGraphics.push(graphic);
                                                                        this.map.graphics.add(graphic);
                                                                    });
                                                                
                                                                });

                                                            } catch (error) {
                                                                console.error(`Error: esriGeometryPolyline => ${error.name} - ${error.message}`);
                                                            }
                                                        }.bind(this));
                                                    }
                                                    /*
                                                    response.map(function(currValue) {
                                                        console.log(currValue);
                                                        let symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
                                                        let graphic = new Graphic(currValue.features.geometry, symbol);
                                                        this.map.graphics.add(graphic);
                                                    }.bind(this));
                                                    */
                                                    
                                                    /*
                                                    let fragment = document.createDocumentFragment(); 
                                                    response.features.map(function (cValue) {                                
                                                        let formCard = document.createElement("div");
                                                        formCard.className = "form-card";
                                                        let span = document.createElement("span");
                                                        span.className = "form-item";
                                                        let div = document.createElement("div");
                                                        div.className = "form-item";
                                                        let lbl = document.createElement("label");
                                                        let tNode = document.createTextNode(`${this.countAnalysis}. ${lyr.name}`);
                                                        let iconSpan = document.createElement("span");
                                                        iconSpan.title = "ZOOM";
                                                        let iconI = document.createElement("i");
                                                        iconI.className = "fa fa-map";
                                                        iconSpan.appendChild(iconI);
                                                        lbl.appendChild(tNode);
                                                        span.appendChild(lbl);
                                                        span.appendChild(iconSpan);
                                                        this.countAnalysis++;
                                                        lyr.fields.forEach(function(arg) {
                                                            let itemDiv = document.createElement('div');
                                                            itemDiv.className = "form-item-content";
                                                            let itemLabel = document.createElement('label');
                                                            itemLabel.textContent = arg.alias;
                                                            let itemSpan = document.createElement('span');
                                                            let itemP = document.createElement('p');
                                                            itemP.textContent = cValue.attributes[arg.field];
                                                            itemSpan.appendChild(itemP);
                                                            itemDiv.appendChild(itemLabel);
                                                            itemDiv.appendChild(itemSpan);
                                                            div.appendChild(itemDiv);
                                                        });
                                                        formCard.appendChild(span);
                                                        formCard.appendChild(div);
                                                        fragment.appendChild(formCard);
                                                    }.bind(this));                            
                                                    this.ID_Result_List.appendChild(fragment); 
                                                    */
                                                    
                                                } catch (error) {
                                                    console.error(`Error: Analisis - Sin Paginación | response => ${error.name} - ${error.message}`);
                                                }                    
                                            },
                                            (error) => {  
                                                console.error(`Error: Analisis - Sin Paginación | Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                                            }
                                        ).always(lang.hitch(this, function() {
                                            /*
                                            setTimeout(() => {
                                                let abc = this.lyrGraphics.map(function(x) {
                                                    return x.geometry;
                                                });

                                                var joinedPolygons = geometryEngine.union(abc);
                                                
                                            }, 8000);
                                            */
                                            this.ID_Load_Buffer.style.display = "none";
                                            this.ID_Table_Analysis.style.display = "block"; 
                                        }.bind(this))); 
                                    }
                                } catch (error) {
                                    console.error(`Error: Analisis/queryTask.executeForCount response => ${error.name} - ${error.message}`);
                                }                    
                            },
                            (error) => {  
                                console.error(`Error: Analisis/queryTask.executeForCount - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                            }
                        ).always(lang.hitch(this, function() {
                            this.ID_Load_Buffer.style.display = "none";
                            this.ID_Table_Analysis.style.display = "block";                            
                        }.bind(this)));                            
                    }
                }.bind(this));
            } catch (error) {
                console.error(`Error: _analysis => ${error.name} - ${error.message}`);
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
                    console.log(bufferedGeometries);
            /*
            array.forEach(bufferedGeometries, function(geometry) {
              var graphic = new Graphic(geometry, symbol);
              this.map.graphics.add(graphic);
            }.bind(this));  
            */
            bufferedGeometries.map((currentValue) => {
                try {
                    
                    if (typeof(currentValue) !== 'undefined') {
                        this.map.graphics.add(new Graphic(currentValue, symbol));    
                    }
                    
                } catch (error) {
                    console.error(`Error: bufferedGeometries => ${error.name} - ${error.message}`);
                }
            });
            /*
            let symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
            let graphic = new Graphic(currValue.geometry, symbol);
            this.map.graphics.add(graphic);
            */
        },       
        _ambito: function(htmlID, htmlPH, htmlPHAlter, htmlLBL, order, oID, item, svr, queryWhere) {
            /* Carga de los SELECTOR del ámbito */
            try {
                let options = [];
                let container = domConstruct.create("div", {
                        id: `DIV_${htmlID}`,
                        style: { width: '100%' }
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
                            options.push({ name: `${name}`, id: id });
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
                    style: { width: '100%', fontSize: '13px' }
                });
        
                tableContainer.addChild(filteringSelect);
                tableContainer.startup();
                return filteringSelect;
            } catch (error) {
                console.error(`Error: _ambito => ${error.name} - ${error.message}`);
            }
        },
        _ambitoUpdate: function(htmlPHAlter, order, oID, item, svr, queryWhere) {
            /* Actualización del SELECTOR dependiente y no dependiente */
            try {
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
                return new Memory({data: options });
            } catch (error) {
                console.error(`Error: _ambitoUpdate => ${error.name} - ${error.message}`);
            }
        },
        _loadLayer: function(objectID, srv, renderColor, lbl) {
            /* Carga de capa al mapa principal */
            try {
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
            /* Retorno del color de borde del polígono */
            try {
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
            /* Retorno del borde de color */
            try {
                if(color == null)
                    return color;
                else
                    return (color = new Color(color));
            } catch (error) {
                console.error(`Error: _lineColor => ${error.name} - ${error.message}`);
            }
        },
        _zoomLayer: function(lyr, id) {
            /* Acercamiento a la capas seleccionadas del SELECTOR */
            try {
                id = id || 0; 
                let query = new Query();
                query.objectIds = [id];
                lyr.clearSelection();
                lyr.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    try {
                        features.map(function(cValue) {
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
        _validateSelect: function(objSelect){
            /* Validar la selección del ámbito */
            try {
                const VALUE_SELECT = { '00': true, '000': true, '': true };
                VALUE_SELECT_DEFAULT = false;
                return VALUE_SELECT[objSelect.get('value')] || VALUE_SELECT_DEFAULT;
            } catch (error) {
                console.error(`Error: _validateSelect => ${error.name} - ${error.message}`);
            }
        },
        _intersectLayer: function(GPL) {
            /* Intersección de las capas operativas */
            try {
                let [id, srv] = GPL;
                let query = new Query(); query.objectIds = [id];
                const lyr = new FeatureLayer(srv, { mode: FeatureLayer.MODE_SELECTION });
                lyr.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    try {
                        features.map(function(cValue) {
                            this.geometryIntersect = cValue.geometry;
                            this._jsonSRV(this.lyrList);
                        }.bind(this));
                    } catch (error) {
                        console.error(`Error: _intersectLayer/selectFeatures => ${error.name} - ${error.message}`);
                    }
                }.bind(this));
            } catch (error) {
                console.error(`Error: _intersectLayer => ${error.name} - ${error.message}`);
            }
        },
        _jsonSRV: function(lyrList) {
            /* Object: De prueba para recorrer las capas a intersectar. Función recursiva de lista de capas */
            try {
                lyrList.map(function(cValue) {
                    if(cValue.hasOwnProperty('srv')) {
                        cValue.srv.map(function(currentValue) {
                            if(currentValue.hasOwnProperty('srv')) {
                                currentValue.srv.map(function(currValue) {
                                    if(currValue.hasOwnProperty('srv')) {
                                        currValue.srv.map(function(curreVal) {
                                            this._queryTask(curreVal,curreVal);
                                        }.bind(this));
                                    } else {
                                        this._queryTask(currValue,currValue.url);
                                    }
                                }.bind(this));
                            } else {
                                this._queryTask(currentValue,currentValue.url);
                            }
                        }.bind(this));
                    } else {
                        this._queryTask(cValue,cValue.url);
                    }
                }.bind(this));
            } catch (error) {
                console.error(`Error: _jsonSRV ${error.name} - ${error.message}`);
            }            
        },
        _queryTask: function(lyr, srv) {
            try {
                this.ID_Table_Count.style.display = "none";
                this.ID_Load.style.display = "block";
                let queryTask = new QueryTask(srv);
                let query = new Query();
                query.outFields = lyr.fields.map(x => x.field);
                query.geometry = this.geometryIntersect;
                query.SpatialRelationship = "esriSpatialRelIntersects";
                query.geometryType = "esriGeometryEnvelope";
                queryTask.executeForCount(query).then(
                    (count) => {
                        try {
                            this.countResult = this.countResult + count;
                            this.ID_Count.innerText = this.countResult;
                            this.ID_CountText.innerHTML = this.textAmbito;
                            this.countItem++;
                            if(this.lyrGroup.length == 0) {
                                this.lyrGroup.push({ capa: lyr.name, cantidad: count });
                            } else {
                                let index = this._validatedData(this.lyrGroup, lyr.padre[0]);
                                if(index == false) {
                                    this.lyrGroup.push({ capa: lyr.padre[0], cantidad: count});
                                } else {                                    
                                    this.lyrGroup[index].cantidad = this.lyrGroup[index].cantidad + count;
                                }
                            }
                        } catch (error) {
                            console.error(`Error: _queryTask/queryTask.executeForCount response => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: _queryTask/queryTask.executeForCount - Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, function() {
                    this._elementById(`${this.IDTableCount_Name}_Total`).innerText = `${this.countResult}`;
                    if((this.countItem -1)  == this.lyrList.length) {
                        this.ID_Load.style.display = "none";
                        this.ID_Table_Count.style.display = "block";
                        this._sortJSON(this.lyrGroup,'cantidad','desc');                        
                        this._elementById(`${this.IDTableCount_Name}_Tbody`).innerHTML = "";                        
                        this.lyrGroup.map(function(cValue, index){
                            let fragment = document.createDocumentFragment();
                            let row = document.createElement("tr");
                            let cell_0 = document.createElement("td");
                            let cellText_0 = document.createTextNode(index + 1);
                            cell_0.appendChild(cellText_0);
                            let cell_1 = document.createElement("td");
                            let cellText_1 = document.createTextNode(cValue.capa);
                            cell_1.appendChild(cellText_1);
                            let cell_2 = document.createElement("td");
                            let cellText_2 = document.createTextNode(cValue.cantidad);
                            cell_2.appendChild(cellText_2);
                            row.appendChild(cell_0);
                            row.appendChild(cell_1);
                            row.appendChild(cell_2);
                            fragment.appendChild(row);
                            this._elementById(`${this.IDTableCount_Name}_Tbody`).appendChild(fragment);
                        }.bind(this));
                        //console.log(this.lyrGroup);
                    }
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
            /* Ordenando el json de capas */
            try {
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
            /* Se crea la tabla de resumen */
            try {
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
        },
        _removeChild: function(listDiv, divCount) {
            /* Se limpia la estructura */
            try {
                divCount.innerText = "0";
                while(listDiv.firstChild) {
                    listDiv.removeChild(listDiv.firstChild);
                }
            } catch (error) {
                console.error(`Error: _removeChild => ${error.name} - ${error.message}`);
            } 
        },
        _hola: function(lyrList) {
            if(lyrList.hasOwnProperty('srv')) {
                lyrList.map(function(cValue) {
                    console.log(cValue.name);
                    console.log(cValue.url);
                }.bind(this));
                return this._prueba(cValue.srv);
            } else {
                console.log(cValue.url);
            }
        },
        _elementById: function (paramId) {
            /* Se valida el ID */
            try {
                let id = document.getElementById(paramId);
                if(id !== null && id !== undefined)
                    return id;
                else
                    console.error(`Error: ID (${paramId}) => null || undefined`);
            } catch(error) {
                console.error(`_elementById => ${error.name} - ${error.message}`);
            }
        }
    });
});