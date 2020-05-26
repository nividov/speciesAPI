export async function fetchAll(userInput){
    await fetchClassification(userInput);
    if(obj.matchType !== "FUZZY" && obj.matchType !== "EXACT"){
        return obj;
    }
    await fetchImageData(obj.id);
    await fetchVernacularNames(obj.id);
    await pushHeatmapURL(obj.id);
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
            pushImageData(res);
        });
}

async function fetchVernacularNames(id){
    await fetch(`https://api.gbif.org/v1/species/${id}/vernacularNames`)
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            pushVernacularNames(res);
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

function pushImageData(data){
    data.results.forEach(el => {
        let newObj = {
            URL: el.identifier,
            source: el.source,
            created: el.created,
            license: el.license,
            rightsHolder: el.rightsHolder
        };
        obj.images.push(newObj);
    });
}

function pushVernacularNames(data){
    let newArr = [];
    data.results.forEach(el => {
        newArr.push(el.vernacularName);
    });
    newArr = [...new Set(newArr)]; //to filter the unique values
    obj.vernacularNames = newArr;
}

function pushHeatmapURL(id){
    obj.heatMap.west = `https://api.gbif.org/v2/map/occurrence/density/0/0/0@4x.png?style=gbif-classic.point&srs=EPSG:4326&taxonKey=${id}`;
    obj.heatMap.east = `https://api.gbif.org/v2/map/occurrence/density/0/1/0@4x.png?style=gbif-classic.point&srs=EPSG:4326&taxonKey=${id}`;
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