const express = require('express');
const app = express();
const routerConfig = require('./routes/route-config');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const whitelist = [].concat(process.env.WHITELIST);
app.use(morgan('combined'));
app.use(bodyParser.json({
  type: ['json', 'application/csp-report']
}));

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'code.jquery.com'", "'cdnjs.cloudflare.com'", "'stackpath.bootstrapcdn.com'"],
    styleSrc: ["'self'", "'fonts.googleapis.com'"],
    reportUri: '/report-violation',
    upgradeInsecureRequests: true
  }
}));
app.use(helmet.noCache());
app.use(helmet.referrerPolicy({ policy: 'strict-origin' }));

app.use(cors({
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('404 - Not found'));
    }
  },
  methods: ['POST', 'OPTIONS']
}));

app.post('/report-violation', (req, res) => {
  if (req.body) {
    console.log('CSP Violation: ', req.body)
  } else {
    console.log('CSP Violation: No data received!')
  }
  res.status(204).end()
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

app.use(routerConfig);

module.exports = app;
