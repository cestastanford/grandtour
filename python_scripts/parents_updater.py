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

# Set parents to an array
db.entries.update_many({},[{"$set": {"parents": [ "$parents" ] }}])

# Handle entries with no parents
db.entries.update_many({"parents": [ None ]},[{"$set": {"parents": [] }}])