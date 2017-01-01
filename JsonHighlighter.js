"use strict"

exports.JsonHighlighter = class JsonHighlighter {

  static span(prefix, cssClass, value, suffix = "") {
    return `${prefix}<span class="${cssClass}">${value}</span>${suffix}`
  }

  static colorKey(key) {
    let rules = [
      [ (key) => key.startsWith("\"?"), "filter" ],
      [ (key) => key.startsWith("\"*") || key == "\"+\"" || key == "\"-\"", "mutation" ],
      [ (key) => key.startsWith("\"//"), "comment" ],
      [ (key) => key.startsWith("\"!"), "action" ],
      [ (key) => key.endsWith("?\"") || key.endsWith(">\"") || key.endsWith("<\""), "operator" ],
      [ (key) => true, "key" ],
    ]
    for(let rule of rules) {
      if (rule[0](key)) {
        return this.span("", rule[1], key)
      }
    }
  }

  static prepare(json, indentation = "  ") {
    let lines = JSON.stringify(json, null, indentation).split("\n")
    let result = []
    for(let line of lines) {
      let parts = /^(\s*)(\".*\")?(: )(\".*\"|\d+|true|false|null|undefined|\[\]|\{\})?([\{\}\[\]])?(,)?$/g.exec(line)
      if (parts) {
        result.push(
          parts[1] +
          this.colorKey(parts[2]) +
          this.span("", "separator", parts[3]) +
          (parts[4]? this.span("", "value", parts[4]): "") +
          (parts[5]? this.span("", "parenthesis", parts[5]): "") +
          (parts[6]? this.span("", "separator", parts[6]): "")
        )
        continue
      }
      parts = /^(\s*)([\{\}\[\]]|\[\])(,)?$/g.exec(line)
      if (parts) {
        result.push(
          this.span(parts[1], "parenthesis", parts[2]) +
          (parts[3]? this.span("", "separator", parts[3]) : "")
        )
        continue
      }
      parts = /^(\s*)(\d+|\".*\"|true|false|undefined)(,)?$/g.exec(line)
      if (parts) {
        result.push(this.span(parts[1], "value", parts[2]) +
          (parts[3]? this.span("", "value", parts[3]): "")
        )
        continue
      }
    }
    return result.join("\n")
  }

}
