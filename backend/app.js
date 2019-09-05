const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const moment = require('moment');
const Promise = require('promise');

class Database {
  constructor(config) {
    this.connection = mysql.createPool(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err)
            return reject(err);
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}

const database = new Database({
  connectionLimit : 5,
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'admin_fiverr',
  debug: true
});

// function handle_database(req,res) {
//   pool.getConnection(function(err,connection){
//     if (err) {
//       res.json({"code" : 100, "status" : "Error in connection database"});
//       return;
//     }

//     console.log('connected as id ' + connection.threadId);
    
//     connection.on('error', function(err) {      
//       res.json({"code" : 100, "status" : "Error in connection database"});
//       return;     
//     });
//   });
// }

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

app.get('/api/dashboard',(req, res, next) => {
  // handle_database(req,res);
  // const dashboardQuery = "SELECT sum(d.sold), sum(d.pulled), sum(d.newclients), sum(d.credit), sum(d.inuse), sum(d.t1), sum(d.t2) from daily as d";
  // pool.query(dashboardQuery, (err, rows, fields) => {
  //   console.log(rows);
  //   console.log(fields);

  //   if (!err) {
  //     res.status(200).json({
  //       message: 'Dasboard data fetched successfully',
  //       dashboardData: rows
  //     });
  //   } else {
  //     console.log('Error while performing Query.');
  //   }
  // });
});

app.post('/api/saveRecord',(req, res, next) => {
  const record = req.body;
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.get('/api/getYears',(req, res) => {
  database.query('SELECT YEAR(date) AS year FROM daily GROUP BY YEAR(date)')
  .then (data => {
    res.status(201).json({
      message: 'Years fetched successfully',
      yearData: data
    });
  })
  .catch(err => {
    throw err;
  });
});

app.post('/api/getReport',(req, res, next) => {
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
    throw err;
  });
});

app.get('/api/getDailyData',(req, res, next) => {
  const dailyDataQuery = `SELECT d.date, o.name as officeName, d.rep_id as repId, v.name as vehicleName, 
  d.sold, d.pulled, d.newclients, d.credit, d.balance, d.unused, d.inuse, d.t1, d.t2, d.st, 
  r.name as repName FROM daily as d join reps as r on d.rep_id = r.id 
  join office as o on r.office_id = o.id join vehicle as v on d.vehicle_id = v.id`;

  database.query(dailyDataQuery)
  .then (rows => {
    res.status(201).json({
      message: 'Daily data fetched successfully',
      dailyData: rows
    });
  })
  .catch(err => {
    throw err;
  });
});

app.get('/api/getOffices',(req, res, next) => {
  const officeDataQuery = `select * from office`;

  database.query(officeDataQuery)
  .then (rows => {
    res.status(201).json({
      message: 'Office data fetched successfully',
      offices: rows
    });
  })
  .catch(err => {
    throw err;
  });
});

app.post('/api/addOffice',(req, res) => {
  const addOfficeQuery = `insert INTO office(name) VALUES ('${req.body.name}')`;

  database.query(addOfficeQuery)
  .then (rows => {
    res.status(201).json({
      message: 'Office added successfully',
    });
  })
  .catch(err => {
    throw err;
  });
});

app.post('/api/updateOffice',(req, res) => {
  const updateOfficeQuery = `update office SET name='${req.body.name}' WHERE id='${req.body.id}'`;

  database.query(updateOfficeQuery)
  .then (rows => {
    res.status(201).json({
      message: 'Office has been updated successfully'
    });
  })
  .catch(err => {
    throw err;
  });
});

app.post('/api/deleteOffice',(req, res) => {
  const deleteOfficeQuery = `delete FROM office WHERE id='${req.body.id}'`;

  database.query(deleteOfficeQuery)
  .then (rows => {
    res.status(201).json({
      message: 'Office deleted successfully'
    });
  })
  .catch(err => {
    throw err;
  });
});

app.get('/api/getTotalData',(req, res, next) => {
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
    throw err;
  });
});

app.get('/api/getVehicles',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.post('/api/saveVehicle',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.get('/api/getReps',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.post('/api/saveRep',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.get('/api/getSpliteData',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

module.exports = app;
