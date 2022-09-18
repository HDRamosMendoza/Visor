define([
    'esri/units',
    'esri/geometry/Extent',
    'esri/config',
    /*'esri/urlUtils',*/
    'esri/tasks/GeometryService',
    'esri/layers/ImageParameters',
    'gis/plugins/Google',
    'dojo/i18n!./nls/main',
    'dojo/topic',
    'dojo/sniff'
], function (units, Extent, esriConfig, /*urlUtils,*/ GeometryService, ImageParameters, GoogleMapsLoader, i18n, topic, has) {

    // url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
    esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
    esriConfig.defaults.io.alwaysUseProxy = false;

    // add a proxy rule to force specific domain requests through proxy
    // be sure the domain is added in proxy.config
    /*urlUtils.addProxyRule({
        urlPrefix: 'www.example.com',
        proxyUrl: 'proxy/proxy.ashx'
    });*/

    // url to your geometry server.
    esriConfig.defaults.geometryService = new GeometryService('https://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');

    // Use your own Google Maps API Key.
    // https://developers.google.com/maps/documentation/javascript/get-api-key
    GoogleMapsLoader.KEY = 'NOT-A-REAL-API-KEY';

    // helper function returning ImageParameters for dynamic layers
    // example:
    // imageParameters: buildImageParameters({
    //     layerIds: [0],
    //     layerOption: 'show'
    // })
    function buildImageParameters (config) {
        config = config || {};
        var ip = new ImageParameters();
        //image parameters for dynamic services, set to png32 for higher quality exports
        ip.format = 'png32';
        for (var key in config) {
            if (config.hasOwnProperty(key)) {
                ip[key] = config[key];
            }
        }
        return ip;
    }

    //some example topics for listening to menu item clicks
    //these topics publish a simple message to the growler
    //in a real world example, these topics would be used
    //in their own widget to listen for layer menu click events
    topic.subscribe('layerControl/hello', function (event) {
        topic.publish('growler/growl', {
            title: 'Hello!',
            message: event.layer._titleForLegend + ' ' +
                (event.subLayer ? event.subLayer.name : '') +
                ' says hello'
        });
    });
    topic.subscribe('layerControl/goodbye', function (event) {
        topic.publish('growler/growl', {
            title: 'Goodbye!',
            message: event.layer._titleForLegend + ' ' +
                (event.subLayer ? event.subLayer.name : '') +
                ' says goodbye'
        });
    });

    return {
        // used for debugging your app
        isDebug: true,

        //default mapClick mode, mapClickMode lets widgets know what mode the map is in to avoid multipult map click actions from taking place (ie identify while drawing).
        defaultMapClickMode: 'identify',
        // map options, passed to map constructor. see: https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
        mapOptions: {
            basemap: 'streets',
            /*center: [-96.59179687497497, 39.09596293629694],*/
            center: [-75.015152, -9.189967],
            zoom: 6,
            sliderStyle: 'small',
            showLabels : true
        },

        //webMapId: 'ef9c7fbda731474d98647bebb4b33c20',  // High Cost Mortgage
        // webMapOptions: {},

        // panes: {
        // 	left: {
        // 		splitter: true
        // 	},
        // 	right: {
        // 		id: 'sidebarRight',
        // 		placeAt: 'outer',
        // 		region: 'right',
        // 		splitter: true,
        // 		collapsible: true
        // 	},
        // 	bottom: {
        // 		id: 'sidebarBottom',
        // 		placeAt: 'outer',
        // 		splitter: true,
        // 		collapsible: true,
        // 		region: 'bottom'
        // 	},
        // 	top: {
        // 		id: 'sidebarTop',
        // 		placeAt: 'outer',
        // 		collapsible: true,
        // 		splitter: true,
        // 		region: 'top'
        // 	}
        // },
        // collapseButtonsPane: 'center', //center or outer

        // custom titles
        titles: {
            header: i18n.viewer.titles.header,
            subHeader: i18n.viewer.titles.subHeader,
            pageTitle: i18n.viewer.titles.pageTitle
        },

        layout: {
            /*  possible options for sidebar layout:
                    true - always use mobile sidebar, false - never use mobile sidebar,
                    'mobile' - use sidebar for phones and tablets, 'phone' - use sidebar for phones,
                    'touch' - use sidebar for all touch devices, 'tablet' - use sidebar for tablets only (not sure why you'd do this?),
                    other feature detection supported by dojo/sniff and dojo/has- http://dojotoolkit.org/reference-guide/1.10/dojo/sniff.html

                default value is 'phone'
            */
            //sidebar: 'phone'
        },

        // user-defined layer types
        /*
        layerTypes: {
            myCustomLayer: 'widgets/MyCustomLayer'
        },
        */

        // user-defined widget types
        /*
        widgetTypes: [
            'myWidgetType'
        ],
        */

        // operationalLayers: Array of Layers to load on top of the basemap: valid 'type' options: 'dynamic', 'tiled', 'feature'.
        // The 'options' object is passed as the layers options for constructor. Title will be used in the legend only. id's must be unique and have no spaces.
        // 3 'mode' options: MODE_SNAPSHOT = 0, MODE_ONDEMAND = 1, MODE_SELECTION = 2
        operationalLayers: [{
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/collect/sigrid_collect/MapServer',
            title: "SIGRID Collect",
            options: {
                id: 'SIGRIDCollect',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },
            legendLayerInfos: {
                exclude: false
            },
            layerControlLayerInfos: {                
                swipe: true,
                metadataUrl: true,
                expanded: false 
            }
        },

        {
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Elementos_Expuestos/MapServer',
            title: "Elementos Expuestos",
            options: {
                id: 'elementosExpuestos',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },
            legendLayerInfos: {
                exclude: false
            },
            layerControlLayerInfos: {
                swipe: true,
                metadataUrl: true,
                expanded: false,                
                sublayers: true
            }
        },

        {
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Informacion_CENEPRED/MapServer',
            title: "Informacion CENEPRED",
            options: 
            {
                id: 'informacionCENEPRED',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },
            legendLayerInfos: 
            {
                exclude: false
            },
            layerControlLayerInfos: 
            {
                swipe: true,
                metadataUrl: true,
                expanded: false
            }
        },

        {
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Cartografia_Riesgos/MapServer',
            title: "Cartografia Riesgos",
            options: {
                id: 'cartografiaRiesgos',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },
            legendLayerInfos: {
                exclude: false
            },
            layerControlLayerInfos: {
                swipe: true,
                metadataUrl: true,
                expanded: false
            }
        },

        {
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Cartografia_Peligros/MapServer',
            title: "Cartografia Peligros",
            options: {
                id: 'cartografiaPeligros',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },
            legendLayerInfos: {
                exclude: false
            },
            layerControlLayerInfos: {
                swipe: true,
                metadataUrl: true,
                expanded: false
            }
        },

        {
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Informacion_Complementaria/MapServer',
            title: "Información Complementaria",
            options: {
                id: 'informacionComplementaria',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },            
            legendLayerInfos: {
                exclude: false
            },
            //Para mostrar popups
           identifyLayerInfos: {
                //layerIds: [1,7,8,9,10,12,13,14,16,17,19,20,21,22,23,24,27,28,29,30,32,33,34,35,38,39,40,42,43,45,46,48,49,50,51,52]
                //layerIds: [6010000,6010100,6010200,6010300,6010400,6010500,6030100,6030200,6040000,6050000,6060000,6060100,6060200,6070000,6080000,6080100,6080200,6090000,6090100,6090200,6090300,6090400,6090500,6090600,6100000,6100100,6100101,6100102,6100103,6100104,6100200,6100201,6100202,6100203,6100204,6100300,6110000,6110100,6110200,6110300,6120000,6120100,6120200,6130000,6130100,6130200,6130300,6130301,6130302,6130303,6130400,6130500]
                layerIds: [6010000,6010100,6010200,6010300,6010400,6010500,6030100,6030200,6040000,6050000,6060000,6060100,6060200,6070000,6080000,6080100,6080200,6090000,6090100,6090200,6090300,6090400,6090500,6090600,6100000,6100100,6100101,6100102,6100103,6100104,6100200,6100201,6100202,6100203,6100204,6100300,6110000,6110100,6110200,6110300,6120000,6120100,6120200,6130000,6130100,6130200,6130400,,6130500,6140000]
            },
            layerControlLayerInfos: {
                swipe: true,
                metadataUrl: true,
                expanded: false 
            }
        },  

        {
            type: 'dynamic',
            url: 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/MEF/prevaed/MapServer',
            title: "PREVAED",
            options: 
            {
                id: 'prevaedmef',
                opacity: 1.0,
                visible: true,
                imageParameters: buildImageParameters()
            },            
            legendLayerInfos: 
            {
                exclude: false
            },            
            layerControlLayerInfos: 
            {
                swipe: true,
                metadataUrl: true,
                expanded: false 
            }
        }
    ],
        // set include:true to load. For titlePane type set position the the desired order in the sidebar
        widgets: {
            growler: {
                include: true,
                id: 'growler',
                type: 'domNode',
                path: 'gis/dijit/Growler',
                srcNodeRef: 'growlerDijit',
                options: {}
            },
            search: {
                include: true,
                type: has('phone') ? 'titlePane' : 'domNode',
                path: 'esri/dijit/Search',
                srcNodeRef: 'geocoderButton',
                title: i18n.viewer.widgets.search,
                iconClass: 'fa-search',
                position: 0,
                options: {
                    map: true,
                    visible: true,
                    enableInfoWindow: false,
                    enableButtonMode: has('phone') ? false : true,
                    expanded: has('phone') ? true : false
                }
            },
            basemaps: {
                include: false,
                id: 'basemaps',
                type: 'domNode',
                path: 'gis/dijit/Basemaps',
                srcNodeRef: 'basemapsDijit',
                options: 'config/basemaps'
            },
            identify: {
                include: false,
                id: 'identify',
                type: 'titlePane',
                path: 'gis/dijit/Identify',
                title: i18n.viewer.widgets.identify,
                iconClass: 'fa-info-circle',
                open: false,
                preload: true,
                position: 3,
                options: 'config/identify'
            },
            mapInfo: {
                include: false,
                id: 'mapInfo',
                type: 'domNode',
                path: 'gis/dijit/MapInfo',
                srcNodeRef: 'mapInfoDijit',
                options: {
                    map: true,
                    mode: 'dms',
                    firstCoord: 'y',
                    unitScale: 3,
                    showScale: true,
                    xLabel: '',
                    yLabel: '',
                    minWidth: 286
                }
            },
            scalebar: {
                include: true,
                id: 'scalebar',
                type: 'map',
                path: 'esri/dijit/Scalebar',
                options: {
                    map: true,
                    attachTo: 'bottom-left',
                    scalebarStyle: 'line',
                    scalebarUnit: 'dual'
                }
            },
            locateButton: {
                include: true,
                id: 'locateButton',
                type: 'domNode',
                path: 'gis/dijit/LocateButton',
                srcNodeRef: 'locateButton',
                options: {
                    map: true,
                    publishGPSPosition: true,
                    highlightLocation: true,
                    useTracking: true,
                    geolocationOptions: {
                        maximumAge: 0,
                        timeout: 15000,
                        enableHighAccuracy: true
                    }
                }
            },
            overviewMap: {
                include: has('phone') ? false : true,
                id: 'overviewMap',
                type: 'map',
                path: 'esri/dijit/OverviewMap',
                options: {
                    map: true,
                    attachTo: 'bottom-right',
                    color: '#0000CC',
                    height: 100,
                    width: 125,
                    opacity: 0.30,
                    visible: false
                }
            },
            homeButton: {
                include: true,
                id: 'homeButton',
                type: 'domNode',
                path: 'esri/dijit/HomeButton',
                srcNodeRef: 'homeButton',
                options: {
                    map: true,
                    extent: new Extent({
                        xmin: -180,
                        ymin: -85,
                        xmax: 180,
                        ymax: 85,
                        spatialReference: {
                            wkid: 4326
                        }
                    })
                }
            },
            legend: {
                include: false,
                id: 'legend',
                type: 'titlePane',
                path: 'gis/dijit/Legend',
                title: i18n.viewer.widgets.legend,
                iconClass: 'fa-picture-o',
                open: false,
                position: 1,
                options: {
                    map: true,
                    legendLayerInfos: true
                }
            },
            layerControl: {
                include: true,
                id: 'layerControl',
                type: 'titlePane',
                path: 'gis/dijit/LayerControl',
                title: i18n.viewer.widgets.layerControl,
                iconClass: 'fa-th-list',
                open: false,
                position: 0,
                options: {
                    map: true,
                    layerControlLayerInfos: true,
                    separated: true,
                    vectorReorder: true,
                    overlayReorder: true,
                    // create a custom menu entry in all of these feature types
                    // the custom menu item will publish a topic when clicked
                    menu: {
                        feature: [{
                            topic: 'hello',
                            iconClass: 'fa fa-smile-o',
                            label: 'Say Hello'
                        }]
                    },
                    //create a example sub layer menu that will
                    //apply to all layers of type 'dynamic'
                    subLayerMenu: {
                        dynamic: [{
                            topic: 'goodbye',
                            iconClass: 'fa fa-frown-o',
                            label: 'Say goodbye'
                        }]
                    }
                }
            },
            bookmarks: {
                include: false,
                id: 'bookmarks',
                type: 'titlePane',
                path: 'gis/dijit/Bookmarks',
                title: i18n.viewer.widgets.bookmarks,
                iconClass: 'fa-bookmark',
                open: false,
                position: 2,
                options: 'config/bookmarks'
            },
            find: {
                include: false,
                id: 'find',
                type: 'titlePane',
                canFloat: true,
                path: 'gis/dijit/Find',
                title: i18n.viewer.widgets.find,
                iconClass: 'fa-search',
                open: false,
                position: 3,
                options: 'config/find'
            },
            draw: {
                include: false,
                id: 'draw',
                type: 'titlePane',
                canFloat: true,
                path: 'gis/dijit/Draw',
                title: i18n.viewer.widgets.draw,
                iconClass: 'fa-paint-brush',
                open: false,
                position: 4,
                options: {
                    map: true,
                    mapClickMode: true
                }
            },
            measure: {
                include: false,
                id: 'measurement',
                type: 'titlePane',
                canFloat: true,
                path: 'gis/dijit/Measurement',
                title: i18n.viewer.widgets.measure,
                iconClass: 'fa-expand',
                open: false,
                position: 5,
                options: {
                    map: true,
                    mapClickMode: true,
                    defaultAreaUnit: units.SQUARE_MILES,
                    defaultLengthUnit: units.MILES
                }
            },
            daniel: {
                include: true,
                id: 'daniel',
                type: 'titlePane',
                canFloat: true,
                path: 'gis/dijit/DiagnosticoTerritorial',
                title: "Diagnóstico y Reporte Territorial",
                iconClass: 'fa-archive',
                open: false,
                position: 100,
                options: {
                    map: true,
                    mapClickMode: true,
                    defaultAreaUnit: units.SQUARE_MILES,
                    defaultLengthUnit: units.MILES
                }
            },
            print: {
                include: false,
                id: 'print',
                type: 'titlePane',
                canFloat: true,
                path: 'gis/dijit/Print',
                title: i18n.viewer.widgets.print,
                iconClass: 'fa-print',
                open: false,
                position: 6,
                options: {
                    map: true,
                    printTaskURL: 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
                    copyrightText: 'Copyright 2014',
                    authorText: 'Me',
                    defaultTitle: 'Viewer Map',
                    defaultFormat: 'PDF',
                    defaultLayout: 'Letter ANSI A Landscape'
                }
            },
            directions: {
                include: false,
                id: 'directions',
                type: 'titlePane',
                path: 'gis/dijit/Directions',
                title: i18n.viewer.widgets.directions,
                iconClass: 'fa-map-signs',
                open: false,
                position: 7,
                options: {
                    map: true,
                    mapRightClickMenu: true,
                    options: {
                        routeTaskUrl: 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route',
                        routeParams: {
                            directionsLanguage: 'en-US',
                            directionsLengthUnits: units.MILES
                        },
                        active: false //for 3.12, starts active by default, which we dont want as it interfears with mapClickMode
                    }
                }
            },
            editor: {
                include: has('phone') ? false : true,
                id: 'editor',
                type: 'titlePane',
                path: 'gis/dijit/Editor',
                title: i18n.viewer.widgets.editor,
                iconClass: 'fa-pencil',
                open: false,
                position: 8,
                options: {
                    map: true,
                    mapClickMode: true,
                    editorLayerInfos: true,
                    settings: {
                        toolbarVisible: true,
                        showAttributesOnClick: true,
                        enableUndoRedo: true,
                        createOptions: {
                            polygonDrawTools: ['freehandpolygon', 'autocomplete']
                        },
                        toolbarOptions: {
                            reshapeVisible: true,
                            cutVisible: true,
                            mergeVisible: true
                        }
                    }
                }
            },
            streetview: {
                include: false,
                id: 'streetview',
                type: 'titlePane',
                canFloat: true,
                position: 9,
                path: 'gis/dijit/StreetView',
                title: i18n.viewer.widgets.streetview,
                iconClass: 'fa-street-view',
                paneOptions: {
                    resizable: true,
                    resizeOptions: {
                        minSize: {
                            w: 250,
                            h: 250
                        }
                    }
                },
                options: {
                    map: true,
                    mapClickMode: true,
                    mapRightClickMenu: true
                }
            },
            locale: {
                include: true,
                type: has('phone') ? 'titlePane' : 'domNode',
                id: 'locale',
                position: 0,
                srcNodeRef: 'geocodeDijit',
                path: 'gis/dijit/Locale',
                title: i18n.viewer.widgets.locale,
                iconClass: 'fa-flag',
                options: {
                    style: has('phone') ? null : 'margin-left: 30px;'
                }
            },
            help: {
                include: has('phone') ? false : true,
                id: 'help',
                type: 'floating',
                path: 'gis/dijit/Help',
                title: i18n.viewer.widgets.help,
                iconClass: 'fa-info-circle',
                paneOptions: {
                    draggable: false,
                    html: '<a href="#"><i class="fa fa-fw fa-info-circle"></i>link</a>'.replace('link', i18n.viewer.widgets.help),
                    domTarget: 'helpDijit',
                    style: 'height:345px;width:450px;'
                },
                options: {}
            }

        }
    };
});
