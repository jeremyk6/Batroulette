/*
 * Licence : GNU GPLv3 or later
 */

var map;

popups_list = []

/* Building register that will contain all downloaded buildings. The style is shamelessly ripped off from iD. */ 
buildings_collection = L.geoJSON(null, {
    style: {"color": "#e06e5f", "weight": 1, "fillOpacity": 0.3},
    onEachFeature: function (feature, layer) {
        layer.on('mouseover', function () {
          this.setStyle({
            "weight":5,
          });
        });
        layer.on('mouseout', function () {
          this.setStyle({
            "weight":1,
          });
        });
        layer.on('click', function () {
            position = layer.getBounds().getCenter();
            popup = popups_list.find(popup => JSON.stringify(popup._latlng) == JSON.stringify(position))
            if(!popup) {
                id = "popup_"+Date.now()
                popup = L.popup().setLatLng(layer.getBounds().getCenter())
                popup.setContent(`
                <div class="popup" id="`+id+`">
                    <p>Est-ce que ce bâtiment a changé ?</p>
                    <button onclick="popup_yes('`+id+`')">Oui</button>
                    <button onclick="popup_remove('`+id+`')">Non</button>
                </div>
                `)
                popup.id = id
                popups_list.push(popup)
            }    
            popup.openOn(map);
            map.flyTo(position)
        });
    }
})

function popup_remove(id) {
    popup = popups_list.find(popup => popup.id == id)
    popup.remove()
    index = popups_list.indexOf(popup)
    popups_list.splice(index)
}

function popup_yes(id) {
    popup = popups_list.find(popup => popup.id == id)
    popup.setContent(`
    <div class="popup" id="`+id+`">
        <p>Pouvez-vous nous en dire plus ?</p>
        <textarea></textarea><br/><br/>
        <button onclick="send('`+id+`')">Envoyer</button>
    </div>
    `)
}

function send(id) {
    console.log("TODO")
    popup_remove(id)
}

/* Download and filter OSM datas on the current map bbox to keep only buildings. Already downloaded buildings are not kept */
function downloadBat() {
    bounds = map.getBounds();
    url = "https://www.openstreetmap.org/api/0.6/map?bbox="+bounds.getWest()+","+bounds.getSouth()+","+bounds.getEast()+","+bounds.getNorth()
    data = get(url)
    data.then(osmxml => {
        osmxml = new DOMParser().parseFromString(osmxml,"text/xml");
        osmgeojson = osmtogeojson(osmxml)
        /* Add only new buildings to the features list */
        existing_ids = buildings_collection.getLayers().map(layer => layer.feature.id)
        buildings = osmgeojson.features.filter(feature => 'building' in feature.properties && feature.geometry.type.toLowerCase().includes("polygon") && !existing_ids.includes(feature.properties.id))
        buildings_collection.addData({type : "FeatureCollection", features : buildings})
    })
}

function init() {
    map = L.map('map');

    osm = new L.TileLayer(
        'http://wms.openstreetmap.fr/tms/1.0.0/orthohr/{z}/{x}/{y}.jpg', 
        {
            attribution : 'IGN BD Ortho ©',
            maxZoom : 19
        }
    ).addTo(map);
    
    /* Add buildings layer to the map */
    buildings_collection.addTo(map)
    
    /* Set zoom & position if in parameters */
    params = new URLSearchParams(window.location.search);
    try {
        params = params.get("map").split("/")
        z = Number(params[0])
        x = Number(params[1])
        y = Number(params[2])
        map.setView([x,y], z);
    } catch {
        map.setView([47.123,4.658], 6);
    }

    /* On every move/zoom end... */
    map.on('moveend zoomend', function() {
        /* ... update zoom and position in url */
        params = "map="+map.getZoom()+"/"+map.getCenter().lat+"/"+map.getCenter().lng
        url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params;
        window.history.pushState({path: url}, '', url);

        /* ... download OSM datas if at a sufficient scale, else clear the buildings register */
        if(map.getZoom() >= 18) {
            downloadBat();
        }
        else {
            buildings_collection.clearLayers()
        }
    });
}