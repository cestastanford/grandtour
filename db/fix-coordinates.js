/*
node -r dotenv/config db/fix-coordinates.js > output.log
*/
var MongoClient = require('mongodb').MongoClient
const csv=require('csvtojson');
var url = process.env.MONGODB_URI_DEV;
const csvFilePath = "db/missing_Albano.csv";
const {find} = require("lodash");

async function main() {
    let db = (await MongoClient.connect(url));
    let allTravelData = await csv().fromFile(csvFilePath);
    let entries = db.collection('entries');
    // console.log(await entries.find({_revisionIndex: 15}).count());
    let filter = {travels: {$elemMatch: {place: "Albano"}}};
    let results = await entries.find(filter).toArray();
    for (let item of results) {
        let travels = item.travels;
        // console.log(item._id, item.index);
        let toUpdate = false;
        for (let travel of travels) {
            let actualTravelData = find(allTravelData, {"place": travel.place});
            if (!travel.place) {
                console.log("NO PLACE: ", item._id, JSON.stringify(item, null, 2));
                continue;
            }
            if (!actualTravelData) {
                // console.log("=====No travel data found for " + travel.place);
                continue;
            }
            console.log("old", "\t", travel.place, travel.latitude, actualTravelData["FINAL LAT"], travel.longitude, actualTravelData["FINAL LON"], actualTravelData["Italy"]);
            toUpdate = true;
            travel.latitude = actualTravelData["FINAL LAT"];
            travel.longitude = actualTravelData["FINAL LON"];
            travel.italy = actualTravelData["Italy"] === "Y";
        }
        if (toUpdate) {
            console.log("updating", item._id);
            await entries.updateOne({_id: item._id}, {$set: {travels: travels}});
        }
        // break;
    }
    console.log("DONE");
}
main();