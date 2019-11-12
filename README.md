The Grand Tour Explorer
=======================
This is the codebase for the Grand Tour Explorer web project.  To set up a local development environment, follow these steps:
- Make sure you have the following tools installed:
  - [NodeJS 8.4 or later](https://nodejs.org/en/)
  - [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
  - [MongoDB](https://www.mongodb.com/download-center/v2/community)
- Clone the repository locally: `git clone https://github.com/cestastanford/grandtour`.
- From the repository directory, install npm dependencies: `npm install`
- Create an environmental variable file called `.env` in the root directory.
- Add the following to .env:
```
MONGODB_URI=localhost:27017
SECRET_KEY_1=abc
SECRET_KEY_2=abc
SECRET_KEY_3=abc
SHEETS_EMAIL=...
SHEETS_PRIVATE_KEY=...
BOOK_ORIGIN=...
```
- Start the server: `npm run dev-start`.  This will create and host a MongoDB database and start the Node server.
- Check the console output for the automatically-created default admin user login info.  This account is created when no existing user accounts exist.
- Check the console output for the local address of the site (often http://localhost:5100).  Visit that address and log in!

Restoring a MongoDB database backup
-----------------------------------
To restore a MongoDB database backup into your local database, unzip the backup and find the directory containing the BSON and JSON files.  Make sure the development server is not running and run the following commands.  Warning: this will erase the current database and replace it; make a copy of your `data` directory if you want to save it.
- Make sure the development server is not running (ctrl-C from the shell running `npm run`).
- Delete the current `data` directory and create a new one: `rm -rf data && mkdir data`
- Run the MongoDB database alone: `mongod --dbpath data`
- In another shell, import the dump: `mongorestore -d test path/to/directory/with/bson`
- Shut down the MongoDB database (ctrl-C).
- Start up the development environment, which should automatically create another `default-admin` user: `npm run dev-start`.

Map Visualization
https://www.mapbox.com/install/js/bundler-install/