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
import { fetchNodes } from '../actions/jaeger-api';

const initialState = {
  nodes: null,
  loading: false,
  error: null,
};

function fetchStarted(state) {
  return { ...state, loading: true };
}

function fetchNodesDone(state, { payload }) {
  const nodes = payload.data || [];
  nodes.sort(localeStringComparator);
  return { ...state, nodes, error: null, loading: false };
}

function fetchNodesErred(state, { payload: error }) {
  return { ...state, error, loading: false, nodes: [] };
}

export default handleActions(
  {
    [`${fetchNodes}_PENDING`]: fetchStarted,
    [`${fetchNodes}_FULFILLED`]: fetchNodesDone,
    [`${fetchNodes}_REJECTED`]: fetchNodesErred,
  },
  initialState
);
