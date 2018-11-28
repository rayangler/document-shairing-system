# Document ShAIRing System
A group project for CSC 32200: Software Engineering. The project requires us to create a file sharing system with different user privileges and a command-based version tracker.

## Getting Started
To get started, you must have the following downloaded and/or installed:
- Cloned github repo
- Node.js and npm
- PostgreSQL

## Setting Up Directory
If contributing to this project, you might want to start by forking this project to create a copy of it on your Github account. You can follow the steps to set it up [here](https://help.github.com/articles/fork-a-repo/). Make sure to check out related links in the documentation to help with syncing and making pull requests.

If you just want to check out the project, feel free to clone it. To clone the repository, enter the following command in your terminal:
```
$ git clone https://github.com/rayangler/document-shairing-system
```

Make sure to have Node.js with npm installed. You can use Homebrew, downloaded from https://brew.sh/. Use `brew install node` to get the latest version of Node and npm. Alternatively, Node can also be found here: https://nodejs.org/en/.

To make sure Node and npm were installed properly, use the following commands in your terminal:
```
$ node -v
$ npm -v
```
After Node and npm are properly installed, go to the cloned directory and use `npm install` to install of the dependencies and packages needed for the project to work.

## Setting Up PostgreSQL
Download a compatible version of Postgres for your computer from https://www.postgresql.org/download/. You should have pgAdmin and psql installed on your computer as a result.

To follow along with the project's connection string to psql, create the following in pgAdmin:
- User: air_superuser
- Password: password
- Database: air_db

Otherwise, edit the connectionString variable in the project file to correspond with your own credentials. The connectionString is in the following format:
```
var connectionString = "postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase";
```

## Run the Project
After setting up the directory and the PostgreSQL server, you should be ready to run the project using `node index.js`. Go to the appropriate host to view the project. The default is `http://localhost:3000` on a web browser.

### Making and Viewing Changes
Making changes to the frontend (Handlebars, CSS, etc.) only requires you to refresh the webpage to view the changes after saving. If making edits from the .js files, you must stop running the project and rerun it.
