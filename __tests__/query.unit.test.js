import { parseQuery } from "../query";

describe('test parseQuery', () => {
    test('compound query', () => {
        const query = {
            "occupations_group": ["Diplomacy", "Clergy"], "pursuits": ["diplomat"]
        };
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^Diplomacy$/gi
                                    }
                                }
                            }
                        },
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^Clergy$/gi
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "$or": [
                        {
                            "pursuits": {
                                "$elemMatch": {
                                    "pursuit": {
                                        "$regex": /^diplomat$/gi
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
    });
    test('query with object', () => {
        const query = {
            "occupations_group": [{ "_id": "Diplomacy" }]
        };
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^Diplomacy$/gi
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
    });
    test('single query with string', () => {
        const query = {
            "occupations_group": "Diplomacy"
        };
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^Diplomacy$/gi
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
    });
    test('single query with object', () => {
        const query = {
            "occupations_group": { "_id": "Diplomacy" }
        };
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^Diplomacy$/gi
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
    });
    test('negative query', () => {
        const query = {
            "occupations_group": [{ "_id": "Diplomacy", "negative": true }, "Clergy"], "pursuits": ["diplomat"]
        };
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "occupations": {
                                "$not": {
                                    "$elemMatch": {
                                        "group": {
                                            "$regex": /^Diplomacy$/gi
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^Clergy$/gi
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "$or": [
                        {
                            "pursuits": {
                                "$elemMatch": {
                                    "pursuit": {
                                        "$regex": /^diplomat$/gi
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
    });
});