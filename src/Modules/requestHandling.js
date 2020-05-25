export async function fetchAll(userInput){
    await fetchClassification(userInput);
    await fetchImageData(obj.id);
    await fetchVernacularNames(obj.id);
    console.log(obj)
}
async function fetchClassification(name){
    let data;
    await fetch(`https://api.gbif.org/v1/species/match?name=${name}`)
        .then((response) => {
            return data = response.json();
        })
        .then((res) => {
            setClassification(res);
            setId(res);
        })
}
async function fetchImageData(id){
    let data;
    await fetch(`https://api.gbif.org/v1/species/${id}/media`)
        .then((response) => {
            return data = response.json();
        })
        .then((res) => {
            pushImageData(res);
        })
}

async function fetchVernacularNames(id){
    let data;
    await fetch(`https://api.gbif.org/v1/species/${id}/vernacularNames`)
        .then((response) => {
            return data = response.json();
        })
        .then((res) => {
            pushVernacularNames(res);
        })
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

function pushImageData(data){
    data.results.forEach(el => {
        let newObj = {
            URL: el.identifier,
            source: el.source,
            created: el.created,
            license: el.license,
            rightsHolder: el.rightsHolder
        }
        obj.images.push(newObj)
    })
}

function pushVernacularNames(data){
    let newArr = []
    data.results.forEach(el => {
        newArr.push(el.vernacularName)
    })
    newArr = [...new Set(newArr)]; //to filter the unique values
    obj.vernacularNames = newArr;
}

let obj = {
    id: 0,
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
    vernacularNames: []
}

export async function fetchWithName(name){
    let data;
    await fetch(`https://api.gbif.org/v1/species/match?name=${name}`)
        .then((response) => {
            data = response.json();
        });
    return data;
}