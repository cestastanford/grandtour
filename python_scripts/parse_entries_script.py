# This file takes in the "notes" field from json, and 
# splits up the notes according to rules. It is not perfect
# but there's a finalized version of the split up json in the slack of #dumps


import re, pickle, json, argparse
from pymongo import MongoClient


parser = argparse.ArgumentParser()
parser.add_argument("file_path", help="echo the path of the json file")
args = parser.parse_args()

JSON_PATH = args.file_path

print(JSON_PATH)
def open_json(path):
    with open(path) as f:
        data = json.load(f)
    return data

def save_dict_as_json_pretty_printed(d, pathname="./parsed_entries.json"):
    with open(pathname, 'w') as fp:
        json.dump(d, fp, indent=4)


def noteParser(s):
    if s is None:
        return []
    s = s.strip()
    if len(s) <= 1:
        return []
    if s[1] == " ":
        s = s[0] + "." + s[1:]
    s_copy = s
    references_parsed = []
    index = 1
    while True:
        r_str = str(index) + "\. (.+) " + str(index + 1) + "\."
        reg = re.compile(r_str)

        m = reg.search(s_copy)

        # both a valid citation and no match, it is on final match, so change regex
        if not m:
            r_str = str(index) + "\. (.+)"
            reg = re.compile(r_str)
            m = reg.search(s_copy)
            try:
                references_parsed.append(m.group(1).strip())

            except AttributeError as e:
                # log_to_file(s, path_of_log_file, ID)
                return references_parsed + [s_copy, "TODO"]
            break
        index += 1
        try:
            references_parsed.append(m.group(1).strip())
        except AttributeError as e:
            log_to_file(s, path_of_log_file, ID)
            references_parsed.append(s_copy)
            return references_parsed + [s_copy, "TODO"]
        _, end = m.span(1)
        s_copy = s_copy[end:].strip()

    return references_parsed

# this code will print the json with the lists appended to the entries. Makes for easy editing
def main():
    list_of_entries = open_json(JSON_PATH)
    for i, entry in enumerate(list_of_entries):
        parsed_note = noteParser(entry["notes"])
        list_of_entries[i]["parsed_notes"] = parsed_note
    save_dict_as_json_pretty_printed(list_of_entries)

main()
