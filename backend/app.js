const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const routerConfig = require('./routes/route-config');

// app.use(helmet());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});
app.use(routerConfig);

module.exports = app;
