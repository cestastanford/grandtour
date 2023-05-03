"""
Splits parents field into an array.
"""
import json
import os
import pymongo
from pymongo import MongoClient

uri = os.getenv("MONGODB_URI")
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

for entry in db.entries.find({}):
    new_parents = [entry["parents"]] if entry["parents"] else []
    db.entries.update_one({"_id": entry['_id']}, {"$set": {"parents": new_parents }})
