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
import store from 'store';
import NodeForm from './NodeForm';
import SearchResults from './SearchResults';
import * as jaegerApiActions from '../../actions/jaeger-api';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorMessage from '../common/ErrorMessage';
import { getUrlState } from '../SearchTracePage/url';

import './index.css';
import { fetchedState } from '../../constants';

export class NodeDisplayImpl extends Component {
  componentDidMount() {
    const { fetchNodes } = this.props;
    fetchNodes();
  }

  render() {
    const {
      nodeList,
      loadingNodes,
      errors,
      tableData,
      request,
      status,
      loadingDetail,
      lookback,
      start,
      statusKeys,
    } = this.props;
    const showError = errors && !loadingDetail;
    return (
      <Row className="NodeDisplay--row">
        <Col span={6} className="NodeDisplay--column">
          <div className="NodeDisplay--find">
            {!loadingNodes && nodeList ? <NodeForm nodeList={nodeList} /> : <LoadingIndicator />}
          </div>
        </Col>
        <Col span={18} className="NodeDisplay--column">
          {showError && (
            <div className="js-test-error-message">
              <h2>There was an error querying for nodes:</h2>
              {errors.map(err => (
                <ErrorMessage key={err.message} error={err} />
              ))}
            </div>
          )}
          {!showError && (
            <SearchResults
              start={start}
              lookback={lookback}
              request={request}
              status={status}
              tableData={tableData}
              loading={loadingDetail}
              statusKeys={statusKeys}
            />
          )}
        </Col>
      </Row>
    );
  }
}

NodeDisplayImpl.propTypes = {
  loadingNodes: PropTypes.bool,
  nodeList: PropTypes.arrayOf(
    PropTypes.shape({
      node: PropTypes.string,
      services: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  loadingDetail: PropTypes.bool,
  statusKeys: PropTypes.arrayOf(PropTypes.string),
  tableData: PropTypes.shape({
    operations: PropTypes.arrayOf(PropTypes.string),
    sum: PropTypes.arrayOf(
      PropTypes.shape({
        successCount: PropTypes.number,
        failCount: PropTypes.number,
        average: PropTypes.number,
        min: PropTypes.number,
        max: PropTypes.number,
      })
    ),
  }),
  request: PropTypes.arrayOf(
    PropTypes.shape({
      operationName: PropTypes.string,
      startTime: PropTypes.number,
      failed: PropTypes.number,
    })
  ),
  status: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.number,
      operationName: PropTypes.string,
      keys: PropTypes.arrayOf(PropTypes.string),
      values: PropTypes.arrayOf(PropTypes.string),
      isOn: PropTypes.bool,
    })
  ),
  lookback: PropTypes.string,
  start: PropTypes.number,
  urlQueryParams: PropTypes.shape({
    service: PropTypes.string,
    limit: PropTypes.string,
  }),
  queryOfResults: PropTypes.shape({
    service: PropTypes.string,
    limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  fetchNodes: PropTypes.func,
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string,
    })
  ),
};

const stateNodesXformer = memoizeOne(stateNodes => {
  const { nodes, services, loading: loadingNodes, error: nodeError, search } = stateNodes;
  const nodeList =
    nodes &&
    nodes.map(address => ({
      node: address,
      services: services[address] || [],
    }));
  return { nodeList, loadingNodes, nodeError, search };
});

const nodeDetailXformer = memoizeOne(nodeDetail => {
  const { request: stRequest, status: stStatus, state, error: detailError } = nodeDetail;
  const list = [];
  const request = [];

  for (let i = 0; i < stRequest.length; i++) {
    if (stRequest[i].responseTime > 0) {
      const tmp = [].concat(list[stRequest[i].operationName]);
      tmp.push(stRequest[i].responseTime);
      list[stRequest[i].operationName] = tmp;
    } else {
      const tmp = [].concat(list[stRequest[i].operationName]);
      tmp.push('failed');
      list[stRequest[i].operationName] = tmp;
    }
    request.push({
      operationName: stRequest[i].operationName,
      startTime: stRequest[i].startTime,
      failed: stRequest[i].failed,
    });
  }

  const requestOperations = Object.keys(list);
  const sum = [];
  for (let op = 0; op < requestOperations.length; op++) {
    const d = [].concat(list[requestOperations[op]]).filter(v => !(v === undefined));
    let failCount = 0;
    const total = d.reduce((s, e) => {
      if (e !== 'failed') return s + e;
      failCount++;
      return e;
    }, 0);
    const min = d.reduce((a, b) => (b !== 'failed' ? Math.min(a, b) : a));
    const max = d.reduce((a, b) => (b !== 'failed' ? Math.max(a, b) : a));
    const successCount = d.length - failCount;
    const average = total / d.length;
    sum.push({ successCount, failCount, average, min, max });
  }

  const tableData = {
    operations: requestOperations,
    sum,
  };

  let keyCollector = [];
  const { timestamps, status: statusMap } = stStatus;
  const status =
    timestamps &&
    timestamps.map(timestamp => {
      const oneStatus = statusMap[timestamp];
      const keys = Object.keys(oneStatus.status);
      const values = Object.values(oneStatus.status);
      keyCollector = keyCollector.concat(keys);
      let isOn = true;
      if (oneStatus.status.status === 'false') isOn = false;
      return {
        timestamp,
        operationName: oneStatus.operationName,
        keys,
        values,
        isOn,
      };
    });
  const statusKeys = [...new Set(keyCollector)];
  const loadingDetail = state === fetchedState.LOADING;

  return {
    statusKeys,
    tableData,
    request,
    status,
    loadingDetail,
    detailError,
  };
});

export function mapStateToProps(state) {
  const { router, nodes: tmpNodes } = state;
  const query = getUrlState(router.location.search);
  const { nodeList, loadingNodes, nodeError, search } = stateNodesXformer(tmpNodes);
  const { statusKeys, tableData, request, status, loadingDetail, detailError } = nodeDetailXformer(search);
  const errors = [];
  if (nodeError) {
    errors.push(nodeError);
  }
  if (detailError) {
    errors.push(detailError);
  }
  const lastNodeSearch = store.get('lastNodeSearch');
  let lookback;
  let start;
  if (lastNodeSearch) {
    const { lookback: look, start: st } = lastNodeSearch;
    if (look && st && look !== '-' && st !== '-') {
      lookback = look;
      start = st;
    }
  }

  return {
    start,
    lookback,
    tableData,
    statusKeys,
    request,
    status,
    loadingDetail,
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
