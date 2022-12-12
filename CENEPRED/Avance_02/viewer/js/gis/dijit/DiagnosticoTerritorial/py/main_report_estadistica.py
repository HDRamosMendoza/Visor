#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import arcpy
import json
from os.path import basename
from numpy import array

# Default Folder
scratch_Folder = arcpy.env.scratchFolder
arcpy.AddMessage("Scracth {}".format(scratch_Folder))
# Default GDB
scratch_GDB = arcpy.env.scratchGDB
# Workspace - PATH .SDE
cnn_sde = os.path.join(r"C:\sigrid.sde")
# Spatial Reference
arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(4326)
# Overwrite Output
arcpy.env.overwriteOutput = True        
# Lista de capas (cadena separadas por comas)
lyr_00 = arcpy.GetParameterAsText(0) # capa
# Poligono de intersección (área de interés)
geojson_polygon = arcpy.GetParameterAsText(1)
lyr_99 = "bdcenepred.elementos_expuestos.INEI_ManzanasReferenciales"
lyr_00 = "bdcenepred.cartografia_peligros.AreasAfectadasFlujos"
geojson_polygon = '''{ 
                    "type": "Polygon", 
                    "coordinates": [
                        [[-79.8486328125,-7.1663003819031825],[-78.22265625,-8.993600464280018],[-75.52001953125,-6.271618064314864],[-79.16748046874999,-5.615985819155327],[-79.8486328125,-7.1663003819031825]]
                    ],
                    "spatialReference" : { "wkid" : 4326 }
                }'''

arcpy.AddMessage("Parametro 1: " + lyr_00)
arcpy.AddMessage("Parametro 2: " + geojson_polygon)
arcpy.AddMessage("Ruta scratch: " + scratch_GDB)

def nameAlone(_name):
    _name = _name.replace(".", "")
    if('/' in _name):
        return _name[_name.rfind('/')+1:] 
    else:
        return _name

if __name__ == '__main__':
    if len(lyr_00) > 0 and len(geojson_polygon) > 0:
        response = dict()
        string_to_json = json.loads(geojson_polygon)
        geo_polygon = arcpy.AsShape(string_to_json)

        # AREAS
        arcpy.MakeFeatureLayer_management(os.path.join(cnn_sde,lyr_00), "temp_areas")
        arcpy.SelectLayerByLocation_management("temp_areas", "INTERSECT", geo_polygon)
        arcpy.CopyFeatures_management("temp_areas", os.path.join(scratch_GDB,"select_temp_areas"))
        values = [row[0] for row in arcpy.da.SearchCursor("temp_areas",['SHAPE@'])]
        area_union = os.path.join(scratch_GDB,"temp_areas_union")
        arcpy.Union_analysis(values, area_union)
        
        # MANZANAS
        arcpy.MakeFeatureLayer_management(area_union, "temp_union")
        arcpy.MakeFeatureLayer_management(os.path.join(cnn_sde,lyr_99), "temp_manzanas")
        arcpy.SelectLayerByLocation_management("temp_manzanas", "INTERSECT", "temp_union")
        arcpy.CopyFeatures_management("temp_manzanas", os.path.join(scratch_GDB,"select_temp_manzanas"))
        total_pob = [row[0] for row in arcpy.da.SearchCursor("temp_manzanas",['pob_total'])]
        total_viv = [row[0] for row in arcpy.da.SearchCursor("temp_manzanas",['num_viv_part'])]

        # SUMA TOTAL POBLACION
        sum_pob = sum([total for total in total_pob if total is not None])
        response["total_poblacion"] = sum_pob
        # SUMA TOTAL VIVIENDA
        sum_viv = sum([total for total in total_viv if total is not None])
        response["total_vivienda"] = sum_viv 

        # Response
        resp = json.dumps(response)
        arcpy.SetParameterAsText(2, resp)