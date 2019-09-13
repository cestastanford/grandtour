"""
Run this at the end. Adds numTours variable to db. Used for the numTours variable in the travelers
visualization.
"""
import json
import os
import pymongo
from pymongo import MongoClient

uri = os.getenv("MONGODB_URI")
# uri = "mongodb://localhost:27017/test" # Use this to test on local database.
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

entries = db.entries.find({})
for entry in entries:
    travels = entry["travels"]
    numTours = 0
    for travel in travels:
        if "tourIndex" in travel:
            tourIndex = travel["tourIndex"]
            if tourIndex > numTours:
                numTours = tourIndex
    db.entries.update_one({"_id": entry["_id"]}, {"$set": {"numTours": numTours}})
