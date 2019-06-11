import re
import csv
import json
import pandas as pd
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
from pprint import pprint
import argparse


parser = argparse.ArgumentParser()
parser.add_argument("footnotes_file_path", help="echo the path of the footnotes csv file")
parser.add_argument("parsed_entries_json_path", help="echo the path of the parsed entries from prev script")
args = parser.parse_args()

FOOTNOTE_PATH = args.footnotes_file_path
PARSED_ENTRIES_PATH = args.parsed_entries_json_path



def createSetFromFile(path):
    content = readFileToList(path)
    content = set(content)
    return content


def noteParser(citation, abbreviations):
    candidates = process.extract(
        citation, abbreviations, limit=4, scorer=fuzz.token_set_ratio)
    return citation, candidates

def createMappingsFromTwoFiles(path_to_keys, path_to_values):
    keys = readFileToList(path_to_keys)
    values = readFileToList(path_to_values)
    d = dict(zip(keys, values))
    return d


def readFileToList(path):
    with open(path) as f:
        content = f.readlines()

    # you may also want to remove whitespace characters like `\n` at the end of each line
    content = [x.rstrip() for x in content]
    return content


NO_MATCH_SET = createSetFromFile("unmatched_abbreviations.txt")
CORRECTED_MATCHES = createMappingsFromTwoFiles(
    "one_offs.txt", "corrected_matches.txt")

DF = pd.read_csv(FOOTNOTE_PATH)


def open_json(path):
    with open(path) as f:
        data = json.load(f)
    return data


def save_dict_as_json_pretty_printed(d, pathname="./consolidated_entries.json"):
    with open(pathname, 'w') as fp:
        json.dump(d, fp, indent=4)


# This handles the boundary conditions for the SP entries
def handleSP(orig_reference):
    citation_obj = {79: [6, 8],
                    80: [],
                    83: [],
                    85: [[13, 13], [14, 16]],
                    92: [[27, 32]],
                    92: [[37, 37], [39, 39]],
                    93: [[3, 6], [9, 15], [19, 31], [32, 32]],
                    98: [[19, 37], [39, 46]],
                    104: [[]],
                    105: [[281, 283], [309, 321]]
                    }
    if "SP98" == orig_reference[:4]:
         orig_reference = "SP 98" + orig_reference[5:]
    left_num = orig_reference.partition("/")[0].partition(" ")[2]
    if left_num == "99":
        return "SP 99/57-S3"

    # "SP 98/32, ff.175, 215 (Walton, 7 Apr., 19 Jun. 1731)."
    try:
        ref_number = int(orig_reference.partition(
        "/")[2].partition(",")[0].partition(" ")[0].partition(".")[0])
    except:
        return orig_reference + " TODO"
    for entry in citation_obj[int(left_num)]:
        try:
            if ref_number >= entry[0] and ref_number <= entry[1]:
                return "SP " + left_num + "/" + "-".join((str(i) for i in entry))
        except:
            pass
    return orig_reference

def noteHandler(note):
    if "ibid" in note.lower():
        return note
    if note in NO_MATCH_SET:
        return note
    if note in CORRECTED_MATCHES:
        return CORRECTED_MATCHES[note]


    original_footnote, candidates = noteParser(note, list(
        DF['abbreviation']))
    
    if note[:2] == "SP":
        return handleSP(original_footnote)
    if "Add." == note[:4] or "Eg." == note[:3]:
        return note
    elif candidates[0][1] >= 79:
        return candidates[0][0]
    elif candidates[0][1] < 79 and candidates[0][1] >= 70:
        return note
    else:
        return note

def noteConsolidator(entry):
    parsed_notes = entry["parsed_notes"]
    if entry["_revisionIndex"] != 16 or len(parsed_notes) == 0:
        return parsed_notes

    consolidated_entries = []
    for i, parsed_note in enumerate(parsed_notes):
        new_note = noteHandler(parsed_note)
        consolidated_entries.append(new_note)
    return consolidated_entries

def main():
    list_of_entries = open_json(PARSED_ENTRIES_PATH)
    for i, entry in enumerate(list_of_entries):
        consolidated_note = noteConsolidator(entry)
        list_of_entries[i]["consolidated_notes"] = consolidated_note
    save_dict_as_json_pretty_printed(list_of_entries)


main()
