To get started, install Python 3.

numTours.py should be run for the Group By Number of Tours feature in the visualization.

```
pip3 install pymongo
```

# Files included
entries_updater.py - This uses consolidated_entries.json to add the values for notes, parsed_notes, and consolidated_notes.
entries_updater_2.py - This uses new_corrected_entries.json to replace the values found in `consolidated_notes` field for each entry with the dictionary found in the JSON. This was done as a correction to the first step, as there were some parsing issues initially.

entries_updater_new.py - The updater with the new way of parsing footnotes. It follows the following steps:

1. take all the notes from the "Titles for Sources features" spreadsheet (exported as csv)
1. for each note, do a free text search for its text in the "notes" section of all entries. For each entry in the result, append the note to the "sources" array
1. Also, for each note, look at all the entries linked in the "biography", etc. columns in the "Titles for Sources features" spreadsheet, and add the note to the "sources" array of each entry as appropriate