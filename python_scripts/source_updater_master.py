"""
Run this at the end. This finally updates the entries in the database with the new footnotes values.
You must have consolidated_entries.json in the same directory.
Also, set the environment variable MONGODB_URI to the connection string.
"""
import csv
import os
import re
from typing import Generator, Iterable
import pymongo
from pymongo import MongoClient
from bson.objectid import ObjectId
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from tqdm import tqdm

RE_PAGE_RANGE = re.compile(r'/(\d*)-(\d*)$')
RE_NON_ALPHANUMERIC_WHITESPACE_END = re.compile(r'[^a-zA-Z\d\s]$')
RE_NON_ALPHANUMERIC_WHITESPACE_BEGINNING = re.compile(r'^[^a-zA-Z\d\s]')

def generate_source_regexes(source_name) -> Iterable[re.Pattern]:
    # Simple word check for source name. Match source name with word
    # boundaries (but no word boundaries if the source begins or ends
    # with a non-alphanumeric-whitespace character such as : or *, so
    # they still get matched properly).
    pattern = re.escape(source_name)
    if not RE_NON_ALPHANUMERIC_WHITESPACE_BEGINNING.match(source_name):
        pattern = r'\b' + pattern
    if not RE_NON_ALPHANUMERIC_WHITESPACE_END.match(source_name):
        pattern = pattern + r'\b'
    yield re.compile(pattern)
    
    # Iterate through sources with multiple pages, e.g., "98/1-3"
    # should generate the following regexes: "98/1", "98/2", "98/3"
    match = RE_PAGE_RANGE.search(source_name)
    if match:
        start, end = [int(i) for i in match.groups()]
        for i in range(start, end + 1):
            subbed = RE_PAGE_RANGE.sub(f"/{i}", source_name)
            yield from generate_source_regexes(subbed)

def main():
    uri = os.getenv("MONGODB_URI")
    client = MongoClient(uri)
    database_name = pymongo.uri_parser.parse_uri(uri)['database']
    db = client[database_name]
    sources = []
    with open(os.path.join(os.path.dirname(__file__), 'titles_for_sources_features.csv')) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            for regex in generate_source_regexes(row['abbrev']):
                sources.append(dict(
                    regex=regex,
                    **row
                ))

    query = {"_revisionIndex": 16}
    # query = {"_revisionIndex": 16, "index": 4444}
    cnt = db.entries.count_documents(query)
    entries = db.entries.find(query).sort("index", pymongo.ASCENDING)
    # entries = db.entries.find({"index": 145, "_revisionIndex": 16})
    with open('output.csv', 'w+') as csvfile:
        fieldnames = ['index', 'source_abbrev', 'context', 'field', 'url', 'source_full']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for entry in tqdm(entries, total=cnt):
            entry_sources = set(source["abbrev"] for source in entry.get("sources", []))
            for source in sources:
                if source["abbrev"] in entry_sources: continue
                for field in ("biography", "narrative", "tours", "notes"):
                    if source["regex"].search(entry[field] or ""):
                        ctx_result = re.search(r'(\.{0,5}' + source["regex"].pattern + r'.{0,10})', entry[field] or "")
                        context = ctx_result.groups()[0] if ctx_result else None
                        writer.writerow(dict(
                            index=entry["index"],
                            source_abbrev=source["abbrev"],
                            context=context,
                            field=field,
                            url=f"https://grand-tour-explorer-2017.herokuapp.com/#/entries/{entry['index']}",
                            source_full=source["full"],))

    

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

if __name__ == "__main__":
    main()