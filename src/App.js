import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import WolfFence from './WolfFence'

const _ = require('lodash')

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      enableBark: false,
      enableBarrier: false
    }
  }

  componentDidMount () {
    const urlParams = new URLSearchParams(window.location.search)
    const level = urlParams.get('level')
    let enableBark = false
    let enableBarrier = false
    if (level === '2') {
      enableBark = true
    }
    if (level === '3') {
      enableBark = true
      enableBarrier = true
    }

    this.setState({
      enableBark, enableBarrier
    })
  }


  render () {
    return (
      <div style={{ width: '100%' }}>
        <Row>
          <Col>
            <WolfFence enableBark={this.state.enableBark} enableBarrier={this.state.enableBarrier} />
          </Col>
        </Row>
      </div>
    )
  }
}

export default App;
