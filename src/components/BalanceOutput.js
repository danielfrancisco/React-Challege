import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';
import userInput from '../reducers/userInput';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];
  
  function mergeByKey(arr1, arr2, key) {
  const map = new Map();

  for (const obj of arr1) {
    map.set(obj[key], { ...obj });
  }

  for (const obj of arr2) {
    const k = obj[key];
    if (map.has(k)) {
      map.set(k, { ...map.get(k), ...obj });
    } else {
      map.set(k, { ...obj });
    }
  }

  return Array.from(map.values());
}

const merged = mergeByKey(state.accounts, state.journalEntries, 'ACCOUNT');
merged.sort((a, b) => a.ACCOUNT - b.ACCOUNT);

const dates = [...merged]

function populateDatesArray(){
   for(let i in merged){
   dates.push(new Date (merged[i].PERIOD))
 }
}
populateDatesArray()

function getLatestOrOldestDate(dates, period) {
  if (!Array.isArray(dates) || dates.length === 0) return null;

  const timestamps = dates
    .map(d => new Date(d).getTime())
    .filter(ts => !isNaN(ts));

  if (timestamps.length === 0) return null;
  
  const latestOrOldest = period==='latest'?Math.max(...timestamps): 
  period==='oldest'?Math.min(...timestamps):null;
  
  return new Date(latestOrOldest);
}

const oldestDate = getLatestOrOldestDate(dates, 'oldest')
const latestDate = getLatestOrOldestDate(dates, 'latest')
const firstAccount = merged[0]
const lastAccount = merged[merged.length-1]

//false console.log("date",!isNaN(new Date(state.userInput.startPeriod)));
//true console.log(Number.isNaN(state.userInput.startAccount))

//false console.log("date",!isNaN(new Date(state.userInput.endPeriod)));
//true console.log(Number.isNaN(state.userInput.endAccount))

balance = merged.map(acc=>
    acc.ACCOUNT>=state.userInput.startAccount && acc.ACCOUNT<=state.userInput.endAccount&&
    new Date(acc.PERIOD)>=new Date(state.userInput.startPeriod) && 
    new Date(acc.PERIOD)<=new Date(state.userInput.endPeriod)?
  ({
  ACCOUNT: acc.ACCOUNT,
   DESCRIPTION: acc.LABEL,
   DEBIT:  acc.DEBIT || 0,
   CREDIT:  acc.CREDIT || 0,
   BALANCE: (acc.DEBIT || 0) - (acc.CREDIT || 0)
}): ""
  
).filter(entry => entry !== "");

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
