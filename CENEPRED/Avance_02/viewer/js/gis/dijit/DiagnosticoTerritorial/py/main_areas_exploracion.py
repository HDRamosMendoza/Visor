#!/usr/bin/env python
# -*- coding: utf-8 -*-
import zipfile
import os
import random
import time
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
# arcpy.env.workspace = os.path.join(r"D:\RepositorioGitHub\Visor\CENEPRED\Avance_02\viewer\js\gis\dijit\DiagnosticoTerritorial\py\sigrid.gdb")
cnn_sde = os.path.join(r"C:\Users\DanielRamos\AppData\Roaming\Esri\Desktop10.4\ArcCatalog\Biodiversidad.sde")
# Spatial Reference
# Spatial Reference
arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(4326)
# Overwrite Output
arcpy.env.overwriteOutput = True        
# Lista de capas (cadena separadas por comas)
geoLayer = arcpy.GetParameterAsText(0) # capa
# Poligono de intersección
geojson_polygon = arcpy.GetParameterAsText(1)
#geoLayer = 'ZRMN,EVAR,planes_PPRRD'
geoLayer = 'AreasExposicion|asd'
#geoFormat = "GDB" #"GDB" || "SHP" || "GDB" || "PRUEBA"
geojson_polygon = '''{ 
                    "type": "Polygon", 
                    "coordinates": [
                        [[-79.8486328125,-7.1663003819031825],[-78.22265625,-8.993600464280018],[-75.52001953125,-6.271618064314864],[-79.16748046874999,-5.615985819155327],[-79.8486328125,-7.1663003819031825]]
                    ],
                    "spatialReference" : { "wkid" : 4326 }
                }'''

arcpy.AddMessage("Parametro 1: " + geoLayer)
arcpy.AddMessage("Parametro 2: " + geojson_polygon)
arcpy.AddMessage("Ruta scratch : " + scratch_GDB)
print(".... CORRIENDO")
def nameAlone(_name):
    _name = _name.replace(".", "")
    if('/' in _name):
        return _name[_name.rfind('/')+1:] 
    else:
        return _name

if __name__ == '__main__':
    if len(geoLayer) > 0 and len(geojson_polygon) > 0:
        # Convert STRING to JSON
        string_to_json = json.loads(geojson_polygon)
        _lyrCoord = array(string_to_json["coordinates"][0])
        _tuplePolygon = tuple(tuple(a_m.tolist()) for a_m in _lyrCoord)
        _stringCoord = ""
        for long, lat in _tuplePolygon:
            _stringCoord += "{0} {1},".format(str(long),str(lat))
        else:
            _stringCoord = "(("+_stringCoord[0:(len(_stringCoord)-1)]+"))"        
        
        # Bucle layer
        lyr, alias = geoLayer.split("|")
        # Download PRUEBA
        response = dict()
        response["D_PATH"] = { "path": scratch_Folder }
        response["D_LYR"] = { "alis": lyr }
        response["D_ALIAS"] = { "alis": alias }
        
        arcpy.MakeQueryLayer_management(cnn_sde,alias,'''
            SELECT * 
            FROM {0} lyr 
            WHERE sde.st_intersects(lyr.shape, sde.st_geometry('polygon {1}',4326)) = 1
        '''.format(lyr,_stringCoord))

        _aliasLyr = "INEI"
        _manzanas = "INEI_ManzanasReferenciales"
        arcpy.MakeQueryLayer_management(cnn_sde,_aliasLyr,'''
            SELECT * 
            FROM {0} lyrManzanas  
        '''.format(_manzanas))
        arcpy.CopyFeatures_management(_aliasLyr, os.path.join(scratch_GDB,"{}".format(_manzanas.replace(".", ""))))

        fields = ['SHAPE@JSON']
        #_arr = [u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_1.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_2.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_3.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_90.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_91.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_92.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_93.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_94.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_95.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_96.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_97.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_98.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_99.shp', u'C:\\Users\\DANIEL~1\\AppData\\Local\\Temp\\scratch\\n_100.shp']
        _arr = []
        _count = 0
        with arcpy.da.SearchCursor(alias, fields) as cursor:
            for row in cursor:
                _count = _count + 1
                if(_count < 15):
                    convert_AsShape = arcpy.AsShape(row[0],True)
                    arcpy.CopyFeatures_management(convert_AsShape, os.path.join(scratch_Folder,"{0}{1}".format("n_",str(_count))))
                    _arr.append(os.path.join(scratch_Folder,"{0}{1}.shp".format("n_",str(_count))))
                    
        print(scratch_GDB)
        _union = os.path.join(scratch_GDB,"{}".format("geomtry_union"))
        arcpy.Union_analysis(_arr, _union)
        
        _intersect = os.path.join(scratch_GDB,"{}".format("geomtry_intersect"))
        arcpy.Intersect_analysis ([
            os.path.join(scratch_GDB,"{}".format(_manzanas.replace(".", ""))),
            _union
        ], _intersect)

        
        #WHERE sde.st_intersects(lyr.shape, sde.st_geometry('polygon {1}',4326))
        
        #arcpy.CopyFeatures_management("_union", os.path.join(scratch_Folder,"{}".format("geomtry_union")))

        #arcpy.Union_analysis (_arr, alias + "_union")

        #arcpy.CopyFeatures_management(alias + "_union", os.path.join(scratch_Folder,"{}".format(alias.replace(".", ""))))
        
        # Response KMZ
        #arcpy.SetParameterAsText(3, _pathZip)
        resp = json.dumps(response)
        arcpy.SetParameterAsText(2, resp)
        '''
        for layer in item:
            lyr,alias = layer.split("|")
            print(lyr)
            print(alias)
            layer_temp = lyr + time_file
            layer_temp = nameAlone(layer_temp)
           
            arcpy.MakeQueryLayer_management(cnn_sde,alias,
                SELECT 
                    sum(lyr_2017.pob_total) as poblacion,
                    sum(lyr_2017.num_viv_part) as vivienda
                FROM {0} lyr_2017 
                WHERE sde.st_intersects(
                    lyr.shape, 
                    (
                        SELECT 
                        sde.st_area(sde.st_union(lyr.shape))
                        FROM {0} lyr 
                        WHERE sde.st_intersects(lyr.shape, sde.st_geometry('polygon {1}',4326))
                    ) 
                )
            .format(lyr,_stringCoord))
            arcpy.CopyFeatures_management(alias, os.path.join(scratch_Folder,"{}".format(alias.replace(".", ""))))
           
        # Response KMZ
        #arcpy.SetParameterAsText(3, _pathZip)
        resp = json.dumps(response)
        arcpy.SetParameterAsText(2, resp)
        '''