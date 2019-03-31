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
    test('single query with string - should give fuzzy search', () => {
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
                                        "$regex": /Diplomacy/gi
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
    test('query AND with object', () => {
        const query = {
            "occupations_group": { "operator": "and", "uniques": [{ "_id": "Diplomacy" }, { "_id": "Democracy" }] }
        };
        const result = {
            "$and": [
                {
                    "$and": [
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
                                        "$regex": /^Democracy$/gi
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
    test('negative OR query', () => {
        const query = {
            "occupations_group": { "operator": "or", "uniques": [{ "_id": "Diplomacy", "negative": true }, { "_id": "Clergy" }] },
            "pursuits": { "operator": "or", "uniques": [{ "_id": "diplomat" }] }
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
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "$and": [
                                {
                                    "$or": [
                                        {
                                            "biography": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        },
                                        {
                                            "narrative": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        },
                                        {
                                            "tours": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        },
                                        {
                                            "notes": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        }
                                    ]
                                },
                                {
                                    "$or": [
                                        {
                                            "biography": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "narrative": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "tours": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "notes": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
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
        const result = {
            "$and": [
                {
                    "$and": [
                        {
                            "$and": [
                                {
                                    "$or": [
                                        {
                                            "biography": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        },
                                        {
                                            "narrative": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        },
                                        {
                                            "tours": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        },
                                        {
                                            "notes": {
                                                "$regex": /\btwo\b/gi
                                            }
                                        }
                                    ]
                                },
                                {
                                    "$or": [
                                        {
                                            "biography": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "narrative": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "tours": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "notes": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
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
        const result = {
            "$and": [
                {
                    "$or": [
                        {
                            "$and": [
                                {
                                    "$and": [
                                        {
                                            "biography": {
                                                "$regex": /^((?!\btwo\b).)*/gi
                                            }
                                        },
                                        {
                                            "narrative": {
                                                "$regex": /^((?!\btwo\b).)*/gi
                                            }
                                        },
                                        {
                                            "tours": {
                                                "$regex": /^((?!\btwo\b).)*/gi
                                            }
                                        },
                                        {
                                            "notes": {
                                                "$regex": /^((?!\btwo\b).)*/gi
                                            }
                                        }
                                    ]
                                },
                                {
                                    "$or": [
                                        {
                                            "biography": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "narrative": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "tours": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        },
                                        {
                                            "notes": {
                                                "$regex": /\bthree\b/gi
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        expect(parseQuery(query)).toEqual(result);
    });
});