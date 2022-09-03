let _elementById = function (paramId) {
	try {
	    let id = document.getElementById(paramId);
	    if(id !== null && id !== undefined){
	        return id;
	    } else {
	        console.log(`
	        	Error: ID(${paramId}) => null || undefined
	        `);
	    }
	} catch(error) {
  		console.error(`
  			_elementById: ${error.name} - ${error.message}.
  		`);
	}
};

/* Oculta todos los TAG que esta asociado a cada pestaña */
let _tabDesactive = function(node) {
	try {
    	for (let i = 0; i < node.length; i++) {
			_elementById(node[i].id + "_TAB").style.display = "none";
    	}
    } catch(error) {
  		console.error(`
  			_tabDesactive: ${error.name} - ${error.message}.
  		`);
	}
};

/* Activa TAG de la pestaña que se da clic */
let _tabActive = function() {
	try {
    	const nodeCheckboxTabs = document.querySelectorAll(`
    		.scroll-menu input[name='tabs']
    	`);
    	for(let i = 0; i<nodeCheckboxTabs.length; i++){
    		nodeCheckboxTabs[i].addEventListener('click', function(){
    			_tabDesactive(nodeCheckboxTabs);
    			let id = this.id;
            	_elementById(id).click();
                _elementById(id + "_TAB").style.display = "block";
        	});
        }
    } catch(error) {
  		console.error(`
  			_tabActive: ${error.name} - ${error.message}.
  		`);
	}
};

let _htmlSummary = function(_id) {
	try {
		let tblDiv = document.createElement("div");
		tblDiv.className = "report-subtitle";
		let rowTD_NodeDiv = document.createTextNode("Resumen:");
		tblDiv.appendChild(rowTD_NodeDiv);

		let tbl = document.createElement("table");
		tbl.className = "tbl";
		let tblHead = document.createElement("thead");

		let rowHead = document.createElement("tr");

		let rowHeadTH_Item = document.createElement("th");
		let rowHeadTH_ItemNode = document.createTextNode("#");
		rowHeadTH_Item.appendChild(rowHeadTH_ItemNode);

		let rowHeadTH_Name = document.createElement("th");
		let rowHeadTH_NameNode = document.createTextNode("Descripción");
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
		/*
		let rowTD_Node = document.createTextNode("Sin Coincidencias");
		rowTD.appendChild(rowTD_Node);
		row.appendChild(rowTD);
		*/
		tblBody.appendChild(row);
		tbl.appendChild(tblHead);
		tbl.appendChild(tblBody);

		let tblFoot = document.createElement("tfoot");
		let rowFoot = document.createElement("tr");
		let rowFootTD = document.createElement("td");
		rowFootTD.colSpan = "2";
		rowFootTD.style.textAlign = "right";
		rowFootTD.style.fontWeight = "900";

		let rowFootTD_Text = document.createTextNode("Total");
		rowFootTD.appendChild(rowFootTD_Text);

		let rowFootTDCant = document.createElement("td");
		rowFootTDCant.style.textAlign = "right";
		
		let rowFootTD_Cant = document.createTextNode("0");
		rowFootTDCant.id = "ID_Total";
		rowFootTDCant.appendChild(rowFootTD_Cant);

		rowFoot.appendChild(rowFootTD);
		rowFoot.appendChild(rowFootTDCant);
		tblFoot.appendChild(rowFoot);

		tbl.appendChild(tblFoot);
		/*
		tblDiv.appendChild(tbl);
		*/
		_elementById(_id).appendChild(tblDiv);
		_elementById(_id).appendChild(tbl);
	} catch (error) {
		console.error(`Error: _htmlSummary => ${error.name} - ${error.message}`);
	}
}
_htmlSummary("ID_TableSummary");

let _htmlSummaryLoad = function() {
	try {
		let countItem = 1;
		let countCant = 0;
		let arr = [
			{"name":"Información", "cant": 4},
			{"name":"Información", "cant": 54},
			{"name":"Información", "cant": 48}
		];
		arr.map(function(currentValue) {
			let fragment = document.createDocumentFragment();
			let row = document.createElement("tr");
			let cell_0 = document.createElement("td");
			let cellText_0 = document.createTextNode(countItem);
			cell_0.appendChild(cellText_0);
			let cell_1 = document.createElement("td");
			let cellText_1 = document.createTextNode(currentValue.name);
			cell_1.appendChild(cellText_1);
			let cell_2 = document.createElement("td");
			let cellText_2 = document.createTextNode(currentValue.cant);
			cell_2.appendChild(cellText_2);
			row.appendChild(cell_0);
			row.appendChild(cell_1);
			row.appendChild(cell_2);
			fragment.appendChild(row);
			document.getElementById("ID_Table_Tbody").appendChild(fragment);
			countItem++;
			countCant = countCant + currentValue.cant;
			document.getElementById("ID_Total").innerText = countCant;
		});
		
	} catch (error) {
		console.error(`Error: _htmlSummaryLoad => ${error.name} - ${error.message}`);
	}
};
_htmlSummaryLoad();

/* */

const abc = {"lyrList": [
	{ 
		"name": "Información CENEPRED",
		"srv": [
			{ 
				"name": "Planes PPRRD",
				"fields":[
					{
						"alias": "Nombre",
						"field": "nombre"
					},
					{
						"alias": "Descripción",
						"field": "descripcion"
					},
					{
						"alias": "Ámbito",
						"field": "ambito"
					},
					{		
						"alias": "Autor Corporativo",
						"field": "autor_corporativo"
					}
				],
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Informacion_CENEPRED/MapServer/3010000"
			}
		]
	},
	{ 
		"name": "Papu CENEPRED",
		"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Informacion_CENEPRED/MapServer/3010000"
		
	},
	{ 
		"name": "Cartografía Riesgos",
		"srv": [
			{
				"name": "Evaluaciones de Riesgo",
				"fields":[
					{
						"alias": "Nombre",
						"field": "nombre"
					},
					{
						"alias": "Descripción",
						"field": "descripcion"
					}
				],
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Cartografia_Riesgos/MapServer/4010000"
			},
			{ 
				"name": "Zonas de Riesgo No Mitigables",
				"fields":[
					{
						"alias": "Predio",
						"field": "nom_predio"
					},
					{
						"alias": "Fecha Doc.",
						"field": "fecha_doc"
					},
					{
						"alias": "Información",
						"field": "bdcenepred_informacion_compleme"
					},
					{
						"alias": "Parte Registral",
						"field": "part_regis"
					}
				],
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Cartografia_Riesgos/MapServer/4020000"
			}
		]
	}
]
};

console.log(abc);

function hola(_abc) {
	/*
	if(!_abc.srv) {
		_abc.map(function(currentValue) {
			
			//console.log(currentValue);
			if(!currentValue.srv) {
				console.log("NO TIENE SRV");
				ab.push(
					{
						"name": currentValue.name,
						"url": currentValue.url
					}
				);
				return {
					"name": currentValue.name,
					"url": currentValue.url
				};
				//return {"url": currentValue.url};
			} else {
				console.log("SI TIENE SRV");
				ab.push(
					{
						"name": currentValue.name,
						"hijos":[ hola(currentValue)]
					}
				);
				//return hola(currentValue.srv);
			}

		});

	} else {
		ab.push(
			{"name": _abc.name, "url": _abc.url}
		);
	}
	*/

	return [
		{
			"hijos": abc
		}

	];
	


	
	
	if (!_abc.srv){
        this._treeDefault.push(nodeOD.id);
        return true;
      } else {
        this._treeDefault.push(nodeOD.id);
        return this._getRamos(nodeOD.parent);
      } 
	  
};

let ac = hola(abc.lyrList);
console.log("ac");
console.log(ac);
console.log("ac");

function _class(name) {
	return document.getElementsByClassName(name);
}

let tabPanes = _class("tab-header")[0].getElementsByTagName("div");

for(let i=0;i<tabPanes.length;i++){
	tabPanes[i].addEventListener("click", function(){
	
		_class("tab-header")[0].getElementsByClassName("active")[0].classList.remove("active");
		tabPanes[i].classList.add("active");

		_class("tab-indicator")[0].style.top = `calc(80px + ${i*50}px)`;
		
		_class("tab-content")[0].getElementsByClassName("active")[0].classList.remove("active");
		_class("tab-content")[0].getElementsByTagName("div")[i].classList.add("active");
	
	});
}

let jsonData = [
	{ 
		"name": "Centros Poblados",
		"fields":[
			{
				"alias": "objectid_1",
				"field": "objectid_1"
			}
		],
		"analysis": false,
		"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2110002"
	},
	{ 
		"name": "Establecimientos de Salud",
		"fields":[
			{
				"alias": "objectid",
				"field": "objectid"
			}
		],
		"analysis": false,
		"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2020000"
	},
	{ 
		"name": "Instituciones Educativas",
		"fields":[
			{
				"alias": "objectid",
				"field": "objectid"
			}
		],
		"analysis": false,
		"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2030000"
	},
	{ 
		"name": "Recursos Para Respuesta",
		"fields":[
			{
				"alias": "objectid",
				"field": "objectid"
			}
		],
		"analysis": false,
		"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2040000"
	},
	{ 
		"name": "Penitenciarias",
		"fields":[
			{
				"alias": "objectid",
				"field": "objectid"
			}
		],
		"analysis": false,
		"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2050000"
	},
	{ 
		"name": "Infraestructura Vial y Transporte",
		"srv":[
			{ 
				"name": "Transporte",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2060100"
			},
			{ 
				"name": "Red Ferroviaria",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": true,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2060200"
			},
			{ 
				"name": "Red Vial",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": true,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2060300"
			},
			{ 
				"name": "Otra Infraestructura",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2060400"
			}
		]
	},
	{ 
		"name": "Infraestructura Eléctrica y Sanitaria",
		"srv":[
			{ 
				"name": "Infraestructura Eléctrica",
				"srv":[
					{ 
						"name": "Línea de Transmisión",
						"fields":[
							{
								"alias": "Objectid",
								"field": "objectid"
							}
						],
						"analysis": false,
						"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2070101"
					},
					{ 
						"name": "Central Hidraúlica",
						"fields":[
							{
								"alias": "Objectid",
								"field": "objectid"
							}
						],
						"analysis": false,
						"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2070102"
					},
					{ 
						"name": "Central Térmica",
						"fields":[
							{
								"alias": "Objectid",
								"field": "objectid"
							}
						],
						"analysis": false,
						"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2070103"
					}
				]
			},
			{ 
				"name": "Infraestructura Sanitaria",
				"fields":[
					{
						"alias": "ObjectID",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2070200"
			}
		]
	},
	{ 
		"name": "Infraestructura Hídrica",
		"srv":[
			{ 
				"name": "Pozos, Presas y Bocatomas",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2080100"
			},
			{ 
				"name": "Canales",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2080200"
			},
			{ 
				"name": "Reservorios",
				"fields":[
					{
						"alias": "objectid_1",
						"field": "objectid_1"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2080300"
			},
			{ 
				"name": "Infraestructura de Prevención y/o Reducción",
				"fields":[
					{
						"alias": "objectid_1",
						"field": "objectid_1"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2080400"
			}
		]
	},
	{ 
		"name": "Infraestructura para Hidrocarburos",
		"srv":[
			{ 
				"name": "Refinerias",
				"fields":[
					{
						"alias": "objectid_1",
						"field": "objectid_1"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2090100"
			},
			{ 
				"name": "Establecimientos",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2090200"
			},
			{ 
				"name": "Plantas de Abastecimiento de Combustibles Líquidos",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid_1"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2090300"
			},
			{ 
				"name": "Planta Envasadora de GLP",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid_1"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2090400"
			},
			{ 
				"name": "Gasoducto, Oleoducto y Poliducto",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2090500"
			}
		]
	},
	{ 
		"name": "Predios Urbanos y Rurales ",
		"srv":[
			{ 
				"name": "Manzanas Referenciales 2017 01",
				"fields":[
					{
						"alias": "objectid_1",
						"field": "objectid_1"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2100300"
			},
			{ 
				"name": "Manzanas Referenciales 2017 02",
				"fields":[
					{
						"alias": "objectid",
						"field": "objectid"
					}
				],
				"analysis": false,
				"url": "https://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer/2100400"
			}
		]
	}];


