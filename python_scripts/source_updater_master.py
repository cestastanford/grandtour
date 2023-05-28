"""
See README for instructions.
"""
import csv
import os
import re
import itertools
from typing import Generator, Iterable
import pymongo
from pymongo import MongoClient
from bson.objectid import ObjectId
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from tqdm import tqdm

RE_PAGE_RANGE = re.compile(r'(\d*)-(\d*)$')
RE_NON_ALPHANUMERIC_WHITESPACE_END = re.compile(r'[^a-zA-Z\d\s]$')
RE_NON_ALPHANUMERIC_WHITESPACE_BEGINNING = re.compile(r'^[^a-zA-Z\d\s]')

def generate_source_regexes(source_name) -> Iterable[re.Pattern]:
    # Simple word check for source name. Match source name with word
    # boundaries (but no word boundaries if the source begins or ends
    # with a non-alphanumeric-whitespace character such as : or *, so
    # they still get matched properly).
    pattern = re.escape(source_name)
    if not RE_NON_ALPHANUMERIC_WHITESPACE_BEGINNING.search(source_name):
        pattern = r'\b' + pattern
    if not RE_NON_ALPHANUMERIC_WHITESPACE_END.search(source_name):
        pattern = pattern + r'\b'
    yield re.compile(pattern)
    
    # Iterate through sources with multiple pages, e.g., "98/1-3"
    # should generate the following regexes: "98/1", "98/2", "98/3"
    match = RE_PAGE_RANGE.search(source_name)
    if match:
        start, end = [int(i) for i in match.groups()]
        for i in range(start, end + 1):
            subbed = RE_PAGE_RANGE.sub(f"{i}", source_name)
            yield from generate_source_regexes(subbed)
    
    # Sometimes HMC "Stuart" is spelled "HMC/Stuart"
    if source_name == "HMC Stuart":
        yield from generate_source_regexes("HMC/Stuart")

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
    with open(os.path.join(os.path.dirname(__file__), 'Parsed Linked Footnotes for final review - Abbreviated titles for parsing March 2023.csv')) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            abbrev = row["Abbreviation in sources"]
            abbrev_dict = row["Abbreviation in dictionary"]
            full = row["Full title"]
            if not abbrev or not abbrev_dict or not full: continue
            for regex in itertools.chain(generate_source_regexes(abbrev), generate_source_regexes(abbrev_dict)):
                sources.append(dict(
                    regex=regex,
                    full=full,
                    abbrev=abbrev
                ))

    with open('output.csv', 'w+') as csvfile:
        fieldnames = ['index', 'source_abbrev', 'context', 'field', 'url', 'source_full']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        bulk_updates = []
        # query = {"index": 42}
        # Loop through all revisionIndexes (16 and 15) to make sure we got all entries.
        entries_already_seen = set()
        for revisionIndex in range(16, 14, -1):
            print("revisionIndex", revisionIndex)
            query = {"_revisionIndex": revisionIndex, "index": {"$nin": list(entries_already_seen) } }
            cnt = db.entries.count_documents(query)
            entries = db.entries.find(query)#.sort("index", pymongo.ASCENDING)
            for entry in tqdm(entries, total=cnt):
                # If we've already seen a newer entry (with a newer revisionIndex), continue.
                if entry["index"] in entries_already_seen: continue
                entries_already_seen.add(entry["index"])
                entry_sources = set(source["abbrev"] for source in entry.get("sources", []))
                for source in sources:
                    if source["abbrev"] in entry_sources: continue
                    for field in ("biography", "narrative", "tours", "notes"):
                        entry_field_text = (entry[field] or "").replace("\xa0", " ")
                        # if field == "notes" and source["abbrev"] == "Voltaire 1967":
                        #     print(source["regex"].search(entry_field_text))
                        #     import pdb; pdb.set_trace()
                        if source["regex"].search(entry_field_text):
                            ctx_result = re.search(r'(\.{0,5}' + source["regex"].pattern + r'.{0,10})', entry_field_text)
                            context = ctx_result.groups()[0] if ctx_result else None
                            writer.writerow(dict(
                                index=entry["index"],
                                source_abbrev=source["abbrev"],
                                context=context,
                                field=field,
                                url=f"https://grandtourexplorer.wc.reclaim.cloud/#/entries/{entry['index']}",
                                source_full=source["full"],))
                            bulk_updates.append(UpdateOne(
                                {"_id": entry["_id"], "_revisionIndex": entry["_revisionIndex"] },
                                {"$push": {
                                    "sources": {
                                        "abbrev": source["abbrev"],
                                        "full": source["full"]
                                    }
                                }}
                            ))


        print(f"Number of updates: {len(bulk_updates)}")
        if input("Check output.csv to ensure it is correct. Write output to database? (y/n)") == "y":
            try:
                db.entries.bulk_write(bulk_updates, ordered=False)
            except BulkWriteError as bwe:
                print(bwe.details)
            print("Done writing updates to database.")


if __name__ == "__main__":
    main()