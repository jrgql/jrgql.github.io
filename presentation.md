# jrGQL

sli.do for questions #jrgql

Most starred and relevant question gets a gift

---

# Data

At first there were only the 3rd normal form

```
Users                             Relations
/----+-------+----------------\   /----+--------+------\
| id | Name  | Email          |   | id | person | boss |
+----+-------+----------------+   +----+--------+------+
| 1  | James | james@jrgql.io |   | 1  | 1      | 2    |
| 2  | Wife  | wife@jrgql.io  |   | 2  | 2      | 3    |
| 3  | Cat   | cat@jrgql.io   |   \----+--------+------/
\----+-------+----------------/
```

???

In the last milennia HW was more expensive than Dev.

Strongly centralized languages, few big solutions existed.

---

# New wave

Then denormalization exploded the DCs

```
James' relations            Wife's relations            Cat's relations
/-------+----------------\  /-------+----------------\  /-------+----------------\
| Name  | Email          |  | Name  | Email          |  | Name  | Email          |
+-------+----------------+  +-------+----------------+  +-------+----------------+
| Wife  | wife@jrgql.io  |  | James | james@jrgql.io |  | James | james@jrgql.io |
| Cat   | cat@jrgql.io   |  | Cat   | cat@jrgql.io   |  | Wife  | wife@jrgql.io  |
\-------+----------------/  \-------+----------------/  \-------+----------------/
```

???

~10 years ago map-reduce and nosql exploded the industry, new players emerged, changed the mindset.

---

# Back to the basics

Natural presentations for the win

```
{ name: James, email: james@jrgql.io } -- boss --\
                                                 |
                                                 V
                                            { name: Wife, email: wife@jrgql.io }
                                                 |
{ name: Cat, email: cat@jrgql.io } <----- boss --/
```

???

There is no spoon, everything is a graph.

---

# Graph DBs

- Neo4j

- ArangoDb

- Any Engine can hold a graph

???

MongoDb driver

---

# Graph representation

G = (V, E)

- Node collection(s)

- Edge collection(s)

  - Edge list

  - Adjacency matrix

  - Adjacency lists

???

Ad. list is used in examples.

---

# Query languages

## Gremlin
```gremlin
g.V.has('name','hercules').out('father').out('father').name
```

## Cypher
```cypher
MATCH (node1:Label1)-->(node2:Label2)
WHERE node1.propertyA = {value}
RETURN node2.propertyA, node2.propertyB
```

## GraphQL
```graphql
GetAllTheThingsQuery { people(name: "GQL", search: "Smith", first: 5) { name } }
```

???

Gremlin is the oldest.

Cypher is the native lanugage of the biggest player.

GraphQL got many hype and is fancy because of FB authority.

---

# jrGQL

Back to the basics again.

```json

{
  "name": "James",
  "?boss": {
    "?name": "",
    "?boss": {
      "?name": ""
    }
  }
}
```

```json
[
  {
    "name": "James",
    "boss": {
      "name": "Wife",
      "boss": {
        "name": "Cat"
      }
    }
  }
]
```

???

WYRIWYG

---

# Status

## Learned

  - regexps
  - d3js
  - codemirror
  - JS gems
  - remarkjs

## Reference implementation

  - 260 lines
  - existing language
  - WYRIWYG
  - still a document store
  - MongoDB driver

???

JS regexp object is stateful.

d3js is not exactly jQuery.

JS gem: ASI

---

# Examples

https://jrgql.github.io/

---

# Conclusion

- regexp should be opt-in

- typelessness is value

- missing features: ordering, !count, etc...

---

# Q&A

[Github issues](https://github.com/jrgql/jrgql.github.io/issues)
