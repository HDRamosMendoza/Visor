#!/usr/bin/env python
# -*- coding: utf-8 -*-
import zipfile
import os
import random
import time
import arcpy
import json
from os.path import basename
import numpy as array

# Default Folder
scratch_Folder = arcpy.env.scratchFolder
arcpy.AddMessage("Scracth {}".format(scratch_Folder))
# Default GDB
scratch_GDB = arcpy.env.scratchGDB
# Workspace - PATH .SDE
# arcpy.env.workspace = os.path.join(r"D:\RepositorioGitHub\Visor\CENEPRED\Avance_02\viewer\js\gis\dijit\DiagnosticoTerritorial\py\sigrid.gdb")
cnn_sde = os.path.join(r"D:\RepositorioGitHub\Visor\CENEPRED\Avance_02\viewer\js\gis\dijit\DiagnosticoTerritorial\py\sigrid.gdb")
# Spatial Reference
arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(4326)
# Overwrite Output
arcpy.env.overwriteOutput = True        
# Random value
randomBegin = 1000
randomEnd = 9999
time_file = time.strftime("%d%m%y") + "_" + str(random.randint(randomBegin,randomEnd))
# Nombre de KMZ
nameFileKMZ_Zip = str("SIGRID_KMZ_" + time_file)
# Nombre de SHP
nameFileSHP_Zip = str("SIGRID_SHP_" + time_file)
# Nombre de GDB
nameFileGDB_Zip = str("SIGRID_GDB_" + time_file + ".gdb")
# Lista de capas (cadena separadas por comas)
geoLayer = arcpy.GetParameterAsText(0)
# Poligono de intersección
geojson_polygon = arcpy.GetParameterAsText(1)
# Formato a descargar
geoFormat = arcpy.GetParameterAsText(2)
#geoLayer = 'ZRMN,EVAR,planes_PPRRD'
#geoLayer = 'bdcenepred.v3.v_documento_pprrd,bdcenepred.v3.v_documento_evar_con_indicadores,bdcenepred.informacion_complementa.zonas_riesgo_no_mitigables,bdcenepred.cartografia_peligros.Areas_expuestas_inundaciones_1,bdcenepred.cartografia_peligros.Inventario_inundacion_2,bdcenepred.informacion_complementa.Puntos_control_geologico,bdcenepred.informacion_complementa.FENC_afect_VIV,bdcenepred.informacion_complementa.FENC_afect_CARRETERA,bdcenepred.informacion_complementa.FENC_afect_OBRASINFRA,bdcenepred.cartografia_peligros.Fajas_marginales_1,bdcenepred.cartografia_peligros.Pasivos_ambientales_mineros_,bdcenepred.cartografia_peligros.zona_critica,bdcenepred.cartografia_peligros.AreaInundacionTsunami'
#geoFormat = "GDB" #"GDB" || "SHP" || "GDB" || "PRUEBA"
'''geojson_polygon = { 
                    "type": "Polygon", 
                    "coordinates": [
                        [[-79.8486328125,-7.1663003819031825],[-78.22265625,-8.993600464280018],[-75.52001953125,-6.271618064314864],[-79.16748046874999,-5.615985819155327],[-79.8486328125,-7.1663003819031825]]
                    ],
                    "spatialReference" : { "wkid" : 4326 }
                }'''

arcpy.AddMessage("Parametro 1: " + geoLayer)
arcpy.AddMessage("Parametro 2: " + geoFormat)
arcpy.AddMessage("Parametro 3: " + geojson_polygon)
arcpy.AddMessage("Ruta scratch : " + scratch_GDB)

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
        # Create FEATURE
        polygon = arcpy.AsShape(string_to_json)
        # Bucle layer
        item = geoLayer.split(",")
        # Download PRUEBA
        if(geoFormat == "PRUEBA"):
            response = dict()
            item = geoLayer.split(",")
            descGDB = arcpy.Describe(cnn_sde)
            response["GDB_PATH"] = { "path": arcpy.env.workspace }
            response["GDB_NUEVA"] = { "name": "NUEA" }
            response["GDB_NAME"] = { "name": descGDB.name }
            response["GDB_DATATYPE"] = { "datatype": descGDB.dataType }
            response["GDB_CATALOG"] = { "catalog": descGDB.catalogPath }
            response["GDB_tuple"] = { "tuple": _stringCoord }
            #if not arcpy.Exists(nameFileSHP):
            #    os.mkdir(os.path.join(scratch_Folder,nameFileSHP))            
            for layer in item:
                # Add name SHP
                layer_temp = layer + time_file
                layer_temp = nameAlone(layer_temp)
                arcpy.MakeQueryLayer_management(cnn_sde,"Slickrock",'''select * from {0}'''.format(layer,polygon))
                # Ruta de destino de la conversion de un SHP
                arcpy.CopyFeatures_management("Slickrock", os.path.join(scratch_Folder,"{}".format(layer.replace(".", ""))))
            
            _pathZip = os.path.join(scratch_Folder,nameFileSHP_Zip + ".zip")
            zfile = zipfile.ZipFile(_pathZip, "w", zipfile.ZIP_STORED)
            files = os.listdir(os.path.join(scratch_Folder))
            for f in files:
                if f.endswith("shp") or f.endswith("dbf") or f.endswith("shx") or f.endswith("cpg") or f.endswith("prj") or f.endswith("sbn") or f.endswith("sbx") or f.endswith("xml"):
                    _pathFile = os.path.join(scratch_Folder,f)
                    zfile.write(_pathFile,basename(_pathFile))
            zfile.close()
            arcpy.AddMessage("Ruta ZIP : " + _pathZip)
            # Response KMZ
            #arcpy.SetParameterAsText(3, _pathZip)
            resp = json.dumps(response)
            arcpy.SetParameterAsText(3, resp)
        # Download KMZ
        if(geoFormat == "KMZ"):
            for layer in item:
                lyr,alias = layer.split("|")
                layer_temp = lyr + time_file
                layer_temp = nameAlone(layer_temp)
                arcpy.MakeQueryLayer_management(cnn_sde,alias,'''
                    SELECT * 
                    FROM {0} lyr 
                    WHERE sde.st_intersects(lyr.shape, sde.st_geometry('polygon {1}',4326))
                '''.format(lyr,_stringCoord))
                # Conversión de LYR a KML
                arcpy.LayerToKML_conversion(alias,os.path.join(scratch_Folder,alias + ".kmz"))
            
            _pathZip = os.path.join(scratch_Folder,nameFileKMZ_Zip + ".zip")
            zfile = zipfile.ZipFile(_pathZip, "w")
            files = os.listdir(os.path.join(scratch_Folder))
            for f in files:
                if f.endswith(".kmz"):
                    _pathFile = os.path.join(scratch_Folder,f)
                    zfile.write(_pathFile,basename(_pathFile))
            zfile.close()
            # Response KMZ
            arcpy.SetParameterAsText(3, _pathZip)
        
        # Download SHP
        if(geoFormat == "SHP"):
            for layer in item:
                lyr,alias = layer.split("|")
                layer_temp = lyr + time_file
                layer_temp = nameAlone(layer_temp)
                arcpy.MakeQueryLayer_management(cnn_sde,alias,'''
                    SELECT * 
                    FROM {0} lyr 
                    WHERE sde.st_intersects(lyr.shape, sde.st_geometry('polygon {1}',4326))
                '''.format(lyr,_stringCoord))
                # Ruta destino de la conversion de un SHP
                arcpy.CopyFeatures_management(alias, os.path.join(scratch_Folder,"{}".format(alias.replace(".", ""))))
            
            _pathZip = os.path.join(scratch_Folder,nameFileSHP_Zip + ".zip")
            zfile = zipfile.ZipFile(_pathZip, "w", zipfile.ZIP_STORED)
            files = os.listdir(os.path.join(scratch_Folder))
            for f in files:
                if f.endswith("shp") or f.endswith("dbf") or f.endswith("shx") or f.endswith("cpg") or f.endswith("prj") or f.endswith("sbn") or f.endswith("sbx") or f.endswith("xml"):
                    _pathFile = os.path.join(scratch_Folder,f)
                    zfile.write(_pathFile,basename(_pathFile))
            zfile.close()
            # Response SHP
            arcpy.SetParameterAsText(3, _pathZip)
        
        # Download GDB
        if(geoFormat == "GDB"):
            arcpy.CreateFileGDB_management(os.path.join(scratch_Folder), "SIGRID_GDB.gdb")
            _GDB = os.path.join(scratch_Folder,"SIGRID_GDB.gdb")
            for layer in item:
                lyr,alias = layer.split("|")
                layer_temp = lyr + time_file
                layer_temp = nameAlone(layer_temp)
                arcpy.MakeQueryLayer_management(cnn_sde,alias,'''
                    SELECT * 
                    FROM {0} lyr 
                    WHERE sde.st_intersects(lyr.shape, sde.st_geometry('polygon {1}',4326))
                '''.format(lyr,_stringCoord))
                # Ruta destino de la conversion de un SHP
                arcpy.CopyFeatures_management(alias, os.path.join(_GDB, "{}".format(alias.replace(".", ""))))
            
            _pathZip = os.path.join(scratch_Folder,nameFileGDB_Zip + ".zip")
            zfile = zipfile.ZipFile(_pathZip, "w", zipfile.ZIP_DEFLATED)
            for root, dirs, files in os.walk(os.path.join(scratch_Folder)):
                if root == _GDB:
                    for f in files:
                        _pathFile = os.path.join(root, f)
                        zfile.write(_pathFile,basename(_pathFile))
            zfile.close()
            # Response GDB
            arcpy.SetParameterAsText(3, _pathZip)
'''
Nota 01: 
    Te lista los FEATURE sin embargo no te valida si existe en la base de datos o no.
    Aparece en la GDB sin embargo no existe. Para ello utiliza ARCPY.EXITS
    https://diluvium.colorado.edu/arcgis/portalhelp/en/notebook/latest/python/linux/listfeatureclasses.htm

Nota 02: 
    Se pudo identificar y manipular las CAPAS con arcpy.MakeQueryLayer_management, sin embargo al exportar 
    directamente de la GDB se tiene el error de precisión del dato. El problema no es de FORMA sino de FONDO.
    El soporte de los problemas de FONDO lo tiene que dar CENEPRED - 14/11/2022.
'''