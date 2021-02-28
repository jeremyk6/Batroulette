async function get (url) {
    response = await fetch(url);
    if(response.ok) {
        data = await response.text();
        return data;
    } else {
        return null;
    }
}
