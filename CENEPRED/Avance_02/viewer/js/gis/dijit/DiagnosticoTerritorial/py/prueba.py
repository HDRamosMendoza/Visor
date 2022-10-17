#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import random
import time
import json

def _nameAlone(_name):
    _name = _name.replace(".", "")
    if('/' in _name):
        return _name[_name.rfind('/')+1:] 
    else:
        return _name

_name = "lyrSHPbdcenepred.cartografia_p/eligros.Hidrom_Oceanograficos/bdcenepred.cartografia_peligros.Inventario_inundacion_217102022_973121794"

if __name__ == '__main__':
    _nameAlone(_name)