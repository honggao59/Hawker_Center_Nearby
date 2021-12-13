// set the icons
let iconForCurrentPosition =new L.icon({
    iconUrl: 'img/current-location-icon.jpg',
    iconSize: [40,40],
    iconAnchor: [20,25],
})

let iconForFoodCourt = new L.icon({
    iconUrl: "img/food_court1.png",
    iconSize: [32, 32],
    iconAnchor: [32, 32],
    popupAnchor: [-15, -35]
});

// search location and show on the map

const baseURL = "https://api.foursquare.com/v2/";
const clientID = "RG1YLZYPE3WKDMPDD1XW34GQ2C4JGITBH3AH2WWD5KL5ZAEZ";
const clientSecret = "RWNKFGT3VXLSBBP0MUL55FV3FXTS4IFXBV20QBOGMV4XFNEY";
const version = "20211123";

async function search(lat, lng, query) {
    // setup search parameters
    let ll = lat + "," + lng;
    let response = await axios.get(baseURL+'venues/search', {
        params: {
            'll': ll,
            'client_id': clientID,
            'client_secret': clientSecret,
            'v': version,
            'query': query
        }
    })
    return response.data;
}

async function main() {

    function init() {
        map = initMap();
        let searchResultLayer = L.layerGroup();
        window.addEventListener('DOMContentLoaded', () => {
            document.querySelector('#toggle-search-btn').addEventListener('click', async ()=>{
                let currentDisplay =
                document.querySelector("#search-container").style.display;
                if (! currentDisplay || currentDisplay == 'none') {
                    document.querySelector("#search-container").style.display="block";
                } else {
                    document.querySelector("#search-container").style.display="none";
                }
            })

            // setup event listeners
            document.querySelector('#search-btn').addEventListener('click', async ()=>{
                let query = document.querySelector('#search-input').value;
                let center = map.getBounds().getCenter();
                let results = await search(center.lat, center.lng, query);
                let searchMarkers = [];
                searchResultLayer.clearLayers();
                for(let eachVenue of results.response.venues) {
                    // create a marker for each location
                    let marker = L.marker([eachVenue.location.lat, eachVenue.location.lng]);
                    marker.addEventListener('click', function(){
                        let coordinateM = [eachVenue.location.lat, eachVenue.location.lng]
                        // alert (coordinateM);
                        let nearestHC = L.GeometryUtil.closestLayer(map, markerLayer.getLayers(), coordinateM);
                        map.fitBounds([
                            marker,
                            [nearestHC.latlng.lat, nearestHC.latlng.lng],
                        ])
                        map.setZoom(17);
                        nearestHC.layer.openPopup()
                    })
                    marker.bindPopup(`<div><h3>${eachVenue.name}</h3>`);
                    marker.addTo(searchResultLayer);
                    searchMarkers.push(marker);
                }
                if (!map.hasLayer(searchResultLayer)) {
                    map.addLayer(searchResultLayer);
                }
            })
        })
    }
    init();
}

function initMap() {
    let singapore = [1.3521, 103.8198];
    let map = L.map('map');
    map.setView(singapore, 12);
    // map.setMaxBounds(map.getBounds());
    map.setMinZoom(11);

    // setup tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiZXh0cmFrdW4iLCJhIjoiY2swdnZtMWVvMTAxaDNtcDVmOHp2c2lxbSJ9.4WxdONppGpMXeHO6rq5xvg'
    }).addTo(map);

    return map;
}

main();

//Get urrent Location and find the nearest Hawker Center
let markerLayer =null;

function findNearestHC() {
    navigator.geolocation.getCurrentPosition(showMyPosition);
    let currentLat = 0;
    let currentLng = 0;
}

// show my location and find the nearest hawker center
function showMyPosition(position) {
    new L.Marker([position.coords.latitude, position.coords.longitude], {
        icon: iconForCurrentPosition,
    })
        .bindPopup('<h3>"You are here!"</h3>')
        .addTo(map);
    let myCurrCoor = [position.coords.latitude, position.coords.longitude]
    // console.log(myCurrCoor)
    let nearestHC = L.GeometryUtil.closestLayer(map, markerLayer.getLayers(), myCurrCoor);
    // console.log(nearestHC)
    map.fitBounds([
        [myCurrCoor[0], myCurrCoor[1]],
        [nearestHC.latlng.lat, nearestHC.latlng.lng],
    ])
    map.setZoom(17);
    nearestHC.layer.openPopup()
}

// show all the foodcourts on the map
window.addEventListener("DOMContentLoaded", async function () {
    let sgHawkerCenters = await axios.get("data/hawker_centers.geojson");
        let allMarkerLayers = new L.LayerGroup();
        let hcLayer = L.geoJson(sgHawkerCenters.data, {
            onEachFeature: function(feature, hcLayer) {
                // console.log(feature);
                let divEle = document.createElement('div')
                divEle.innerHTML = feature.properties.Description;
                let hcName = divEle.querySelectorAll("td")[19].innerHTML;
                let hcPostoalCode = divEle.querySelectorAll("td")[26].innerHTML;
                    if (hcPostoalCode == null) {
                        hcPostoalCode = "No Available"
                    }
                // console.log(hcPostoalCode);
                new L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], { icon: iconForFoodCourt }).bindPopup(`
                <h5>${hcName}</h5>
                <hr>
                <p> Postal Code: ${hcPostoalCode}</p>
                `).addTo(allMarkerLayers).on("click", function (e) {
                    map.setView(e.latlng, 16)
                })
                allMarkerLayers.addTo(map);
                markerLayer= allMarkerLayers
            }
        })

});

// reset to original position
function backToOriginal() {
    let singapore = [1.3521, 103.8198];
    map.setView(singapore, 12);
};


