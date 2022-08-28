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





