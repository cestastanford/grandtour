The Grand Tour Explorer
=======================
This is the codebase for the Grand Tour Explorer web project.  To set up a local development environment, follow these steps:
- Make sure you have the following tools installed:
  - [NodeJS v14.21.2](https://nodejs.org/en/)
  - [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
  - [MongoDB v.4.4.18](https://www.mongodb.com/download-center/v2/community)
  - Heroku CLI (`curl https://cli-assets.heroku.com/install.sh | sh`)
- Clone the repository locally: `git clone https://github.com/cestastanford/grandtour`.
- From the repository directory, install npm dependencies: `npm install`
- Create an environmental variable file called `.env` in the root directory.
- Add the following to .env:
```
MONGODB_URI=mongodb://localhost:27017/grandtour
SECRET_KEY_1=abc
SECRET_KEY_2=abc
SECRET_KEY_3=abc
SHEETS_EMAIL=...
SHEETS_PRIVATE_KEY=...
BOOK_ORIGIN=...
```
- Start the server: `npm run dev-start`.  This will create and host a MongoDB database and start the Node server.
- Unzip the database dump so that there's a `dump` directory in the root directory of grandtour. Then run `mongorestore -d grandtour dump/grandtour --port 27017 --host localhost --drop` in a separate terminal to sync the database to the local version.
- Check the console output for the local address of the site (often http://localhost:5100).  Visit that address to access the Explorer and the book.


Restoring a MongoDB database backup
-----------------------------------
To restore a MongoDB database backup into your local database, unzip the backup and find the directory containing the BSON and JSON files.  Make sure the development server is not running and run the following commands.  Warning: this will erase the current database and replace it; make a copy of your `data` directory if you want to save it.
- Make sure the development server is not running (ctrl-C from the shell running `npm run`).
- Delete the current `data` directory and create a new one: `rm -rf data && mkdir data`
- Run the MongoDB database alone: `mongod --dbpath data`
- In another shell, import the dump: `mongorestore -d test path/to/directory/with/bson`
- Shut down the MongoDB database (ctrl-C).
- Start up the development environment: `npm run dev-start`.

Map Visualization
https://www.mapbox.com/install/js/bundler-install/

Deployment
----------

The GTE is deployed on Reclaim Hosting.

To deploy, first make a pull request or a commit to the `master` branch. Then, a GitHub Action will build the appropriate code and push the results to the `build` branch. Then, to deploy to Reclaim:
1. Log in to https://app.my.reclaim.cloud/
2. Go to the "Deployment Manager" -> "GIT / SVN" tab on the bottom. Click the "Deploy to..." icon next to "grandtour". Select the grand tour "Application Environment" for "Environment" and click "Deploy".
3. Grand Tour Explorer and book should be deployed at https://aworldmadebytravel.supdigital.org/.


### notes

install MongoDB 4 on Ubuntu

```
nvm install 14
nvm use 14
npm i
npm i -g heroku
npm run dev-start

wget -qO - https://www.mongodb.org/static/pgp/server-4.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 trusted=yes ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

