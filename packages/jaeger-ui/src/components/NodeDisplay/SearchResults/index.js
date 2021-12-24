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
import PropTypes from 'prop-types';
import { Menu, Table } from 'antd';
import ResultGraph from './ResultGraph';

import LoadingIndicator from '../../common/LoadingIndicator';
import './index.css';
import { ONE_MILLISECOND } from '../../../utils/date';

export class SearchResultImpl extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedKey: 'status',
      selectedMenu: 'allRequest',
    };
  }

  handleMenuSelect = e => {
    this.setState({
      selectedMenu: e.key,
    });
  };

  handleSelect = e => {
    this.setState({
      selectedKey: e.key,
    });
  };

  render() {
    const {  start, lookback, request, status, tableData, loading, statusKeys } = this.props;
    const { selectedKey, selectedMenu } = this.state;
    console.log(start);
    console.log(lookback);
    console.log(request);
    console.log(status);
    const columns = [
      {
        title: 'Operation Name',
        dataIndex: 'opName',
        key: 'opName',
      },
      {
        title: 'Number of Request',
        dataIndex: 'NoR',
        key: 'NoR',
      },
      {
        title: 'Number of Success Request',
        dataIndex: 'Success',
        key: 'Success',
      },
      {
        title: 'Number of Failed Request',
        dataIndex: 'Failed',
        key: 'Failed',
      },
      {
        title: 'Max Response Time',
        dataIndex: 'Max',
        key: 'Max',
      },
      {
        title: 'Min Response Time',
        dataIndex: 'Min',
        key: 'Min',
      },
      {
        title: 'Average Response Time',
        dataIndex: 'Average',
        key: 'Average',
      },
    ];

    let overallAve = 0;
    let overallMin = Infinity;
    let overallMax = -Infinity;
    let overallFailCount = 0;
    let overallSuccessCount = 0;
    const data = [].concat(tableData.operations).map((operation, i) => {
      const max = tableData.sum[i].max;
      const min = tableData.sum[i].min;
      const average = tableData.sum[i].average;
      const failed = tableData.sum[i].failCount;
      const success = tableData.sum[i].successCount;
      if (overallMax < max) overallMax = max;
      if (overallMin > min) overallMin = min;
      overallAve += average;
      overallFailCount += failed;
      overallSuccessCount += success;
      return {
        key: i,
        opName: operation,
        NoR: success + failed,
        Success: success,
        Failed: failed,
        Max: `${max / ONE_MILLISECOND}ms`,
        Min: `${min / ONE_MILLISECOND}ms`,
        Average: `${Math.round(average) / ONE_MILLISECOND}ms`,
      };
    });
    data.push({
      key: data.length,
      opName: 'Overall',
      NoR: overallSuccessCount + overallFailCount,
      Success: overallSuccessCount,
      Failed: overallFailCount,
      Max: overallMax === -Infinity ? '0ms' : `${overallMax / ONE_MILLISECOND}ms`,
      Min: overallMin === Infinity ? '0ms' : `${overallMin / ONE_MILLISECOND}ms`,
      Average: overallAve === 0 ? '0ms' : `${Math.round(overallAve) / (data.length * ONE_MILLISECOND)}ms`,
    });

    if (loading) {
      return (
        <React.Fragment>
          <LoadingIndicator className="u-mt-vast" centered />
        </React.Fragment>
      );
    }
    return (
      <div className="SearchResults">
        <div className="SearchResult--display">
          <div className="SearchResults--disMenu">
            <Menu onSelect={this.handleMenuSelect} defaultSelectedKeys={selectedMenu} mode="horizontal">
              <Menu.Item key="allRequest">Describe all request</Menu.Item>
              <Menu.Item key="successRequest">Pick up success request</Menu.Item>
              <Menu.Item key="failedRequest">Pick up failed request</Menu.Item>
            </Menu>
          </div>
          <div className="SearchResults--disKeys">
            <Menu onSelect={this.handleSelect} defaultSelectedKeys={selectedKey} mode="horizontal">
              {statusKeys.map(key => {
                return <Menu.Item key={key}>{key}</Menu.Item>;
              })}
            </Menu>
          </div>
        </div>

        <div className="SearchResults--graph">
          <ResultGraph
            request={request}
            status={status}
            start={start}
            lookback={lookback}
            operationNames={tableData.operations}
            statusKey={selectedKey}
            graphMenu={selectedMenu}
           />
        </div>
        <div className="SearchResults--tables">
          <Table columns={columns} dataSource={data} />
        </div>
      </div>
    );
  }
}

SearchResultImpl.propTypes = {
  lookback: PropTypes.string,
  start: PropTypes.number,
  request: PropTypes.arrayOf(PropTypes.string),
  status: PropTypes.arrayOf(PropTypes.string),
  tableData: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool,
  statusKeys: PropTypes.arrayOf(PropTypes.string),
};
SearchResultImpl.defaultProps = {
  lookback: null,
  start: null,
  request: [],
  status: [],
  tableData: [],
  loading: false,
  statusKeys: [],
};

export default SearchResultImpl;
