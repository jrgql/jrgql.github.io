"use strict"

exports.LandingPage = class LandingPage {

  constructor(examples) {
    this.examples = examples
    this.dbNames = ["intro", "usergroup"]
    this.selectedDb = localStorage.getItem("org.jrgql.selectedDb") || this.dbNames[0]
    this.dbs = {
      "intro": new Database(this.examples["intro"]),
      "usergroup": new Database(this.examples["usergroup"]),
    }
    let actions = {
      "type.reset": (type, parameters) => {
        if (type != "Address") {
          return "NOK"
        }
        this.dbs["usergroup"].types["Address"] = { "_id": "Integer", "address": "Object" }
        return "OK"
      },
      "type.expand": (type, parameters) => {
        if (type != "Address") {
          return "Not done"
        }
        let parts = parameters[0].split(':')
        this.dbs["usergroup"].types["Address"][parts[0]] = parts[1]
        return "Done"
      },
      "type.init": (type, parameters) => {
        let changedRecords = 0
        if (type != "Address") {
          return { changedRecords }
        }
        for(let address of this.dbs["usergroup"].values["Address"]) {
          for(let p in parameters) {
            address[p] = parameters[p]
          }
          changedRecords++
        }
        return { changedRecords }
      },
    }
    this.qls = {
      "intro": new JsonRegExpGraphQueryLanguage(this.dbs["intro"]),
      "usergroup": new JsonRegExpGraphQueryLanguage(this.dbs["usergroup"], actions),
    }
    this.gdbe = new GraphDbEditor("#graphEditor")
  }

  select(db, index) {
    let test = this.examples[db].tests[index]
    let description = test.description
    let text = ""
    if (description) {
      text = `<h4>${description[0]}</h4>`
      for(let line = 1; line < description.length; line++) {
        text += `<p>${description[line]}</p>`
      }
    }
    $("#text").html(text)
    $("#code1").html(JsonHighlighter.prepare(test.input))
    $("#code2").html(JsonHighlighter.prepare(test.output, test.indentation))
  }

  render() {
    this.renderExamples()
    this.runTests()
    this.scrollToSelection(...document.location.href.split("#"))
    this.setupEditor()
    this.setupEditorsContents()
  }

  renderExamples() {
    const examples = $("#exampleContainer")
    let first = true
    for(let dbName of this.dbNames) {
      this.examples[dbName].tests.forEach((test, i) => {
        let href = first? "#" : "##" + test.title.replace(/ /g, "")
        examples.find(".template").clone().text(test.title).attr("href", href).removeClass("template hidden").toggleClass("active", first).appendTo(examples).attr("data-db", dbName).attr("data-index", i).click((e) => {
          $(e.target).parent().children().removeClass("active")
          $(e.target).addClass("active")
          this.select($(e.target).data("db"), $(e.target).data("index"))
        })
        first = false
      })
    }
    $("#collapseExamples")
      .on("show.bs.collapse", (e) => { localStorage.setItem("org.jrgql.showExamples", true) })
      .on("hide.bs.collapse", (e) => { localStorage.setItem("org.jrgql.showExamples", false) })
      .collapse((localStorage.getItem("org.jrgql.showExamples") || "true") == "true"? "show": "hide")
  }

  runTests() {
    for(let dbName of this.dbNames) {
      this.examples[dbName].tests.forEach((test, i) => {
        let results
        try {
          results = this.qls[dbName].query(test.rootType, test.input)
          test.indentation = this.qls[dbName].indentation
          let equals = _.isEqual(results, test.output)
          if (!equals) {
            throw new Error("Result is different from expected.")
          }
          $(`.list-group-item[data-index=${i}][data-db=${dbName}]`).addClass("list-group-item-success")
        } catch (e) {
          console.error("FAIL", test.title + ":", results, ", but expected", test.output, e)
          $(`.list-group-item[data-index=${i}][data-db=${dbName}]`).addClass("list-group-item-danger")
        }
        if (!results) {
          results = ""
        }
      })
    }
  }

  scrollToSelection(url, tag, example) {
    if (tag) {
      let offset = $(`#${tag}`).offset()
      if (offset) {
        $("html, body").animate({scrollTop: offset.top}, "slow")
      }
    }
    if (example) {
      for(let dbName of this.dbNames) {
        let i = 0
        for(let test of this.examples[dbName].tests) {
          let shortName = test.title.replace(/ /g, "")
          if (shortName == example) {
            $("#exampleContainer").children().removeClass("active")
            $(`#exampleContainer [href$="${shortName}"]`).addClass("active")
            this.select(dbName, i)
            return
          }
          i++
        }
      }
      this.select("intro", 0)
    } else {
      this.select("intro", 0)
    }
  }

  setupEditor() {
    let dbOptionTemplate = $("#dbSelector .template")
    for(let dbName in this.dbs) {
      dbOptionTemplate.clone().removeClass("template hidden").find("a").html(dbName).parent().appendTo(dbOptionTemplate.parent()).click((e) => {
          this.selectedDb = e.currentTarget.innerText.trim()
          localStorage.setItem("org.jrgql.selectedDb", this.selectedDb)
          this.setupEditorsContents()
      })
    }
    this.editor1 = CodeMirror.fromTextArea($("#editor1")[0], {
      mode: "application/json",
      lint: true,
      tabMode: "indent",
      lineNumbers: true,
      matchBrackets: true,
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"]
    })
    this.editor2 = CodeMirror.fromTextArea($("#editor2")[0], {
      mode: "application/json",
      lint: true,
      tabMode: "indent",
      lineNumbers: true,
      matchBrackets: true,
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"]
    })
    $("#fullScreen").click((e) => {
      $("#graphEditor svg").appendTo($(".modal-body"))
      this.gdbe.zoomToFit()
    })
    $("#modal").on("shown.bs.modal", () => this.gdbe.zoomToFit())
    $("button.close").click((e) => {
      $(".modal-body svg").appendTo($("#graphEditor"))
      this.gdbe.zoomToFit()
    })
    $("button#run").click((e) => {
      let q = JSON.parse(this.editor2.doc.getValue())
      let results = this.qls[this.selectedDb].query(this.selectedRootType, q)
      $("#result").html(JsonHighlighter.prepare(results, this.qls[this.selectedDb].indentation))
    })
    $("button#clear").click((e) => {
      $("#result").html("")
    })
  }

  setupEditorsContents() {
    this.editor1.doc.setValue(JSON.stringify(this.dbs[this.selectedDb], null, "  "))
    let example = this.examples[this.selectedDb]
    let test0 = example.tests[0]
    if (example) {
      this.editor2.doc.setValue(JSON.stringify(test0.input, null, "  "))
      this.selectedRootType = test0.rootType
      $("#result").html(JsonHighlighter.prepare(test0.output))
    }

    $("#editorMode :input").on("change", (e) => this.toggleEditor(e.target.id))
    this.toggleEditor(localStorage.getItem("org.jrgql.editorMode") || "jsonMode")

    $("#rootTypeSelectorButton span.buttonText").html("Type: " + test0.rootType)
    let rootTypeOptionTemplate = $("#rootTypeSelector .template")
    $("#rootTypeSelector .example").remove()
    for(let type in example.types) {
      rootTypeOptionTemplate.clone().addClass("type").removeClass("template hidden").find("a").html(type).parent().appendTo(rootTypeOptionTemplate.parent()).click((e) => {
          this.selectedRootType = e.currentTarget.innerText.trim()
          $("#rootTypeSelectorButton span.buttonText").html("Type: " + this.selectedRootType)
      })
    }

    let exampleOptionTemplate = $("#exampleSelector .template")
    $("#exampleSelector .example").remove()
    example.tests.forEach((test, i) => {
      exampleOptionTemplate.clone().addClass("example").attr("data-index", i).removeClass("template hidden").find("a").html(test.title).parent().appendTo(exampleOptionTemplate.parent()).click((e) => {
          let i = $(e.currentTarget).data("index")
          let test = this.examples[this.selectedDb].tests[i]
          this.editor2.doc.setValue(JSON.stringify(test.input, null, "  "))
          $("#rootTypeSelectorButton span.buttonText").html("Type: " + test.rootType)
          this.selectedRootType = test.rootType
      })
    })
  }

  toggleEditor(mode = "graphMode") {
    $("#editorMode label")
    $("#" + mode).attr("checked", "checked").parent().addClass("active")
    localStorage.setItem("org.jrgql.editorMode", mode)
    if (mode == "jsonMode") {
      $("#textEditor").removeClass("hidden")
      this.editor1.refresh()
      $("#graphEditor").hide()
      $("button#fullScreen").hide()
    } else {
      $("#textEditor").addClass("hidden")
      $("#graphEditor").show()
      $("button#fullScreen").show()
      this.gdbe.setDb(this.dbs[this.selectedDb])
      this.gdbe.render()
    }
  }

}
