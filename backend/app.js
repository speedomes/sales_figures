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
  database : 'salesFigures',
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
    next(err); 
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
    next(err); 
  });
});

app.post('/api/getDailyData',(req, res, next) => {
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

app.get('/api/getOffices',(req, res, next) => {
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

app.post('/api/addOffice',(req, res) => {
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

app.post('/api/updateOffice',(req, res) => {
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

app.post('/api/deleteOffice',(req, res) => {
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
app.get('/api/getVehicles',(req, res, next) => {
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

app.post('/api/addVehicle',(req, res) => {
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

app.post('/api/updateVehicle',(req, res) => {
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

app.post('/api/deleteVehicle',(req, res) => {
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

app.get('/api/getReps',(req, res, next) => {
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

app.post('/api/addRep',(req, res) => {
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

app.post('/api/updateRep',(req, res) => {
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

app.post('/api/deleteRep',(req, res) => {
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
    next(err); 
  });
});

app.get('/api/getSpliteData',(req, res, next) => {
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

module.exports = app;
