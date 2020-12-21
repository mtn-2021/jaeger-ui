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

/* eslint-disable react/require-default-props */

import memoizeOne from 'memoize-one';
import React, { Component } from 'react';
import { Col, Row } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import NodeForm from './NodeForm';
import * as jaegerApiActions from '../../actions/jaeger-api';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorMessage from '../common/ErrorMessage';
import { getUrlState } from '../SearchTracePage/url';

import './index.css';
import JaegerLogo from '../../img/jaeger-logo.svg';

export class NodeDisplayImpl extends Component {
  componentDidMount() {
    const {
      fetchNodes,
      //     // fetchNodeDetail,
      //     // isHomepage,
      //     // queryOfResults,
      //     // urlQueryParams,
    } = this.props;
    // if (!isHomepage && urlQueryParams && !isSameQuery(urlQueryParams, queryOfResults)) {
    //     fetchNodeDetail(urlQueryParams);
    // }
    fetchNodes();
  }

  render() {
    const { nodeList, embedded, loadingNodes, errors, loadingTraces, isHomepage } = this.props;
    const showError = errors && !loadingTraces;
    const showLogo = isHomepage && !errors;
    return (
      <Row className="NodeDisplay--row">
        {!embedded && (
          <Col span={6} className="NodeDisplay--column">
            <div className="NodeDisplay--find">
              {!loadingNodes && nodeList ? <NodeForm nodeList={nodeList} /> : <LoadingIndicator />}
            </div>
          </Col>
        )}
        <Col span={!embedded ? 18 : 24} className="NodeDisplay--column">
          {showError && (
            <div className="js-test-error-message">
              <h2>There was an error querying for nodes:</h2>
              {errors.map(err => (
                <ErrorMessage key={err.message} error={err} />
              ))}
            </div>
          )}
          {showError && <h2>here result</h2>}

          {showLogo && (
            <img
              className="SearchTracePage--logo js-test-logo"
              alt="presentation"
              src={JaegerLogo}
              width="400"
            />
          )}
        </Col>
      </Row>
    );
  }
}

NodeDisplayImpl.propTypes = {
  isHomepage: PropTypes.bool,
  loadingTraces: PropTypes.bool,
  loadingNodes: PropTypes.bool,
  embedded: PropTypes.shape({
    searchHideGraph: PropTypes.bool,
  }),
  nodeList: PropTypes.arrayOf(PropTypes.string),
  urlQueryParams: PropTypes.shape({
    service: PropTypes.string,
    limit: PropTypes.string,
  }),
  queryOfResults: PropTypes.shape({
    service: PropTypes.string,
    limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  // services: PropTypes.arrayOf(
  //     PropTypes.shape({
  //         name: PropTypes.string,
  //         operations: PropTypes.arrayOf(PropTypes.string),
  //     })
  // ),
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  fetchNodes: PropTypes.func,
  // fetchNodeDetail: PropTypes.func,
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string,
    })
  ),
};

const stateNodesXformer = memoizeOne(stateNodes => {
  const { loading: loadingNodes, nodes: nodeList, error: nodeError } = stateNodes;

  return { loadingNodes, nodeList, nodeError };
});

// export to test
export function mapStateToProps(state) {
  const { embedded, router, nodes: tmpNodes } = state;
  const query = getUrlState(router.location.search);
  const isHomepage = !Object.keys(query).length;
  const { loadingNodes, nodeList, nodeError } = stateNodesXformer(tmpNodes);
  const errors = [];
  if (nodeError) {
    errors.push(nodeError);
  }
  return {
    embedded,
    isHomepage,
    nodeList,
    loadingNodes,
    errors: errors.length ? errors : null,
    urlQueryParams: Object.keys(query).length > 0 ? query : null,
  };
}

function mapDispatchToProps(dispatch) {
  const { fetchNodes } = bindActionCreators(jaegerApiActions, dispatch);
  return {
    fetchNodes,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeDisplayImpl);
