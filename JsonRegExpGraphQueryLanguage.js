"use strict"

this.exports.JsonRegExpGraphQueryLanguage = class JsonRegExpGraphQueryLanguage {

  constructor(db, actions) {
    this.db = db
    this.actions = actions
    this.operators = [
      { suffix: "?", test: (objectValue, value) => new RegExp(value).test(objectValue) },
      { suffix: ">", test: (objectValue, value) => objectValue > value },
      { suffix: "<", test: (objectValue, value) => objectValue < value },
    ]
    this.indentation = "  "
    this.iterators = {}
  }

  copy(q) {
    return JSON.parse(JSON.stringify(q))
  }

  copyQueryAndExtendWithIdMember(q) {
    let qc = this.copy(q)
    qc[`?${this.db.idMember}`] = ""
    return qc
  }

  copyQueryAndRemoveKeys(q, keys) {
    if (keys.length == 0) {
      return q
    }
    let qc = this.copy(q)
    for(let key of keys) {
      delete qc[key]
    }
    return qc
  }

  query(type, q, keyToRemove) {
    if (q["!indentation"]) {
      this.indentation = q["!indentation"]
    }
    if (q["!type"]) {
      this.defaultType = q["!type"]
    }
    if (!type) {
      type = q["!type"] || this.defaultType
    }
    let results = []
    // multiple queries
    if (q instanceof Array) {
      for(let qi of q) {
        results.push(this.copy(this.query(type, qi, keyToRemove)))
      }
      return results
    }
    if (!this.db.isTypeValid(type)) {
      console.info(`jrGQL.query: type (${type}) is invalid`)
      return []
    }
    // action
    if (q["!"]) {
      if (q["!"] instanceof Array) {
        for(let op of q["!"]) {
          results.push(this.query(type, { "!": op }, keyToRemove))
        }
        return results
      }
      for(let actionName in q["!"]) {
        let parameters = q["!"][actionName]
        let action = this.actions[actionName]
        results.push(action? action(type, parameters) : `jrGQL.Error: action not found ${actionName}`)
      }
      return results
    }
    // create
    if (q["+"]) {
      return [this.db.create(type, q["+"])]
    }
    // delete
    let deleteResultsFromDb = false
    if (q["-"]) {
      q = this.copyQueryAndExtendWithIdMember(q["-"])
      deleteResultsFromDb = true
    }
    // retrieve
    if (type == "Object") {
      let qc = this.copy(q)
      let object = qc[this.db.idMember]
      delete qc[this.db.idMember]
      let ret = this.doQuery(type, qc, object, keyToRemove, deleteResultsFromDb)
      if (ret) {
        results.push(ret)
      } else {
        return null
      }
    } else {
      let iterator
      let from = 0
      if (q["!from"]) {
        if (typeof q["!from"] == "string" && q["!from"].startsWith("#")) {
          iterator = this.iterators[q["!from"]]
        } else {
          from = q["!from"]
          iterator = this.db.getValues(type)
        }
      } else {
        iterator = this.db.getValues(type)
      }
      let i = 0
      for(let object = iterator.next(); !object.done; object = iterator.next()) {
        if (from instanceof Object) {
          if (!this.doQuery(type, from, object.value)) {
            i++
            continue
          }
        } else if (i < from) {
          i++
          continue
        }
        let ret = this.doQuery(type, q, object.value, keyToRemove, deleteResultsFromDb)
        if (!ret) {
          continue
        }
        results.push(ret)
        i++
        if (q["!limit"] == i) {
          let iteratorKey = "#" + Object.keys(this.iterators).length
          this.iterators[iteratorKey] = iterator
          ret["_cursor"] = iteratorKey
          break
        }
      }
    }
    return results
  }

  doQuery(type, q, object, keyToRemove, deleteResultsFromDb) {
    let match = this.match(q, object)
    if (!match.match) {
      return null
    }
    q = this.copyQueryAndRemoveKeys(q, match.keysToRemove)
    if (match.update) {
      q = this.copyQueryAndExtendWithIdMember(q)
    }
    let ret = this.filter(type, q, object, keyToRemove)
    if (Object.keys(ret.result).length == 0) {
      return null
    }
    if (deleteResultsFromDb) {
      this.db.delete(type, ret.result)
    }
    // update
    if (match.update) {
      for(let key in ret.updates) {
        ret.result[key] = ret.updates[key]
      }
      ret.updates[this.db.idMember] = ret.result[this.db.idMember]
      this.db.update(type, ret.updates)
    }
    return ret.result
  }

  filter(type, query, object, keyToRemove) {
    let result = {}
    let updates = {}
    for(let queryKey in query) {
      let queryValue = query[queryKey]
      if (queryKey.startsWith("*")) {
        updates[queryKey.substr(1)] = queryValue
        continue
      }
      // field match
      if (!queryKey.startsWith("?")) {
        if (queryKey.endsWith("?") || queryKey.endsWith(">") || queryKey.endsWith("<")) {
          let searchKey = queryKey.substr(0, queryKey.length-1)
          result[searchKey] = object[searchKey]
          continue
        }
        result[queryKey] = queryValue
        continue
      }
      let search = queryKey.substr(1)
      let regexp = new RegExp(`^${search}$`)
      let isValueObject = queryValue instanceof Object
      let isValueArray = queryValue instanceof Array
      if (!isValueObject || (isValueArray && queryValue.length == 0)) {
        for(let oKey in object) {
          if (regexp.test(oKey)) {
            result[oKey] = object[oKey]
            if (oKey == keyToRemove) {
              keyToRemove = null
            }
          }
        }
        continue
      }
      // subquery of an object
      if (!isValueArray) {
        let subQuery = this.copy(queryValue)
        subQuery[this.db.idMember] = object[search]
        let ret = this.query(this.db.getTypeOf(type, search), subQuery, this.db.idMember)
        if (!ret) {
          continue
        }
        result[search] = ret[0]
        continue
      }
      // subquery of an array
      if (queryValue[0] instanceof Object) {
        let subQuery = this.copy(queryValue[0])
        subQuery[this.db.idMember + "?"] = object[search].join("|")
        result[search] = this.query(this.db.getTypeOf(type, search), subQuery, this.db.idMember)
        continue
      }
      // matchArray
      regexp = new RegExp(queryValue[0])
      result[search] = []
      for(let o of object[search]) {
        if (regexp.test(o)) {
          result[search].push(o)
        }
      }
    }
    if (keyToRemove) {
      delete result[keyToRemove]
    }
    return { result, updates }
  }

  match(q, object) {
    let match = true
    let update = false
    let keysToRemove = []
    outer: for(let key in q) {
      if (key.startsWith("//") || key.startsWith("!")) {
        keysToRemove.push(key)
        continue
      }
      if (key.startsWith("*")) {
        update = true
        continue
      }
      let value = q[key]
      for(let op of this.operators) {
        if (key.endsWith(op.suffix)) {
          match = op.test(object[key.substr(0, key.length-1)], value)
          break outer
        }
      }
      if (!key.startsWith("?") && object[key] !== value) {
        match = false
        break
      }
    }
    return { match, update, keysToRemove }
  }

}
