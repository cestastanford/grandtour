import { parseQuery } from "../query";

describe('test parseQuery', () => {
    test('normal query', () => {
        const query = {
            "occupations_group": ["a", "b", "c"],
            "pursuits": ["d"]
        };
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^a$/gi
                                    }
                                }
                            }
                        },
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^b$/gi
                                    }
                                }
                            }
                        },
                        {
                            "occupations": {
                                "$elemMatch": {
                                    "group": {
                                        "$regex": /^c$/gi
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
                                        "$regex": /^d$/gi
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toBe(result);
    });
});