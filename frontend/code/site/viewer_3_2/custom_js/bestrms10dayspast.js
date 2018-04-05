modelplus.custom_display = modelplus.custom_display || {};

function custom_display(){
	"use strict";
	
	// /////////////// ARGS /////////////// //
	
	// get runset and basic check it
	var sc_runset_id = $('#'+ modelplus.ids.MENU_RUNSET_SBOX).val();
	if ((sc_runset_id == "")||(sc_runset_id == undefined)) return;
	
	// get basic data
	var modelcomb_id = $('#'+ modelplus.ids.MENU_MODEL_MAIN_SBOX).val();
	var reprcomp_id = "bestrms10dayspast";
	
	// /////////////// FUNC /////////////// //
	
	/**
	 * Function for showing the icons
	 */
	var show_points = function(data_values, data_gages){
		var cur_linkid, cur_latlng, cur_gage, cur_marker, models_idx;
		var cur_best_model_id;
		
		data_gages = data_gages[0];
		data_values = data_values[0];
		
		models_idx = set_models_id(data_values);
		
		// create reference list for icon in global var if necessary
		if(typeof(GLB_visual.prototype.polygons[reprcomp_id]) === 'undefined')
			GLB_visual.prototype.polygons[reprcomp_id] = [];
		
		for(var idx=0; idx < data_gages.length; idx++){
			cur_gage = data_gages[idx];
			cur_linkid = cur_gage["link_id"];
			
			// basic check - gage location was found
			if(typeof(data_values[cur_linkid]) === 'undefined')
				continue;
			
			// define icon, marker and its action
			cur_latlng = {lat:parseFloat(cur_gage["lat"]),
			              lng:parseFloat(cur_gage["lng"])};
			
			cur_best_model_id = find_best_model_id(data_values[cur_linkid]);
			cur_marker = new google.maps.Marker({
				position: cur_latlng,
				map: map,
				title: cur_gage.description,
				id: cur_gage.link_id,
				icon: { url: get_icon_url(models_idx[cur_best_model_id]) },
				details: data_values[cur_linkid],
				best_model_id: cur_best_model_id
			});
			
			google.maps.event.addListener(cur_marker, "click", show_message);
			
			// add polygon to the reference list
			GLB_visual.prototype.polygons[reprcomp_id].push(cur_marker);
		}
		
		// create legend
		display_legend(models_idx);
	}
    
    /**
     * Define inner html and shows top legend on the page
     * RETURN: None.
     */
	var display_legend = function(models_icons){
      var div_html = "Best R.M.S.E. - Last 10 days<br>";
      var sub_html = [];
      
      Object.keys(models_icons).forEach(function(key, index){
        var mdl_icon = get_icon_url(index);
        var mdl_name = modelplus.dom.get_model_name(key);
        var html_icon = "<img src='"+mdl_icon+"'>";
        sub_html.push(html_icon + mdl_name);
      });
      
      div_html += sub_html.join("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
      modelplus.dom.show_legend_top(reprcomp_id, div_html);
    }
	
	/**
	 * Function that provides an id/icon for each model
	 * RETURN: Dictionary in the form of {model_a:0, model_b:1, ...}
	 */
	var set_models_id = function(data_values){
		var cur_models, cur_model, i, count;
		var all_models = {};
		
		// build pre-dictionary
		for(i in data_values){
			for(cur_model in data_values[i]['models']){
				all_models[cur_model] = null;
		}}
		
		// build last dictionary
		count = 0;
		for(cur_model in all_models){
			all_models[cur_model] = count;
			count += 1;
		}
		
		return(all_models);
	}
	
	/**
	 * 
	 */
	var find_best_model_id = function(details){
      var lower_error = 1;
      var best_model = null;
      for(var cur_model in details['models']){
        if(details['models'][cur_model] < lower_error){
          best_model = cur_model;
          lower_error = details['models'][cur_model];
	  }}
	  return(best_model);
    }
	
	/**
	 * 
	 */
	var get_icon_url = function(idx){
      var root_url = modelplus.url.base_frontend_webservices;
      var icon_address = root_url + "imgs/map_icons/best"+idx+".png";
      return(icon_address);
    }
	
	/**
	 * Show message
	 */
	var show_message = function(){
		var cur_model_id, cur_rmse, cur_model_title, message_txt;
		var cur_high;
		
		message_txt = this.title + "<br >";
		message_txt += "<table class='models_comparison' >";
		message_txt += "<tr class='title'>";
		message_txt += "<td class='col_left'>Model</td>";
		message_txt += "<td class='col_right'>R.M.S.E.</td>";
		message_txt += "</tr>";
		for(cur_model_id in this.details['models']){
			cur_rmse = this.details['models'][cur_model_id];
			cur_model_title = modelplus.dom.get_model_name(cur_model_id);
			cur_high = (cur_model_id == this.best_model_id ? " highlight" : "");
			message_txt += "<tr >";
			message_txt += "<td class='col_left"+cur_high+"'>" + cur_model_title + "</td>";
			message_txt += "<td class='col_right"+cur_high+"'>" + cur_rmse + "</td>";
			message_txt += "</tr>";
		}
		message_txt += "</table>";
		message_txt += "Number of points: " + this.details['num_points'];
		
		modelplus.dom.display_message_block(message_txt);
	}
	
	// /////////////// CALL /////////////// //
	
	// build URL - why not have a common function for that?
	var root_url = modelplus.url.base_frontend_webservices;
	var ws_data_url = modelplus.viewer.ws + "custom_ws/" + reprcomp_id + ".php";
	ws_data_url += "%i%sc_runset_id=" + sc_runset_id;
	ws_data_url += "%e%sc_modelcomb_id=" + modelcomb_id;
	
	$.when($.getJSON(ws_data_url),
	       modelplus.api.get_gages_by_type([2, 3], true, true))
		.then(show_points);
}
