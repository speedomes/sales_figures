const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'fiverr',
  password : 'fiverr',
  database : 'admin_fiverr',
  debug: false
});

connection.connect((err) => {
  if(!err) {
      console.log("Database is connected ... \n\n");  
  } else {
      console.log("Error connecting database ... \n\n");  
  }
});

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

app.get('/api/dashboard',(req, res, next) => {
  connection.query('SELECT * from user LIMIT 2', (err, rows, fields) => {
    connection.end();
    if (!err)
      console.log('The solution is: ', rows);
    else
      console.log('Error while performing Query.');
    });
  });
  res.status(200).json({
    message: 'Dasboard data fetched successfully',
    dashboardData: {'id': 123}
  });
});

app.post('/api/saveRecord',(req, res, next) => {
  const record = req.body;
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.post('/api/getReport',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.get('/api/getDailyData',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.get('/api/getTotalData',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.get('/api/getOffices',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
  });
});

app.post('/api/saveOffice',(req, res, next) => {
  res.status(201).json({
    message: 'Data saved successfully',
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
