#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import random
import time
import json

def _nameAlone(_name):
    _name = _name.replace(".", "")
    if'/' in _name:
        return _name[_name.rfind('/')+1:] 
    else:
        return _name

_name = "lyrSHPbdcenepred.cartografia_p/eligros.Hidrom_Oceanograficos/bdcenepred.cartografia_peligros.Inventario_inundacion_217102022_973121794"

_heber = ''' assasasd {}'''.format("RAMOS")
#print(_heber)
geoLayer = 'bdcenepred.v3.v_documento_pprrd|sSA,bdcenepred.v3.v_documento_evar_con_indicadores|4587,bdcenepred.informacion_complementa.zonas_riesgo_no_mitigables|OKI,bdcenepred.cartografia_peligros.Areas_expuestas_inundaciones_1|789,bdcenepred.cartografia_peligros.Inventario_inundacion_2|147,bdcenepred.informacion_complementa.Puntos_control_geologico|UHN,bdcenepred.informacion_complementa.FENC_afect_VIV|MNB,bdcenepred.informacion_complementa.FENC_afect_CARRETERA|GTYH,bdcenepred.informacion_complementa.FENC_afect_OBRASINFRA|THG,bdcenepred.cartografia_peligros.Fajas_marginales_1|TGDS,bdcenepred.cartografia_peligros.Pasivos_ambientales_mineros_|SDC,bdcenepred.cartografia_peligros.zona_critica|HGH,bdcenepred.cartografia_peligros.AreaInundacionTsunami|78'
item = geoLayer.split(",")
for layer in item:
    lyr,alias = layer.split("|")
    print(lyr)
    print(alias)
    #print(layer.split("|")[0])
    #print(layer.split("|")[1])
    print('-----')
            
if __name__ == '__main__':
    #_nameAlone(_name)
    abc = tuple(((-79.8486328125, -7.1663003819031825), (-78.22265625, -8.993600464280018), (-75.52001953125, -6.271618064314864), (-79.16748046874999, -5.615985819155327), (-79.8486328125, -7.1663003819031825)))
    ab = ""
    for a, b in abc:
        ab += "{0} {1},".format(str(a),str(b))
    else:
        ab = "(("+ab[0:(len(ab)-1)]+"))"
        #print('termino')

    #print(ab)