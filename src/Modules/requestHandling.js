
export function newRequest(input){
    let newName = processInput(input);
    doIt(newName);
}

function processInput(input){
    let form = input.currentTarget;
    let name = form.elements.namedItem("latName").value;
    return name;
}

function doIt(name){
    console.log(name);
}