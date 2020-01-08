"""
You must have titles_for_sources_features.csv in the same directory.
Also, set the environment variable MONGODB_URI to the connection string.
"""
import json
import os
import pymongo
from pymongo import MongoClient
from bson.objectid import ObjectId
from pymongo import UpdateMany
from pymongo.errors import BulkWriteError
import csv
import re
from tqdm import tqdm

uri = os.getenv("MONGODB_URI")
# uri = "mongodb://localhost:27017/test" # Use this to test on local database.
# Or run:
# export MONGODB_URI=mongodb://localhost:27017/test
client = MongoClient(uri)
database_name = pymongo.uri_parser.parse_uri(uri)['database']
db = client[database_name]

dry_run = True

def construct_free_search_query(keyword, field):
    """Construct free search query; based on code in
    https://github.com/cestastanford/grandtour/blob/e2d5a1d2acccf5e0553f72b54c188ccc022e98e3/query.js#L380
    """
    keyword = keyword.strip()
    matching_regex = re.compile(r"\b" + re.escape(keyword) + r"\b", re.I)
    if not re.match(matching_regex, keyword):
        # Don't do a word boundary search if the word itself does
        # not show up when doing this search on it.
        # For example, the query can be "Bologna [newspaper]" which
        # returns no results if queried with word boundaries \b.
        # Thus, we must perform a regular search without the word
        # boundaries \b.
        # (A word boundary search is equivalent to checking "Match
        # beginning of word" and "Match end of word" in the free
        # word search).
        matching_regex = re.compile(re.escape(keyword), re.I)
        if dry_run:
            print("Not using word boundaries to match keyword: " + keyword)
    assert re.match(matching_regex, keyword) is not None, "regex failed to match keyword: " + keyword
    return {field: matching_regex}

def parse_entry_id_list(input):
    """Parses a comma-separated string of entry IDs into a set."""
    return set(float(item.strip()) for item in input.split(",") if item.strip() != '')

with open(os.path.join(os.path.dirname(__file__), 'titles_for_sources_features.csv')) as f:
    reader = csv.DictReader(f)
    print("Parsing CSV...")
    if dry_run:
        print("[DRY RUN] Checking to make sure 1) all rows in the csv are correctly formatted and 2) the specified entry indexes exist in the db...")
    bulk_updates = []
    bulk_updates.append(UpdateMany(
        {},
        {"$unset": {
            "sources": ""
        }}
    ))
    for row in tqdm(reader):
        notes_entries = db.entries.find(construct_free_search_query(row["abbrev"], "notes"), {"index": 1, "_id": 1})
        entryIndexes = set()
        entryIndexes |= set(e["index"] for e in notes_entries)
        entryIndexes |= parse_entry_id_list(row["bio"])
        entryIndexes |= parse_entry_id_list(row["narrative"])
        entryIndexes |= parse_entry_id_list(row["tours"])
        if dry_run:
            entries = db.entries.find({"index": {"$in": list(entryIndexes) } }, {"index": 1, "_id": 1})
            foundIndexes = set(e["index"] for e in entries)
            assert foundIndexes == entryIndexes, ("foundIndexes and entryIndexes are not equal!", row["abbrev"], foundIndexes, entryIndexes, entryIndexes - foundIndexes)
        bulk_updates.append(UpdateMany(
            {"index": {"$in": list(entryIndexes)}},
            {"$addToSet": {
                "sources": {
                    "abbrev": row["abbrev"],
                    "full": row["full"]
                }
            }}
        ))

if not dry_run:
    print("Update starting")
    try:
        db.entries.bulk_write(bulk_updates, ordered=False)
    except BulkWriteError as bwe:
        print(bwe.details)
    print("Update complete")