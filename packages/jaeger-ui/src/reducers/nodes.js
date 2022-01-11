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

import { handleActions } from 'redux-actions';
import { localeStringComparator } from '../utils/sort';
import { fetchNodes, fetchRequestToNode } from '../actions/jaeger-api';
import { fetchedState } from '../constants';

const initialState = {
  nodes: null,
  services: {},
  loading: false,
  error: null,
  search: {
    request: [],
    status: [],
    query: null,
  },
};

function getTimestamp(logs, key) {
  const log = logs.find(({ fields }) => fields[0].key === key);
  if (log) {
    const { timestamp } = log;
    return timestamp;
  }
  return -1;
}

function getTimestampByValue(logs, value) {
  const log = logs.find(({ fields }) => fields[0].value === value);
  if (log) {
    const { timestamp } = log;
    return timestamp;
  }
  return -1;
}

function getStatus(logs) {
  const log = logs.find(({ fields }) => fields[0].key === 'nodeStatus');
  const { fields } = log;
  const { value } = fields[0];
  const statusKV = value.split(/{|}|, /).filter(Boolean);
  const status = {};
  statusKV.forEach(kv => {
    const spKv = kv.split('=');
    status[spKv[0]] = spKv[1];
  });
  return status;
}

function fetchStarted(state) {
  return { ...state, loading: true };
}

function fetchNodesDone(state, { payload }) {
  const { data: nodes } = payload;

  const nodeAddress = [];
  const servicesOnNode = [];
  nodes.forEach(({ address, services }) => {
    servicesOnNode[address] = services.sort(localeStringComparator);
    nodeAddress.push(address);
  });
  nodeAddress.sort(localeStringComparator);

  return { ...state, nodes: nodeAddress, services: servicesOnNode, error: null, loading: false };
}

function fetchNodesErred(state, { payload: error }) {
  return { ...state, error, loading: false, nodes: [] };
}

function fetchRequestStarted(state, { meta }) {
  const { node, service } = meta.query;

  const query = { node, service };
  const search = { query, request: [], status: [], state: fetchedState.LOADING };
  return { ...state, search };
}

function fetchRequestDone(state, { payload }) {
  const { data } = payload;
  console.log(data);
  const { request, status } = data;
  const requestData = request.map(({ logs, operationName }) => {
    const startTime = getTimestampByValue(logs, 'requestStart');
    const finishTime = getTimestampByValue(logs, 'requestFinish');
    let failed = null;
    if (finishTime === -1) {
      failed = getTimestamp(logs, 'error');
    }
    return {
      operationName,
      startTime,
      responseTime: finishTime - startTime,
      failed,
    };
  });

  const timestamps = [];
  const statusDetail = [];
  status.forEach(({ logs, operationName }) => {
    const timestamp = getTimestamp(logs, 'nodeStatus');
    timestamps.push(timestamp);
    statusDetail[timestamp] = {
      operationName,
      status: getStatus(logs),
    };
  });
  timestamps.sort();
  const statusData = {
    timestamps,
    status: statusDetail,
  };

  const search = { ...state.search, request: requestData, status: statusData, state: fetchedState.DONE };
  return { ...state, search };
}

function fetchRequestErred(state, { payload }) {
  const search = { ...state.search, error: payload, request: [], status: [], state: fetchedState.ERROR };
  return { ...state, search };
}

export default handleActions(
  {
    [`${fetchNodes}_PENDING`]: fetchStarted,
    [`${fetchNodes}_FULFILLED`]: fetchNodesDone,
    [`${fetchNodes}_REJECTED`]: fetchNodesErred,

    [`${fetchRequestToNode}_PENDING`]: fetchRequestStarted,
    [`${fetchRequestToNode}_FULFILLED`]: fetchRequestDone,
    [`${fetchRequestToNode}_REJECTED`]: fetchRequestErred,
  },
  initialState
);
