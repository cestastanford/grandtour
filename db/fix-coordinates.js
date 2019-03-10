var MongoClient = require('mongodb').MongoClient
const csv=require('csvtojson');
// var url = 'mongodb://heroku_4rpt6s2b:20uihpahtlbtngigubmdbgce4m@ds157723.mlab.com:57723/heroku_4rpt6s2b';
var url = 'mongodb://heroku_c4kbv2zc:li372oaj29alsklj0045gmfn4c@ds213975-a0.mlab.com:13975,ds213975-a1.mlab.com:13975/heroku_c4kbv2zc?replicaSet=rs-ds213975';
const csvFilePath = "missing_coordinates.csv";
const {find} = require("lodash");

async function main() {

    let db = (await MongoClient.connect(url));
    let allTravelData = await csv().fromFile(csvFilePath);
    let entries = db.collection('entries');
    // console.log(await entries.find({_revisionIndex: 15}).count());
    let results = await entries.find({}).toArray();
    for (let item of results) {
        let travels = item.travels;
        // console.log(item._id, item.index);
        for (let travel of travels) {
            let actualTravelData = find(allTravelData, {"place": travel.place});
            if (!travel.place) {
                console.log("NO PLACE: ", item._id, JSON.stringify(item, null, 2));
                continue;
            }
            if (!actualTravelData) {
                console.log("=====No travel data found for " + travel.place);
                continue;
            }
            // console.log("\t", travel.place, travel.latitude, actualTravelData["FINAL LAT"], travel.longitude, actualTravelData["FINAL LON"], actualTravelData["Italy"]);

            travel.latitude = actualTravelData["FINAL LAT"];
            travel.longitude = actualTravelData["FINAL LON"];
            travel.italy = actualTravelData["Italy"] === "Y";
        }
        entries.updateOne({_id: item._id}, {$set: {travels: travels}});
        // break;
    }
}
main();