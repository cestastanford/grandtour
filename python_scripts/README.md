To get started, install Python 3.

numTours.py should be run for the Group By Number of Tours feature in the visualization.

```
pip3 install pymongo
```

# Files included
entries_updater.py - This uses consolidated_entries.json to add the values for notes, parsed_notes, and consolidated_notes.
entries_updater_2.py - This uses new_corrected_entries.json to replace the values found in `consolidated_notes` field for each entry with the dictionary found in the JSON. This was done as a correction to the first step, as there were some parsing issues initially.