/*
*   Imports
*/

const Entry = require('./models/entry')
const { getLatestRevisionIndex, getQueryCounts, setQueryCounts } = require('./cache')
const { cloneDeep } = require("lodash");

/*
*   Calculates the counts of entries with values for each field
*   query mapping.
*/

exports.getCounts = async revisionIndex => {

    let counts = getQueryCounts(revisionIndex)
    if (!counts) {

        const countQueries = {

            fullName: { fullName: { $ne: null, $ne: '' } },
            alternateNames: { 'alternateNames.alternateName': { $exists: true } },
            birthDate: { 'dates.birthDate': { $exists: true } },
            index: { 'index': { $exists: true } },
            birthPlace: { 'places.birthPlace': { $exists: true } },
            deathDate: { 'dates.deathDate': { $exists: true } },
            deathPlace: { 'places.deathPlace': { $exists: true } },
            type: { type: { $ne: null } },
            societies: { 'societies.title': { $exists: true } },
            societies_role: { 'societies.role': { $exists: true } },
            education_institution: { 'education.institution': { $exists: true } },
            education_place: { 'education.place': { $exists: true } },
            education_degree: { 'education.degree': { $exists: true } },
            education_teacher: { 'education.teacher': { $exists: true } },
            pursuits: { pursuits: { $ne: [] } },
            occupations: { 'occupations.title': { $exists: true } },
            occupations_group: { 'occupations.group': { $exists: true } },
            occupations_place: { 'occupations.place': { $exists: true } },
            military: { 'military.rank': { $exists: true } },
            travelPlace: { travels: { $not: { $size: 0 } }, 'travels.place': { $exists: true } },
            travelDate: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartYear': { $ne: 0 } }, { 'travels.travelEndYear': { $ne: 0 } }] },
            travel_year: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartYear': { $ne: 0 } }, { 'travels.travelEndYear': { $ne: 0 } }] },
            travel_month: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartMonth': { $ne: 0 } }, { 'travels.travelEndMonth': { $ne: 0 } }] },
            travel_day: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartDay': { $ne: 0 } }, { 'travels.travelEndDay': { $ne: 0 } }] },
            exhibitions: { 'exhibitions.title': { $exists: true } },
            exhibitions_activity: { 'exhibitions.activity': { $exists: true } },
            mentionedNames: { 'mentionedNames.name': { $exists: true } },
            sources: { 'sources': { $exists: true } },
        }

        const facets = {}
        Object.keys(countQueries).forEach(key => {

            facets[key] = [
                { $match: countQueries[key] },
                { $count: 'count' },
            ]

        })

        const results = await Entry.aggregateAtRevision(revisionIndex)
            .facet(facets)

        counts = {}
        Object.keys(results[0]).forEach(key => {
            counts[key] = results[0][key][0] ? results[0][key][0].count : 0
        })

        setQueryCounts(revisionIndex, counts)

    }

    return { counts }

}


/*
*   This is a large block of code that performs queries.
*/

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}

function getRegExp(str, exact) {
    if (exact) {
        // No regular expression needed.
        return str;
    }
    var escapedString = escapeRegExp(str)
    return {
        $regex: new RegExp(escapedString, 'gi')
    }
}


exports.suggest = function (req, res, next) {

    var field = req.body.field;
    var value = req.body.value;
    var query = { $regex: new RegExp(value, "i") };
    var condition = { [field]: query }
    if (field === 'fullName') {

        var query = { $or: [{ fullName: condition[field] }, { alternateNames: { $elemMatch: { alternateName: condition[field] } } }] };
        var projection = { fullName: true, alternateNames: true };
        Entry.findAtRevision(query, res.locals.activeRevisionIndex, projection, field)
            .then(response => {

                var matches = [];
                var doesMatch = d => d.search(new RegExp(value, "i")) != -1
                response.forEach(function (entry) {

                    if (doesMatch(entry.fullName)) matches.push({ nameMatch: entry.fullName });
                    entry.alternateNames.forEach(function (alternateName) {

                        if (doesMatch(alternateName.alternateName)) matches.push({
                            nameMatch: alternateName.alternateName,
                            see: entry.fullName,
                        });

                    });

                });

                res.json({ results: matches });

            })
            .catch(next)

    } else {

        Entry.distinctAtRevision(field, condition, res.locals.activeRevisionIndex)
            .then(results => res.json({ results }))
            .catch(next)

    }

}


/*
 * Get uniques for a given query and suggestion field.
 * example: query = {}, field = "occupations", suggestion = "occupations.group"
 */
async function getUniquesForSingleSuggestion({ activeRevisionIndex, query, field, suggestion }) {
    if (query[field] && query[field].operator === "or") {
        // When we have an OR query, for the field corresponding to the current
        // suggestions field, remove that field from the query. Otherwise,
        // it ends up essentially becoming an AND query.
        let {[field]: fieldPartOfQuery, ...restOfQuery} = query;
        query = restOfQuery;
    }
    
    query = parseQuery(query);
    const pipeline = Entry.aggregateAtRevision(activeRevisionIndex)
        .append({ $match: query })
        .append({ $unwind: '$' + suggestion.split('.')[0] });

    if (suggestion === 'fullName') {

        pipeline.append({
            $project: {
                index: true,
                parentFullName: '$fullName',
                fullName: {
                    $concatArrays: [
                        {
                            $ifNull: [
                                {
                                    $map: {
                                        input: '$alternateNames',
                                        as: 'grade',
                                        in: '$$grade.alternateName',
                                    }
                                },
                                [],
                            ]
                        },
                        ['$fullName'],
                    ]
                }
            }
        })

        pipeline.append({ $unwind: '$fullName' })

    }

    const group = {}
    if (suggestion === 'fullName') {
        group['_id'] = { d: { fullName: '$fullName', parentFullName: '$parentFullName' }, u: '$index' }
    }
    else if (suggestion === 'mentionedNames.name') {
        group['_id'] = { d: "$mentionedNames.name", u: '$index', entryIndex: "$mentionedNames.entryIndex" };
    }
    else {
        group['_id'] = { d: '$' + suggestion, u: '$index' }
    }
    group['count'] = { $sum: 1 };
    pipeline.append({ $group: group });

    if (suggestion === "mentionedNames.name") {
        pipeline.append({ $group: { _id: '$_id.d', entryIndex: { $first: "$_id.entryIndex" }, count: { $sum: 1 } } });
        pipeline.append({ $project: { _id: "$_id", count: "$count", unmatched: { "$lte": ["$entryIndex", null] } } });
    }
    else {
        pipeline.append({ $group: { _id: '$_id.d', count: { $sum: 1 } } });
    }

    if (suggestion === 'fullName') pipeline.append({
        $project: {
            _id: '$_id.fullName',
            parentFullName: '$_id.parentFullName',
            count: true,
        }
    })

    const results = await pipeline.append({ $sort: { count: -1 } })
    return results.filter(d => d._id !== null);
}

/* Get uniques for a range of fields specified in "suggestions",
 * filtered by "query".
 * Sample req.body:
    {
        "query": {},
        "suggestions": ["occupations.group", "pursuits.pursuit"],
        "fields": ["occupations", "pursuits"]
    }
    // TODO: We don't really need to accept a "fields" attribute, if we refactor the field list
    // from public/explore/explore.pug into constants that can be read by the server too.
 */
exports.uniques = async function (req, res, next) {
    const query = req.body.query;
    const activeRevisionIndex = res.locals.activeRevisionIndex;
    const fields = req.body.fields;
    const suggestions = req.body.suggestions;

    const uniquesRequests = suggestions.map((suggestion, i) =>
        getUniquesForSingleSuggestion({
            activeRevisionIndex,
            query,
            field: fields[i],
            suggestion,
        })
    );
    let results;
    try {
        results = await Promise.all(uniquesRequests);
    }
    catch (e) {
        next(e);
    }
    let response = {};
    for (const i in suggestions) {
        const suggestion = suggestions[i];
        response[suggestion] = results[i];
    }
    res.json(response);

}


var searchMap = {
    fullName: (d, exact) => ({
        $or: [
            { fullName: getRegExp(d, exact) },
            { alternateNames: { $elemMatch: { alternateName: getRegExp(d, exact) } } },
        ]
    }),
    type: d => {
        if (d) {
            return { type: d }
        } else {
            // Unknown
            return { type: {$nin: ["Male", "Female"]}}
        }
    },
    index: d => {
        if (d.$type || (d.$not && d.$not.$type)) {
            // Origin queries from the map (see chart.component.ts)
            return {index: d};
        }
        let commaSepValues = d.startIndex.split(",");
        let hyphenSepValues = [];
        let hyphenSepDec = [];
        commaSepValues.forEach(item => {
            const range = item.split('-');
            if (range.length === 2) {
              const start = parseFloat(range[0]);
              const end = parseFloat(range[1]);
              for (let i = start; i <= end; i++) { hyphenSepValues.push(i); }
              for (let i = start; i <= end; i += 0.1) { hyphenSepDec.push(parseFloat(i.toFixed(1))); }
            } else {
              hyphenSepValues.push(parseFloat(item));
            }
          });
        let queries = {
            $or: 
            [ 
                { index: { $in: hyphenSepValues } },
                { index: { $in: hyphenSepDec } },
                { index: { $gte: parseFloat(d.startIndex), $lte: parseFloat(d.endIndex) } },
            ]
        }


        return queries;
    },
    // todo add month filtering.
    birthDate: d => ({ dates: { $elemMatch: { birthDate: { $gte: parseInt(d.startYear), $lte: parseInt(d.endYear) } } } }),
    deathDate: d => ({ dates: { $elemMatch: { deathDate: { $gte: parseInt(d.startYear), $lte: parseInt(d.endYear) } } } }),
    travelDate: d => {
        let startYear = parseInt(d.startYear);
        let endYear = parseInt(d.endYear);
        let startMonth = parseInt(d.startMonth);
        let endMonth = parseInt(d.endMonth);
        let queries = {
            singleYear: {
                $and: [
                    { travelEndYear: { $gte: startYear } },
                    { travelStartYear: { $lte: startYear } }
                ],
            },
            singleMonth: {
                $or: [
                    { travelStartMonth: { $exists: false } },
                    { travelEndMonth: { $exists: false } },
                    { travelStartMonth: { $eq: 0 } },
                    { travelEndMonth: { $eq: 0 } },
                    { 
                        $and: [
                            { travelEndYear: { $gt: startYear } },
                            { travelStartYear: { $lt: startYear } }
                        ],
                    },
                    { 
                        $and: [
                            { travelEndYear: { $eq: startYear } },
                            { travelStartYear: { $eq: startYear } },
                            { travelStartMonth: { $lte: startMonth} },
                            { travelEndMonth: { $gte: startMonth } }
                        ],
                    },
                    { 
                        $and: [
                            { travelEndYear: { $gt: startYear } },
                            { travelStartYear: { $eq: startYear} },
                            { travelStartMonth: { $lte: startMonth } }
                        ],
                    },
                    {
                        $and: [
                            { travelStartYear: { $lt: startYear } },
                            { travelEndYear: { $eq: startYear} },
                            { travelEndMonth: { $gte: startMonth } }
                        ],
                    }

                ]
            },
            rangeOfYears: {
                $or: [
                    {
                        $and: [
                            { travelStartYear: { $gte: startYear } },
                            { travelEndYear: { $lte: endYear } }
                        ]
                    },
                    {
                        $and: [
                            { travelStartYear: { $lte: startYear } },
                            { travelEndYear: { $gte: startYear } }
                        ]
                    },
                    {
                        $and: [
                            { travelStartYear: { $lte: endYear } },
                            { travelEndYear: { $gte: endYear } }
                        ]
                    }
                ],
            },
            rangeOfMonths: {
                $or: [
                    // TODO: what if only one is undefined?
                    { travelStartMonth: { $exists: false } },
                    { travelEndMonth: { $exists: false } },
                    { travelStartMonth: { $eq: 0 } },
                    { travelEndMonth: { $eq: 0 } },
                    {
                        $and: [
                            { travelStartMonth: { $gte: startMonth } },
                            { travelEndMonth: { $lte: endMonth } }
                        ]
                    },
                    {
                        $and: [
                            { travelStartMonth: { $lte: startMonth } },
                            { travelEndMonth: { $gte: startMonth } }
                        ]
                    },
                    {
                        $and: [
                            { travelStartMonth: { $lte: endMonth } },
                            { travelEndMonth: { $gte: endMonth } }
                        ],
                    }
                ],
            }
        };
        let andQueries = [];
        if (!startYear && startMonth) {
            if (!endMonth || (startMonth === endMonth)) {
                // Single month.
                andQueries.push(queries.singleMonth);
            }
            else if (endMonth) {
                // Range of months.
                andQueries.push(queries.rangeOfMonths);
            }
        }
        else if (startYear && (!endYear || (startYear === endYear))) {
            if (!startMonth && !endMonth) {
                // Single year.
                andQueries.push(queries.singleYear);
            }
            else if (startMonth && (!endMonth || (startMonth === endMonth))) {
                // Single year, single month.
                andQueries.push(queries.singleYear);
                andQueries.push(queries.singleMonth);
            }
            else if (startMonth !== endMonth) {
                // Single year, range of months.
                andQueries.push(queries.singleYear);
                andQueries.push(queries.rangeOfMonths);
            }
        }
        else if (startYear !== endYear) {
            if (!startMonth && !endMonth) {
                // Range of years.
                andQueries.push(queries.rangeOfYears);
            }
            else if (startMonth && (!endMonth || (startMonth === endMonth))) {
                // Range of years, single month.
                andQueries.push(queries.rangeOfYears);
                andQueries.push(queries.singleMonth);
            }
            else if (startMonth !== endMonth) {
                // Range of years, range of months.
                andQueries.push(queries.rangeOfYears);
                andQueries.push(queries.rangeOfMonths);
            }
        }
        return {
            travels: {
                $elemMatch: {
                    $and: andQueries
                }
            }
        };
    },

    birthPlace: (d, exact) => ({ places: { $elemMatch: { birthPlace: getRegExp(d, exact) } } }),
    deathPlace: (d, exact) => ({ places: { $elemMatch: { deathPlace: getRegExp(d, exact) } } }),
    travelPlace: (d, exact) => ({ travels: { $elemMatch: { place: getRegExp(d, exact) } } }),

    societies: (d, exact) => ({ societies: { $elemMatch: { title: getRegExp(d, exact) } } }),
    societies_role: (d, exact) => ({ societies: { $elemMatch: { role: getRegExp(d, exact) } } }),

    education_institution: (d, exact) => ({ education: { $elemMatch: { institution: getRegExp(d, exact) } } }),
    education_place: (d, exact) => ({ education: { $elemMatch: { place: getRegExp(d, exact) } } }),
    education_degree: (d, exact) => ({ education: { $elemMatch: { fullDegree: getRegExp(d, exact) } } }),
    education_teacher: (d, exact) => ({ education: { $elemMatch: { teacher: getRegExp(d, exact) } } }),

    sources: (d, exact) => ({ sources: {$elemMatch: { abbrev: getRegExp(d, exact) } } }),
    
    pursuits: (d, exact) => ({ pursuits: { $elemMatch: { pursuit: getRegExp(d, exact) } } }),

    occupations: (d, exact) => ({ occupations: { $elemMatch: { title: getRegExp(d, exact) } } }),
    occupations_group: (d, exact) => ({ occupations: { $elemMatch: { group: getRegExp(d, exact) } } }),
    occupations_place: (d, exact) => ({ occupations: { $elemMatch: { place: getRegExp(d, exact) } } }),

    exhibitions: (d, exact) => ({ exhibitions: { $elemMatch: { title: getRegExp(d, exact) } } }),
    exhibitions_activity: (d, exact) => ({ exhibitions: { $elemMatch: { activity: getRegExp(d, exact) } } }),

    military: (d, exact) => ({ military: { $elemMatch: { rank: getRegExp(d, exact) } } }),

    entry: d => d.terms.map(term => ({
        [term.negative === true ? "$and" : "$or"]: d.sections.filter(section => section.checked).map(section => {
            let regexpValue = (term.beginning ? '\\b' : '')
                + escapeRegExp(term.value)
                + (term.end ? '\\b' : '');
            if (term.negative === true) { // Does not contain. See https://stackoverflow.com/a/33971012
                regexpValue = `^((?!${regexpValue}).)*$`;
            }
            return {
                [section.key]: {
                    $regex: new RegExp(regexpValue, 'gi')
                }
            };
        })
    })),

    mentionedNames: (d, exact) => ({ mentionedNames: { $elemMatch: { name: getRegExp(d, exact) } } }),
    numTours: d => ({ numTours: d }),

}


/*
 * Parse query to become a mongo query.
 * Input: query - a dictionary with keys equal to the field names,
 * and values with attributes:
 * "operator" ("and" or "or")
 * "uniques" - an array of objects with "_id" equal to the value, such as {"_id": "Diplomacy"}.
 * * The "negative" attribute in each element of the array allows this query search to be negative.
 * 
 * Sample query: {"field1": {"operator": "and", "uniques": [{ "_id": "Diplomacy" }, { "_id": "Democracy" }]} }
 * Sample negative query: {"field1": {"operator": "or", "pursuits": [{"_id": "diplomat", "negative": true}]} }
 * 
 * other formats also allowed (default operator is "or"):
 * ["field1": [{"_id: "Diplomacy"}] }
 * ["field1": ["Diplomacy"]}
 * ["field1": "Dipl"} // This will do a fuzzy search. Used in the search endpoint.
 * things for startDate and endDate - todo document this.
 */
function parseQuery(query) {

    var output = {};
    for (let k in query) {
        let uniques = query[k].uniques || query[k];
        let list = [];
        if (Array.isArray(uniques)) {
            for (let queryItem of uniques) {
                if (typeof queryItem === 'string') {
                    list.push(searchMap[k](queryItem, true))
                }
                else if (queryItem._id || queryItem._id === "") {
                    let item = searchMap[k](queryItem._id, true);
                    if (queryItem.negative === true && queryItem._id !== "entry") {
                        for (let key in item) {
                            let value = item[key];
                            if (Array.isArray(value)) { // in the case that an array of queries is given, the entire array is negated with the $nor operator
                                delete item[key];
                                key = "$nor";
                            } else if (value instanceof Object) {
                                value = { $not: value };
                            } else {
                                value = { $neq: value };
                            }
                            item[key] = value;
                        }
                    }
                    list.push(item);
                }
            }
        }
        else {
            // Search functionality - fuzzy search. "uniques" would actually just be a single object.
            if (k === "entry") {
                // In the case of free search (renamed word search in the entries), searchMap[k] returns a list itself.
                list = searchMap[k](uniques, false);
            }
            else {
                list.push(searchMap[k](uniques, false));
            }
        }
        if (list.length === 0) {
            continue;
        }
        if (query[k].operator === 'and') {
            output[k] = { $and: list };
        }
        else {
            output[k] = { $or: list };
        }
    }

    // Travel date and travel place - should combine to be "and" if both are specified.
    if (output.travelDate && output.travelPlace) {
        output.travelQuery = cloneDeep(output.travelPlace);
        let operator = output.travelQuery["$or"] ? "$or" : "$and";
        for (let i in output.travelQuery[operator]) {
            if (output.travelQuery[operator][i].travels.$not) {
                output.travelQuery[operator][i].travels.$not.$elemMatch = {
                    $and: [
                        output.travelQuery[operator][i].travels.$not.$elemMatch,
                        output.travelDate["$or"][0].travels.$elemMatch
                    ]
                };
            }
            else {
                output.travelQuery[operator][i].travels.$elemMatch = {
                    $and: [
                        output.travelQuery[operator][i].travels.$elemMatch,
                        output.travelDate["$or"][0].travels.$elemMatch
                    ]
                };
            }
        };
        console.log(JSON.stringify(output.travelQuery));
        delete output.travelDate;
        delete output.travelPlace;
    }

    return Object.values(output).length ? { $and: Object.values(output) } : {};

}
exports.parseQuery = parseQuery;

exports.search = (req, res, next) => {

    const originalQuery = JSON.stringify(req.body.query);
    const query = parseQuery(req.body.query);

    Entry.findAtRevision(
        query,
        res.locals.activeRevisionIndex,
        // values to retrieve for projectForEntryList
        {
            index: true,
            fullName: true,
            type: true,
            numTours: true,
            biography: true,
            tours: true,
            narrative: true,
            notes: true,
            travels: true,
            numTours: true,
        },
        null,
        req.body.limit || null,
        req.body.skip || null
    )
        .then(entries => entries.map(projectForEntryList))
        .then(entries => res.json({ request: JSON.parse(originalQuery), entries }))
        .catch(next)

}

/*
 *  Given an entry's travels array and total number of tours, this function
 *  returns the sum of all tour times.
 */
function getTravelTime(travels, numTours) {
    
    var accum = 0;
    var i;
    for (i = 1; i <= numTours; i++) {
        var thisTour = travels.filter(function (d) {
            return d.tourIndex === i;
        });

        if (thisTour && thisTour[0]) {
            var firstTravel = thisTour[0];
            var lastTravel = thisTour[thisTour.length - 1];

            if (firstTravel.tourStartFrom && (firstTravel.travelStartMonth || firstTravel.travelStartMonth == 0) && lastTravel.tourEndTo && (lastTravel.travelEndMonth || lastTravel.travelEndMonth == 0)) {
                var firstDate = new Date(firstTravel.tourStartFrom, firstTravel.travelStartMonth);
                var lastDate = new Date(lastTravel.tourEndTo, lastTravel.travelEndMonth);
    
                accum += lastDate - firstDate;
            }
        }
    }
    return accum;
}


const projectForEntryList = entry => ({

    index: entry.index,
    fullName: entry.fullName,
    gender: entry.type,
    numTours: entry.numTours,
    entryLength: (entry.biography ? entry.biography.split(" ").length : 0) + (entry.tours ? entry.tours.split(" ").length : 0) + (entry.narrative ? entry.narrative.split(" ").length : 0) + (entry.notes ? entry.notes.split(" ").length : 0),
    biographyLength: entry.biography ? entry.biography.length: 0,
    travelTime: entry.travels ? getTravelTime(entry.travels, entry.numTours) : 0,
    biographyExcerpt: entry.biography ? entry.biography.slice(0, 200) : '',
    dateOfFirstTravel: entry.travels ? entry.travels.reduce((accum, travel) => {

        if (accum) return accum
        else if (travel.travelStartYear) {
            const utc = Date.UTC(travel.travelStartYear, travel.travelStartMonth, travel.travelStartDay)
            return utc
        }

    }, 0) : 0,

})

exports.projectForEntryList = projectForEntryList


function parseExport(res) {

    var mentions = [];
    var mentionIndex = 0;

    var activities = [];
    var activityIndex = 0;
    var travels = [];

    var entries = res.map(function (d) {

        var entry = {};

        // index
        entry["Entry ID"] = d.index;
        // fullName
        entry.travelerNames = d.fullName;
        // gender
        entry.gender = d.type || "Not available";
        // birthDate
        entry.birthDate = d.dates[0] ? d.dates[0].birthDate || "" : "";
        // deathDate
        entry.deathDate = d.dates[0] ? d.dates[0].deathDate || "" : "";
        // birthPlace
        entry.birthPlace = d.places[0] ? d.places[0].birthPlace || "" : "";
        // deathPlace
        entry.deathPlace = d.places[0] ? d.places[0].deathPlace || "" : "";
        // parents
        entry.parents = (d.parents && d.parents.map && d.parents.map(p => p.parents).join(";")) || "";

        let entryBase = {
            ["Entry ID"]: d.index,
            travelerNames: entry.travelerNames,
            birthDate: entry.birthDate,
            deathDate: entry.deathDate,
            gender: entry.gender
        };
        // activities

        // marriages
        if (d.marriages && d.marriages.length) d.marriages.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'marriage',
            eventsDetail1: a.sequence || "",
            eventsDetail2: a.spouse || "",
            place: "",
            startDate: a.year || "",
            endDate: "",
            eventsIndex: ++activityIndex,
        }))

        // education
        if (d.education && d.education.length) d.education.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'education',
            eventsDetail1: "",
            eventsDetail2: a.institution || "",
            place: a.place || "",
            startDate: a.from || "",
            endDate: a.to || "",
            eventsIndex: ++activityIndex,
        }))

        // societies
        if (d.societies && d.societies.length) d.societies.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'society',
            eventsDetail1: a.role || "",
            eventsDetail2: a.title || "",
            place: "",
            startDate: a.from || "",
            endDate: a.to || "",
            eventsIndex: ++activityIndex,
        }))

        // exhibitions
        if (d.exhibitions && d.exhibitions.length) d.exhibitions.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'exhibition',
            eventsDetail1: "",
            eventsDetail2: a.title || "",
            place: a.place || "",
            startDate: a.from || "",
            endDate: a.to || "",
            eventsIndex: ++activityIndex,
        }))

        // pursuits
        if (d.pursuits && d.pursuits.length) d.pursuits.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'DBITI employment or identifier',
            eventsDetail1: "",
            eventsDetail2: a.pursuit,
            place: "",
            startDate: "",
            endDate: "",
            eventsIndex: ++activityIndex,
        }))

        // occupations
        if (d.occupations && d.occupations.length) d.occupations.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'occupation',
            eventsDetail1: a.group,
            eventsDetail2: a.title,
            place: a.place || "",
            startDate: a.from || "",
            endDate: a.to || "",
            eventsIndex: ++activityIndex,
        }))

        // military
        if (d.military && d.military.length) d.military.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'military career',
            eventsDetail1: a.officeType,
            eventsDetail2: a.rank,
            place: "",
            startDate: a.rankStart || "",
            endDate: a.rankEnd || "",
            eventsIndex: ++activityIndex,
        }))

        // travels
        if (d.travels && d.travels.length) d.travels.forEach((a, i) => travels.push({
            ...entryBase,
            tourStartYear: a.tourStartFrom,
            tourEndYear: a.tourEndFrom,
            placeOfVisit: a.place || "",
            coordinates: a.latitude ? [a.latitude, a.longitude].join(",") : "",
            visitStartYear: a.travelStartYear || "",
            visitStartMonth: a.travelStartMonth || "",
            visitStartDay: a.travelStartDay || "",
            visitEndYear: a.travelEndYear || "",
            visitEndMonth: a.travelEndMonth || "",
            visitEndDay: a.travelEndDay || "",
            markers: a.markers || "",
            travelIndex: i,
        }))

        entry.sources = d.sources && d.sources.length ? d.sources.map(function (d) { return d.abbrev; }).join(",") : "";

        entry.eventsIndex = activities
            .filter(d => d["Entry ID"] === entry["Entry ID"])
            .map(d => d.eventsIndex)
            .join(",");

        // mentionedNames stored into mentions array
        if (d.mentionedNames && d.mentionedNames.length) d.mentionedNames.forEach(m => mentions.push({
            matchedMentions: m.name && typeof m.entryIndex === 'number' ? m.name : "",
            unmatchedMentions: m.name && typeof m.entryIndex !== 'number' ? m.name : "",
            matchedMentionsEntryIndexes: m.name && typeof m.entryIndex === 'number' ? "" + m.entryIndex : "",
            index: d.index,
        }))

        // mentions array parsed to get mentioned names for each entry
        if (d.mentionedNames && d.mentionedNames.length) {
            entry.matchedMentions = mentions
                .filter(function (m) { return m.index == entry["Entry ID"] && m.matchedMentions !== ""; })
                .map(function (m) { return m.matchedMentions; })
                .join(";");

            entry.unmatchedMentions = mentions
                .filter(function (m) { return m.index == entry["Entry ID"] && m.unmatchedMentions !== ""; })
                .map(function (m) { return m.unmatchedMentions; })
                .join(";");

            entry.matchedMentionsEntryIndexes = mentions
                .filter(function (m) { return m.index == entry["Entry ID"] && m.matchedMentionsEntryIndexes !== ""; })
                .map(function (m) { return m.matchedMentionsEntryIndexes; })
                .join(",");

            if (entry.matchedMentions.length === 0) {
                delete entry.matchedMentions;
            }
            if (entry.unmatchedMentions.length === 0) {
                delete entry.unmatchedMentions;
            }
            if (entry.matchedMentionsEntryIndexes.length === 0) {
                delete entry.matchedMentionsEntryIndexes;
            }
        }
        entry.origin = d.origin.entryOrigin;
        entry.originSourceName = d.origin.sourceName;
        entry.originSourceIndex = d.origin.sourceIndex;

        return entry;

    })

    return {
        entries: entries,
        activities: activities,
        travels: travels
    }

}


exports.export = (req, res, next) => {

    if (req.body.query) {

        var originalQuery = JSON.stringify(req.body.query);
        var query = parseQuery(req.body.query);

    } else {

        var ids = req.body.index_list;
        var query = { index: { $in: ids } };

    }

    Entry.aggregateAtRevision(res.locals.activeRevisionIndex)
        .match(query)
        .then(result => res.json({ result: parseExport(result) }))
        .catch(next)

}
