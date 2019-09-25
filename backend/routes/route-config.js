const express = require('express');
const router = express.Router();
const moment = require('moment');
const Promise = require('promise');
const mysql = require('mysql');

class Database {
  constructor(config) {
    this.connection = mysql.createPool(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          // res.json({"code" : 100, "status" : "Error in connection database"});
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
          // res.json({"code" : 100, "status" : "Error in connection database"});
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
  debug: process.env.DEBUG || false
});

router.post('/api/getDashboardData',(req, res, next) => {
    let dashboardQuery = `SELECT sum(d.sold) as sold, sum(d.pulled) as pulled,
      sum(d.newclients) as newClients, FORMAT(sum(d.credit), 2) as credit,
      sum(d.inuse) as interviews, sum(d.t1) as day1, sum(d.t2) as day2,
      FORMAT((sum(d.t2)/sum(d.t1))*100, 2) as percentage
      from daily as d join reps as r on d.rep_id = r.id 
      join office as o on r.office_id = o.id where`;
  
    let dashboardDataCollection = [];
  
    if(req.body.office !== null) {
      dashboardQuery += ` o.id='${req.body.office}' and`;
    }
  
    if(req.body.rep !== null) {
      dashboardQuery += ` r.id='${req.body.rep}' and`;
    }
  
    if(req.body.year !== '') {
      const dateObj = moment().isoWeekYear(parseInt(req.body.year)).toDate();
      let startDate = moment(dateObj).startOf('year').format('YYYY.MM.DD');
      let endDate = moment(dateObj).endOf('year').format('YYYY.MM.DD');
  
      if(req.body.month !== '') {
        startDate = moment(dateObj).month(req.body.month-1).startOf('month').format('YYYY.MM.DD');
        endDate = moment(dateObj).month(req.body.month-1).endOf('month').format('YYYY.MM.DD');
        
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
            const filterDate = startDate.clone().add(count, 'days').format('YYYY.MM.DD');
            const weekQuery = dashboardQuery + ` date='${filterDate}'`;
  
            dashboardPromiseArray.push(database.query(weekQuery)
              .then(rows => {
                dailyData = rows[0];
                dailyData['duration'] = filterDate;
                dailyData['dayNo'] = count + 1;
                return dailyData;
              })
            );
  
            const holidayQuery = `SELECT count(d.sold) as holidays from daily as d
                join reps as r on d.rep_id = r.id join office as o on r.office_id = o.id
                where date='${filterDate}' and sold=-1`;
              
            holidayQueryPromiseArray.push(database.query(holidayQuery)
              .then(rows => {
                holidaysData = rows[0];
                holidaysData['day'] = filterDate;
                holidaysData['dayNo'] = count + 1;
                return holidaysData;
              })
            );
          }
  
          Promise.all(dashboardPromiseArray).then(dailyDataCollection => {
            dailyData = dailyDataCollection.sort((a, b) => {
              return (a.dayNo - b.dayNo);
            });
          });
  
          Promise.all(holidayQueryPromiseArray).then(holidaysCollection => {
            holidaysData = holidaysCollection.sort((a, b) => {
              return (a.dayNo - b.dayNo);
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
            const start = startDate.format('YYYY.MM.DD');
            const end = endDate.format('YYYY.MM.DD');
            const weekQuery = dashboardQuery + ` date<='${end}' and date>='${start}'`;
            const week = weekNo;
            
            dashboardPromiseArray.push(database.query(weekQuery)
              .then(rows => {
                weeklyData = rows[0];
                weeklyData['duration'] = week;
                return weeklyData;
              })
            );
  
            const holidayQuery = `SELECT count(d.sold) as holidays from daily as d
                join reps as r on d.rep_id = r.id join office as o on r.office_id = o.id
                where date<='${end}' and date>='${start}' and sold=-1`;
              
            holidayQueryPromiseArray.push(database.query(holidayQuery)
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
          startDate = moment(dateObj).month(count).startOf('month').startOf('isoWeek').isoWeekday('Tuesday');
          if(startDate.month() < count) {
            startDate = startDate.add(7, 'days');
          }
  
          endDate = moment(dateObj).month(count+1).startOf('month').isoWeekday('Monday');
          if(endDate.month() === count) {
            endDate = endDate.add(7, 'days');
          }
  
          const monthQuery = dashboardQuery + ` date<='${endDate.format('YYYY.MM.DD')}' and date>='${startDate.format('YYYY.MM.DD')}'`;
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
  
          for(let count=0; count <=11; count++) {
            startDate = moment(dateObj).month(count).startOf('month').format('YYYY.MM.DD');
            endDate = moment(dateObj).month(count).endOf('month').format('YYYY.MM.DD');
  
            const holidayQuery = `SELECT count(d.sold) as holidays from daily as d
              join reps as r on d.rep_id = r.id join office as o on r.office_id = o.id
              where date<='${endDate}' and date>='${startDate}' and sold=-1`;
            let holidaysData = {};
  
            holidayQueryPromiseArray.push(database.query(holidayQuery)
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
        const yearQuery = dashboardQuery + ` date<='${endDate.format('YYYY.MM.DD')}' and date>='${startDate.format('YYYY.MM.DD')}'`;
        let yearlyData = [];
  
        dashboardPromiseArray.push(database.query(yearQuery)
          .then(rows => {
            yearlyData = rows[0];
            yearlyData['duration'] = year;
            return database.query(`SELECT count(d.sold) as holidays from daily as d
              join reps as r on d.rep_id = r.id join office as o on r.office_id = o.id
              where date<='${endDate}' and date>='${startDate}' and sold=-1`);
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
const weekStartDate = moment(sDate).format('YYYY.MM.DD');
const weekEndDate = moment(eDate).format('YYYY.MM.DD');
const monthStartDate = moment(sDate).startOf('month').format('YYYY.MM.DD');
const monthEndDate = moment(eDate).endOf('month').format('YYYY.MM.DD');
const yearStartDate = moment(sDate).startOf('year').format('YYYY.MM.DD');
const yearEndDate = moment(eDate).endOf('year').format('YYYY.MM.DD');

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
console.log(startLimit, endLimit);
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

router.post('/api/getScopeData',(req, res, next) => {
let scopeDataQuery = `SELECT d.date, o.name as officeName, d.rep_id as repId, v.name as vehicleName, 
d.sold, d.pulled, d.newclients as newClients, d.credit, d.balance, d.unused, d.inuse, d.t1, d.t2, d.st, 
r.name as repName FROM daily as d join reps as r on d.rep_id = r.id 
join office as o on r.office_id = o.id join vehicle as v on d.vehicle_id = v.id where`;

let scopeData = [];

if(req.body.office !== null && req.body.office !== '') {
    scopeDataQuery += ` o.id='${req.body.office}' and`;
}

if(req.body.rep !== null && req.body.rep !== '') {
    scopeDataQuery += ` r.id='${req.body.rep}' and`;
}

if(req.body.year !== '') {
    const dateObj = moment().isoWeekYear(parseInt(req.body.year)).toDate();
    let startDate = moment(dateObj).startOf('year').format('YYYY.MM.DD');
    let endDate = moment(dateObj).endOf('year').format('YYYY.MM.DD');

    if(req.body.month !== '') {
    startDate = moment(dateObj).month(req.body.month-1).startOf('month').format('YYYY.MM.DD');
    endDate = moment(dateObj).month(req.body.month-1).endOf('month').format('YYYY.MM.DD');
    
    if(req.body.week !== '') {
        let monthStart = moment(dateObj).month(req.body.month-1).startOf('month').startOf('isoWeek').isoWeekday('Tuesday');
        if(monthStart.month() < req.body.month-1) {
        monthStart = monthStart.add(7, 'days');
        }

        let monthEnd = moment(dateObj).month(req.body.month).startOf('month').isoWeekday('Monday');
        if(monthEnd.month() === req.body.month-1) {
        monthEnd = monthEnd.add(7, 'days');
        }

        const scopeDataPromiseArray = [];
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
        const filterDate = startDate.clone().add(count, 'days').format('YYYY.MM.DD');
        const weekQuery = scopeDataQuery + ` date='${filterDate}'`;

        scopeDataPromiseArray.push(database.query(weekQuery)
            .then(rows => {
            scopeData = rows[0];
            return scopeData;
            })
        );
        }

        Promise.all(scopeDataPromiseArray).then(scopeDataCollection => {
        scopeData = scopeDataCollection.sort((a, b) => {
            return (a.date - b.date);
        });

        res.status(201).json({
            message: 'Scope data fetched successfully',
            scopeData: scopeDataCollection
        });
        });
    } else {
        const scopeDataPromiseArray = [];
        let weekStart = moment(dateObj).month(req.body.month-1).startOf('month').isoWeekday('Tuesday');
        let weekEnd = moment(dateObj).month(req.body.month-1).startOf('month').add(6, 'days');
        let monthEnd = moment(dateObj).month(req.body.month).startOf('month').isoWeekday('Monday');
        let isMonthEnd = true;

        startDate = weekStart;
        endDate = weekEnd;

        while(isMonthEnd) {
        const start = startDate.format('YYYY.MM.DD');
        const end = endDate.format('YYYY.MM.DD');
        const weekQuery = scopeDataQuery + ` date<='${end}' and date>='${start}'`;
        
        scopeDataPromiseArray.push(database.query(weekQuery)
            .then(rows => {
            scopeData = rows[0];
            return scopeData;
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

        Promise.all(scopeDataPromiseArray).then(weeklyDataCollection => {
        scopeData = weeklyDataCollection.sort((a, b) => {
            return (a.date - b.date);
        });

        res.status(201).json({
            message: 'Scope data fetched successfully',
            scopeData: weeklyDataCollection
        });
        });
    }
    } else {
    const scopeDataPromiseArray = [];
    for(let count=0; count <=11; count++) {
        startDate = moment(dateObj).month(count).startOf('month').startOf('isoWeek').isoWeekday('Tuesday');
        if(startDate.month() < count) {
        startDate = startDate.add(7, 'days');
        }

        endDate = moment(dateObj).month(count+1).startOf('month').isoWeekday('Monday');
        if(endDate.month() === count) {
        endDate = endDate.add(7, 'days');
        }

        const monthQuery = scopeDataQuery + ` date<='${endDate.format('YYYY.MM.DD')}' and date>='${startDate.format('YYYY.MM.DD')}'`;
        console.log(monthQuery);
        scopeDataPromiseArray.push(database.query(monthQuery)
        .then(rows => {
            scopeData = rows;
            return scopeData;
        })
        );
    }

    Promise.all(scopeDataPromiseArray).then(monthlyDataCollection => {
        scopeData = monthlyDataCollection.sort((a, b) => {
        return (a.date - b.date);
        });

        res.status(201).json({
        message: 'Scope data fetched successfully',
        scopeData: monthlyDataCollection
        });
    })
    .catch(err => {
        next(err); 
    });
    }
    scopeDataQuery += ` date<='${endDate}' and date>='${startDate}'`;
} else {
    const scopeDataPromiseArray = [];
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
    const yearQuery = scopeDataQuery + ` date<='${endDate.format('YYYY.MM.DD')}' and date>='${startDate.format('YYYY.MM.DD')}'`;
    scopeDataPromiseArray.push(database.query(yearQuery)
        .then(rows => {
        scopeData = rows[0];
        return scopeData;
        })
    );
    });

    Promise.all(scopeDataPromiseArray).then(dataCollection => {
    scopeData = dataCollection.sort((a, b) => {
        return (a.date - b.date);
    });

    res.status(201).json({
        message: 'Scope data fetched successfully',
        scopeData: dataCollection
    });
    })
    .catch(err => {
    next(err); 
    });
}
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

/** APIs for Vehicle page **/
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

router.get('/api/getReps',(req, res, next) => {
const RepDataQuery = `SELECT r.id, r.name as repName, o.name as officeName,
    v.name as vehicleName, r.balance, r.office_id,
    r.vehicle_id FROM reps AS r JOIN office AS o ON r.office_id = o.id JOIN vehicle AS v 
    ON r.vehicle_id = v.id`;

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
const yearStartDate = moment().startOf('year').format('YYYY.MM.DD');
const today = moment().format('YYYY.MM.DD');

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

router.get('/api/getSpliteData',(req, res, next) => {
const spliteDataQuery = `SELECT s.date, o.name, s.cash, s.cards, s.viu,
    FORMAT((s.cash + s.cards), 2) as total
    FROM split as s join office as o on s.office_id=o.id`;

database.query(spliteDataQuery)
.then (rows => {
    res.status(201).json({
    message: 'Splite data fetched successfully.',
    spliteData: rows
    });
})
.catch(err => {
    next(err); 
});
});

module.exports = router;