require([
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Search",
    "esri/widgets/Zoom",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
  ],
    function(Map, MapView,Search,Zoom,FeatureLayer,Legend) {

        //Create map
        var map = new Map({
            basemap: "dark-gray"
        });

        //Map parameters
        var view = new MapView({
            container: "viewDiv",
            map: map,
            center: [144.999165,-37.811574],
            zoom: 12
        });
    
        // Removes zoom widget (ensures only search widget is present), because default zoom widget can't be moved
        view.ui.components = (["search"]);
        
        //add search widget
        var search = new Search({
            view: view
        });

        view.ui.add(search, "top-left");
        
        //adds new zoom widget, and in the correct place
        var zoom = new Zoom({
            view: view
        });
        
        view.ui.add(zoom, "bottom-left");
    
        //defines the default color scheme for the data when no filters are applied
        var defaultRenderer = {
            type: "simple",
            symbol: {
            type: "simple-line",
            color: "blue",
            width: "3.5px",
            }
        }

        //color ramp value data used for filters/legend, used later in code
        var vals_2016 = [78,82,84.7,87.5,89.7];
        var vals_2017 = [78,79.6,82.1,85.8,90.8];
        var vals_2018 = [75,78,83.2,86.8,91];
        var vals_2019 = [73,75.4,82,86.7,91];
        
        var active_color_ramp = [];

        // creating the popup
        var popup_fields = ["pct_ontime","pct_dlvrd","pct_cnclld","pct_shrt"];
        var popup_labels = ["% Ontime","% Delivered","% Cancelled","% Shorted"];
        field_data = [];
        
        var f;
        for(f=0;f<popup_fields.length;f++){
            field_data[f] = {"fieldName":popup_fields[f],"label":popup_labels[f]};
        }

        var test_popup = {
        "title": "Route {Route} stats for {Year_str}:",
        "content": [{
            "type": "fields",
            "fieldInfos": field_data
        }]
        }
    
        //creating feature layer with popup and other visual properties
        var featureLayer = new FeatureLayer({
            url:"https://services9.arcgis.com/MZ0eChmhdUQn1GI9/arcgis/rest/services/performance_shapefile/FeatureServer",
            // outFields: ["*"],
            popupTemplate: test_popup,
            renderer: defaultRenderer,
            opacity: 0.5,
        });
        // add feature layer
        map.add(featureLayer);

        // defining the legend for the different years of data
        var performanceLegend = new Legend({
            view: view,
            label: "test",
            layerInfos: [{
                layer: featureLayer,
                title: "Tram Performance"
            }]
        });
        
        //default legend for when no filters are applied
        var defaultLegend = new Legend({
            view: view,
            layerInfos: [{
            layer: featureLayer,
            title: "Tram Lines",
            }]
        });

        //add the default legend
        view.ui.add(defaultLegend, "bottom-right");

        // Create a UI with the filter expressions
        var sqlExpressions = ["pct_ontime > 1","Year = 2016","Year = 2017","Year = 2018","Year = 2019"];
        var sqlLabels = ["Please choose a year","2016","2017","2018","2019"];
     
        //creates a fselection filter dropdown and populates it 
        var selectFilter = document.createElement("select");
        selectFilter.setAttribute("class", "esri-widget esri-select");
        selectFilter.setAttribute("style", "width: 275px; font-family: Avenir Next W00; font-size: 1em;");
        var i = 0;
        sqlExpressions.forEach(function(sql){
            var option = document.createElement("option");
            option.value = sql;
            option.innerHTML = sqlLabels[i]
            selectFilter.appendChild(option);
            i++;
        });
        view.ui.add(selectFilter, "top-right");
        
        //updates the filter when the drop down is changed
        selectFilter.addEventListener('change', function (event) {
        setFeatureLayerViewFilter(event.target.value);
        });
    
    
        // Filter Function
        function setFeatureLayerViewFilter(expression) {
            // applies the sql expression
            view.whenLayerView(featureLayer).then(function(featureLayerView) {
                featureLayerView.filter = {
                    where: expression
                };
         
                // gets year for filter
                // var active_filter_index = selectFilter.options.selectedIndex;

                //applies correct values for each year for the color ramp in the legend
                // or resets to the default view
          
                switch (selectFilter.options.selectedIndex) {
                    case 0:
                        // restores the default renderer and default legend
                        featureLayer.renderer = defaultRenderer;
                        featureLayer.opacity = 0.5;
                        view.ui.add(defaultLegend, "bottom-right");
                        view.ui.remove(performanceLegend);
                    break;
                    case 1:
                        active_color_ramp = vals_2016;
                        display_performance();
                    break;
                    case 2:
                        active_color_ramp = vals_2017;
                        display_performance();
                    break;
                    case 3:
                        active_color_ramp = vals_2018;
                        display_performance();
                    break;
                    case 4:
                        active_color_ramp = vals_2019;
                        display_performance()
                }
                
                // populates the renderer (or color data) that will be applied to the feature layer    
                function display_performance(){
                
                    var color_stops = ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"];
                    var stops_data = [];
                    var j = 0;
                    
                    for(j = 0; j < color_stops.length ;j++){
                        stops_data[j] = {value: active_color_ramp[j],color: color_stops[j],label: active_color_ramp[j] + "% or higher"};
                    }
            
                    var renderer_try = {
                        type: "simple",
                        symbol: {
                            color: "#BA55D3",
                            type: "simple-line",
                            style: "solid",
                            width: "3.5px",
                        },
                        visualVariables: [{
                            type: "color", 
                            field: "pct_ontime", // field for renderer
                            stops: stops_data,
                        }]
                    };
                    // updates the renderer
                    featureLayer.renderer = renderer_try;
                    featureLayer.opacity = 1;
                    // updates the legend with the new one instead of the default one
                    view.ui.add(performanceLegend, "bottom-right");
                    view.ui.remove(defaultLegend);
                } 
            });
        }
    });
  