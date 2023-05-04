"""
Splits parents field into an array.
"""
import json
import os
import pymongo
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError
from tqdm import tqdm

uri = os.getenv("MONGODB_URI")
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

bulk_updates = []

for entry in tqdm(db.entries.find({})):
    if type(entry["parents"]) is list:
        continue
    new_parents = [entry["parents"]] if entry["parents"] else []
    bulk_updates.append(UpdateOne(
        {"_id": entry['_id']},
        {"$set": {"parents": new_parents } }
    ))

try:
    db.entries.bulk_write(bulk_updates, ordered=False)
except BulkWriteError as bwe:
    print(bwe.details)
