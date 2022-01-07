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

import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Bar }  from 'react-chartjs-2';
import 'chartjs-adapter-moment';
import { ONE_MILLISECOND } from '../../../utils/date';

function getUintTime(time) {
  const unit = time.substr(-1);
  const units = {
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };
  return parseInt(time, 10) * units[unit] * 1000 * 1000;
}

const colors = {
  0: 'rgba(30, 144, 255, 1)',
  1: 'rgba(144, 101, 224, 1)',
  2: 'rgba(206, 101, 224, 1)',
  3: 'rgba(160, 44, 47, 1)',
  4: 'rgba(210, 83, 44, 1)',
};

const UnitKeeper = {
  m: { format: '~hh:mm a', half: '30s', full: 'minute' },
  h: { format: '~MM/DD hh:mm a', underUnit: 'm', half: '30m', full: 'hour' },
  d: { format: '~MM/DD', underUnit: 'h', half: '12h', full: 'day' },
};

function getIntervalTime(lookback) {
  const unit = lookback.substr(-1);
  const vol = parseInt(lookback, 10);
  const interval = Math.floor(vol / 10);
  if (interval !== 0) {
    return {
      time: getUintTime(interval + unit),
      unit,
      interval: interval + unit,
    };
  }
  if (vol > 4) {
    return {
      time: getUintTime(UnitKeeper[unit].half),
      unit: UnitKeeper[unit].underUnit,
      interval: UnitKeeper[unit].half,
    };
  }
  if (unit === 'd') {
    return {
      time: getUintTime(vol * 2 + UnitKeeper[unit].underUnit),
      unit: UnitKeeper[unit].underUnit,
      interval: vol * 2 + UnitKeeper[unit].underUnit,
    };
  }
  if (unit === 'h') {
    return {
      time: getUintTime(vol * 5 + UnitKeeper[unit].underUnit),
      unit: UnitKeeper[unit].underUnit,
      interval: vol * 5 + UnitKeeper[unit].underUnit,
    };
  }
  return {
    time: getUintTime(1 + unit),
    unit,
    interval: 1 + unit,
  };
}

function getLabelsAndData(lookback, start, request, operationNames, graphMenu) {
  const lookbackTime = getUintTime(lookback);
  const interval = getIntervalTime(lookback);
  const format = UnitKeeper[interval.unit].format;
  const intervalTime = interval.time;
  const length = lookbackTime / intervalTime;
  let requestLength = request.length - 1;
  let time = start;
  const labels = [];
  const data = [];
  const dataCount = [];

  for (let i = 0; i <= length - 1; i++) {
    const dataPart = [];
    operationNames.forEach(operationName => {
      dataPart[operationName] = 0;
    });
    let count = 0;

    for (let l = requestLength; l >= 0; l--) {
      if (request[l].startTime >= time && request[l].startTime < time + intervalTime) {
        if (graphMenu === 'allRequest') {
          count++;
          dataPart[request[l].operationName] += 1;
        } else if (graphMenu === 'failedRequest' && request[l].failed !== null) {
          count++;
          dataPart[request[l].operationName] += 1;
        } else if (graphMenu === 'successRequest' && request[l].failed === null) {
          count++;
          dataPart[request[l].operationName] += 1;
        }
      } else {
        requestLength = l;
        break;
      }
    }

    data.push(count);
    for (let op = 0; op < operationNames.length; op++) {
      const tmpCount = [].concat(dataCount[operationNames[op]]);
      tmpCount.push(dataPart[operationNames[op]]);
      dataCount[operationNames[op]] = tmpCount;
    }

    time += intervalTime;
    const label = moment(time / ONE_MILLISECOND)
      .format(format)
      .split(' ');
    labels.push(label);
  }

  let datasets = operationNames.map((operationName, index) => ({
    type: 'bar',
    data: [].concat(dataCount[operationName]).filter(v => !(v === undefined)),
    label: operationName,
    backgroundColor: colors[index],
    yAxisID: 'yBar',
    xAxisID: 'xBar',
  }));
  if (!(datasets && datasets.length > 0))
    datasets = [
      {
        type: 'bar',
        data,
        label: 'Number of request',
        yAxisID: 'yBar',
        xAxisID: 'xBar',
      },
    ];

  const max = data.reduce((a, b) => Math.max(a, b));
  const maxData = 5 - (max % 5) + max;

  return { labels, datasets, maxData, interval };
}

function getStatusPlot(status, yPlop) {
  const statusData = [];
  const missingData = [];
  const statusFlag = yPlop === 'status';
  let maxData = -Infinity;

  status.forEach(stPart => {
    if (stPart.isOn) {
      const index = [].concat(stPart.keys).indexOf(yPlop);
      if (index >= 0) {
        const value = statusFlag ? 1 : parseInt(stPart.values[index], 10);
        statusData.push({
          operationName: stPart.operationName,
          x: stPart.timestamp / ONE_MILLISECOND,
          y: value,
        });
        if (maxData < value) maxData = value;
      }
    } else {
      missingData.push({
        operationName: stPart.operationName,
        x: stPart.timestamp / ONE_MILLISECOND,
        y: 0,
      });
    }
  });

  const datasets = [
    {
      type: 'scatter',
      data: statusData,
      label: yPlop,
      backgroundColor: `rgba(117, 219, 219,1)`,
      yAxisID: 'yScat',
      xAxisID: 'xScat',
    },
    {
      type: 'scatter',
      data: missingData,
      label: 'disConnect',
      backgroundColor: `rgba(255, 15, 43, 1)`,
      yAxisID: 'yScat',
      xAxisID: 'xScat',
    },
  ];

  let i;
  for (i = 0; maxData > 100; i++) {
    maxData /= 10;
  }

  maxData = Math.ceil(maxData) * 10 ** i;
  if (maxData === -Infinity) maxData = 1;
  return { datasets, maxData };
}

function ResultGraphImpl(props) {
  const { request, status, lookback: lb, start, operationNames, statusKey, graphMenu } = props;
  let lookback = '1h';
  let labels;
  let datasets;
  let xLabel= 'Last 1 hour';
  let intervalUnit;
  const minData = 0;
  let maxDataB = 10;
  let maxDataS = 1;
  // console.log(lb,graphMenu,operationNames);
  // console.log(request, status, statusKey);
  console.log(start);
  if ((status && status.length > 0) || (request && request.length > 0)) {
    lookback = lb;
    const structure = getLabelsAndData(lookback, start, request, operationNames, graphMenu);
    const statusData = getStatusPlot(status, statusKey);
    labels = structure.labels;
    datasets = [].concat(statusData.datasets).concat(structure.datasets);
    xLabel = `Last ${parseInt(lookback, 10)} ${UnitKeeper[lookback.substr(-1)].full}`;
    intervalUnit = structure.interval;
    maxDataB = structure.maxData;
    maxDataS = statusData.maxData;
  } else {
    const structure = getLabelsAndData(
      lookback,
      new Date() * 1000 - getUintTime(lookback),
      request,
      operationNames,
      graphMenu
    );
    const statusData = getStatusPlot(status, statusKey);
    labels = structure.labels;
    datasets = [].concat(statusData.datasets).concat(structure.datasets);
    intervalUnit = structure.interval;
  }

  const graphData = {
    labels,
    datasets,
  };
  const graphOption = {
    plugins: {
      legend: {
        labels: {
          filter: items => {
            return operationNames.indexOf(items.text) !== -1;
          },
        },
      },
    },
    scales: {
      xBar: {
        stacked: true,
        title: {
          display: true,
          text: `${xLabel}`,
        },
      },
      xScat: {
        display: true,
        min: `${start / ONE_MILLISECOND}`,
        max: `${(start + getUintTime(lookback)) / ONE_MILLISECOND}`,
        // suggestedMin: `${start / ONE_MILLISECOND}`,
        // suggestedMax: `${(start + getUintTime(lookback)) / ONE_MILLISECOND}`,
        type: 'time',
        time: {
          parser: `${UnitKeeper[intervalUnit.unit].format}`,
          // min: `${start / ONE_MILLISECOND}`,
          // max: `${(start + getUintTime(lookback)) / ONE_MILLISECOND}`,
        },
        ticks: {
          source: 'labels',
          // min: `${start / ONE_MILLISECOND}`,
          // max: `${(start + getUintTime(lookback)) / ONE_MILLISECOND}`,
        }
      },
      yBar: {
        position: 'left',
        stacked: true,
        min: `${minData}`,
        max: `${maxDataB}`,
        title: {
          display: true,
          text: `Number of requests(/${intervalUnit.interval})`,
        },
        ticks: {
          callback: value => { return `${value}`; },
        },
      },
      yScat: {
        position: 'right',
        min: `${minData}`,
        max: `${maxDataS}`,
        title: {
          display: true,
          text: `${statusKey}`,
        },
        ticks: {
          callback: value => { return `${value}`; },
        },
      },
    },
  };
  console.log(graphData,graphOption);
  return (
      <div>
        <Bar data={graphData} options={graphOption} />
      </div>
   );
}

ResultGraphImpl.propTypes = {
  lookback: PropTypes.string,
  start: PropTypes.number,
  request: PropTypes.arrayOf(PropTypes.string),
  status: PropTypes.arrayOf(PropTypes.string),
  operationNames: PropTypes.arrayOf(PropTypes.string),
  statusKey: PropTypes.string,
  graphMenu: PropTypes.string,
};

ResultGraphImpl.defaultProps = {
  lookback: null,
  start: null,
  request: [],
  status: [],
  operationNames: [],
  statusKey: null,
  graphMenu: null,
};

export default ResultGraphImpl;
