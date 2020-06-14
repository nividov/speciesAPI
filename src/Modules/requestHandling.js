//this helper module is responsible for handling the requests and the data. Therefore, the GUI components don't
//have to handle the data, just display them in a correct way.
//'fetch...' functions trigger the API requests; 'set...' functions are responsible for packing the retrieved data
//into the final object 'obj'

//this function starts the fetch calls. Each fetchCall will retrieve information form the API server
//and then write the information into the obj object, which will be passed.
export async function fetchAll(userInput){
    await fetchClassification(userInput);
    if(obj.matchType !== "FUZZY" && obj.matchType !== "EXACT"){
        return obj;
    }
    await fetchImageData(obj.id);
    await fetchVernacularNames(obj.id);
    await setHeatmapURL(obj.id);
    return obj;
}
async function fetchClassification(name){
    await fetch(`https://api.gbif.org/v1/species/match?name=${name}`)
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            setClassification(res);
            setId(res);
            setMatchType(res);
            setCanonicalName(res);
        });
}
async function fetchImageData(id){
    await fetch(`https://api.gbif.org/v1/species/${id}/media`)
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            setImageData(res);
        });
}

async function fetchVernacularNames(id){
    await fetch(`https://api.gbif.org/v1/species/${id}/vernacularNames`)
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            setVernacularNames(res);
        });
}

function setClassification(data){
    obj.classification.kingdom = data.kingdom;
    obj.classification.phylum = data.phylum;
    obj.classification.class = data.class;
    obj.classification.order = data.order;
    obj.classification.family = data.family;
    obj.classification.genus = data.genus;
    obj.classification.species = data.species;
}

function setId(data){
    obj.id = data.speciesKey;
}

function setMatchType(data){
    obj.matchType = data.matchType;
}

function setCanonicalName(data){
    obj.canonicalName = data.canonicalName;
}

function setImageData(data){
    let newArr = [];
    data.results.forEach(el => {
        let newObj = {
            URL: el.identifier,
            source: el.source,
            created: el.created,
            license: el.license,
            rightsHolder: el.rightsHolder
        };
        newArr.push(newObj);
    });
    obj.images = newArr;
}

function setVernacularNames(data){
    let newArr = [];
    data.results.forEach(el => {
        newArr.push(el.vernacularName);
    });
    newArr = [...new Set(newArr)]; //to filter the unique values
    obj.vernacularNames = newArr;
}

function setHeatmapURL(id){
    obj.heatMap.west = `https://api.gbif.org/v2/map/occurrence/density/0/0/0@4x.png?style=classic.point&srs=EPSG:4326&taxonKey=${id}`;
    obj.heatMap.east = `https://api.gbif.org/v2/map/occurrence/density/0/1/0@4x.png?style=classic.point&srs=EPSG:4326&taxonKey=${id}`;
}

let obj = {
    id: 0,
    matchType: "",
    canonicalName: "",
    classification: {
        kingdom: "",
        phylum: "",
        class: "",
        order: "",
        family: "",
        genus: "",
        species: ""
    },
    images: [],
    vernacularNames: [],
    heatMap: {
        west: "",
        east: ""
    }
};