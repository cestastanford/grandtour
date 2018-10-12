The Grand Tour Explorer
=======================
This is the codebase for the Grand Tour Explorer web project.  To set up a local development environment, follow these steps:
- Make sure you have the following tools installed:
  - [NodeJS 8.4 or later](https://nodejs.org/en/)
  - [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
  - [MongoDB](https://www.mongodb.com/download-center/v2/community)
- Clone the repository locally: `git clone https://github.com/codyml/gte.git`.
- From the repository directory, install npm and Bower dependencies: `npm install`
- Create an environmental variable file: `echo "MONGODB_URI='localhost:27017'" > .env`
- Create a data directory: `mkdir data`
- Start the server: `npm run dev-start`.  This will create and host a MongoDB database and start the Node server.
- Check the console output for the automatically-created default admin user login info.  This account is created when no existing user accounts exist.
- Check the console output for the local address of the site (often http://localhost:5100).  Visit that address and log in!

Restoring a MongoDB database backup
-----------------------------------
To restore a MongoDB database backup into your local database, unzip the backup and find the directory containing the BSON and JSON files.  With the server and database running (see above), run the following command: `mongorestore -d test path/to/directory/with/bson/json`.
