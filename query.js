/*
*   Imports
*/

const Entry = require('./models/entry')
const { getLatestRevisionIndex, getQueryCounts, setQueryCounts } = require('./cache')


/*
*   Calculates the counts of entries with values for each field
*   query mapping.
*/

exports.getCounts = async revisionIndex => {

    let counts = getQueryCounts(revisionIndex)
    if (!counts) {

        const countQueries = {

            fullName: { fullName : { $ne : null, $ne : '' } },
            alternateNames: { 'alternateNames.alternateName' : { $exists : true } },
            birthDate: { 'dates.0.birthDate' : { $exists : true } },
            birthPlace: { 'places.0.birthPlace' : { $exists : true } },
            deathDate: { 'dates.0.deathDate' : { $exists : true } },
            deathPlace: { 'places.0.deathPlace' : { $exists : true } },
            type: { type : { $ne : null } },
            societies: { 'societies.title' : { $exists : true } },
            societies_role: { 'societies.role' : { $exists : true } },
            education_institution: { 'education.institution' : { $exists : true } },
            education_place: { 'education.place' : { $exists : true } },
            education_degree: { 'education.degree' : { $exists : true } },
            education_teacher: { 'education.teacher' : { $exists : true } },
            pursuits: { pursuits : { $ne : [] } },
            occupations: { 'occupations.title' : { $exists : true } },
            occupations_group: { 'occupations.group' : { $exists : true } },
            occupations_place: { 'occupations.place' : { $exists : true } },
            military: { 'military.rank' : { $exists : true } },
            travel_place: { travels : { $not : { $size : 0 } }, 'travels.place' : { $exists : true } },
            travel_date: { travels : { $not : { $size : 0 } }, $or : [ { 'travels.travelStartYear' : { $ne : 0 } }, { 'travels.travelEndYear' : { $ne : 0 } } ] },
            travel_year: { travels : { $not : { $size : 0 } }, $or : [ { 'travels.travelStartYear' : { $ne : 0 } }, { 'travels.travelEndYear' : { $ne : 0 } } ] },
            travel_month: { travels : { $not : { $size : 0 } }, $or : [ { 'travels.travelStartMonth' : { $ne : 0 } }, { 'travels.travelEndMonth' : { $ne : 0 } } ] },
            travel_day: { travels : { $not : { $size : 0 } }, $or : [ { 'travels.travelStartDay' : { $ne : 0 } }, { 'travels.travelEndDay' : { $ne : 0 } } ] },
            exhibitions: { 'exhibitions.title' : { $exists : true } },
            exhibitions_activity: { 'exhibitions.activity' : { $exists : true } },

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
    var escapedString =  escapeRegExp(str)
    if (exact) escapedString = '^' + escapedString + '$'
    return new RegExp(escapedString, 'gi')
}


exports.suggest = function (req, res, next) {

    var field = req.body.field;
    var value = req.body.value;
    var query = { $regex : new RegExp(value, "i") };
    var condition = { [field]: query }
    if (field === 'fullName') {

        var query = { $or : [ { fullName: condition[field] }, { alternateNames: { $elemMatch : { alternateName : condition[field] } } } ] };
        var projection = { fullName: true, alternateNames: true };
        Entry.findAtRevision(query, req.user.activeRevisionIndex, projection, field)
        .then(response => {

            var matches = [];
            var doesMatch = d => d.search( new RegExp(value, "i") ) != -1
            response.forEach(function(entry) {

                if (doesMatch(entry.fullName)) matches.push({ nameMatch: entry.fullName });
                entry.alternateNames.forEach(function(alternateName) {

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

    const field = req.body.field
    const query = parseQuery(req.body.query)
    const pipeline = Entry.aggregateAtRevision(req.user.activeRevisionIndex)
    .append({ $match: query })
    .append({ $unwind: '$' + field.split('.')[0] })

    if (field === 'fullName') {

        pipeline.append({
            $project: {
                index: true,
                parentFullName: '$fullName',
                fullName: {
                    $concatArrays: [
                    { $ifNull: [
                        { $map: {
                            input: '$alternateNames',
                            as: 'grade',
                            in: '$$grade.alternateName',
                        } },
                        [],
                    ] },
                    [ '$fullName' ],
                    ]
                }
            }
        })

        pipeline.append({ $unwind: '$fullName' })

    }

    const group = {}
    if (field === 'fullName') group['_id'] = { d: { fullName: '$fullName', parentFullName: '$parentFullName' }, u: '$index' }
        else group['_id'] = { d: '$' + field, u: '$index' }
            group['count'] = { $sum: 1 }
        pipeline.append({ $group: group })
        .append({ $group: { _id: '$_id.d', count: { $sum: 1 } } })

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

    fullName: (d, exact) => ({ $or: [
        { fullName: { $regex: getRegExp(d, exact) } },
        { alternateNames: { $elemMatch: { alternateName: { $regex: getRegExp(d, exact) } } } },
    ] }),
    type: d => ({ type: d }),

    birthDate: d => ({ dates: { $elemMatch: { birthDate: +d } } }),
    deathDate: d => ({ dates: { $elemMatch: { deathDate: +d } } }),

    birthPlace: (d, exact) => ({ places: { $elemMatch: { birthPlace: { $regex: getRegExp(d, exact) }  } } }),
    deathPlace: (d, exact) => ({ places: { $elemMatch: { deathPlace: { $regex: getRegExp(d, exact) }  } } }),

    societies: (d, exact) => ({ societies: { $elemMatch: { title: { $regex: getRegExp(d, exact) }  } } }),
    societies_role: (d, exact) => ({ societies: { $elemMatch: { role: { $regex: getRegExp(d, exact) }  } } }),

    education_institution: (d, exact) => ({ education: { $elemMatch: { institution: { $regex: getRegExp(d, exact) }  } } }),
    education_place: (d, exact) => ({ education: { $elemMatch: { place: { $regex: getRegExp(d, exact) }  } } }),
    education_degree: (d, exact) => ({ education: { $elemMatch: { fullDegree: { $regex: getRegExp(d, exact) }  } } }),
    education_teacher: (d, exact) => ({ education: { $elemMatch: { teacher: { $regex: getRegExp(d, exact) }  } } }),

    pursuits: (d, exact) => ({ pursuits: { $elemMatch: { pursuit: { $regex: getRegExp(d, exact) }  } } }),

    occupations: (d, exact) => ({ occupations: { $elemMatch: { title: { $regex: getRegExp(d, exact) }  } } }),
    occupations_group: (d, exact) => ({ occupations: { $elemMatch: { group: { $regex: getRegExp(d, exact) }  } } }),
    occupations_place: (d, exact) => ({ occupations: { $elemMatch: { place: { $regex: getRegExp(d, exact) }  } } }),

    exhibitions: (d, exact) => ({ exhibitions: { $elemMatch: { title: { $regex: getRegExp(d, exact) }  } } }),
    exhibitions_activity: (d, exact) => ({ exhibitions: { $elemMatch: { activity: { $regex: getRegExp(d, exact) }  } } }),

    military: (d, exact) => ({ military: { $elemMatch: { rank: { $regex: getRegExp(d, exact) }  } } }),

    travel: d => ({
        travels: {
            $elemMatch: { $and: [
                d.place ? { place: { $regex: getRegExp(d.place) } } : {},
                d.date ? { $and: [
                    d.date.startYear ? { $or: [
                        { travelEndYear: { $gt: +d.date.startYear } },
                        { $and: [
                            { travelEndYear: +d.date.startYear },
                            d.date.startMonth ? { $or: [
                                { travelEndMonth: { $gte: +d.date.startMonth } },
                                { travelEndMonth: 0 },
                            ] } : {},
                        ] }
                    ] } : {},
                    d.date.endYear ? { $or: [
                        { travelStartYear: { $lt: +d.date.endYear, $ne: 0 } },
                        { $and: [
                            { travelStartYear: +d.date.endYear },
                            d.date.endMonth ? { $or: [
                                { travelStartMonth: { $lte: +d.date.endMonth } },
                                { travelStartMonth: 0 },
                            ] } : {},
                        ] }
                    ] } : {},
                ] } : {},
            ] }
        }
    }),

    entry: d => ({
        $and: d.terms.map(term => ({
            $or: d.sections.filter(section => section.checked).map(section => ({
                [section.key]: { $regex: new RegExp((term.beginning ? '\\b' : '') 
                    + escapeRegExp(term.value)
                    + (term.end ? '\\b' : ''), 'gi') }
            }))
        }))
    }),

}


function parseQuery(query) {
    
    var o = []
    for (var k in query) {
        
        if (Array.isArray(query[k])) {
            
            var s = { $or : [] }
            for (var i in query[k]) {
                s.$or.push( searchMap[k](query[k][i], true) )
            }
        
        } else var s = searchMap[k](query[k])

        o.push(s)

    }
    
    return o.length ? { $and: o } : {};

}


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
    )
    .then(entries => entries.map(projectForEntryList))
    .then(entries => res.json({ request: JSON.parse(originalQuery), entries }))
    .catch(next)

}


const projectForEntryList = entry => ({ 

    index: entry.index,
    fullName: entry.fullName,
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

    var entries = res.map(function(d){

        var entry = {};

        // index
        entry.index = d.index;
        // fullName
        entry.fullName = d.fullName;
        // gender
        entry.gender = d.type || "Unknown";
        // birthDate
        entry.birthDate = d.dates[0] ? d.dates[0].birthDate || "" : "";
        // deathDate
        entry.deathDate = d.dates[0] ? d.dates[0].deathDate || "" : "";
        // birthPlace
        entry.birthPlace = d.dates[0] ? d.dates[0].birthPlace || "" : "";
        // deathPlace
        entry.deathPlace = d.dates[0] ? d.dates[0].deathPlace || "" : "";
        // parents
        entry.parents = (d.parents && d.parents.parents) || "";

        let entryBase = {
            entry : d.index,
            fullName: entry.fullName,
            birthDate: entry.birthDate,
            deathDate: entry.deathDate,
            gender: entry.gender
        };
        // activities

        // marriages
        if (d.marriages) d.marriages.forEach(a => activities.push({
            ...entryBase,
            index : ++activityIndex,
            type : 'marriage',
            details : a.sequence || "",
            value : a.spouse || "",
            place : "",
            startDate : a.year || "",
            endDate : "",
        }))

        // education
        if (d.education) d.education.forEach(a => activities.push({
            index : ++activityIndex,
            ...entryBase,
            type : 'education',
            details : "",
            value : a.institution || "",
            place : a.place || "",
            startDate : a.from || "",
            endDate : a.to || "",
        }))

        // societies
        if (d.societies) d.societies.forEach(a => activities.push({
            index : ++activityIndex,
            ...entryBase,
            type : 'society',
            details : a.role || "",
            value : a.title || "",
            place : "",
            startDate : a.from || "",
            endDate : a.to || "",
        }))

        // exhibitions
        if (d.exhibitions) d.exhibitions.forEach(a => activities.push({
            index : ++activityIndex,
            ...entryBase,
            type : 'exhibition',
            details : "",
            value : a.title || "",
            place : a.place || "",
            startDate : a.from || "",
            endDate : a.to || "",
        }))

        // pursuits
        if (d.pursuits) d.pursuits.forEach(a => activities.push({
            index : ++activityIndex,
            ...entryBase,
            type : 'pursuit',
            details : "",
            value : a.pursuit,
            place : "",
            startDate : "",
            endDate : "",
        }))

        // occuaptions
        if (d.occupations) d.occupations.forEach(a => activities.push({
            index : ++activityIndex,
            ...entryBase,
            type : 'occupation',
            details : a.group,
            value : a.title,
            place : a.place || "",
            startDate : a.from || "",
            endDate : a.to || "",
        }))

        // occuaptions
        if (d.military) d.occupations.forEach(a => activities.push({
            index : ++activityIndex,
            ...entryBase,
            type : 'military careers',
            details : a.officeType,
            value : a.rank,
            place : a.place || "",
            startDate : a.rankStart || "",
            endDate : a.rankEnd || "",
        }))

        // travels
        if (d.travels) d.travels.forEach(a => travels.push({
            ...entryBase,
            travelIndex : a.travelindexTotal,
            place : a.place || "",
            coordinates : a.latitude ? [a.latitude, a.longitude].join(",") : "",
            startDate : a.travelStartYear ? a.travelStartYear + "-" + (a.travelStartMonth || "01") + "-" + (a.travelStartDay || "01") : "", //a.travelStartMonth ? a.travelStartDay ? a.travelStartYear + "/" + (a.travelStartMonth || "01") + "/" + (a.travelStartDay || "01") : a.travelStartYear + "/" + a.travelStartMonth : a.travelStartYear : "",
            endDate : a.travelEndYear ? a.travelEndYear + "-" +  (a.travelEndMonth || "01") + "-" + (a.travelEndDay || "01") : "" //a.travelEndMonth ? a.travelEndDay ? a.travelEndYear + "/" + a.travelEndMonth + "/" + a.travelEndDay : a.travelEndYear + "/" + a.travelEndMonth : a.travelEndYear : "",
        }))

        entry.activities = activities
        .filter(function(d){ return d.entry == entry.index; })
        .map(function(d){ return d.index; })
        .join(",")
        return entry;
    
    })

    return {
        entries : entries,
        activities : activities,
        travels : travels
    }

}


exports.export = (req, res, next) => {

    if (req.body.query) {

        var originalQuery = JSON.stringify(req.body.query);
        var query = parseQuery(req.body.query);

    } else {

        var ids = req.body.index_list;
        var query = { index : { $in : ids } };

    }

    Entry.aggregateAtRevision(req.user.activeRevisionIndex)
    .match(query)
    .then(result => res.json({ result: parseExport(result) }))
    .catch(next)

}
