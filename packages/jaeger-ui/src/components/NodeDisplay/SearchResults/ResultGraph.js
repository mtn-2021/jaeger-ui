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
import dimensions from 'react-dimensions';
import { Bar } from 'react-chartjs-2';
// import moment from 'moment';
// import PropTypes from 'prop-types';
// import { ONE_MILLISECOND } from '../../../utils/date';

function getUintTime(time) {
  const unit = time.substr(-1);
  const units = {
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };
  return parseInt(time, 10) * units[unit] * 1000 * 1000;
}

// const colors = {
//   0: 'rgba(30, 144, 255, 1)',
//   1: 'rgba(144, 101, 224, 1)',
//   2: 'rgba(206, 101, 224, 1)',
//   3: 'rgba(160, 44, 47, 1)',
//   4: 'rgba(210, 83, 44, 1)',
// };

const UnitKeeper = {
  m: { format: '~hh:mm a', half: '30s', full: 'minute' },
  h: { format: '~MM/DD hh:mm a', underUnit: 'm', half: '30m', full: 'hour' },
  d: { format: '~MM/DD', underUnit: 'h', half: '12h', full: 'day' },
};

// function getIntervalTime(lookback) {
//   const unit = lookback.substr(-1);
//   const vol = parseInt(lookback, 10);
//   const interval = Math.floor(vol / 10);
//   if (interval !== 0) {
//     return {
//       time: getUintTime(interval + unit),
//       unit,
//       interval: interval + unit,
//     };
//   }
//   if (vol > 4) {
//     return {
//       time: getUintTime(UnitKeeper[unit].half),
//       unit: UnitKeeper[unit].underUnit,
//       interval: UnitKeeper[unit].half,
//     };
//   }
//   if (unit === 'd') {
//     return {
//       time: getUintTime(vol * 2 + UnitKeeper[unit].underUnit),
//       unit: UnitKeeper[unit].underUnit,
//       interval: vol * 2 + UnitKeeper[unit].underUnit,
//     };
//   }
//   if (unit === 'h') {
//     return {
//       time: getUintTime(vol * 5 + UnitKeeper[unit].underUnit),
//       unit: UnitKeeper[unit].underUnit,
//       interval: vol * 5 + UnitKeeper[unit].underUnit,
//     };
//   }
//   return {
//     time: getUintTime(1 + unit),
//     unit,
//     interval: 1 + unit,
//   };
// }

// function getLabelsAndData(lookback, start, request, operationNames, graphMenu) {
//   const lookbackTime = getUintTime(lookback);
//   const interval = getIntervalTime(lookback);
//   const format = UnitKeeper[interval.unit].format;
//   const intervalTime = interval.time;
//   const length = lookbackTime / intervalTime;
//   let requestLength = request.length - 1;
//   let time = start;
//   const labels = [];
//   const data = [];
//   const dataCount = [];
//
//   for (let i = 0; i <= length - 1; i++) {
//     const dataPart = [];
//     operationNames.forEach(operationName => {
//       dataPart[operationName] = 0;
//     });
//     let count = 0;
//
//     for (let l = requestLength; l >= 0; l--) {
//       if (request[l].startTime >= time && request[l].startTime < time + intervalTime) {
//         if (graphMenu === 'allRequest') {
//           count++;
//           dataPart[request[l].operationName] += 1;
//         } else if (graphMenu === 'failedRequest' && request[l].failed !== null) {
//           count++;
//           dataPart[request[l].operationName] += 1;
//         } else if (graphMenu === 'successRequest' && request[l].failed === null) {
//           count++;
//           dataPart[request[l].operationName] += 1;
//         }
//       } else {
//         requestLength = l;
//         break;
//       }
//     }
//
//     data.push(count);
//     for (let op = 0; op < operationNames.length; op++) {
//       const tmpCount = [].concat(dataCount[operationNames[op]]);
//       tmpCount.push(dataPart[operationNames[op]]);
//       dataCount[operationNames[op]] = tmpCount;
//     }
//
//     time += intervalTime;
//     const label = moment(time / ONE_MILLISECOND)
//       .format(format)
//       .split(' ');
//     labels.push(label);
//   }
//
//   let datasets = operationNames.map((operationName, index) => ({
//     type: 'bar',
//     data: [].concat(dataCount[operationName]).filter(v => !(v === undefined)),
//     label: operationName,
//     backgroundColor: colors[index],
//     yAxisID: 'y-bar',
//     xAxisID: 'x-bar',
//   }));
//   if (!(datasets && datasets.length > 0))
//     datasets = [
//       {
//         type: 'bar',
//         data,
//         label: 'Number of request',
//         yAxisID: 'y-bar',
//         xAxisID: 'x-bar',
//       },
//     ];
//
//   const max = data.reduce((a, b) => Math.max(a, b));
//   const maxData = 5 - (max % 5) + max;
//
//   return { labels, datasets, maxData, interval };
// }
//
// function getStatusPlot(status, yPlop) {
//   const statusData = [];
//   const missingData = [];
//   const statusFlag = yPlop === 'status';
//   let maxData = -Infinity;
//
//   status.forEach(stPart => {
//     if (stPart.isOn) {
//       const index = [].concat(stPart.keys).indexOf(yPlop);
//       if (index >= 0) {
//         const value = statusFlag ? 1 : parseInt(stPart.values[index], 10);
//         statusData.push({
//           operationName: stPart.operationName,
//           x: stPart.timestamp / ONE_MILLISECOND,
//           y: value,
//         });
//         if (maxData < value) maxData = value;
//       }
//     } else {
//       missingData.push({
//         operationName: stPart.operationName,
//         x: stPart.timestamp / ONE_MILLISECOND,
//         y: 0,
//       });
//     }
//   });
//
//   const datasets = [
//     {
//       type: 'scatter',
//       data: statusData,
//       label: yPlop,
//       backgroundColor: `rgba(117, 219, 219,1)`,
//       yAxisID: 'y-scat',
//       xAxisID: 'x-scat',
//     },
//     {
//       type: 'scatter',
//       data: missingData,
//       label: 'disConnect',
//       backgroundColor: `rgba(255, 15, 43, 1)`,
//       yAxisID: 'y-scat',
//       xAxisID: 'x-scat',
//     },
//   ];
//
//   let i;
//   for (i = 0; maxData > 100; i++) {
//     maxData /= 10;
//   }
//
//   maxData = Math.ceil(maxData) * 10 ** i;
//   if (maxData === -Infinity) maxData = 1;
//   return { datasets, maxData };
// }

function ResultGraphImpl(props) {
  console.log(props);
  // const { request, status, lookback: lb, start, operationNames, statusKey, graphMenu } = props;
  // let lookback;
  // let labels;
  // let datasets;
  // let xLabel;
  // let intervalUnit;
  // let minData;
  // let maxDataB;
  // let maxDataS;
  // console.log("before if");
  // if ((status && status.length > 0) || (request && request.length > 0)) {
  //   lookback = lb;
  //   const structure = getLabelsAndData(lookback, start, request, operationNames, graphMenu);
  //   const statusData = getStatusPlot(status, statusKey);
  //   labels = structure.labels;
  //   datasets = [].concat(statusData.datasets).concat(structure.datasets);
  //   xLabel = `Last ${parseInt(lookback, 10)} ${UnitKeeper[lookback.substr(-1)].full}`;
  //   intervalUnit = structure.interval;
  //   minData = 0;
  //   maxDataB = structure.maxData;
  //   maxDataS = statusData.maxData;
  // } else {
  //   lookback = '1h';
  //   console.log("before getData");
  //   const structure = getLabelsAndData(
  //     lookback,
  //     new Date() * 1000 - getUintTime(lookback),
  //     request,
  //     operationNames,
  //     graphMenu
  //   );
  //   console.log("before getPlot");
  //   const statusData = getStatusPlot(status, statusKey);
  //   labels = structure.labels;
  //   datasets = [].concat(statusData.datasets).concat(structure.datasets);
  //   xLabel = 'Last 1 hour';
  //   intervalUnit = structure.interval;
  //   minData = 0;
  //   maxDataB = 10;
  //   maxDataS = 1;
  // }
  console.log("after if");

  const graphData = {labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月'],
    datasets: [
      {
        label: 'Dataset',
        // データの値
        data: [65, 59, 80, 81, 56, 55, 40],
        // グラフの背景色
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(201, 203, 207, 0.2)',
        ],
        // グラフの枠線の色
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)',
          'rgb(201, 203, 207)',
        ],
        // グラフの枠線の太さ
        borderWidth: 1,
      },
    ],};
  // const graphData = {
  //   labels,
  //   datasets,
  // };
  // const graphOption = {
  //   legend: {
  //     display: true,
  //     labels: {
  //       filter: items => {
  //         return operationNames.indexOf(items.text) !== -1;
  //       },
  //     },
  //   },
  //   scales: {
  //     xAxes: [
  //       {
  //         id: 'x-bar',
  //         stacked: true,
  //         scaleLabel: {
  //           display: true,
  //           labelString: xLabel,
  //         },
  //       },
  //       {
  //         id: 'x-scat',
  //         scaleLabel: {
  //           display: false,
  //         },
  //         type: 'time',
  //         time: {
  //           parser: UnitKeeper[intervalUnit.unit].format,
  //         },
  //         ticks: {
  //           source: 'labels',
  //           min: start / ONE_MILLISECOND,
  //           max: (start + getUintTime(lookback)) / ONE_MILLISECOND,
  //         },
  //       },
  //     ],
  //     yAxes: [
  //       {
  //         id: 'y-bar',
  //         position: 'left',
  //         stacked: true,
  //         scaleLabel: {
  //           display: true,
  //           labelString: `Number of requests(/${intervalUnit.interval})`,
  //         },
  //         ticks: {
  //           beginAtZero: true,
  //           min: minData,
  //           max: maxDataB,
  //           callback: value => {
  //             return `${value}`;
  //           },
  //         },
  //       },
  //       {
  //         id: 'y-scat',
  //         position: 'right',
  //         scaleLabel: {
  //           display: true,
  //           labelString: `${statusKey}`,
  //         },
  //         ticks: {
  //           beginAtZero: true,
  //           min: minData,
  //           max: maxDataS,
  //         },
  //       },
  //     ],
  //   },
  // };
  console.log("after graph");
  console.log(graphData);
  // console.log(graphOption); options={graphOption}
  // return ( <div> <p2> Hello World!!!</p2> </div>);
  return (
     <div className="ResultGraph">
       <Bar data={graphData}  />
     </div>
   );
}

// ResultGraphImpl.propTypes = {
//   lookback: PropTypes.string,
//   start: PropTypes.number,
//   request: PropTypes.arrayOf(PropTypes.string),
//   status: PropTypes.arrayOf(PropTypes.string),
//   operationNames: PropTypes.arrayOf(PropTypes.string),
//   statusKey: PropTypes.string,
//   graphMenu: PropTypes.string,
// };
//
// ResultGraphImpl.defaultProps = {
//   lookback: null,
//   start: null,
//   request: [],
//   status: [],
//   operationNames: [],
//   statusKey: null,
//   graphMenu: null,
// };

export { ResultGraphImpl };
export default dimensions()(ResultGraphImpl);
