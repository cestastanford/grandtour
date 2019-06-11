Instructions

1. Export the database from mongoand turn it into json

mongoexport --host localhost --db test --collection entries --out entries.json --fields _id,notes

Then