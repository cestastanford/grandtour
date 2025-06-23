Here is how to run the Grand Tour Explorer locally from the archive:

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- The Grand Tour Explorer archive (grandtour-master.zip)

## Setup Instructions

1. **Extract the archive:**
   ```bash
   unzip grandtour-master.zip
   cd grandtour-master
   ```

2. **Start the application using Docker:**
   ```bash
   docker-compose up --build
   ```
   
   This will:
   - Build the Jekyll book component
   - Build the Angular/Node.js Explorer application
   - Start MongoDB database
   - Start the Express server

3. **Import the database dump:**
   
   After the containers are running, open a new terminal and import the database:
   ```bash
   docker exec -it grandtour-mongodb mongorestore -d grandtour /docker-entrypoint-initdb.d/dump/grandtour --drop
   ```

4. **Access the application:**
   - Open your browser to http://localhost:5100
   - The Explorer interface will be available at http://localhost:5100/explorer
   - The book content will be available at http://localhost:5100

## Troubleshooting

- If you encounter port conflicts, check that ports 5100 and 27017 are available
- For permission issues with Docker, ensure your user is in the docker group
- If the Jekyll build fails, ensure Ruby 3.1+ and bundler are installed