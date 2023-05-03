# Grand Tour Explorer Python Scripts

## Parents updater file (May 2023)

The parents updater file was made in May 2023. It convert the `parents` field, which was a single object, into an array with the single parent in it.

To run it locally, you can run:

```python
export MONGODB_URI=mongodb://localhost:27017/heroku_c4kbv2zc
python parents_updater.py
```

To run it on production, follow the same instructions as with the source updater master file in the section below.


## Source updater master file (Jan 2023)

The source updater file was made in January 2023. It fixes the `sources` based on each entry's text, using manual rule encoding in the script file.

To run it, first get the connection string to the prod MongoDB database and then make a local copy:

```bash
cd grandtour
export MONGODB_URI=[connection string to prod database]
mongodump --uri $MONGODB_URI --out dump
mongod --dbpath ./data

# In another terminal, run:
mongorestore dump
```

Now with the local database running, run:

```bash
pip3 install -r requirements.txt
export MONGODB_URI=mongodb://localhost:27017/heroku_c4kbv2zc
python source_updater_master.py
```

Finally, once you are happy with the changes, you can run this on the actual production database:

```bash
export MONGODB_URI= # add URL to MongoDB database
python source_updater_master.py
```

If you make any changes to the code, make sure you update tests and then run them:

```bash
pytest
```

## Older files description

### How to run parsing scripts

- Install Python 3. Run `pip3 install -r requirements.txt`.
- Make sure that `titles_for_sources_features.csv` is added, too.
- Run `export MONGODB_URI=...` to set the URI to the mongodb database (such as the production database.)
- Run the appropriate script, for example, `python3 entries_updater_new.py`

entries_updater.py - This uses consolidated_entries.json to add the values for notes, parsed_notes, and consolidated_notes.

entries_updater_2.py - This uses new_corrected_entries.json to replace the values found in `consolidated_notes` field for each entry with the dictionary found in the JSON. This was done as a correction to the first step, as there were some parsing issues initially.

entries_updater_new.py - The updater with the new way of parsing footnotes. It follows the following steps:

1. take all the notes from the "Titles for Sources features" spreadsheet (exported as csv)
1. for each note, do a free text search for its text in the "notes" section of all entries. For each entry in the result, append the note to the "sources" array
1. Also, for each note, look at all the entries linked in the "biography", etc. columns in the "Titles for Sources features" spreadsheet, and add the note to the "sources" array of each entry as appropriate

numTours.py: adds a field to each entry called "numTours". required for the Group By Number of Tours feature in the visualization.
