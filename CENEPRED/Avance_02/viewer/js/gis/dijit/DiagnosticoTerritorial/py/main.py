#!/usr/bin/env python
# -*- coding: utf-8 -*-
import zipfile
import os
import random
import time
import arcpy
import json

# Default Folder
scratch_Folder = arcpy.env.scratchFolder
print(scratch_Folder)

# Default GDB
scratch_GDB = arcpy.env.scratchGDB
print(scratch_GDB)

# Workspace
arcpy.env.workspace = os.path.join(r"D:\RepositorioGitHub\Visor\CENEPRED\Avance_02\viewer\js\gis\dijit\DiagnosticoTerritorial\py\sigrid.gdb")

# Spatial Reference
arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(4326)

# Overwrite Output
arcpy.env.overwriteOutput = True
        
# Random value
randomBegin = 100000
randomEnd = 999999999
time_file = time.strftime("%d%m%Y") + "_" + str(random.randint(randomBegin,randomEnd))

# Nombre de KMZ
nameFileKMZ = str("SIGRID_KMZ_" + time_file)
nameFileKMZ_Zip = str("SIGRID_KMZ_ZIP_" + time_file)

# Nombre de SHP
nameFileSHP = str("SIGRID_SHP_" + time_file)
nameFileSHP_Zip = str("SIGRID_SHP_ZIP_" + time_file)

# Nombre de GDB
nameFileGDB = str("SIGRID_GDB_" + time_file)
nameFileGDB_Zip = str("SIGRID_GDB_ZIP_" + time_file)

# Param list layer
#geoLayer = arcpy.GetParameterAsText(0)
geoLayer = 'ZRMN,EVAR,planes_PPRRD'
# Param polygon instersect
#geojson_polygon = arcpy.GetParameterAsText(1)
#geoFormat = arcpy.GetParameterAsText(2)
geoFormat = "SHP"
# Param example polygon
geojson_polygon ='''
                { 
                    "type": "Polygon", 
                    "coordinates": [
                        [[-79.8486328125,-7.1663003819031825],[-78.22265625,-8.993600464280018],[-75.52001953125,-6.271618064314864],[-79.16748046874999,-5.615985819155327],[-79.8486328125,-7.1663003819031825]]
                    ],
                    "spatialReference" : { "wkid" : 4326 }
                }'''
arcpy.AddMessage("Parametro 1: " + geoLayer)
arcpy.AddMessage("Parametro 2: " + geoFormat)
arcpy.AddMessage("Parametro 3: " + geojson_polygon)

if __name__ == '__main__':
    if len(geoLayer) > 0 and len(geojson_polygon) > 0:
        # Convert STRING to JSON
        string_to_json = json.loads(geojson_polygon)        
        # Create FEATURE
        polygon = arcpy.AsShape(string_to_json)
        # Bucle layer
        item = geoLayer.split(",")

        if(geoFormat == "PRUEBA"):            
            response = dict()
            item = geoLayer.split(",")
            for layer in item:
                if(arcpy.Exists(layer)):
                    response[layer] = {"layer": layer, "exit": "SI"}
                else:
                    response[layer] = {"layer": layer, "exit": "NO"}
            response = json.dumps(response)
            arcpy.SetParameterAsText(4, response)

        if(geoFormat == "ZIP"):
            if not arcpy.Exists(nameFileKMZ):
                os.mkdir(os.path.join(scratch_Folder,nameFileKMZ))
           
            for layer in item:
                if(arcpy.Exists(layer)):
                    # Add name
                    layer_temp = 'lyr' + layer + time_file
                    #Se crear un Layer para su uso
                    arcpy.MakeFeatureLayer_management(layer, layer_temp)
                    layer = layer.replace(".", "")
                    # Nombre del KMZ
                    name_KMZ = "SIGRID_CENEPRED_KMZ_" + layer + "_" + time_file
                    # Selección por localización
                    arcpy.SelectLayerByLocation_management(layer_temp,"INTERSECT", polygon)
                    # Ruta de destino de la conversion de un KMZ
                    saveKmzURL = os.path.join(scratch_Folder,nameFileKMZ, name_KMZ + ".kmz")
                    # Conversión de LAYER a KML
                    arcpy.LayerToKML_conversion(layer_temp, saveKmzURL)
                else:
                    print("Not exist: {}".format(layer))                        
            
            _pathZip = os.path.join(scratch_Folder,nameFileKMZ,nameFileKMZ_Zip + ".zip")
            zfile = zipfile.ZipFile(_pathZip, "w")
            files = os.listdir(os.path.join(scratch_Folder,nameFileKMZ))
            for f in files:
                if f.endswith(".kmz"):
                    zfile.write(os.path.join(scratch_Folder,nameFileKMZ,f))

            zfile.close()
            # Response KMZ
            arcpy.SetParameterAsText(4, _pathZip)
            print(_pathZip)
        
        if(geoFormat == "SHP"):
            print("SHP")
            if not arcpy.Exists(nameFileSHP):
                os.mkdir(os.path.join(scratch_Folder,nameFileSHP))

            for layer in item:
                if(arcpy.Exists(layer)):
                    # Add name
                    layer_temp = 'lyrSHP' + layer + time_file
                    #Se crear un Layer para su uso
                    arcpy.MakeFeatureLayer_management(layer, layer_temp)
                    layer = layer.replace(".", "")
                    # Nombre del KMZ
                    name_SHP = "SIGRID_CENEPRED_SHP_" + layer + "_" + time_file
                    # Selección por localización
                    arcpy.SelectLayerByLocation_management(layer_temp,"INTERSECT", polygon)
                    # Ruta de destino de la conversion de un KMZ
                    #save_SHP_URL = os.path.join(scratch_Folder,nameFileSHP, name_SHP + ".shp")
                    arcpy.CopyFeatures_management(layer_temp, os.path.join(scratch_Folder,nameFileSHP, name_SHP + ".shp"))
                    # Conversión de LAYER a KML
                    #arcpy.FeatureClassToShapefile_conversion(layer_temp,save_SHP_URL)
                else:
                    print("Not exist: {}".format(layer))                        
            
            _pathZip = os.path.join(scratch_Folder,nameFileSHP,nameFileSHP_Zip + ".zip")
            zfile = zipfile.ZipFile(_pathZip, "w", zipfile.ZIP_STORED)
            files = os.listdir(os.path.join(scratch_Folder,nameFileSHP))
            for f in files:
                if f.endswith("shp") or f.endswith("dbf") or f.endswith("shx"):
                    zfile.write(os.path.join(scratch_Folder,nameFileSHP,f))

            zfile.close()
            # Response KMZ
            arcpy.SetParameterAsText(4, _pathZip)
            print(_pathZip)

        if(geoFormat == "GDB"):
            print("GDB")


'''
# Nota: https://diluvium.colorado.edu/arcgis/portalhelp/en/notebook/latest/python/linux/listfeatureclasses.htm
    Te lista los FEATURE sin embargo no te valida si existe en la base de datos o no. 
    En ocasiones aparece en la GDB sin embargo no existe. Para ello utiliza ARCPY.EXITS

'''