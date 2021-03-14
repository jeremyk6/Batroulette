async function get (url) {
    response = await fetch(url);
    if(response.ok) {
        data = await response.text();
        return data;
    } else {
        return null;
    }
}

async function post(url, options) {
    response = await fetch(url, {
      method: 'post',
      body: JSON.stringify(options)
    })
    if(response.ok) {
        return 0
    } else {
        return -1
    }
}

function createNote(lat, lon, text) {
    osmapi = "https://master.apis.dev.openstreetmap.org/api/0.6/notes?lat="+lat+"&lon="+lon+"&text="+text
    return(post(osmapi, {}))
}