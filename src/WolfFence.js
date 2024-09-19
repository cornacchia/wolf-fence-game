import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { ArrowDown, ArrowRight } from 'react-bootstrap-icons'

const _ = require('lodash')
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function calcDistances (map, wRow, wCol) {
  let maxMin = { max: -1, min: 1000 }
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      const horizontalDist = Math.abs(i - wRow)
      const verticalDist = Math.abs(j - wCol)
      const totalDist = horizontalDist + verticalDist
      map[i][j].distance = totalDist
      if (totalDist > maxMin.max) maxMin.max = totalDist
      if (totalDist < maxMin.min) maxMin.min = totalDist
    }
  }

  return maxMin
}

function hexToRgb (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function map (value, fromSource, toSource, fromTarget, toTarget) {
  return (value - fromSource) / (toSource - fromSource) * (toTarget - fromTarget) + fromTarget
}

function getColorGradients (maxMin) {
  const startRGB = hexToRgb('#00ff00')
  const endRGB = hexToRgb('#ff0000')
  const colors = {}

  for (let i = maxMin.min; i <= maxMin.max; i++) {

    var percentFade = map(i, maxMin.min, maxMin.max, 0, 1)

    var diffRed = endRGB.r - startRGB.r
    var diffGreen = endRGB.g - startRGB.g
    var diffBlue = endRGB.b - startRGB.b

    diffRed = (diffRed * percentFade) + startRGB.r
    diffGreen = (diffGreen * percentFade) + startRGB.g
    diffBlue = (diffBlue * percentFade) + startRGB.b

    const result = "rgb(" + Math.round(diffRed) + ", " + Math.round(diffGreen) + ", " + Math.round(diffBlue) + ")"
    colors[i] = result
  }

  return colors
}

function markExcludedTiles (map, barriers, wolf) {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      for (let hBarrPos in barriers.horizontal) {
        if (barriers.horizontal[hBarrPos] && i <= hBarrPos && hBarrPos < wolf.row) map[i][j].excluded = true
        if (barriers.horizontal[hBarrPos] && i > hBarrPos && hBarrPos >= wolf.row) map[i][j].excluded = true
      }
      for (let vBarrPos in barriers.vertical) {
        if (barriers.vertical[vBarrPos] && j <= vBarrPos && vBarrPos < wolf.col) map[i][j].excluded = true
        if (barriers.vertical[vBarrPos] && j > vBarrPos && vBarrPos >= wolf.col) map[i][j].excluded = true
      }
    }
  }
}

class WolfFence extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      map: null,
      colors: null,
      wolf: null,
      barriers: null,
      found: false,
      numOfClicks: 0
    }

    this.createMap = this.createMap.bind(this)
    this.clickOnCell = this.clickOnCell.bind(this)
    this.setBarrier = this.setBarrier.bind(this)
  }

  componentDidMount () {
    this.createMap()
  }

  createMap () {
    const map = []
    const wolfPosition = getRandomInt(0, 64)
    let wRow = -1
    let wCol = -1
    let n = 0
    for (let i = 0; i < 8; i++) {
      const row = []
      for (let j = 0; j < 8; j++) {
        const newTile = {
          wolf: false,
          distance: -1,
          clicked: false,
          excluded: false
        }
        if (n === wolfPosition) {
          newTile.wolf = true
          wRow = i
          wCol = j
        }
        row.push(newTile)
        n += 1
      }
      map.push(row)
    }

    const maxMin = calcDistances(map, wRow, wCol)
    const colors = getColorGradients(maxMin)
    const barriers = {
      vertical: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
      horizontal: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false }
    }

    this.setState({ map, colors, barriers, wolf: { row: wRow, col: wCol } })
  }

  clickOnCell (i, j) {
    if (this.state.found) return
    const map = this.state.map
    let numOfClicks = this.state.numOfClicks
    let found = this.state.found
    if (!found && !map[i][j].clicked) numOfClicks += 1
    if (map[i][j].wolf) found = true
    map[i][j].clicked = true
    this.setState({ map, numOfClicks, found })
  }

  setBarrier (type, pos) {
    const barriers = this.state.barriers
    const map = this.state.map
    barriers[type][pos] = true

    markExcludedTiles(map, barriers, this.state.wolf)

    this.setState({
      map, barriers
    })
  }

  render () {
    return (
      <div style={{ width: '100%' }}>
        {!_.isNil(this.state.map) &&
          <Row>
            <Col xs={10}>
              <Row>
                <Col className='rowHeader'></Col>
                <Col className='colHeader'>1</Col>
                <Col className='colHeader'>2</Col>
                <Col className='colHeader'>3</Col>
                <Col className='colHeader'>4</Col>
                <Col className='colHeader'>5</Col>
                <Col className='colHeader'>6</Col>
                <Col className='colHeader'>7</Col>
                <Col className='colHeader'>8</Col>
              </Row>
              {this.state.map.map((row, rowIdx) => {
                return (
                  <Row key={'row' + rowIdx}>
                    <Col className='rowHeader'>{ROWS[rowIdx]}</Col>
                    {row.map((cell, cellIdx) => {
                      let className = 'mapCell'
                      if (this.state.barriers.horizontal[rowIdx]) className += ' barrierBottom'
                      if (this.state.barriers.vertical[cellIdx]) className += ' barrierRight'

                      let backgroundColor = '#ffffff'
                      if (cell.clicked) {
                        if (this.props.enableBark) backgroundColor = this.state.colors[cell.distance]
                        else backgroundColor = '#a0a0a0'
                      }

                      if (cell.excluded) backgroundColor = cell.clicked ? '#000000' : '#ffffff'

                      let backgroundImage = ''
                      if (cell.clicked && cell.wolf) backgroundImage = 'url("/images/wolf.png")'

                      return (
                      <Col
                        key={'cell' + rowIdx + '-' + cellIdx}
                        className={className}
                        style={{ backgroundColor: backgroundColor, backgroundImage: backgroundImage }}
                        onClick={() => { this.clickOnCell(rowIdx, cellIdx )}}
                      >
                        {false && this.props.enableBark && !cell.wolf && cell.clicked && !cell.excluded && cell.distance}
                      </Col>
                    )})}
                    {rowIdx < this.state.map.length - 1 &&
                      <Col xs='2' className='d-flex flex-column' style={{ width: '200px'}}>
                        {this.props.enableBarrier &&
                          <Button
                          className='mt-auto'
                          onClick={() => { this.setBarrier('horizontal', rowIdx )}}
                          disabled={this.state.found || this.state.barriers.horizontal[rowIdx]}
                          >
                            <ArrowDown />
                          </Button>
                        }
                      </Col>
                    }
                  </Row>
              )})}
              <Row>
                  <Col className='rowHeader'></Col>
                {_.tail(this.state.map[0]).map((bCol, bColIdx) => (
                  <Col className='bottomCell' key={'bCol' + bColIdx} >
                    {this.props.enableBarrier &&
                      <Button
                        style={{ width: '70%' }}
                        onClick={() => { this.setBarrier('vertical', bColIdx )}}
                        disabled={this.state.found || this.state.barriers.vertical[bColIdx]}
                      >
                        <ArrowRight />
                      </Button>
                    }
                  </Col>
                ))}
              </Row>
            </Col>
            <Col xs={2}>
              <Row>
                {!this.props.enableBark && !this.props.enableBarrier &&
                  <h2>Trova il lupo a tentoni!</h2>
                }
                {this.props.enableBark && !this.props.enableBarrier &&
                  <h2>Trova il lupo ascoltando gli ululati!</h2>
                }
                {this.props.enableBark && this.props.enableBarrier &&
                  <h2>Trova il lupo costruendo barriere!</h2>
                }
                <hr/>
                <h3>Click: {this.state.numOfClicks}</h3>
              </Row>
            </Col>
          </Row>
        }

      </div>
    )
  }
}

WolfFence.propTypes = {
  enableBark: PropTypes.bool,
  enableBarrier: PropTypes.bool
}

export default WolfFence
