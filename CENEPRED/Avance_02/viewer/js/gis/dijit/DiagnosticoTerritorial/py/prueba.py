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
print(_heber)


if __name__ == '__main__':
    
    _nameAlone(_name)
    abc = tuple(((-79.8486328125, -7.1663003819031825), (-78.22265625, -8.993600464280018), (-75.52001953125, -6.271618064314864), (-79.16748046874999, -5.615985819155327), (-79.8486328125, -7.1663003819031825)))
    ab = ""
    for a, b in abc:
        ab += "{0} {1},".format(str(a),str(b))
    else:
        ab = "(("+ab[0:(len(ab)-1)]+"))"
        print('termino')

    print(ab)