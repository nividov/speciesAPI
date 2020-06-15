# speciesINFO

This Website provides you with information for any species. You simply have to search for the sceintific name of your species, and all die information will be shown to you.

## Information to the tasks
- P2 Usability

to deliver a better user experience, i followed design patterns throughout the application

- P3 Datentrennung

In this application, the data handling is performed in separate module, so that all the GUI components don't have to worry about fetching or modifying data, but only display the information its gives. 

- P4 persistente Datenhaltung (API)

I chose to built this application in a way, that every new search triggers a request to the API. Therefore, the data is persistent and always in sync with the data on the server.

- P10 Veröffentlichung

This Website was published and is reachable via the following link: https://www.species-info.com

- A2 Kommentieren

The code was commented whenever an explanation was needed in roder to understand the purpose and workflow of a function.

- A4 Projektmanagement

To enable a solid project management, the code was uploaded to GitHub https://github.com/nividov/speciesAPI. This enabled the use of its version control system and its project functions (tasks + project board showing the current status of the app)

## Install & Setup

To access the code, render the Website and use the tests, simply follow these steps:

- install Node.js

- download and unpack this repository

- install dependencies
```sh
npm install
```

- render the Website
```sh
npm run dev
```
Navigate to localhost:5000. You should see the app running.

- run the unit tests
```sh
npm test
```

- run the system tests
```sh
npx cypress open
```
