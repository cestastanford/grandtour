"""
Run this at the end. Adds numTours variable to db. Used for the numTours variable in the travelers
visualization.
"""
import json
import os
import pymongo
from pymongo import MongoClient

uri = os.getenv("MONGODB_URI")
uri = "mongodb://localhost:27017/heroku_c4kbv2zc" # Use this to test on local database.
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

db.entries.update_many({},[{"$set": {"parents_parsed": "$parents"}}])
db.entries.update_many({},[{"$addFields":{"parents_parsed": {"parents" : { "$split": [ "$parents.parents", ", and " ]}}}}])

# iterate over each entry in the collection

for entry in db.entries.find():
    # extract the 'parents' array from the current entry
    parents = entry['parents_parsed']
    if 'parents' not in parents:
        continue    

    if  parents['parents'] is None:
        db.entries.update_one({'_id': entry['_id']}, {'$set': {'parents_parsed': []}})
        continue

    
    print(parents)
    # initialize an empty list to hold the parent objects
    parent_objs = []
    
    # iterate over each parent object in the 'parents' array
    for parent in parents['parents']:
        # create a new dictionary to hold the parent object data
        parent_obj = {}
        # add the 'order', 'parent', 'heir', 'pupil', 'surviving',
        # 'posthumous', and 'illegitimate' keys and their values to
        # the parent object dictionary
        for k,v in parents.items(): 
            if k == 'parents':
                parent_obj['parent'] = parent
            else: 
                parent_obj[k] = parents[k]
        
        # add the parent object dictionary to the list of parent objects
        parent_objs.append(parent_obj)
    
    # update the 'parents' key in the current entry with the new list
    # of parent objects
    db.entries.update_one({'_id': entry['_id']}, {'$set': {'parents_parsed': parent_objs}})
