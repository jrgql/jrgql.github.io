"use strict"

exports.examples = {
  "intro": {
    "idMember": "_id",
    "types": {
      "Intro": {
        "name": "String",
        "filter": "String",
        "search": "String"
      },
    },
    "values": {
      "Intro": [
        {
          "name": "jrGQL",
          "filter": "to get a field",
          "search": "for values"
        }
      ],
    },
    "tests": [
      {
        "title": "jrGQL",
        "description": [
          "A minimalistic query language",
          "James RegExp Graph Query Language. Just kidding, no one names a QL about himself.",
          "<strong>JSON RegExp Graph Query Language</strong>. jr is small, so you can read it as junior, GQL is capitalized because it is more readable than gql.",
          "Write standard JSON to search and use regular expressions to filter keys and search values.",
        ],
        "rootType": "Intro",
        "input": {
          "// JSON RegExp Graph Query Language": "",
          "name": "jrGQL",
          "?[filter]*": "",
          "search?": ".*values$"
        },
        "output": [{
          "name": "jrGQL",
          "filter": "to get a field",
          "search": "for values"
        }]
      },
    ]
  },
  "usergroup": {
    "idMember": "_id",
    "types": {
      "User": {
        "_id": "Integer",
        "name": "String",
        "email": "String",
        "boss": "User",
        "groups": "Group[]",
      },
      "Group": {
        "_id": "Integer",
        "name": "String",
        "tags": "String[]",
        "members": "User[]",
      },
      "Address": {
        "_id": "Integer",
        "address": "Object",
      }
    },
    "values": {
      "User": [
        {
          "_id": 1,
          "name": "James",
          "email": "james@jrgql.org",
          "boss": 2,
          "groups": [
            4, 5
          ]
        },
        {
          "_id": 2,
          "name": "Wife",
          "email": "wife@jrgql.org",
          "boss": 3,
          "groups": [
            4, 6
          ]
        },
        {
          "_id": 3,
          "name": "Cat",
          "email": "cat@jrgql.org",
          "boss": null,
          "groups": [
            5
          ]
        },
      ],
      "Group": [
        {
          "_id": 4,
          "name": "Humans",
          "tags": [
            "2-legged", "has2pay4food"
          ],
          "members": [
            1, 2
          ]
        },
        {
          "_id": 5,
          "name": "Boys",
          "tags": [
            "facialHair"
          ],
          "members": [
            1, 3
          ]
        },
        {
          "_id": 6,
          "name": "Girls",
          "tags": [
            "simplyTheBest"
          ],
          "members": [
            2
          ]
        }
      ],
      "Address": [
        {
          "_id": 7,
          "address": {
            "zip": 6723,
            "city": "Szeged",
          }
        }
      ],
    },
    "tests": [
      {
        "title": "Filter",
        "description": [
          "Filter by key of an object",
          "If a key starts with <code>?</code> then the rest of the key is used as a regular expression.",
          "See the example to get all the members."
        ],
        "rootType": "User",
        "input": {
          "name": "James",
          "?.*": ""
        },
        "output": [{
          "_id": 1,
          "name": "James",
          "email": "james@jrgql.org",
          "boss": 2,
          "groups": [ 4, 5 ]
        }]
      },
      {
        "title": "Search",
        "description": [
          "Search for a subset of objects",
          "If a key ends with <code>?</code> then the value is used to select the objects.",
          "If a key not starts with and neither ends with <code>?</code> then no RegExp search is issued, just simple equality is checked for the value."
        ],
        "rootType": "User",
        "input": {
            "name?": ".a.*",
        },
        "output": [
          { "name": "James" },
          { "name": "Cat" }
        ]
      },
      {
        "title": "Simple filtering",
        "description": [
          "Query only the needed fields",
          "Note that <code>?key</code> is interpreted as <code>?^key$</code>.",
          "<code>^</code> and <code>$</code> is always applied to regular expressions for keys."
        ],
        "rootType": "User",
        "input": {
            "name": "James",
            "?email": ""
        },
        "output": [{
          "name": "James",
          "email": "james@jrgql.org",
        }]
      },
      {
        "title": "Deep query",
        "description": [
          "Depth is unlimited",
          "In a graph you can go into any depth by embedding queries."
        ],
        "rootType": "User",
        "input": {
          "name": "James",
          "?boss": {
            "?name": "",
            "?boss": {
              "?name": ""
            }
          }
        },
        "output": [{
          "name": "James",
          "boss": {
            "name": "Wife",
            "boss": {
              "name": "Cat"
            }
          }
        }]
      },
      {
        "title": "Multiple queries",
        "description": [
          "Issue any number of query at once",
          "Just start the query as an array. The inner queries are interpreted in the given order.",
        ],
        "rootType": "User",
        "input": [
          {
            "// first query": "",
            "name": "James",
            "?email": "",
          },
          {
            "// second query": "",
            "?name": "",
            "email": "cat@jrgql.org",
          }
        ],
        "output": [
          [
            {
              "name": "James",
              "email": "james@jrgql.org",
            },
          ],
          [
            {
              "name": "Cat",
              "email": "cat@jrgql.org",
            },
          ]
        ]
      },
      {
        "title": "Inline object",
        "description": [
          "Inline objects are fully supported",
          "Use them naturally.",
          "If you are interested in the example data set, check the next section. Or switch to the graph viewer."
        ],
        "rootType": "Address",
        "input": [
          {
            "// returns the whole inline object": "",
            "?.*": ""
          },
          {
            "// filters the inline object": "",
            "?address": {
              "?zip": ""
            }
          },
        ],
        "output": [
          [
            {
              "_id": 7,
              "address": {
                "zip": 6723,
                "city": "Szeged",
              }
            }
          ],
          [
            {
              "address": {
                "zip": 6723,
              }
            }
          ],
        ],
      },
      {
        "title": "Array of objects",
        "description": [
          "Arrays are fully supported",
          "Use them naturally.",
          "This example exists only to run the unit tests. Check the source code of this page, all functionality was tested on load."
        ],
        "rootType": "User",
        "input": {
          "name": "James",
          "// get the names of my groups": "",
          "?groups": [
            {
              "?name": ""
            }
          ]
        },
        "output": [{
          "name": "James",
          "groups": [
            {
              "name": "Humans"
            },
            {
              "name": "Boys"
            }
          ]
        }]
      },
      {
        "title": "Array of primitives",
        "description": [
          "Simple types in arrays are supported",
          "Simple values can be listed inside arrays, just query <code>[]</code> as the value.",
          "Operators (like search) are supported for array values too."
        ],
        "rootType": "Group",
        "input": [
          {
            "// all array values": "",
            "name": "Humans",
            "?tags": []
          },
          {
            "// only some tags": "",
            "name": "Humans",
            "?tags": [
              "has2.*4food"
            ]
          },
          {
            "// groups with these tags": "",
            "?name": "",
            "tags?": [
              "has2.*4food"
            ]
          },
        ],
        "output": [
          [{
            "name": "Humans",
            "tags": [
              "2-legged", "has2pay4food"
            ]
          }],
          [{
            "name": "Humans",
            "tags": [
              "has2pay4food"
            ]
          }],
          [{
            "name": "Humans",
            "tags": [
              "2-legged",
              "has2pay4food"
            ]
          }],
        ]
      },
      {
        "title": "Mutation",
        "description": [
          "Create, update, delete",
          "To create, wrap the new item in an object with <code>\"+\"</code> key. Result is the new item.",
          "To update, use <code>*key</code> notation. Result is the updated item and id is always returned.",
          "To delete, wrap the query in an object with <code>\"-\"</code> key. Result is the deleted item and id is always returned.",
        ],
        "rootType": "User",
        "input": [
          {
            "// create": "",
            "+": {
              "name": "James2",
              "email": "james2@jrgql.org",
            }
          },
          {
            "// update": "",
            "name": "James2",
            "*email": "james+updated@jrgql.org",
          },
          {
            "// delete": "",
            "-": {
              "name": "James2",
              "?email": "",
            }
          },
        ],
        "output": [
          [{
            "_id": 8,
            "name": "James2",
            "email": "james2@jrgql.org",
          }],
          [{
            "_id": 8,
            "name": "James2",
            "email": "james+updated@jrgql.org",
          }],
          [{
            "_id": 8,
            "name": "James2",
            "email": "james+updated@jrgql.org",
          }],
        ]
      },
      {
        "title": "Action",
        "description": [
          "Run server side actions",
          "To call a server action wrap the call in an object with <code>\"!\"</code> key. Result is an array filled up with the results.",
          "You can do multiple calls in an array.",
          "Parameters can be empty, an array or an object.",
          "<em>Be responsible!</em> Not everything needs an action. In the example below the <em>type.init</em> can be done with a simple query too: <code>{\"*district\":\"Tarjan\"}</code>."
        ],
        "rootType": "Address",
        "input": [
          { "!": { "type.reset": "" } },
          {
            "!": [
              { "type.expand": [ "district:String" ] },
              { "type.init": { "district": "Tarjan" } },
            ]
          },
        ],
        "output": [
          [ "OK" ],
          [
            [ "Done" ],
            [ { "changedRecords": 1 } ],
          ]
        ]
      },
      {
        "title": "Operator",
        "description": [
          "Filter values based on operators",
          "As search (<code>key?</code>) is a RegExp match operator, integer comparisons are also operators. <code>\"field&gt;\": value</code> matches if <em>field &gt; value</em> is true."
        ],
        "rootType": "Address",
        "input": [
          {
            "?address": {
              "zip>": 6700,
              "?city": ""
            }
          },
          {
            "?address": {
              "zip<": 6700,
              "?city": ""
            }
          },
        ],
        "output": [
          [{
            "address": {
              "zip": 6723,
              "city": "Szeged"
            }
          }],
          []
        ]
      },
      {
        "title": "Variables",
        "description": [
          "Set variables of query",
          "With <code>\"!variable\": value</code> you can also affect the results.",
          "Built in variables are <em>from</em>, <em>limit</em>, <em>indentation</em> and <em>type</em>.",
          "<em>from</em> value can be a count (<code>\"!from\": 1</code>), a \"matcher\" (<code>\"!from\": { \"_id\": 1 }</code>) or a cursor (<code>\"!from\": \"#0\"</code>) returned by the server when previous query stopped by a limit.",
          "<em>type</em> is an optional variable both to support different endpoints for each root type (this is what all the other tests use) and to support a fully qualified query like this. In this reference implementation <em>indentation</em> and <em>type</em> are remembered."
        ],
        "input": [
          {
            "!indentation": "    ",
            "!type": "User",
          },
          { "!limit": 1               , "name?": ".a.*" },
          { "!from": 1                , "name?": ".a.*" },
          { "!from": "#0"             , "name?": ".a.*" },
          { "!from": { "name": "Cat" }, "name?": ".a.*" }
        ],
        "output": [
          [],
          [{ "name": "James", "_cursor": "#0" } ],
          [{ "name": "Cat" } ],
          [{ "name": "Cat" } ],
          [{ "name": "Cat" } ],
        ]
      },
    ],
  }
}
