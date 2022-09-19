let map; let featureTable;
require([
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',
  'esri/layers/FeatureLayer',
  'esri/dijit/FeatureTable',
  'esri/geometry/Polygon',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/config',
  'esri/map',
  'dojo/text!./json/config.json',
  'dojo/_base/lang',
  'dojo/parser',
  'dojo/ready',
  'dojo/on',
  'dojo/domReady!'
], function(
    Chart,
    FeatureLayer,
    FeatureTable,
    Polygon,
    Query,
    QueryTask,
    esriConfig,
    Map,
    configJSON,
    lang,
    dom,
    parser,
    ready,
    on
) {
    esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
    esriConfig.defaults.io.alwaysUseProxy = false;

    const config = JSON.parse(configJSON);
    let configDiagnosis = config.lyrDiagnosis;
    let configDiagnosis_Temp = [];
    let configAnalysis = config.lyrAnalysis;
    let configAnalysis_Temp = [];
    let reportItemTotal = 0;
    let reportItemResult = 0;
    let chartLabel = [];
    let chartData = [];
    let chartBackgroundColor = [];
    let chartID = "ID_TABLE_Graphic";
    
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

    let _reportJson = function(json, _conf, _name = "") {
        try { /* Recorre un arból de n hijos */
            let type; let resul; let layer;             
            for (var i=0; i < json.length; i++) {
                type = typeof json[i].srv;
                if (type == "undefined") {
                    reportItemTotal = reportItemTotal + 1;
                    resul = true;
                    //layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name} / <strong>${json[i].name}</strong>`;
                    layer = _name == "" ? `<strong>${json[i].name}</strong>` : `${_name}<strong>${json[i].name}</strong>`;
                    _conf.push({
                        name:layer ,
                        url:json[i].url,
                        fields:json[i].fields,
                        objectid:json[i].objectid,
                        rgb:json[i].rgb,
                        default:typeof json[i].default !== "undefined" ? true: false,
                        content:json[i].content
                    });
                } else {
                    if(_name.length == 0) { /* Se filtra solo las cabeceras una vez */
                        _conf.push({ name:json[i].name });
                    }
                    resul += _reportJson(json[i].srv, _conf, _name.concat(json[i].name + " / "));
                }
            }            
            return resul;
        } catch (error) {
            console.error(`Error: _reportJson => ${error.name} - ${error.message}`);
        }
    };

    /* Lista de ANALYSIS */
    _reportJson(configAnalysis, configAnalysis_Temp);
    /* Lista de DIAGNOSIS */
    _reportJson(configDiagnosis, configDiagnosis_Temp);
    
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
            if(Object.keys(lyr).length !== 1) { /* Se filtra para que no entre la cabeceras de grupos */
                this.ID_Load.style.display = "block";    
                this.ID_TABLE_Resumen.style.display = "none";            
                let queryTask = new QueryTask(lyr.url);
                let query = new Query();
                query.outFields = lyr.fields.map(x => x.name);
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
                            if(count === 0) {                            
                                _elementById("ID_TAB_Header").childNodes[3+_index].style.display="none";
                                _elementById("ID_TAB_Content").childNodes[3+_index].style.display="none";
                            } else {
                                const chart = Chart.getChart(chartID);
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
                        this.ID_Load.style.display = "none";
                        this.ID_TABLE_Resumen.style.display = "block";
                        /* Se limpiar TABLE */
                        _elementById(`ID_TABLE_Resumen_Tbody`).innerHTML = "";
                        //_htmlTable(_elementById("ID_TABLE_Resumen"));
                        /* Se ordena JSON */
                        _sortJSON(configDiagnosis_Temp, 'cantidad','desc'); 
                        /* Se lista capas */
                        configDiagnosis_Temp.map(function(cValue, index){
                            if(cValue.cantidad > 0 && typeof cValue.cantidad !== "undefined") {
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
                        }.bind(this)); 
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
                configDiagnosis_Temp.map(function(lyr, index) {
                    !lyr.default || _featureTable(lyr.url,lyr.objectid,lyr.fields);
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
            const data = { labels:[], datasets:[{ data:[], backgroundColor:[],borderWidth: 1 }]};
            new Chart(chartID, { 
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

    let _jsonTravelTree = function(_json, _name = "") {
		try {/* Se crea dinamicamente el TAB y CONTENT del TAB */
            let _nameTemp = "";
            _json.map(function(lyr, index) {
                const divHeader = document.createElement("div");
                divHeader.innerHTML = lyr.name;
                if(Object.keys(lyr).length === 1) {
                    divHeader.className = "header-group";
                    _nameTemp = lyr.name;
                } else {
                    divHeader.id = `Header_${index}`;
                    divHeader.className = "tablinks";
                    divHeader.onclick = function(){
                        let HeaderID = `Header_${index}`;
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

                        featureTable.destroy();
                        _featureTable(
                            nodeHeader.getAttribute("data-url"),
                            nodeHeader.getAttribute("data-objectid"),
                            JSON.parse(nodeHeader.getAttribute("data-fields"))
                        );                        
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
                divContent.id = `Content_${index}`;

                //divContent.className = !lyr.default || "active";
                const divTitle = document.createElement("section");
                divTitle.innerHTML = lyr.name;
                const divHR = document.createElement("section");
                divHR.className = "div-hr";
                const divAside = document.createElement("section");
                divAside.className = "report-table";
                divAside.id = `IDTable_${index}`;
              
                const divMain = document.createElement("main");
                if(lyr.content ?? false){
                    console.log(lyr.content ?? false);
                    
                    if(typeof lyr.content[0].tab[0].url == "undefined") {
                        console.log("CAMPOS");
                        console.log(lyr.content[0].tab[0].fields);
                        lyr.content[0].tab[0].fields.map(function(current, ind) {
                            ind = ind + 1;
                            
                            const inputText = document.createElement("input");
                            inputText.type = "radio";
                            inputText.className = "tabs-horiz";
                            inputText.id = `tab${index}${current.name}`;
                            inputText.name = `tabs-2${index}`;
                            if(typeof current.default !== "undefined") {
                                inputText.setAttribute("checked","");
                            }
                            const label = document.createElement("label");
                            label.innerText = current.alias;
                            label.setAttribute("for",`tab${index}${current.name}`);
                            
                            divMain.appendChild(inputText);
                            divMain.appendChild(label);                            
                        }.bind(this));
                    } else {
                        console.log("URL");
                        console.log(lyr.content[0].tab[0].url);
                    }      
                 
                    if(typeof lyr.content[0].tab[0].url == "undefined") {
                        console.log("CAMPOS");
                        console.log(lyr.content[0].tab[0].fields);
                        lyr.content[0].tab[0].fields.map(function(current, ind) {
                            ind = ind + 1;
                            
                            const sect = document.createElement("section");
                            sect.id = `content${index}${current.name}`;
                            const div = document.createElement("div");
                            div.innerText = current.alias;
                            sect.appendChild(div);
                            
                            divMain.appendChild(sect);                            
                        }.bind(this));
                    } else {
                        console.log("URL");
                        console.log(lyr.content[0].tab[0].url);
                    } 

                    const tagStyle = document.createElement("style");
                    let abc = "";
                    if(typeof lyr.content[0].tab[0].url == "undefined") {
                        console.log("STYLE");
                        console.log(lyr.content[0].tab[0].fields);
                        lyr.content[0].tab[0].fields.map(function(current, ind) {
                            ind = ind + 1;
                            console.log(current.name);
                            abc += `#tab${index}${current.name}:checked ~ #content${index}${current.name},`;
                            console.log(abc);
                            
                        }.bind(this));
                    } else {
                        console.log("URL");
                        console.log(lyr.content[0].tab[0].url);
                    } 

                    if(abc !== "") {
                        let abc_2 = abc.substring(0, abc.length - 1);
                        console.log(abc_2);
                        tagStyle.textContent = abc_2.concat("{display: block;};");
                        divMain.appendChild(tagStyle);
                    }
                 

                    divAside.appendChild(divMain); 
                }
                

               

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
    _elementById("ID_TAB_Header").childNodes[4].className = "active";
	_elementById("ID_TAB_Content").childNodes[4].className = "active";*/
    

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