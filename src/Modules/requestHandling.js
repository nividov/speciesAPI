export async function newFetch(name){
    let apiRequestName = name.replace(/\s/g, "%20");
    let data;
    await fetch(`https://api.gbif.org/v1/species/match?name=${apiRequestName}`)
        .then((response) => {
            return response.json();
        })
        .then((data2) => {
            console.log(data2);
            data = data2;
        });
    return data;
}