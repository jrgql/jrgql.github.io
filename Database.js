"use strict"

exports.Database = class Database {

  constructor({idMember="_id"}) {
    this.idMember = idMember
    this.maxId = 1
  }

  async init({types={}, values={}}) {
    this.types = types
    this.values = {}
    for(let type in this.types) {
      await this.drop(type)
      if (!(this.types[type] instanceof Object)) {
        continue
      }
      for(let v of values[type]) {
        await this.create(type, v)
      }
    }
  }

  async drop(type) {
    this.values[type] = []
  }

  isTypeValid(type) {
    return this.types[type] || type == "Object"
  }

  getTypeOf(type, key) {
    if (type == "Object") {
      return "Object"
    }
    let result = this.types[type][key]
    if (!result) { // unknown type
      return ""
    }
    return result.replace("[]", "")
  }

  * getValues(type) {
    if (!this.isTypeValid(type)) {
      throw(new Error("Invalid type: " + type))
    }
    for(let v of this.values[type]) {
      yield Promise.resolve(v)
    }
  }

  async create(type, value) {
    let v = JSON.parse(JSON.stringify(value))
    v[this.idMember] = this.maxId++
    if (!this.values[type]) {
      this.values[type] = []
    }
    this.values[type].push(v)
    return v
  }

  async delete(type, value) {
    this.values[type].splice(this.values[type].findIndex((e) => e[this.idMember] == value[this.idMember]), 1)
  }

  async update(type, value) {
    let target = this.values[type].find((v) => v[this.idMember] == value[this.idMember])
    for(let k in value) {
      target[k] = value[k]
    }
  }

}
