"use strict"

exports.GraphDbEditor = class GraphDbEditor {

  constructor(selector) {
    this.selector = selector

    this.container = $(this.selector)

    this.colors = [ "#FFEEEE", "#EEFFEE", "#EEEEFF", "#FFEEFF", "#FFFFEE", "#EEFFFF" ]
    this.typeColors = {}
  }

  erase() {
    $(`${this.selector} svg`).remove()
  }

  setDb(db) {
    this.db = db

    this.erase()

    this.svg = d3.select(this.selector).append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("style", "border: 1px solid black;")

    this.topGroup = this.svg.append("g")

    this.typeLines = this.topGroup
      .append("g")
        .attr("class", "typeLines")

    this.valueLines = this.topGroup
      .append("g")
        .attr("class", "valueLines")

    this.typesGroup = this.topGroup
      .append("g")
        .attr("class", "types")

    this.valuesGroup = this.topGroup
      .append("g")
        .attr("class", "values")

    this.zoom = d3.zoom(this.topGroup)
      .scaleExtent([1 / 8, 1])
      .on("zoom", () => this.zoomed())

    this.svg
      .call(this.zoom)
      .on("wheel", () => d3.event.preventDefault())
  }

  zoomed() {
    this.topGroup.attr("transform", d3.event.transform)
  }

  drag(simulationType) {
    return d3.drag()
      .on("start", (d) => {
        if (!d3.event.active) {
          let simulation = simulationType == "types"? this.typesSimulation : this.valuesSimulation
          simulation.alphaTarget(0.3).restart()
        }
        d.fx = d.x
        d.fy = d.y
      })
      .on("drag", (d) => {
        d.fx = d3.event.x
        d.fy = d3.event.y
      })
      .on("end", (d) => {
        if (!d3.event.active) {
          let simulation = simulationType == "types"? this.typesSimulation : this.valuesSimulation
          simulation.alphaTarget(0)
        }
        d.fx = null
        d.fy = null
      })
  }

  storeColor(typeName, i) {
    return this.typeColors[typeName] = i < this.colors.length? this.colors[i] : "#EEEEEE"
  }

  createType(typeName, i, node) {
    // console.log("new type", typeName)
    let type = d3.select(node)
      .append("g")
      .attr("class", (d) => "type " + (this.db.types[d] instanceof Object? "complex" : "primitive") )
      .attr("typeName", (d) => d)
      .call(this.drag("types"))

    type
      .append("rect")
      .attr("style", `fill: ${this.storeColor(typeName, i)}; stroke: black; stroke-width: 1; stroke-dasharray: 10 5;`)

    type
      .append("text")
      .attr("class", "typeName svg-no-select")
      .attr("font-family", "monospace")
      .attr("text-decoration", "underline")
      .text(typeName)
  }

  createField(typeName, field, i, node) {
    // console.log("new field in type", typeName, ":", field)
    d3.select(node)
      .append("text")
      .attr("class", "field svg-no-select")
      .attr("name", (d) => d.name)
      .attr("type", (d) => d.type)
      .attr("y", (d) => 20 + i * 20)
      .attr("font-family", "monospace")
      .attr("font-size", "12px")
      .text((d) => `${d.name}: ${d.type}`)
  }

  createValue(value, i, node) {
    // console.log("new value", value, i, node)
    let valueNode = d3.select(node)
      .append("g")
      .attr("class", "value")
      .attr("typeName", value["_type"])

    valueNode
      .append("rect")
      .attr("style", `fill: ${this.typeColors[value["_type"]]}; stroke: black; stroke-width: 1;`)

    valueNode
      .call(this.drag("values"))
      .append("text")
      .attr("class", "svg-no-select")
      .attr("font-family", "monospace")
      .attr("text-decoration", "underline")
      .text(value["_type"])

    delete value["_type"]

    let j = 0
    for(let field in value) {
      valueNode
        .append("text")
        .attr("class", "svg-no-select")
        .text(`${field}: ${JSON.stringify(value[field])}`)
        .attr("y", (d) => 20 + j * 20)
        .attr("font-family", "monospace")
        .attr("font-size", "12px")
      j++
    }
  }

  setBackgroundSize(node) {
    const padding = 3
    let bbox = node.getBBox()
    d3.select(node)
      .select("rect")
      .attr("x", bbox.x - padding)
      .attr("y", bbox.y - padding)
      .attr("width", bbox.width + 2 * padding)
      .attr("height", bbox.height + 2 * padding)
  }

  render() {
    let typeNodes = Object.keys(this.db.types).map((name) => ({ name }))

    this.typesGroup
      .selectAll("g.type")
      .data(typeNodes)
      .enter()
        .each((type, i, all) => {
          this.createType(type.name, i, all[i])
        })

    this.typesGroup
      .selectAll("g.type")
      .selectAll("text.field")
      .data((type, i, all) => {
        return Object.keys(this.db.types[type.name]).map(
          (name) => ({ name, parent: type.name, type: this.db.types[type.name][name] })
        )
      })
      .enter()
        .each((d, i, all) => {
          this.createField(d.parent, d.name, i, all[i])
        })

    this.types = this.typesGroup
      .selectAll("g.type")

    let valueNodes = Object.keys(this.db.values).map((type) =>
      JSON.parse(JSON.stringify(this.db.values[type])).map((value) => {
        value["_type"] = type
        return value
      })
    ).reduce((a1, a2) => a1.concat(a2))

    this.valuesGroup
      .selectAll("g.value")
      .data(valueNodes)
      .enter()
        .each((value, i, all) => {
          this.createValue(value, i, all[i])
        })

    this.values = this.valuesGroup
      .selectAll("g.value")

    this.types.each((d, i, all) => this.setBackgroundSize(all[i]))
    this.values.each((d, i, all) => this.setBackgroundSize(all[i]))

    let typeLinks = []
    for(let typeName in this.db.types) {
      let type = this.db.types[typeName]
      for(let field in type) {
        let typeOfField = type[field].replace("[]", "")
        if (this.db.types[typeOfField]) {
          typeLinks.push({ source: typeName, target: typeOfField })
        }
      }
    }

    let valueLinks = []
    for(let typeName in this.db.values) {
      let type = this.db.values[typeName]
      for(let value of type) {
        for(let field in value) {
          let typeOfField = this.db.getTypeOf(typeName, field)
          if (this.db.types[typeOfField] && value[field]) {
            if (value[field] instanceof Array) {
              for(let link of value[field]) {
                valueLinks.push({ source: value["_id"], target: link })
              }
            } else {
              valueLinks.push({ source: value["_id"], target: value[field] })
            }
          }
        }
      }
    }

    [this.typeLinks, this.typesSimulation] =
      this.getLinks(this.typeLines, typeLinks, ((d) => d.name), 0, 125, typeNodes, () => this.typeLinksTick());

    [this.valueLinks, this.valuesSimulation] =
      this.getLinks(this.valueLines, valueLinks, ((d) => d._id), 400, 125, valueNodes, () => this.valueLinksTick());
  }

  getLinks(container, links, id, cx, cy, nodes, tick) {
    let linkNodes = container
      .selectAll("line")
        .data(links)
        .enter()
          .append("line")
          .attr("stroke", "black")
          .attr("stroke-width", 1)

    let simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(id).distance(200))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(cx, cy))

    simulation
      .nodes(nodes)
      .on("tick", tick)
      .on("end", () => this.zoomToFit())
      .alphaDecay(0.5)
      .force("link")
      .links(links)

    return [ linkNodes, simulation ]
  }

  zoomToFit() {
    let bounds = this.topGroup.node().getBBox()
    let parent = this.topGroup.node().parentElement
    let fullWidth = parent.clientWidth || parent.parentNode.clientWidth
    let fullHeight = parent.clientHeight || parent.parentNode.clientHeight
    if (bounds.width == 0 || bounds.height == 0) {
      return
    }
    let scale = 0.85 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight)
    let x = fullWidth  / 2 - scale * (bounds.x + bounds.width  / 2)
    let y = fullHeight / 2 - scale * (bounds.y + bounds.height / 2)
    let transform = d3.zoomIdentity.translate(x, y).scale(scale)
    this.topGroup
      .transition()
      .duration(500)
      .attr("transform", transform)
      .on("end", () => this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(x,y).scale(scale)))
  }

  typeLinksTick() {
    this.typeLinks
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)

    this.types
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
  }

  valueLinksTick() {
    this.valueLinks
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)

    this.values
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
  }

}
