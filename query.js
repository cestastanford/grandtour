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

    let counts = getQueryCounts()
    if (!counts) {

        const countQueries = {

            fullName: { fullName : { $ne : null } },
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

        setQueryCounts(counts)

    }

    return { counts }

}


/*
*   This is a large block of code that performs queries.
*/


function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
            var doesMatch = function(d) { return d.search( new RegExp(value, "i") ) != -1; };
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


var searchMapRE = {

fullName : function(d) { return { $or : [
{ fullName : { $regex : new RegExp(escapeRegExp(d), "gi") } },
{ alternateNames : { $elemMatch : { alternateName : { $regex : new RegExp(escapeRegExp(d), "gi") } } } },
] } },
type : function(d) { return { type : d } },

birthDate : function(d) { return { dates : { $elemMatch : { birthDate : +d } } } },
deathDate : function(d) { return { dates : { $elemMatch : { deathDate : +d } } } },

birthPlace : function(d) { return { places : { $elemMatch : { birthPlace : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
deathPlace : function(d) { return { places : { $elemMatch : { deathPlace : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

societies : function(d) { return { societies : { $elemMatch : { title : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
societies_role : function(d) { return { societies : { $elemMatch : { role : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

education_institution : function(d) { return { education : { $elemMatch : { institution : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
education_place : function(d) { return { education : { $elemMatch : { place : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
education_degree : function(d) { return { education : { $elemMatch : { fullDegree : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
education_teacher : function(d) { return { education : { $elemMatch : { teacher : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

pursuits : function(d) { return { pursuits : { $elemMatch : { pursuit : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

occupations : function(d) { return { occupations : { $elemMatch : { title : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
occupations_group : function(d) { return { occupations : { $elemMatch : { group : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
occupations_place : function(d) { return { occupations : { $elemMatch : { place : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

exhibitions : function(d) { return { exhibitions : { $elemMatch : { title : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },
exhibitions_activity : function(d) { return { exhibitions : { $elemMatch : { activity : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

military : function(d) { return { military : { $elemMatch : { rank : { $regex : new RegExp(escapeRegExp(d), "gi") }  } } } },

travel : function(d) {

    var outer = [];

    if (d.date) {

        if (d.date.startYear) {

            outer.push({
                $or : [ { travelEndYear : { $gt : +d.date.startYear } }, { $and : [ { travelEndYear : +d.date.startYear } ] } ]
            });

            if (d.date.startMonth) {

                var middle = outer[0].$or[1].$and;
                middle.push({
                    $or : [ { travelEndMonth : { $gt : +d.date.startMonth } }, { $and : [ { travelEndMonth : +d.date.startMonth } ] } ]
                });

                if (d.date.startDay) {

                    var inner = middle[1].$or[1].$and;
                    inner.push({
                        $or : [ { travelEndDay : { $gte : +d.date.startDay } } ]
                    });

                }

            }

        }

        if (d.date.endYear) {

            outer.push({
                $or : [ { travelStartYear : { $lt : +d.date.endYear, $ne : 0 } }, { $and : [ { travelStartYear : +d.date.endYear } ] } ]
            });

            if (d.date.endMonth) {

                var middle = outer[0].$or[1].$and;
                middle.push({
                    $or : [ { travelStartMonth : { $lt : +d.date.endMonth, $ne : 0 } }, { $and : [ { travelStartMonth : +d.date.endMonth } ] } ]
                });

                if (d.date.endDay) {

                    var inner = middle[1].$or[1].$and;
                    inner.push({
                        $or : [ { travelStartDay : { $lte : +d.date.endDay, $ne : 0 } } ]
                    });

                }

            }

        }

    }

    if (d.place) outer.push({ place : { $regex : new RegExp(escapeRegExp(d.place), "gi") } });

    return { travels : { $elemMatch : { $and : outer } } };

},

entry : function(d) {

    var or = [];
    for (var section in d.sections) {
        queryObj = {};
        queryObj[section] = { $regex : new RegExp((d.beginnings === 'yes' ? '\\b' : '') + escapeRegExp(d.sections[section]), "gi") };
        or.push(queryObj);
    }
    return { $or : or };
},

}


var searchMap = {

    fullName : function(d) { return { $or : [
        { fullName : { $regex : new RegExp(escapeRegExp(d), "gi") } },
        { alternateNames : { $elemMatch : { alternateName : { $regex : new RegExp(escapeRegExp(d), "gi") } } } },
    ] } },

    type : function(d) { return { type : d } },

    birthDate : function(d) { return { dates : { $elemMatch : { birthDate : +d } } } },
    deathDate : function(d) { return { dates : { $elemMatch : { deathDate : +d } } } },

    birthPlace : function(d) { return { places : { $elemMatch : { birthPlace : d  } } } },
    deathPlace : function(d) { return { places : { $elemMatch : { deathPlace : d  } } } },

    societies : function(d) { return { societies : { $elemMatch : { title : d } } } },
    societies_role : function(d) { return { societies : { $elemMatch : { role :d  } } } },

    education_institution : function(d) { return { education : { $elemMatch : { institution : d  } } } },
    education_place : function(d) { return { education : { $elemMatch : { place : d  } } } },
    education_degree : function(d) { return { education : { $elemMatch : { fullDegree : d } } } },
    education_teacher : function(d) { return { education : { $elemMatch : { teacher : d  } } } },

    pursuits : function(d) { return { pursuits : { $elemMatch : { pursuit : d  } } } },

    occupations : function(d) { return { occupations : { $elemMatch : { title : d  } } } },
    occupations_group : function(d) { return { occupations : { $elemMatch : { group : d  } } } },
    occupations_place : function(d) { return { occupations : { $elemMatch : { place : d  } } } },

    exhibitions : function(d) { return { exhibitions : { $elemMatch : { title : d  } } } },
    exhibitions_activity : function(d) { return { exhibitions : { $elemMatch :  { activity : d  }  } } } ,

    military : function(d) { return { military : { $elemMatch : { rank : d  } } } },

    travel : function(d) {

        var outer = [];

        if (d.date) {

            if (d.date.startYear) {

                outer.push({
                    $or : [ { travelEndYear : { $gt : +d.date.startYear } }, { $and : [ { travelEndYear : +d.date.startYear } ] } ]
                });

                if (d.date.startMonth) {

                    var middle = outer[0].$or[1].$and;
                    middle.push({
                        $or : [ { travelEndMonth : { $gt : +d.date.startMonth } }, { $and : [ { travelEndMonth : +d.date.startMonth } ] } ]
                    });

                    if (d.date.startDay) {

                        var inner = middle[1].$or[1].$and;
                        inner.push({
                            $or : [ { travelEndDay : { $gte : +d.date.startDay } } ]
                        });

                    }

                }

            }

            if (d.date.endYear) {

                outer.push({
                    $or : [ { travelStartYear : { $lt : +d.date.endYear, $ne : 0 } }, { $and : [ { travelStartYear : +d.date.endYear } ] } ]
                });

                if (d.date.endMonth) {

                    var middle = outer[0].$or[1].$and;
                    middle.push({
                        $or : [ { travelStartMonth : { $lt : +d.date.endMonth, $ne : 0 } }, { $and : [ { travelStartMonth : +d.date.endMonth } ] } ]
                    });

                    if (d.date.endDay) {

                        var inner = middle[1].$or[1].$and;
                        inner.push({
                            $or : [ { travelStartDay : { $lte : +d.date.endDay, $ne : 0 } } ]
                        });

                    }

                }

            }

        }

        if (d.place) outer.push({ place : { $regex : new RegExp(escapeRegExp(d.place), "gi") } });

        return { travels : { $elemMatch : { $and : outer } } };

    },

    entry : function(d) {
        var or = [];
        for (var section in d.sections) {
            queryObj = {};
            queryObj[section] = { $regex : new RegExp((d.beginnings === 'yes' ? '\\b' : '') + escapeRegExp(d.sections[section]), "gi") };
            or.push(queryObj);
        }
        return { $or : or };
    },

}


function parseQuery(query) {
    var o = []
    for (var k in query){
        if (query[k].constructor === Array) {
            var s = { $or : [] }
            for (var i in query[k]) {
                s.$or.push( searchMap[k](query[k][i]) );
            }
        }
        else var s = searchMap[k](query[k]);

        o.push(s)

    }
    return o.length ? { $and: o } : {};
}


exports.search = function (req, res, next) {

    const originalQuery = JSON.stringify(req.body.query);
    const query = parseQuery(req.body.query);

    Entry.findAtRevision(
        query,
        req.user.activeRevisionIndex,
        {
            index: true,
            fullName: true,
            biography: true,
        }
        )
    .then(response => res.json({ request: JSON.parse(originalQuery), entries: response }))
    .catch(next)

}


function parseQuery2(query) {
    var o = []
    for (var k in query){
        var s = searchMapRE[k](query[k]);

        o.push(s)

    }
    return o.length ? { $and: o } : {};
}


exports.search2 = (req, res, next) => {

    const originalQuery = JSON.stringify(req.body.query);
    const query = parseQuery2(req.body.query);

    Entry.findAtRevision(
        query,
        req.user.activeRevisionIndex,
        {
            index: true,
            fullName: true,
            biography: true,
        }
        )
    .then(response => res.json({ request: JSON.parse(originalQuery), entries: response }))
    .catch(next)

}


function parseExport(res){

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
        entry.gender = d.gender;
        // birthDate
        entry.birthDate = d.dates[0] ? d.dates[0].birthDate || "" : "";
        // deathDate
        entry.deathDate = d.dates[0] ? d.dates[0].deathDate || "" : "";
        // birthPlace
        entry.birthPlace = d.dates[0] ? d.dates[0].birthPlace || "" : "";
        // deathPlace
        entry.deathPlace = d.dates[0] ? d.dates[0].deathPlace || "" : "";
        // parents
        entry.parents = d.parents || "";

        // activities

        // marriages
        if (d.marriages) d.marriages.forEach(a => activities.push({
            index : ++activityIndex,
            entry : d.index,
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
            entry : d.index,
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
            entry : d.index,
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
            entry : d.index,
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
            entry : d.index,
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
            entry : d.index,
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
            entry : d.index,
            type : 'military careers',
            details : a.officeType,
            value : a.rank,
            place : a.place || "",
            startDate : a.rankStart || "",
            endDate : a.rankEnd || "",
        }))

        // travels
        if (d.travels) d.travels.forEach(a => travels.push({
            entry : d.index,
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
    .then(result => res.json({ result: parseExport(response) }))
    .catch(next)

}
