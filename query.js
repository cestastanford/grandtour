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
            birthDate: { 'dates.0.birthDate': { $exists: true } },
            birthPlace: { 'places.0.birthPlace': { $exists: true } },
            deathDate: { 'dates.0.deathDate': { $exists: true } },
            deathPlace: { 'places.0.deathPlace': { $exists: true } },
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
            travel_place: { travels: { $not: { $size: 0 } }, 'travels.place': { $exists: true } },
            travel_date: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartYear': { $ne: 0 } }, { 'travels.travelEndYear': { $ne: 0 } }] },
            travel_year: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartYear': { $ne: 0 } }, { 'travels.travelEndYear': { $ne: 0 } }] },
            travel_month: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartMonth': { $ne: 0 } }, { 'travels.travelEndMonth': { $ne: 0 } }] },
            travel_day: { travels: { $not: { $size: 0 } }, $or: [{ 'travels.travelStartDay': { $ne: 0 } }, { 'travels.travelEndDay': { $ne: 0 } }] },
            exhibitions: { 'exhibitions.title': { $exists: true } },
            exhibitions_activity: { 'exhibitions.activity': { $exists: true } },

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
        Entry.findAtRevision(query, req.user.activeRevisionIndex, projection, field)
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

        Entry.distinctAtRevision(field, condition, req.user.activeRevisionIndex)
            .then(results => res.json({ results }))
            .catch(next)

    }

}


exports.uniques = function (req, res, next) {

    const field = req.body.field;
    const query = parseQuery(req.body.query);
    const pipeline = Entry.aggregateAtRevision(req.user.activeRevisionIndex)
        .append({ $match: query })
        .append({ $unwind: '$' + field.split('.')[0] });

    if (field === 'fullName') {

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
    if (field === 'fullName') {
        group['_id'] = { d: { fullName: '$fullName', parentFullName: '$parentFullName' }, u: '$index' }
    }
    else if (field === 'mentionedNames.name') {
        group['_id'] = { d: "$mentionedNames.name", u: '$index', entryIndex: "$mentionedNames.entryIndex" };
    }
    else {
        group['_id'] = { d: '$' + field, u: '$index' }
    }
    group['count'] = { $sum: 1 };
    pipeline.append({ $group: group });

    if (field === "mentionedNames.name") {
        pipeline.append({ $group: { _id: '$_id.d', entryIndex: { $first: "$_id.entryIndex" }, count: { $sum: 1 } } });
        pipeline.append({ $project: { _id: "$_id", count: "$count", disabled: { "$lte": ["$entryIndex", null] } } }); // disabled will be false when $entryIndex is defined, and true when $entryIndex is undefined.
    }
    else {
        pipeline.append({ $group: { _id: '$_id.d', count: { $sum: 1 } } });
    }

    if (field === 'fullName') pipeline.append({
        $project: {
            _id: '$_id.fullName',
            parentFullName: '$_id.parentFullName',
            count: true,
        }
    })

    pipeline.append({ $sort: { count: -1 } })
        .then(results => res.json({ values: results.filter(d => d._id !== null) }))
        .catch(next)

}


var searchMap = {
    fullName: (d, exact) => ({
        $or: [
            { fullName: getRegExp(d, exact) },
            { alternateNames: { $elemMatch: { alternateName: getRegExp(d, exact) } } },
        ]
    }),
    type: d => ({ type: d }),
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
                            { travelEndMonth: { $gte: startMonth } },
                            { travelStartMonth: { $lte: startMonth } }
                        ]
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

    consolidated_notes: (d, exact) => ({ consolidated_notes: getRegExp(d, exact) }),
    
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

    mentionedNames: (d, exact) => ({ mentionedNames: { $elemMatch: { name: getRegExp(d, exact), entryIndex: { $exists: true } } } })
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
                else if (queryItem._id) {
                    let item = searchMap[k](queryItem._id, true);
                    if (queryItem.negative === true && queryItem._id !== "entry") {
                        for (let key in item) {
                            item[key] = { $not: item[key] };
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
        req.user.activeRevisionIndex,
        {
            index: true,
            fullName: true,
            biography: true,
            travels: true,
        },
        null,
        req.body.limit || null,
        req.body.skip || null
    )
        .then(entries => entries.map(projectForEntryList))
        .then(entries => res.json({ request: JSON.parse(originalQuery), entries }))
        .catch(next)

}


const projectForEntryList = entry => ({

    index: entry.index,
    fullName: entry.fullName,
    biographyLength: entry.biography.length,
    travelTime: entry.travels ? 10 * entry.travels.reduce((accum, travel) => {
        if (travel.travelEndYear && travel.travelStartYear) {
            return accum + (new Date(travel.travelEndYear) - new Date(travel.travelStartYear));
        }
        return accum;
    }, 0) : 0,
    biographyExcerpt: entry.biography ? entry.biography.slice(0, 200) : '',
    dateOfFirstTravel: entry.travels ? entry.travels.reduce((accum, travel) => {

        if (accum) return accum
        else if (travel.travelStartYear) {
            const utc = Date.UTC(travel.travelStartYear, travel.travelStartMonth, travel.travelStartDay)
            return utc
        }

    }, 0) : 0

})

exports.projectForEntryList = projectForEntryList


function parseExport(res) {

    var activities = [];
    var activityIndex = 0;
    var travels = [];

    var entries = res.map(function (d) {

        var entry = {};

        // index
        entry.index = d.index;
        // fullName
        entry.travelerNames = d.fullName;
        // gender
        entry.gender = d.type || "Unknown";
        // birthDate
        entry.birthDate = d.dates[0] ? d.dates[0].birthDate || "" : "";
        // deathDate
        entry.deathDate = d.dates[0] ? d.dates[0].deathDate || "" : "";
        // birthPlace
        entry.birthPlace = d.places[0] ? d.places[0].birthPlace || "" : "";
        // deathPlace
        entry.deathPlace = d.places[0] ? d.places[0].deathPlace || "" : "";
        // parents
        entry.parents = (d.parents && d.parents.parents) || "";

        let entryBase = {
            entry: d.index,
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
            index: ++activityIndex,
        }))

        //

        // education
        if (d.education && d.education.length) d.education.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'education',
            eventsDetail1: "",
            eventsDetail2: a.institution || "",
            place: a.place || "",
            startDate: a.from || "",
            endDate: a.to || "",
            index: ++activityIndex,
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
            index: ++activityIndex,
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
            index: ++activityIndex,
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
            index: ++activityIndex,
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
            index: ++activityIndex,
        }))

        // occupations
        if (d.military && d.military.length) d.occupations.forEach(a => activities.push({
            ...entryBase,
            lifeEvents: 'military careers',
            eventsDetail1: a.officeType,
            eventsDetail2: a.rank,
            place: a.place || "",
            startDate: a.rankStart || "",
            endDate: a.rankEnd || "",
            index: ++activityIndex,
        }))

        // travels
        if (d.travels && d.travels.length) d.travels.forEach(a => travels.push({
            ...entryBase,
            travelPlace: a.place || "",
            coordinates: a.latitude ? [a.latitude, a.longitude].join(",") : "",
            startDate: a.travelStartYear ? a.travelStartYear + "-" + (a.travelStartMonth || "01") + "-" + (a.travelStartDay || "01") : "", //a.travelStartMonth ? a.travelStartDay ? a.travelStartYear + "/" + (a.travelStartMonth || "01") + "/" + (a.travelStartDay || "01") : a.travelStartYear + "/" + a.travelStartMonth : a.travelStartYear : "",
            endDate: a.travelEndYear ? a.travelEndYear + "-" + (a.travelEndMonth || "01") + "-" + (a.travelEndDay || "01") : "", //a.travelEndMonth ? a.travelEndDay ? a.travelEndYear + "/" + a.travelEndMonth + "/" + a.travelEndDay : a.travelEndYear + "/" + a.travelEndMonth : a.travelEndYear : "",
            startYear: a.travelStartYear || "",
            startMonth: a.travelStartMonth || "",
            startDay: a.travelStartDay || "",
            endYear: a.travelEndYear || "",
            endMonth: a.travelEndMonth || "",
            endDay: a.travelEndDay || "",
            markers: a.markers || "",
            travelIndex: a.travelindexTotal
        }))

        entry.eventsIndex = activities
            .filter(function (d) { return d.entry == entry.index; })
            .map(function (d) { return d.index; })
            .join(",");

        // if (d.mentionedNames && d.mentionedNames.length) {
        //     entry.matchedMentions = d.mentionedNames.filter(e => e.name && typeof e.entryIndex === 'number').map(e => e.name.replace(",", ";"));

        //     entry.unmatchedMentions = d.mentionedNames.filter(e => e.name && typeof e.entryIndex !== 'number').map(e => e.name.replace(",", ";"));

        //     entry.matchedMentionsEntryIndexes = d.mentionedNames.filter(e => e.name && typeof e.entryIndex === 'number').map(e => "" + e.entryIndex);
        //     if (entry.matchedMentions.length === 0) {
        //         delete entry.matchedMentions;
        //     }
        //     if (entry.unmatchedMentions.length === 0) {
        //         delete entry.unmatchedMentions;
        //     }
        //     if (entry.matchedMentionsEntryIndexes.length === 0) {
        //         delete entry.matchedMentionsEntryIndexes;
        //     }
        // }

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

    Entry.aggregateAtRevision(req.user.activeRevisionIndex)
        .match(query)
        .then(result => res.json({ result: parseExport(result) }))
        .catch(next)

}