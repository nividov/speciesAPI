export async function fetchWithName(name){
    let apiRequestName = name.replace(/\s/g, "%20");
    let data;
    await fetch(`https://api.gbif.org/v1/species/match?name=${apiRequestName}`)
        .then((response) => {
            data = response.json();
        });
    return data;
}