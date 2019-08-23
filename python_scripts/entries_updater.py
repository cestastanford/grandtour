"""
Run this at the end. This finally updates the entries in the database with the new footnotes values.
You must have consolidated_entries.json in the same directory.
Also, set the environment variable MONGODB_URI to the connection string.
"""
import json
import os
import pymongo
from pymongo import MongoClient
from bson.objectid import ObjectId
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError

uri = os.getenv("MONGODB_URI")
# uri = "mongodb://user:2uHApc4xCLXTA8h@ds157723.mlab.com:57723/heroku_4rpt6s2b" #?retryWrites=false"
# uri = "mongodb://localhost:27017/test" # Use this to test on local database.
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

entries = db.entries.find({})
for entry in entries:
    print(entry)
    # travels = entry["travels"]
    # numTours = 0
    # for travel in travels:
    #     if "tourIndex" in travel:
    #         tourIndex = travel["tourIndex"]
    #         if tourIndex > numTours:
    #             numTours = tourIndex
    # db.entries.update_one({"_id": entry["_id"]}, {"$set": {"numTours": numTours}})

# with open(os.path.join(os.path.dirname(__file__), 'consolidated_entries.json')) as f:
#     updates = json.load(f)

# bulk_updates = []
# for update in updates:
#     bulk_updates.append(UpdateOne(
#         {"_id": ObjectId(update["_id"]["$oid"]), "_revisionIndex": update["_revisionIndex"] },
#         {"$set": {
#             "parsed_notes": update["parsed_notes"],
#             "consolidated_notes": update["consolidated_notes"]
#         }}
#     ))

# try:
#     db.entries.bulk_write(bulk_updates, ordered=False)
# except BulkWriteError as bwe:
#     print(bwe.details)