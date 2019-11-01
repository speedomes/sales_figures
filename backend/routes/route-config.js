const express = require('express');
const router = express.Router();
const moment = require('moment');
const Promise = require('promise');
const mysql = require('mysql');
const dateFormat = 'YYYY.MM.DD';

class Database {
  constructor(config) {
    this.connection = mysql.createPool(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          reject({"code" : 100, "message" : "Error connecting database"});
          return;
        }
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) {
          reject({"code" : 100, "message" : "Error connecting database"});
          return;
        }
        resolve();
      });
    });
  }
}

const database = new Database({
  connectionLimit : 5,
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PWD,
  database : process.env.MYSQL_DB_NAME,
  debug: false
});

router.post('/api/getDashboardData',(req, res, next) => {
  let dashboardQuery = `SELECT sum(d.sold) as sold, sum(d.pulled) as pulled,
    sum(d.newclients) as newClients, FORMAT(sum(d.credit), 2) as credit,
    sum(d.inuse) as interviews, sum(d.t1) as day1, sum(d.t2) as day2,
    FORMAT((sum(d.t2)/sum(d.t1))*100, 2) as percentage
    from daily as d join reps as r on d.rep_id = r.id 
    join office as o on r.office_id = o.id where`;

  let holidayQuery = `SELECT count(d.sold) as holidays from daily as d
    join reps as r on d.rep_id = r.id join office as o on r.office_id = o.id
    where sold=-1`;

  if(req.body.office !== null) {
    dashboardQuery += ` o.id='${req.body.office}' and`;
    holidayQuery += ` and o.id='${req.body.office}'`;
  }

  if(req.body.rep !== null) {
    dashboardQuery += ` r.id='${req.body.rep}' and`;
    holidayQuery += ` and r.id='${req.body.rep}'`;
  }

  if(req.body.year !== '') {
    const dateObj = moment().isoWeekYear(parseInt(req.body.year)).toDate();
    let startDate = moment(dateObj).startOf('year').format(dateFormat);
    let endDate = moment(dateObj).endOf('year').format(dateFormat);

    if(req.body.month !== '') {
      startDate = moment(dateObj).month(req.body.month-1).startOf('month').format(dateFormat);
      endDate = moment(dateObj).month(req.body.month-1).endOf('month').format(dateFormat);
      
      if(req.body.week !== '') {
        let monthStart = moment(dateObj).month(req.body.month-1).startOf('month').startOf('isoWeek').isoWeekday('Tuesday');
        if(monthStart.month() < req.body.month-1) {
          monthStart = monthStart.add(7, 'days');
        }

        let monthEnd = moment(dateObj).month(req.body.month).startOf('month').isoWeekday('Monday');
        if(monthEnd.month() === req.body.month-1) {
          monthEnd = monthEnd.add(7, 'days');
        }

        const dashboardPromiseArray = [];
        const holidayQueryPromiseArray = [];
        let dailyData = [];
        let holidaysData = [];
        const weekArray = [];
        const noOfWeeks = Math.ceil(monthEnd.clone().diff(monthStart, 'days')/ 7);

        for(let count=0; count < noOfWeeks; count++) {
          const start = monthStart.clone().add(count*7, 'days');
          if(count === (noOfWeeks -1)) {
            weekArray.push({ 
              start: start,
              end: monthEnd.clone()
            });
          } else {
            weekArray.push({
              start: start,
              end: monthStart.clone().add((count*7)+ 6, 'days')
            });
          }
        }

        startDate = weekArray[req.body.week - 1].start;
        endDate = weekArray[req.body.week - 1].end;

        for (let count=0; count<= endDate.diff(startDate, 'days'); count++) {
          const filterDate = startDate.clone().add(count, 'days').format(dateFormat);
          const weekQuery = dashboardQuery + ` date='${filterDate}'`;

          dashboardPromiseArray.push(database.query(weekQuery)
            .then(rows => {
              dailyData = rows[0];
              dailyData['duration'] = filterDate;
              dailyData['startDateOffset'] = count + 1;
              return dailyData;
            })
          );

          let hQuery = '';
          hQuery = holidayQuery + ` and date='${filterDate}'`;

          holidayQueryPromiseArray.push(database.query(hQuery)
            .then(rows => {
              holidaysData = rows[0];
              holidaysData['day'] = filterDate;
              holidaysData['startDateOffset'] = count + 1;
              return holidaysData;
            })
          );
        }

        Promise.all(dashboardPromiseArray).then(dailyDataCollection => {
          dailyData = dailyDataCollection.sort((a, b) => {
            return (a.startDateOffset - b.startDateOffset);
          });
        });

        Promise.all(holidayQueryPromiseArray).then(holidaysCollection => {
          holidaysData = holidaysCollection.sort((a, b) => {
            return (a.startDateOffset - b.startDateOffset);
          });

          dailyData.forEach((data, index) => {
            data['holidays'] = holidaysData[index].holidays;
          });

          res.status(201).json({
            message: 'Dashboard data fetched successfully',
            dashboardData: dailyData,
            durationType: 'Day'
          });
        });
      } else {
        const dashboardPromiseArray = [];
        let weekStart = moment(dateObj).month(req.body.month-1).startOf('month').isoWeekday('Tuesday');
        let weekEnd = moment(dateObj).month(req.body.month-1).startOf('month').add(6, 'days');
        let monthEnd = moment(dateObj).month(req.body.month).startOf('month').isoWeekday('Monday');
        let isMonthEnd = true;
        let weekNo = 1;
        let weeklyData = [];
        let holidaysData = [];
        const holidayQueryPromiseArray = [];

        startDate = weekStart;
        endDate = weekEnd;

        while(isMonthEnd) {
          const start = startDate.format(dateFormat);
          const end = endDate.format(dateFormat);
          const weekQuery = dashboardQuery + ` date<='${end}' and date>='${start}'`;
          const week = weekNo;
          
          dashboardPromiseArray.push(database.query(weekQuery)
            .then(rows => {
              weeklyData = rows[0];
              weeklyData['duration'] = week;
              return weeklyData;
            })
          );

          let hQuery = '';
          hQuery = holidayQuery + ` and date<='${end}' and date>='${start}'`;

          holidayQueryPromiseArray.push(database.query(hQuery)
            .then(rows => {
              holidaysData = rows[0];
              holidaysData['week'] = week;
              return holidaysData;
            })
          );

          const diff = monthEnd.diff(endDate, 'days');
          if(diff <= 0) {
            isMonthEnd = false;
            break;
          } else if(diff > 0 && diff < 7) {
            endDate = endDate.add(diff, 'days');
            weekNo++;
          } else {
            endDate = endDate.add(7, 'days');
            weekNo++;
          }
          startDate = startDate.add(7, 'days');
        }

        Promise.all(dashboardPromiseArray).then(weeklyDataCollection => {
          weeklyData = weeklyDataCollection.sort((a, b) => {
            return (a.duration - b.duration);
          });
        });

        Promise.all(holidayQueryPromiseArray).then(holidaysCollection => {
          holidaysData = holidaysCollection.sort((a, b) => {
            return (a.week - b.week);
          });

          weeklyData.forEach((data, index) => {
            data['holidays'] = holidaysData[index].holidays;
          });

          res.status(201).json({
            message: 'Dashboard data fetched successfully',
            dashboardData: weeklyData,
            durationType: 'Week'
          });
        });
      }
    } else {
      const dashboardPromiseArray = [];
      for(let count=0; count <=11; count++) {
        let startDateOffset = moment(dateObj).month(count).startOf('month').day();
        startDateOffset = getStartDateOffset(startDateOffset);

        let endDateOffset = moment(dateObj).month(count).endOf('month').day();
        endDateOffset = getEndDateOffset(endDateOffset);

        const monthStart = moment(dateObj).month(count).startOf('month').add(startDateOffset, 'days').format(dateFormat);
        const monthEnd =  moment(dateObj).month(count).endOf('month').add(endDateOffset, 'days').format(dateFormat);

        const monthQuery = dashboardQuery + ` date<='${monthEnd}' and date>='${monthStart}'`;
        let monthlyData = [];

        dashboardPromiseArray.push(database.query(monthQuery)
          .then(rows => {
            monthlyData = rows[0];
            monthlyData['duration'] = count + 1;
            return monthlyData;
          })
        );
      }

      Promise.all(dashboardPromiseArray).then(monthlyDataCollection => {
        monthlyData = monthlyDataCollection.sort((a, b) => {
          return (a.duration - b.duration);
        });

        const holidayQueryPromiseArray = [];

        for (let count=0; count <=11; count++) {
          let startDateOffset = moment(dateObj).month(count).startOf('month').day();
          startDateOffset = getStartDateOffset(startDateOffset);

          let endDateOffset = moment(dateObj).month(count).endOf('month').day();
          endDateOffset = getEndDateOffset(endDateOffset);

          const monthStart = moment(dateObj).month(count).startOf('month').add(startDateOffset, 'days').format(dateFormat);
          const monthEnd =  moment(dateObj).month(count).endOf('month').add(endDateOffset, 'days').format(dateFormat);

          let hQuery = '';
          hQuery = holidayQuery + ` and date<='${monthEnd}' and date>='${monthStart}'`;
          let holidaysData = {};

          holidayQueryPromiseArray.push(database.query(hQuery)
            .then(rows => {
              holidaysData['month'] = count + 1;
              holidaysData['holidays'] = rows[0].holidays;
              return holidaysData;
            })
          );
        }

        Promise.all(holidayQueryPromiseArray).then(holidaysCollection => {
          holidaysData = holidaysCollection.sort((a, b) => {
            return (a.month - b.month);
          });

          monthlyData.forEach((data, index) => {
            data['holidays'] = holidaysData[index]['holidays'];
          });

          res.status(201).json({
            message: 'Dashboard data fetched successfully',
            dashboardData: monthlyData,
            durationType: 'Month'
          });
        })
        .catch(err => {
          next(err); 
        });
      })
      .catch(err => {
        next(err); 
      });
    }
    dashboardQuery += ` date<='${endDate}' and date>='${startDate}'`;
  } else {
    const dashboardPromiseArray = [];
    req.body.years.forEach((yearObj, index) => {
      const year = yearObj.year;
      const dateObj = moment().isoWeekYear(parseInt(year)).toDate();
      startDate =  moment(dateObj).startOf('year').startOf('isoWeek').isoWeekday('Tuesday');
        if(startDate.year() < year) {
          startDate = startDate.add(7, 'days');
        }

      endDate = moment(moment().isoWeekYear(parseInt(year+1)).toDate()).startOf('year').isoWeekday('Monday');
      if(endDate.year() === year) {
        endDate = endDate.add(7, 'days');
      }
      const yearQuery = dashboardQuery + ` date<='${endDate.format(dateFormat)}' and date>='${startDate.format(dateFormat)}'`;
      let hQuery = '';
      hQuery = holidayQuery + ` and date<='${endDate.format(dateFormat)}' and date>='${startDate.format(dateFormat)}'`;

      let yearlyData = [];

      dashboardPromiseArray.push(database.query(yearQuery)
        .then(rows => {
          yearlyData = rows[0];
          yearlyData['duration'] = year;
          return database.query(hQuery);
        })
        .then(rows => {
          yearlyData['holidays'] = rows[0].holidays;
          return yearlyData;
        })
      );
    });

    Promise.all(dashboardPromiseArray).then(dataCollection => {
      res.status(201).json({
        message: 'Dashboard data fetched successfully',
        dashboardData: dataCollection,
        durationType: 'Year'
      });
    })
    .catch(err => {
      next(err); 
    });
  }
});

router.get('/api/getYears',(req, res) => {
  database.query('SELECT YEAR(date) AS year FROM daily GROUP BY YEAR(date)')
  .then (data => {
    res.status(201).json({
    message: 'Years fetched successfully',
    yearData: data
    });
  })
  .catch(err => {
    next(err); 
  });
});

router.post('/api/getReport',(req, res, next) => {
  const sDate = moment().isoWeekYear(parseInt(req.body.year)).isoWeekday('Tuesday').isoWeek(parseInt(req.body.week)).toDate();
  const eDate = moment().isoWeekYear(parseInt(req.body.year)).isoWeekday('Monday').isoWeek(parseInt(req.body.week) + 1).toDate();
  const weekStartDate = moment(sDate).format(dateFormat);
  const weekEndDate = moment(eDate).format(dateFormat);
  const monthStartDate = moment(sDate).startOf('month').format(dateFormat);
  const monthEndDate = moment(eDate).endOf('month').format(dateFormat);
  const yearStartDate = moment(sDate).startOf('year').format(dateFormat);
  const yearEndDate = moment(eDate).endOf('year').format(dateFormat);

  const wPulledQuery = `select sum(d.pulled) as wData, r.name as repName, 
  o.name as officeName, r.id as repId 
  from daily as d JOIN reps as r on d.rep_id=r.id JOIN office as o on r.office_id=o.id WHERE 
  d.date<='${weekEndDate}' AND d.date>='${weekStartDate}'
  GROUP BY d.rep_id ORDER BY wData DESC`;

  let pulledPromiseArray = [];
  let reportData = {};

  database.query(wPulledQuery)
  .then (rows => {
      rows.forEach((row) => {
      pulledPromiseArray.push(
          database.query(`select sum(d.pulled) as mData from daily as d JOIN reps as r on d.rep_id=r.id 
          WHERE d.date<='${monthEndDate}' AND d.date>='${monthStartDate}'
          AND r.id = '${row.repId}'`)
          .then (rows => {
          row.mData = rows[0].mData;
          return database.query(`select sum(d.pulled) as yData from daily as d JOIN reps as r on d.rep_id=r.id 
          WHERE d.date<='${yearEndDate}' AND d.date>='${yearStartDate}'
          AND r.id = '${row.repId}'`);
          }, err => {
          return database.close().then(() => { throw err; })
          })
          .then (rows => {
          row.yData = rows[0].yData;
          return row;
          }, err => {
          return database.close().then(() => { throw err; })
          })
      );
      })
      
      Promise.all(pulledPromiseArray).then((data) => {
      reportData.pulledData = data;
      let newClientsPromiseArray = [];
      const wNewClientsQuery = `select sum(d.newclients) as wData, r.name as repName,
          o.name as officeName, r.id as repId
          from daily as d JOIN reps as r on d.rep_id=r.id JOIN office as o on r.office_id=o.id WHERE
          d.date<='${weekEndDate}' AND d.date>='${weekStartDate}'
          GROUP BY d.rep_id ORDER BY wData DESC`;

      database.query(wNewClientsQuery)
      .then (rows => {
          rows.forEach((row) => {
          newClientsPromiseArray.push(
              database.query(`select sum(d.newclients) as mData from daily as d JOIN reps as r on d.rep_id=r.id 
              WHERE d.date<='${monthEndDate}' AND d.date>='${monthStartDate}'
              AND r.id = '${row.repId}'`)
              .then (rows => {
              row.mData = rows[0].mData;
              return database.query(`select sum(d.newclients) as yData from daily as d JOIN reps as r on d.rep_id=r.id 
              WHERE d.date<='${yearEndDate}' AND d.date>='${yearStartDate}'
              AND r.id = '${row.repId}'`);
              }, err => {
              return database.close().then(() => { throw err; })
              })
              .then (rows => {
              row.yData = rows[0].yData;
              return row;
              }, err => {
              return database.close().then(() => { throw err; })
              })
          );
          })
          
          Promise.all(newClientsPromiseArray).then((data) => {
          reportData.newClientsData = data;
          res.status(201).json({
              message: 'Report data fetched successfully',
              pulledData: reportData.pulledData,
              newClientsData: reportData.newClientsData
          });
          });
      });
      });
  },err => {
      return database.close().then(() => { throw err; })
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/getDailyData',(req, res, next) => {
  const startLimit = parseInt(req.body.startLimit);
  const endLimit = parseInt(req.body.endLimit);
  const dailyDataQuery = `SELECT d.date, o.name as officeName, d.rep_id as repId, v.name as vehicleName, 
  d.sold, d.pulled, d.newclients as newClients, d.credit, d.balance, d.unused, d.inuse, d.t1, d.t2, d.st, 
  r.name as repName FROM daily as d join reps as r on d.rep_id = r.id 
  join office as o on r.office_id = o.id join vehicle as v on d.vehicle_id = v.id LIMIT ${startLimit},${endLimit}`;

  database.query(dailyDataQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Daily data fetched successfully',
      dailyData: rows
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/getDailyDataByFilter',(req, res, next) => {
  const startLimit = parseInt(req.body.startLimit);
  const endLimit = parseInt(req.body.endLimit);
  
  let dailyDataQuery = `SELECT d.date, o.name as officeName, d.rep_id as repId, v.name as vehicleName, 
  d.sold, d.pulled, d.newclients as newClients, d.credit, d.balance, d.unused, d.inuse, d.t1, d.t2, d.st, 
  r.name as repName FROM daily as d join reps as r on d.rep_id = r.id 
  join office as o on r.office_id = o.id join vehicle as v on d.vehicle_id = v.id`;

  if(req.body.year !== '') {
    const dateObj = moment().isoWeekYear(parseInt(req.body.year)).toDate();

    if (req.body.month !== '') {
      let startDateOffset = moment(dateObj).month(req.body.month-1).startOf('month').day();
      startDateOffset = getStartDateOffset(startDateOffset);

      let endDateOffset = moment(dateObj).month(req.body.month-1).endOf('month').day();
      endDateOffset = getEndDateOffset(endDateOffset);

      let monthStart = moment(dateObj).month(req.body.month-1).startOf('month').add(startDateOffset, 'days').format(dateFormat);
      let monthEnd =  moment(dateObj).month(req.body.month-1).endOf('month').add(endDateOffset, 'days').format(dateFormat);

      dailyDataQuery += ` WHERE d.date<='${monthEnd}' AND d.date>='${monthStart}' ORDER BY d.date LIMIT ${startLimit},${endLimit}`;

      database.query(dailyDataQuery)
      .then (rows => {
        res.status(201).json({
          message: 'Filtered daily data fetched successfully',
          dailyData: rows
        });
      })
      .catch(err => {
        next(err); 
      });
    } else {
      let startDateOffset = moment(dateObj).startOf('year').day();
      startDateOffset = getStartDateOffset(startDateOffset);

      let endDateOffset = moment(dateObj).endOf('year').day();
      endDateOffset = getEndDateOffset(endDateOffset);

      let yearStart = moment(dateObj).startOf('year').add(startDateOffset, 'days').format(dateFormat);
      let yearEnd =  moment(dateObj).endOf('year').add(endDateOffset, 'days').format(dateFormat);

      dailyDataQuery += ` WHERE d.date<='${yearEnd}' AND d.date>='${yearStart}' ORDER BY d.date LIMIT ${startLimit},${endLimit}`;

      database.query(dailyDataQuery)
      .then (rows => {
        res.status(201).json({
          message: 'Filtered daily data fetched successfully',
          dailyData: rows
        });
      })
      .catch(err => {
        next(err); 
      });
    }
  }
});

router.post('/api/getScopeData',(req, res, next) => {
  const startLimit = parseInt(req.body.startLimit);
  const endLimit = parseInt(req.body.endLimit);
  let scopeDataQuery = `SELECT d.date, d.sold, d.pulled, d.newclients as newClients, d.credit, d.inuse, d.t1 as day1, d.t2 as day2, d.rep_id as repId, r.name as repName,
    v.name as vehicle, d.balance, o.name as officeName
    FROM daily AS d JOIN reps AS r ON d.rep_id = r.id JOIN vehicle AS v ON d.vehicle_id = v.id JOIN office AS o ON r.office_id = o.id WHERE`;
  let splitDataQuery = `SELECT SUM(cash) as cash, SUM(cards) as cards FROM split WHERE`;

  let scopeData = {};

  if(req.body.office !== null && req.body.office !== '') {
    scopeDataQuery += ` r.office_id='${req.body.office}' AND`;
    splitDataQuery += ` office_id='${req.body.office}' AND`;
  }

  if(req.body.rep !== null && req.body.rep !== '') {
    scopeDataQuery += ` d.rep_id='${req.body.rep}' AND`;
  }

  if(req.body.year !== '') {
    const dateObj = moment().isoWeekYear(parseInt(req.body.year)).toDate();
    if (req.body.month !== '') {
      if (req.body.week !== '') {
        let startDateOffset = moment(dateObj).month(req.body.month-1).startOf('month').day();
        startDateOffset = getStartDateOffset(startDateOffset);

        let endDateOffset = moment(dateObj).month(req.body.month-1).endOf('month').day();
        endDateOffset = getEndDateOffset(endDateOffset);

        let monthStart = moment(dateObj).month(req.body.month-1).startOf('month').add(startDateOffset, 'days');
        let monthEnd =  moment(dateObj).month(req.body.month-1).endOf('month').add(endDateOffset, 'days');
        const noOfWeeks = Math.ceil(monthEnd.clone().diff(monthStart, 'days')/ 7);
        const weekArray = [];

        for(let count=0; count < noOfWeeks; count++) {
          const start = monthStart.clone().add(count*7, 'days');
          if(count === (noOfWeeks -1)) {
            weekArray.push({ 
              start: start,
              end: monthEnd.clone()
            });
          } else {
            weekArray.push({
              start: start,
              end: monthStart.clone().add((count*7)+ 6, 'days')
            });
          }
        }

        weekStart = weekArray[req.body.week - 1].start.format(dateFormat);
        weekEnd = weekArray[req.body.week - 1].end.format(dateFormat);

        scopeDataQuery += ` d.date<='${weekEnd}' AND d.date>='${weekStart}' ORDER BY d.date`;
        splitDataQuery += ` date<='${weekEnd}' AND date>='${weekStart}'`;
      } else {
        let startDateOffset = moment(dateObj).month(req.body.month-1).startOf('month').day();
        startDateOffset = getStartDateOffset(startDateOffset);

        let endDateOffset = moment(dateObj).month(req.body.month-1).endOf('month').day();
        endDateOffset = getEndDateOffset(endDateOffset);

        let monthStart = moment(dateObj).month(req.body.month-1).startOf('month').add(startDateOffset, 'days').format(dateFormat);
        let monthEnd =  moment(dateObj).month(req.body.month-1).endOf('month').add(endDateOffset, 'days').format(dateFormat);

        scopeDataQuery += ` d.date<='${monthEnd}' AND d.date>='${monthStart}' ORDER BY d.date`;
        splitDataQuery += ` date<='${monthEnd}' AND date>='${monthStart}'`;
      }
    } else {
      let startDateOffset = moment(dateObj).startOf('year').day();
      startDateOffset = getStartDateOffset(startDateOffset);

      let endDateOffset = moment(dateObj).endOf('year').day();
      endDateOffset = getEndDateOffset(endDateOffset);

      let yearStart = moment(dateObj).startOf('year').add(startDateOffset, 'days').format(dateFormat);
      let yearEnd =  moment(dateObj).endOf('year').add(endDateOffset, 'days').format(dateFormat);

      scopeDataQuery += ` d.date<='${yearEnd}' AND d.date>='${yearStart}' ORDER BY d.date`;
      splitDataQuery += ` date<='${yearEnd}' AND date>='${yearStart}'`;
    }

    scopeDataQuery += ` LIMIT ${startLimit},${endLimit}`;

    database.query(scopeDataQuery)
    .then (rows => {
      let totalPulled = 0;
      let totalNewClients = 0;
      let totalCredit = 0;
      let totalVehicles = 0;
      rows.forEach((row) => {
        totalPulled += row.pulled;
        totalNewClients += row.newClients;
        totalCredit += row.credit;
        totalVehicles++;
      });
      scopeData.data = rows;
      scopeData.totalPulled = totalPulled;
      scopeData.totalNewClients = totalNewClients;
      scopeData.totalCredit = totalCredit;
      scopeData.totalVehicles = totalVehicles;

      database.query(splitDataQuery)
      .then (rows => {
        scopeData.cash = rows[0].cash;
        scopeData.cards = rows[0].cards;
        res.status(201).json({
          message: 'Scope data fetched successfully',
          scopeData: scopeData
        });
      })
      .catch(err => {
        next(err); 
      });
    })
    .catch(err => {
      next(err); 
    });
  }
});

router.post('/api/checkRecord',(req, res, next) => {
  const recordQuery = `Select * from daily WHERE rep_id='${req.body.repId}' AND date='${req.body.date}'`;
  const officeRecordQuery = `Select sum(d.sold) as sold, sum(d.pulled) as pulled, sum(d.newclients) as newClients,
    sum(d.credit) as credit, sum(d.inuse) as inuse, sum(d.t1) as day1, sum(d.t2) as day2
    from daily AS d JOIN reps AS r ON d.rep_id = r.id JOIN office AS o ON r.office_id = o.id WHERE 
    o.id='${req.body.officeId}' AND d.date='${req.body.date}'`;
  const splitQuery = `SELECT id, cash, cards, viu FROM split WHERE office_id='${req.body.officeId}' AND date='${req.body.date}'`;

  database.query(recordQuery)
  .then (rows => {
    let repRecords = [];
    repRecords = rows;
    const repPromiseArray = [];

    if (repRecords.length > 0) {
      if(!repRecords[0].balance) {
        const balanceQuery = `Select balance from daily WHERE rep_id='${req.body.repId}' ORDER BY last_modified DESC`;
        repPromiseArray.push(database.query(balanceQuery)
          .then(rows => {
            repRecords[0].balance = rows[0].balance;
            return repRecords[0];
          })
        );
      }
  
      if(!repRecords[0].balanceb) {
        const balanceBQuery = `Select balanceb from daily WHERE rep_id='${req.body.repId}' ORDER BY last_modified DESC`;
        repPromiseArray.push(database.query(balanceBQuery)
          .then(rows => {
            repRecords[0].balanceb = rows[0].balanceb;
            return repRecords[0];
          })
        );
      }

      if(!repRecords[0].vehicle_id) {
        const vehicleQuery = `Select vehicle_id from daily WHERE rep_id='${req.body.repId}' ORDER BY last_modified DESC`;
        repPromiseArray.push(database.query(vehicleQuery)
          .then(rows => {
            repRecords[0].vehicle_id = rows[0].vehicle_id;
            return repRecords[0];
          })
        );
      }
    } else {
      const balanceQuery = `Select balance, balanceb, vehicle_id from daily WHERE rep_id='${req.body.repId}' ORDER BY last_modified DESC`;
      repPromiseArray.push(database.query(balanceQuery)
        .then(rows => {
          repRecords = rows[0];
          return repRecords;
        })
      );
    }

    Promise.all(repPromiseArray).then(dataCollection => {
      dataCollection = dataCollection.length > 0 ? dataCollection : repRecords;
      let officeRecords = [];
      let splitRecords = [];
      
      database.query(officeRecordQuery)
      .then(rows => {
        officeRecords = rows;
        database.query(splitQuery)
        .then (rows => {
          splitRecords = rows;
          res.status(201).json({
            message: 'Records fetched successfully',
            records: dataCollection,
            officeRecords: officeRecords,
            splitRecords: splitRecords
          });
        })
        .catch(err => {
          next(err); 
        });
      })
      .catch(err => {
        next(err); 
      });
    })
  })
  .catch(err => {
    next(err); 
  });
});

router.post('/api/addRecord',(req, res) => {
  const dateToFilter = moment(req.body.date).format(dateFormat);
  const addRecordQuery = `Insert daily(date, vehicle_id, sold, pulled, newclients, credit, balance, inuse, t1, t2, rep_id, balanceb, last_modified)
    VALUES ('${dateToFilter}', '${req.body.vehicleId}', '${req.body.sold}', '${req.body.pulled}', '${req.body.newClients}', '${req.body.credit}',
    '${req.body.balance}', '${req.body.inuse}', '${req.body.day1}', '${req.body.day2}', '${req.body.repId}', '${req.body.balanceB}', NOW())`;
  
  const updateRepTableQuery = `Update reps SET balance='${req.body.balance}', balanceb='${req.body.balanceB}', vehicle_id='${req.body.vehicleId}'
    WHERE id= '${req.body.repId}'`;

  database.query(addRecordQuery)
  .then (() => {
    database.query(updateRepTableQuery)
    .catch(err => {
      next(err); 
    });

    res.status(201).json({
      message: 'Record added successfully',
    });
  })
  .catch(err => {
    next(err); 
  });
});

router.post('/api/updateRecord',(req, res) => {
  const updateRecordQuery = `Update daily SET vehicle_id='${req.body.vehicleId}', sold='${req.body.sold}', pulled='${req.body.pulled}',
    newclients='${req.body.newClients}', credit='${req.body.credit}', balance='${req.body.balance}', inuse='${req.body.inuse}', 
    t1='${req.body.day1}', t2='${req.body.day2}', balanceb='${req.body.balanceB}', rep_id='${req.body.repId}', last_modified=NOW() WHERE id='${req.body.orderId}'`;

  const updateRepTableQuery = `Update reps  SET balance='${req.body.balance}', balanceb='${req.body.balanceB}', vehicle_id='${req.body.vehicleId}'
    WHERE id='${req.body.repId}'`;

  database.query(updateRecordQuery)
  .then (() => {
    database.query(updateRepTableQuery)
    .catch(err => {
      next(err); 
    });

    res.status(201).json({
      message: 'Record updated successfully',
    });
  })
  .catch(err => {
    next(err); 
  });
});

router.post('/api/saveSplit',(req, res) => {
  const dateToFilter = moment(req.body.date).format(dateFormat);
  const saveSplitQuery = `Insert split(date, office_id, cash, cards, viu) VALUES ('${dateToFilter}', ${req.body.officeId}, ${req.body.cash}, 
    ${req.body.cards}, ${req.body.viu})`;

  database.query(saveSplitQuery)
  .then (() => {
    res.status(201).json({
      message: 'Split record has been added successfully',
    });
  })
  .catch(err => {
    next(err); 
  });
});

router.post('/api/updateSplit',(req, res) => {
  const updateSplitQuery = `Update split  SET cash=${req.body.cash}, cards=${req.body.cards}, viu=${req.body.viu} WHERE id=${req.body.id}`;

  database.query(updateSplitQuery)
  .then (() => {
    res.status(201).json({
      message: 'Split record has been updated successfully',
    });
  })
  .catch(err => {
    next(err); 
  });
});

router.post('/api/getKPIData',(req, res) => {
  const getRKPIDataQuery = `SELECT sum(sold) as sold, sum(pulled) as pulled, sum(newclients) as newClients, sum(credit) as credit, sum(inuse) as inuse,
    sum(t1) as tra1, sum(t2) as tra2 from daily WHERE rep_id=${req.body.repId}`;
  
  const getOKPIDataQuery = `SELECT sum(d.sold) as sold, sum(d.pulled) as pulled, sum(d.newclients) as newClients, sum(d.credit) as credit,
    sum(d.inuse) as inuse, sum(d.t1) as tra1, sum(d.t2) as tra2 from daily as d join reps as r on d.rep_id=r.id join office as o on r.office_id=o.id
    WHERE o.id=${req.body.officeId}`;

  const totalRSoldQuery = `SELECT sum(sold) as sold from daily WHERE rep_id=${req.body.repId} AND sold<>-1`;
  const totalOSoldQuery = `SELECT sum(d.sold) as sold from daily as d join reps as r on d.rep_id=r.id join office as o on r.office_id=o.id
    WHERE o.id=${req.body.officeId} AND sold<>-1`;

  const dateToFilter = moment(req.body.date);

  let weekStartOffset = dateToFilter.startOf('week').day();
  let weekEndOffset = dateToFilter.endOf('week').day();
  weekStartOffset = getStartDateOffset(weekStartOffset);
  weekEndOffset = getEndDateOffset(weekEndOffset);

  const weekStart = dateToFilter.startOf('week').add(weekStartOffset, 'days').format(dateFormat);
  const weekEnd = dateToFilter.endOf('week').add(weekEndOffset, 'days').format(dateFormat);
  const weeklyRKPIDataQuery = getRKPIDataQuery + ` AND date<='${weekEnd}' AND date>='${weekStart}'`;
  const weeklyRTotalSoldQuery = totalRSoldQuery + ` AND date<='${weekEnd}' AND date>='${weekStart}'`;
  const weeklyOKPIDataQuery = getOKPIDataQuery + ` AND date<='${weekEnd}' AND date>='${weekStart}'`;
  const weeklyOTotalSoldQuery = totalOSoldQuery + ` AND date<='${weekEnd}' AND date>='${weekStart}'`;

  let monthStartOffset = dateToFilter.startOf('month').day();
  let monthEndOffset = dateToFilter.endOf('month').day();
  monthStartOffset = getStartDateOffset(monthStartOffset);
  monthEndOffset = getEndDateOffset(monthEndOffset);

  const monthStart = dateToFilter.startOf('month').add(monthStartOffset, 'days').format(dateFormat);
  const monthEnd = dateToFilter.endOf('month').add(monthEndOffset, 'days').format(dateFormat);
  const monthlyRKPIDataQuery = getRKPIDataQuery + ` AND date<='${monthEnd}' AND date>='${monthStart}'`;
  const monthlyRTotalSoldQuery = totalRSoldQuery + ` AND date<='${monthEnd}' AND date>='${monthStart}'`;
  const monthlyOKPIDataQuery = getOKPIDataQuery + ` AND date<='${monthEnd}' AND date>='${monthStart}'`;
  const monthlyOTotalSoldQuery = totalOSoldQuery + ` AND date<='${monthEnd}' AND date>='${monthStart}'`;

  let yearStartOffset = dateToFilter.startOf('year').day();
  let yearEndOffset = dateToFilter.endOf('year').day();
  yearStartOffset = getStartDateOffset(yearStartOffset);
  yearEndOffset = getEndDateOffset(yearEndOffset);

  const yearStart = dateToFilter.startOf('year').add(yearStartOffset, 'days').format(dateFormat);
  const yearEnd = dateToFilter.endOf('year').add(yearEndOffset, 'days').format(dateFormat);
  const yearlyRKPIDataQuery = getRKPIDataQuery + ` AND date<='${yearEnd}' AND date>='${yearStart}'`;
  const yearlyRTotalSoldQuery = totalRSoldQuery + ` AND date<='${yearEnd}' AND date>='${yearStart}'`;
  const yearlyOKPIDataQuery = getOKPIDataQuery + ` AND date<='${yearEnd}' AND date>='${yearStart}'`;
  const yearlyOTotalSoldQuery = totalOSoldQuery + ` AND date<='${yearEnd}' AND date>='${yearStart}'`;

  const allKPIData = {};

  database.query(weeklyRKPIDataQuery)
  .then (rows => {
    allKPIData.weeklyRData = rows[0];
    database.query(weeklyRTotalSoldQuery)
    .then (rows => {
      allKPIData.weeklyRData.sold = rows[0].sold;
    })
    .catch(err => {
      next(err); 
    });

    database.query(monthlyRKPIDataQuery)
    .then (rows => {
      allKPIData.monthlyRData = rows[0];
      database.query(monthlyRTotalSoldQuery)
      .then (rows => {
        allKPIData.monthlyRData.sold = rows[0].sold;
      })
      .catch(err => {
        next(err); 
      });

      database.query(yearlyRKPIDataQuery)
      .then (rows => {
        allKPIData.yearlyRData = rows[0];
        database.query(yearlyRTotalSoldQuery)
        .then (rows => {
          allKPIData.yearlyRData.sold = rows[0].sold;
        })
        .catch(err => {
          next(err); 
        });
      })
      .catch(err => {
        next(err); 
      });
    })
    .catch(err => {
      next(err); 
    });
  })
  .catch(err => {
    next(err); 
  });

  database.query(weeklyOKPIDataQuery)
  .then (rows => {
    allKPIData.weeklyOData = rows[0];
    database.query(weeklyOTotalSoldQuery)
    .then (rows => {
      allKPIData.weeklyOData.sold = rows[0].sold;
    })
    .catch(err => {
      next(err); 
    });

    database.query(monthlyOKPIDataQuery)
    .then (rows => {
      allKPIData.monthlyOData = rows[0];
      database.query(monthlyOTotalSoldQuery)
      .then (rows => {
        allKPIData.monthlyOData.sold = rows[0].sold;
      })
      .catch(err => {
        next(err); 
      });

      database.query(yearlyOKPIDataQuery)
      .then (rows => {
        allKPIData.yearlyOData = rows[0];
        database.query(yearlyOTotalSoldQuery)
        .then (rows => {
          allKPIData.yearlyOData.sold = rows[0].sold;
          const responseData = {
            repWSold: allKPIData.weeklyRData.sold,
            repWPulled: allKPIData.weeklyRData.pulled,
            repWNewClients: allKPIData.weeklyRData.newClients,
            repWCredit: allKPIData.weeklyRData.credit,
            repWInt: allKPIData.weeklyRData.inuse,
            repWTra1: allKPIData.weeklyRData.tra1,
            repWTra2: allKPIData.weeklyRData.tra2,
            repMSold: allKPIData.monthlyRData.sold,
            repMPulled: allKPIData.monthlyRData.pulled,
            repMNewClients: allKPIData.monthlyRData.newClients,
            repMCredit: allKPIData.monthlyRData.credit,
            repMInt: allKPIData.monthlyRData.inuse,
            repMTra1: allKPIData.monthlyRData.tra1,
            repMTra2: allKPIData.monthlyRData.tra2,
            repYSold: allKPIData.yearlyRData.sold,
            repYPulled: allKPIData.yearlyRData.pulled,
            repYNewClients: allKPIData.yearlyRData.newClients,
            repYCredit: allKPIData.yearlyRData.credit,
            repYInt: allKPIData.yearlyRData.inuse,
            repYTra1: allKPIData.yearlyRData.tra1,
            repYTra2: allKPIData.yearlyRData.tra2,
            officeWSold: allKPIData.weeklyOData.sold,
            officeWPulled: allKPIData.weeklyOData.pulled,
            officeWNewClients: allKPIData.weeklyOData.newClients,
            officeWCredit: allKPIData.weeklyOData.credit,
            officeWInt: allKPIData.weeklyOData.inuse,
            officeWTra1: allKPIData.weeklyOData.tra1,
            officeWTra2: allKPIData.weeklyOData.tra2,
            officeMSold: allKPIData.monthlyOData.sold,
            officeMPulled: allKPIData.monthlyOData.pulled,
            officeMNewClients: allKPIData.monthlyOData.newClients,
            officeMCredit: allKPIData.monthlyOData.credit,
            officeMInt: allKPIData.monthlyOData.inuse,
            officeMTra1: allKPIData.monthlyOData.tra1,
            officeMTra2: allKPIData.monthlyOData.tra2,
            officeYSold: allKPIData.yearlyOData.sold,
            officeYPulled: allKPIData.yearlyOData.pulled,
            officeYNewClients: allKPIData.yearlyOData.newClients,
            officeYCredit: allKPIData.yearlyOData.credit,
            officeYInt: allKPIData.yearlyOData.inuse,
            officeYTra1: allKPIData.yearlyOData.tra1,
            officeYTra2: allKPIData.yearlyOData.tra2
          };

          res.status(201).json({
            message: 'KPI data fetched successfully',
            data: responseData
          });
        })
        .catch(err => {
          next(err); 
        });
      })
      .catch(err => {
        next(err); 
      });
    })
    .catch(err => {
      next(err); 
    });
  })
  .catch(err => {
    next(err); 
  });
});

router.get('/api/getOffices',(req, res, next) => {
  const officeDataQuery = `select * from office ORDER BY office.id`;

  database.query(officeDataQuery)
  .then (rows => {
    res.status(201).json({
    message: 'Office data fetched successfully',
    offices: rows
    });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/addOffice',(req, res) => {
  const addOfficeQuery = `insert INTO office(name) VALUES ('${req.body.name}')`;

  database.query(addOfficeQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Office added successfully',
      });
  })
  .catch(err => {
      next(err); 
  });
});
  
router.post('/api/updateOffice',(req, res) => {
  const updateOfficeQuery = `update office SET name='${req.body.name}' WHERE id='${req.body.id}'`;

  database.query(updateOfficeQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Office has been updated successfully'
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/deleteOffice',(req, res) => {
  const deleteOfficeQuery = `delete FROM office WHERE id='${req.body.id}'`;

  database.query(deleteOfficeQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Office deleted successfully'
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.get('/api/getVehicles',(req, res, next) => {
  const VehicleDataQuery = `select * from vehicle ORDER BY vehicle.id DESC`;

  database.query(VehicleDataQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Vehicle data fetched successfully',
      vehicles: rows
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/addVehicle',(req, res) => {
  const addVehicleQuery = `insert INTO vehicle(name) VALUES ('${req.body.name}')`;

  database.query(addVehicleQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Vehicle added successfully',
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/updateVehicle',(req, res) => {
  const updateVehicleQuery = `update vehicle SET name='${req.body.name}' WHERE id='${req.body.id}'`;

  database.query(updateVehicleQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Vehicle has been updated successfully'
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/deleteVehicle',(req, res) => {
  const deleteVehicleQuery = `delete FROM vehicle WHERE id='${req.body.id}'`;

  database.query(deleteVehicleQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Vehicle deleted successfully'
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/getReps',(req, res, next) => {
  const officeId = req.body.officeId;
  let RepDataQuery = `SELECT r.id, r.name as repName, o.name as officeName,
      v.name as vehicleName, r.balance, r.office_id,
      r.vehicle_id FROM reps AS r JOIN office AS o ON r.office_id = o.id JOIN vehicle AS v 
      ON r.vehicle_id = v.id`;

  if(officeId) {
    RepDataQuery = RepDataQuery + ` WHERE o.id = '${officeId}'`;
  }

  database.query(RepDataQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Rep data fetched successfully',
      reps: rows
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/addRep',(req, res) => {
  const addRepQuery = `INSERT INTO reps(name, office_id, vehicle_id, balance, id) 
  VALUES ('${req.body.name}','${req.body.officeId}','${req.body.vehicleId}',
  '${req.body.balance}','${req.body.id}')`;

  database.query(addRepQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Rep added successfully',
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/updateRep',(req, res) => {
  const updateRepQuery = `UPDATE reps SET name='${req.body.name}',
      office_id='${req.body.officeId}', vehicle_id='${req.body.vehicleId}',
      balance='${req.body.balance}', id='${req.body.id}' WHERE id='${req.body.id}'`;

  database.query(updateRepQuery)
  .then (() => {
      res.status(201).json({
      message: 'Rep has been updated successfully'
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.post('/api/deleteRep',(req, res) => {
  const deleteRepQuery = `DELETE FROM reps WHERE id='${req.body.id}'`;

  database.query(deleteRepQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Rep deleted successfully'
      });
  })
  .catch(err => {
      next(err); 
  });
});

router.get('/api/getTotalData',(req, res, next) => {
  const yearStartDate = moment().startOf('year').format(dateFormat);
  const today = moment().format(dateFormat);

  const transFlexQuery = `select count(vehicle_id) as count from daily as d 
  join vehicle as v on d.vehicle_id=v.id Where d.date>='${yearStartDate}' 
  AND d.date<'${today}' AND v.name like '%trans%'`;

  let promiseArray = [];
  let totalData = {
      startDate: yearStartDate,
      endDate: today
  };

  database.query(transFlexQuery)
  .then (rows => {
      totalData.transFlexHireCount = rows[0].count;
      promiseArray.push (
      database.query(`select count(vehicle_id) as count from daily as d 
      join vehicle as v on d.vehicle_id=v.id Where d.date>='${yearStartDate}' 
      AND d.date<'${today}' AND v.name like '%reflex%'`)
      .then (rows => {
          totalData.reflexHireCount = rows[0].count;
          return database.query(`select count(vehicle_id) as count from daily as d 
          join vehicle as v on d.vehicle_id=v.id Where d.date>='${yearStartDate}' 
          AND d.date<'${today}' AND v.name like '%north%'`);
      }, err => {
          return database.close().then(() => { throw err; })
      })
      .then (rows => {
          totalData.northgateHireCount = rows[0].count;
          return totalData;
      }, err => {
          return database.close().then(() => { throw err; })
      })
      );
      Promise.all(promiseArray).then((data) => {
        res.status(201).json({
            message: 'Total data fetched successfully',
            totalData: data
        });
      });
  },err => {
      return database.close().then(() => { throw err; })
  })
  .catch(err => {
      next(err); 
  });
});

router.get('/api/getSplitData',(req, res, next) => {
  const splitDataQuery = `SELECT s.date, o.name, s.cash, s.cards, s.viu,
      FORMAT((s.cash + s.cards), 2) as total
      FROM split as s join office as o on s.office_id=o.id ORDER BY s.date DESC`;

  database.query(splitDataQuery)
  .then (rows => {
      res.status(201).json({
      message: 'Split data fetched successfully.',
      splitData: rows
    });
  })
  .catch(err => {
      next(err); 
  });
});

function getStartDateOffset(startDateOffset) {
  if(startDateOffset > 2) {
    startDateOffset = 7 - (startDateOffset -2);
  } else if (startDateOffset === 1) {
    startDateOffset = 1;
  } else if (startDateOffset === 0) {
    startDateOffset = 2;
  } else {
    startDateOffset = 0;
  }

  return startDateOffset;
}

function getEndDateOffset(endDateOffset) {
  if(endDateOffset > 1) {
    endDateOffset = 7 - (endDateOffset - 1);
  } else if (endDateOffset === 0) {
    endDateOffset = 1;
  } else {
    endDateOffset = 0;
  }

  return endDateOffset;
}

module.exports = router;