import { parseQuery } from "../query";

describe('test parseQuery', () => {
    test('empty query', () => {
        const query = {
        };
        const result = {
        };
        expect(parseQuery(query)).toEqual(result);
    });
    test('compound query', () => {
        const query = {
            "occupations_group": ["Diplomacy", "Clergy"], "pursuits": ["diplomat"]
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('query with object', () => {
        const query = {
            "occupations_group": [{ "_id": "Diplomacy" }]
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('single query with string - should give fuzzy search', () => {
        const query = {
            "occupations_group": "Diplomacy"
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('negative query', () => {
        const query = {
            "occupations_group": [{ "_id": "Diplomacy", "negative": true }, "Clergy"], "pursuits": ["diplomat"]
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('empty query with OR', () => {
        const query = {
            "pursuits": { "operator": "or", "uniques": [] }
        };
        const result = {
        };
        expect(parseQuery(query)).toEqual(result);
    });
    test('query OR with object', () => {
        const query = {
            "occupations_group": { "operator": "or", "uniques": [{ "_id": "Diplomacy" }] }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('query AND with object', () => {
        const query = {
            "occupations_group": { "operator": "and", "uniques": [{ "_id": "Diplomacy" }, { "_id": "Democracy" }] }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('negative OR query', () => {
        const query = {
            "occupations_group": { "operator": "or", "uniques": [{ "_id": "Diplomacy", "negative": true }, { "_id": "Clergy" }] },
            "pursuits": { "operator": "or", "uniques": [{ "_id": "diplomat" }] }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test('negative array (fullName and alternateNames) query', () => {
        const query = {
            "fullName": { "operator": "and", "uniques": [{ "_id": "John Taylor", "negative": true }] },
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
});

describe('test parseQuery with freeSearch', () => {
    test('regular freeSearch query', () => {
        const query = {
            "entry": {
                "terms": [
                    {
                        "value": "two",
                        "beginning": true,
                        "end": true,
                        "negative": false
                    },
                    {
                        "value": "three",
                        "beginning": true,
                        "end": true,
                        "negative": false
                    }
                ],
                "sections": [
                    {
                        "key": "biography",
                        "name": "Biography",
                        "checked": true
                    },
                    {
                        "key": "narrative",
                        "name": "Narrative",
                        "checked": true
                    },
                    {
                        "key": "tours",
                        "name": "Tours",
                        "checked": true
                    },
                    {
                        "key": "notes",
                        "name": "Notes",
                        "checked": true
                    }
                ],
                "operator": "or"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });

    test('freeSearch query with "and" operator', () => {
        const query = {
            "entry": {
                "terms": [
                    {
                        "value": "two",
                        "beginning": true,
                        "end": true,
                        "negative": false
                    },
                    {
                        "value": "three",
                        "beginning": true,
                        "end": true,
                        "negative": false
                    }
                ],
                "sections": [
                    {
                        "key": "biography",
                        "name": "Biography",
                        "checked": true
                    },
                    {
                        "key": "narrative",
                        "name": "Narrative",
                        "checked": true
                    },
                    {
                        "key": "tours",
                        "name": "Tours",
                        "checked": true
                    },
                    {
                        "key": "notes",
                        "name": "Notes",
                        "checked": true
                    }
                ],
                "operator": "and"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });

    test('freeSearch query with negatives', () => {
        const query = {
            "entry": {
                "terms": [
                    {
                        "value": "two",
                        "beginning": true,
                        "end": true,
                        "negative": true
                    },
                    {
                        "value": "three",
                        "beginning": true,
                        "end": true
                    }
                ],
                "sections": [
                    {
                        "key": "biography",
                        "name": "Biography",
                        "checked": true
                    },
                    {
                        "key": "narrative",
                        "name": "Narrative",
                        "checked": true
                    },
                    {
                        "key": "tours",
                        "name": "Tours",
                        "checked": true
                    },
                    {
                        "key": "notes",
                        "name": "Notes",
                        "checked": true
                    }
                ]
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
});

describe("test parseQuery with dates", () => {
    test("month range", () => {
        const query = {
            travelDate: {
                startMonth: "1",
                endMonth: "1"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("single month", () => {
        const query = {
            travelDate: {
                startMonth: "1"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("single year", () => {
        const query = {
            travelDate: {
                startYear: "1700"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("single year and single month", () => {
        const query = {
            travelDate: {
                startYear: "1700",
                startMonth: "5"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("year range", () => {
        const query = {
            travelDate: {
                startYear: "1700",
                endYear: "1780"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("month range + year range", () => {
        const query = {
            travelDate: {
                startYear: "1700",
                endYear: "1780",
                startMonth: "1",
                endMonth: "10"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("month range + single year", () => {
        const query = {
            travelDate: {
                startYear: "1700",
                startMonth: "1",
                endMonth: "10"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    describe("repeated years/months should be treated the same as a single year/month", () => {
        describe("startYear", () => {

            expect(parseQuery({
                travelDate: {
                    startYear: "1700",
                }
            })).toEqual(parseQuery({
                travelDate: {
                    startYear: "1700",
                    endYear: "1700"
                }
            }));
        });
        describe("startMonth", () => {
            expect(parseQuery({
                travelDate: {
                    startMonth: "5"
                }
            })).toEqual(parseQuery({
                travelDate: {
                    startMonth: "5",
                    endMonth: "5"
                }
            }));
        });
        describe("startYear + startMonth", () => {
            expect(parseQuery({
                travelDate: {
                    startYear: "1700",
                    startMonth: "5",
                }
            })).toEqual(parseQuery({
                travelDate: {
                    startYear: "1700",
                    endYear: "1700",
                    startMonth: "5",
                    endMonth: "5"
                }
            }));
        });
    });
    test("date + place", () => {
        const query = {
            travelDate: {
                startYear: "1700",
                startMonth: "1",
                endMonth: "10"
            },
            travelPlace: {"operator":"and","uniques":[{"negative":false,"_id":"Genoa"}]}
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("date + negative place", () => {
        const query = {
            travelDate: {
                startYear: "1700",
                startMonth: "1",
                endMonth: "10"
            },
            travelPlace: {"operator":"and","uniques":[{"negative":true,"_id":"Genoa"}]}
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
});

describe("test parseQuery with index", () => {
    test("single index", () => {
        const query = {
            index: {
                startIndex: "1",
                endIndex: "1"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("multiple indices", () => {
        const query = {
            index: {
                startIndex: "1,2,3",
                endIndex: "1,2,3"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("range", () => {
        const query = {
            index: {
                startIndex: "1-3",
                endIndex: "1-3"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("multiple indices + range", () => {
        const query = {
            index: {
                startIndex: "1,2,3, 4-6",
                endIndex: "1,2,3, 4-6"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
    test("different start and end with multiple indices + range", () => {
        const query = {
            index: {
                startIndex: "1,2,3,4-6",
                endIndex: "10-12,13,14,15"
            }
        };
        expect(parseQuery(query)).toMatchSnapshot();
    });
});