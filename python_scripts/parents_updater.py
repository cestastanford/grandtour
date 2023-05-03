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

db.entries.update_many({},[{"$set": {"parents": [ "$parents" ] }}])


# db.entries.update({},[{$set: {parents: ["$parents"]}}],{multi: true})

# db.entries.update({},{$pull:{"parents":null}},{multi:true})