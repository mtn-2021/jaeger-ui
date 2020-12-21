// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import queryString from 'query-string';
import PropTypes from 'prop-types';
import { Menu } from 'antd';
import './NodeForm.css';

export class NodeFormImpl extends React.PureComponent {
  render() {
    const {
      nodeList,
      // invalid,
      // submitting,
      // selectedNode,
    } = this.props;
    // const noSelectedService = selectedNode === '-' || !selectedNode;
    return (
      <div>
        <div>
          <span>
            Nodes <span className="NodeForm--labelCount">({nodeList.length})</span>
          </span>
        </div>
        <Menu mode="vertical">
          {nodeList.map(node => (
            <Menu.Item key={node}>{node}</Menu.Item>
          ))}
        </Menu>
      </div>
    );
  }
}

NodeFormImpl.propTypes = {
  nodeList: PropTypes.arrayOf(PropTypes.string),
  // invalid: PropTypes.bool,
  // submitting: PropTypes.bool,
  // selectedNode: PropTypes.string,
};

NodeFormImpl.defaultProps = {
  // invalid: false,
  nodeList: [],
  // submitting: false,
  // selectedNode: null,
};

export function mapStateToProps(state) {
  const { node } = queryString.parse(state.router.location.search);
  return {
    node: node || '-',
  };
}

// function mapDispatchToProps(dispacth) {
//     const {}
//
// }

export default connect(
  mapStateToProps
  // mapDispatchToProps
)(
  reduxForm({
    form: 'nodesSideBar',
  })(NodeFormImpl)
);
