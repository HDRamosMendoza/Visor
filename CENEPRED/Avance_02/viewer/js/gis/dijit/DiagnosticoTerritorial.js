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
    'dojo/text!./DiagnosticoTerritorial/config.json',
    'dojo/aspect',
    'dojo/_base/lang',
    'dojo/dom-construct',
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
    configJSON,    
    aspect,
    lang,
    domConstruct,
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
        countItem: 1,
        countResult: 0,
        postCreate: function () {
            this.inherited(arguments);
            const config = JSON.parse(configJSON);
            console.log("in postCreate");
            this._htmlSummary();

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
            this.lyrList = config.lyrList;
            
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
                    this.ID_CountText.innerHTML  = "Coincidencias";
                    this.ID_CountResult.innerHTML  = "0 - 0";
                    this.ID_Table_Count.innerHTML = '';
                    this._htmlSummary();
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
                    console.log(selDis.get('value'));
                    let objectLiteral = false == this._validateSelect(selDis) ? [selDis.get('value'),srvDis.url,selDis.get('displayedValue'),"Distrito"] :
                                        false == this._validateSelect(selPro) ? [selPro.get('value'),srvPro.url,selPro.get('displayedValue'),"Provincia"] :
                                        false == this._validateSelect(selDep) ? [selDep.get('value'),srvDep.url,selDep.get('displayedValue'),"Departamento"] :
                                        true;                    
                    if(objectLiteral == true) {
                        disp.style.display = "block";
                        setTimeout(() => { disp.style.display = "none"; }, 3000);
                        return false;
                    }
                    /* Reinicia contador */
                    this.countItem = 1;
                    this.countResult = 0;
                    /* Mostrar la segunda pestaña */
                    document.getElementById("tab2").click();                    
                    this.ID_Table_Count.style.display = "none";
                    this.ID_Load.style.display = "block";                    
                    /* Eliminar contenido del resultado */
                    this._removeChild(document.getElementById("ID_Table_Tbody"), this.ID_Count, this.ID_CountResult);
                    /* Intersect layer */
                    this._intersectLayer(objectLiteral);
                } catch (error) {
                    console.error(`Error: button/ID_Diagnosis (click) => ${error.name} - ${error.message}`);
                }
            })));

        },
        startup: function() {
            console.log("in startup");
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
                            let stateExtent = cValue.geometry.getExtent();
                            this.map.setExtent(stateExtent.expand(1.5));
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
                let [id, srv, selected, ambito] = GPL;
                window.selected = selected; window.ambito = ambito;
                let query = new Query(); query.objectIds = [id];
                const lyr = new FeatureLayer(srv, { mode: FeatureLayer.MODE_SELECTION });
                lyr.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    try {
                        features.map(function(cValue) {
                            this._jsonSRV(this.lyrList, cValue.geometry);
                        }.bind(this));
                    } catch (error) {
                        console.error(`Error: _intersectLayer/selectFeatures => ${error.name} - ${error.message}`);
                    }
                }.bind(this));
            } catch (error) {
                console.error(`Error: _intersectLayer => ${error.name} - ${error.message}`);
            }
        },
        _jsonSRV: function(lyrList, graphicGeometry) {
            /* Object: De prueba para recorrer las capas a intersectar. Función recursiva de lista de capas */
            try {
                lyrList.map(function(cValue) {
                    if(cValue.hasOwnProperty('srv')) {
                        cValue.srv.map(function(currentValue) {
                            if(currentValue.hasOwnProperty('srv')) {
                                currentValue.srv.map(function(currValue) {
                                    if(currValue.hasOwnProperty('srv')) {
                                        currValue.srv.map(function(curreVal) {
                                            this._queryTask(curreVal,curreVal,graphicGeometry);
                                        }.bind(this));
                                    } else {
                                        this._queryTask(currValue,currValue.url,graphicGeometry);
                                    }
                                }.bind(this));
                            } else {
                                this._queryTask(currentValue,currentValue.url,graphicGeometry);
                            }
                        }.bind(this));
                    } else {
                        this._queryTask(cValue,cValue.url,graphicGeometry);
                    }
                }.bind(this));
            } catch (error) {
                console.error(`Error: _jsonSRV ${error.name} - ${error.message}`);
            }
            
        },
        _queryTask: function(lyr, srv, graphicGeometry) {
            try {
                this.ID_Table_Count.style.display = "none";
                this.ID_Load.style.display = "block";
                let queryTask = new QueryTask(srv);
                let query = new Query();
                query.outFields = lyr.fields.map(x => x.field);
                query.geometry = graphicGeometry;
                query.SpatialRelationship = "esriSpatialRelIntersects";
                query.geometryType = "esriGeometryEnvelope";
                queryTask.execute(query).then(
                    (response) => {
                        try {
                            let fragment = document.createDocumentFragment();
                            let row = document.createElement("tr");
                            let cell_0 = document.createElement("td");
                            let cellText_0 = document.createTextNode(this.countItem);
                            cell_0.appendChild(cellText_0);
                            let cell_1 = document.createElement("td");
                            let cellText_1 = document.createTextNode(lyr.name);
                            cell_1.appendChild(cellText_1);
                            let cell_2 = document.createElement("td");
                            let cellText_2 = document.createTextNode(response.features.length);
                            cell_2.appendChild(cellText_2);
                            row.appendChild(cell_0);
                            row.appendChild(cell_1);
                            row.appendChild(cell_2);
                            fragment.appendChild(row);
                            document.getElementById("ID_Table_Tbody").appendChild(fragment);
                            this.countResult = this.countResult + response.features.length;
                            this.ID_CountText.innerText = `Coincidencias: ${window.ambito} - ${window.selected}`;
                            this.ID_Count.innerText = this.countResult;
                            this.ID_CountResult.innerText = `1 - ${this.countResult}`;
                            this.countItem++;
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
                                let tNode = document.createTextNode(`${this.countItem}. ${lyr.name}`);
                                let iconSpan = document.createElement("span");
                                iconSpan.title = "ZOOM";
                                let iconI = document.createElement("i");
                                iconI.className = "fa fa-map";
                                iconSpan.appendChild(iconI);
                                lbl.appendChild(tNode);
                                span.appendChild(lbl);
                                span.appendChild(iconSpan);
                                this.countItem++;
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
                            this.ID_Result_List.appendChild(fragment);*/
                        } catch (error) {
                            console.error(`Error: _queryTask/queryTask.execute response => ${error.name} - ${error.message}`);
                        }                    
                    },
                    (error) => {  
                        console.error(`Error: Oops! En el servidor o en el servicio => ${error.name} - ${error.message}`);
                    }
                ).always(lang.hitch(this, function() {
                    //this.ID_Count.innerText = this.ID_Result_List.childNodes.length;
                    //this.ID_CountResult.innerText = `1 - ${this.ID_Result_List.childNodes.length}`;
                    this.ID_Load.style.display = "none";
                    this.ID_Table_Count.style.display = "block";
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
        _htmlSummary: function() {
            try {
                let tbl = document.createElement("table");
                tbl.className = "tbl";
                let tblHead = document.createElement("thead");

                let rowHead = document.createElement("tr");

                let rowHeadTH_Item = document.createElement("th");
                let rowHeadTH_ItemNode = document.createTextNode("#");
                rowHeadTH_Item.appendChild(rowHeadTH_ItemNode);

                let rowHeadTH_Name = document.createElement("th");
                let rowHeadTH_NameNode = document.createTextNode("Capas");
                rowHeadTH_Name.appendChild(rowHeadTH_NameNode);

                let rowHeadTH_Count = document.createElement("th");
                let rowHeadTH_CountSize = document.createTextNode("Cantidad");
                rowHeadTH_Count.appendChild(rowHeadTH_CountSize);

                rowHead.appendChild(rowHeadTH_Item);
                rowHead.appendChild(rowHeadTH_Name);
                rowHead.appendChild(rowHeadTH_Count);
                tblHead.appendChild(rowHead);

                let tblBody = document.createElement("tbody");
                tblBody.id = "ID_Table_Tbody";
                let row = document.createElement("tr");
                let rowTD = document.createElement("td");
                rowTD.colSpan = "3";
                rowTD.style.textAlign = "center";
                let rowTD_Node = document.createTextNode("Sin Coincidencias");

                rowTD.appendChild(rowTD_Node);
                row.appendChild(rowTD);
                tblBody.appendChild(row);
                tbl.appendChild(tblHead);
                tbl.appendChild(tblBody);

                this.ID_Table_Count.appendChild(tbl);
            } catch (error) {
                console.error(`Error: _htmlSummary => ${error.name} - ${error.message}`);
            }
        },
        _removeChild: function(listDiv, divCount, divCountResult) {
            try {
                divCount.innerText = "0";
                divCountResult.innerText = "0 - 0";
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
                return this._prueba(cValue.srv); /*console.log(currentValue.url);*/
            } else {
                console.log(cValue.url);
            }
        }
    });
});