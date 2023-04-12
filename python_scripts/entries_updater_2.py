"""
Run this after running entries_updater.py.

Replaces the values found in `consolidated_notes` field for each entry with the dictionary found in the JSON. This was done as a correction to the first step, as there were some parsing issues initially.

You must have new_corrected_entries.json in the same directory.
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
# uri = "mongodb://localhost:27017/test" # Use this to test on local database.
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

with open(os.path.join(os.path.dirname(__file__), 'new_corrected_entries.json')) as f:
    mapping_dict = json.load(f)

dry_run = False

bulk_updates = []
entries = db.entries.find()
for entry in entries:
    if "consolidated_notes" not in entry:
        continue
    consolidated_notes = entry["consolidated_notes"]
    changed = False
    new_consolidated_notes = []
    for note in consolidated_notes:
        if note in mapping_dict:
            changed = True
            new_consolidated_notes.append(mapping_dict[note])
        else:
            new_consolidated_notes.append(note)
    if changed:
        bulk_updates.append(UpdateOne(
            {"_id": entry["_id"], "_revisionIndex": entry["_revisionIndex"] },
            {"$set": {
                "consolidated_notes": new_consolidated_notes
            }}
        ))
    if dry_run:
        print(str(entry["_id"]), "changed" if changed else "not changed")

if not dry_run:
    print("Update starting")
    try:
        db.entries.bulk_write(bulk_updates, ordered=False)
    except BulkWriteError as bwe:
        print(bwe.details)
    print("Update complete")