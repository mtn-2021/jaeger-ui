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
import queryString from 'query-string';
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Form, Button, Input } from 'antd';
import './NodeForm.css';
import { bindActionCreators } from 'redux';
import store from 'store';
import VirtSelect from '../common/VirtSelect';
import reduxFormFieldAdapter from '../../utils/redux-form-field-adapter';
import * as jaegerApiActions from '../../actions/jaeger-api';

const FormItem = Form.Item;

const AdaptedInput = reduxFormFieldAdapter({ AntInputComponent: Input });
const AdaptedVirtualSelect = reduxFormFieldAdapter({
  AntInputComponent: VirtSelect,
  onChangeAdapter: option => (option ? option.value : null),
});

export function getIntervalUnix(interval) {
    const unit = interval.substr(-1);
    const units = {
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24,
    };
    return parseInt(interval, 10) * units[unit] * 1000 * 1000;
}

function lookbackToTimestamp(lookback, from) {
  return (
    from - getIntervalUnix(lookback)
  );
}

function submitForm(fields, fetchRequestToNode) {
  const { node, service, lookback } = fields;

  let unit = null;
  const units = ['m', 'h', 'd'];
  let lb = '1h';
  if (lookback) {
    unit = lookback.substr(-1);
    if (units.indexOf(unit) >= 0 && parseInt(lookback, 10) + unit === lookback) lb = lookback;
  }

  const now = new Date();
  const start = lookbackToTimestamp(lb, now);
  const end = now * 1000 * 1000;
  store.set('lastNodeSearch', { node, service, start, lookback: lb });

  fetchRequestToNode({
    node,
    service,
    start,
    end,
  });
}

export class NodeFormImpl extends React.PureComponent {
  render() {
    const { handleSubmit, nodeList, selectedNode = '-' } = this.props;
    const disabled = false;
    const setNode = nodeList.find(node => node.node === selectedNode);
    const servicesOnNode = (setNode && setNode.services) || [];
    const neutralState = selectedNode === '-' || !selectedNode;

    return (
      <Form layout="vertical" onSubmit={handleSubmit}>
        <FormItem
          label={
            <span>
              Nodes <span className="NodeForm--labelCount">({nodeList.length})</span>
            </span>
          }
        >
          <Field
            name="node"
            component={AdaptedVirtualSelect}
            placeholder="Select A Node"
            props={{
              disabled,
              clearable: false,
              required: true,
              options: nodeList.map(v => ({ label: v.node, value: v.node })),
            }}
          />
        </FormItem>
        <FormItem
          label={
            <span>
              services{' '}
              <span className="NodeForm--labelCount">({servicesOnNode ? servicesOnNode.length : 0})</span>
            </span>
          }
        >
          <Field
            name="service"
            component={AdaptedVirtualSelect}
            placeholder="Select A Service"
            props={{
              disabled: disabled || neutralState,
              clearable: false,
              required: true,
              options: ['all'].concat(servicesOnNode).map(v => ({ label: v, value: v, title: v })),
            }}
          />
        </FormItem>
        <FormItem
          label={
            <span>
              lookback <span className="NodeForm--labelCount" />
            </span>
          }
        >
          <Field
            name="lookback"
            component={AdaptedInput}
            placeholder="number + unit(m:minute, h:hour, d:day)"
            props={{ disabled, defaultValue: '1h' }}
          />
        </FormItem>
        <Button htmlType="submit" disabled={disabled || neutralState}>
          Get Requests
        </Button>
      </Form>
    );
  }
}

NodeFormImpl.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  nodeList: PropTypes.arrayOf(PropTypes.string),
  selectedNode: PropTypes.string,
};

NodeFormImpl.defaultProps = {
  nodeList: [],
  selectedNode: null,
};

export function mapStateToProps(state) {
  const { node, service } = queryString.parse(state.router.location.search);

  const lastNodeSearch = store.get('lastNodeSearch');
  let lastNode;
  let lastService;
  if (lastNodeSearch) {
    const { node: lastFormNode, service: lastFormService } = lastNodeSearch;
    if (lastFormNode && lastFormNode !== '-') {
      if (state.nodes.nodes.includes(lastFormNode)) {
        lastNode = lastFormNode;
        if (lastFormService && lastFormService !== '-') {
          const serv = state.nodes.services[node];
          if (lastFormService === 'all' || (serv && serv.includes(lastFormService))) {
            // include is not define in mapProp
            lastService = lastFormService;
          }
        }
      }
    }
  }

  return {
    destroyOnUnmount: false,
    initialValues: {
      node: node || lastNode || '-',
      service: service || lastService || 'all',
    },
    selectedNode: formValueSelector('nodesSideBar')(state, 'node'),
  };
}

function mapDispatchToProps(dispacth) {
  const { fetchRequestToNode } = bindActionCreators(jaegerApiActions, dispacth);
  return {
    onSubmit: fields => submitForm(fields, fetchRequestToNode),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(
  reduxForm({
    form: 'nodesSideBar',
  })(NodeFormImpl)
); // このあたりで default undefined
