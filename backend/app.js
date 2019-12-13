const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const routerConfig = require('./routes/route-config');

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

app.use(bodyParser.json({
  type: ['json', 'application/csp-report']
}));

app.post('/report-violation', (req, res) => {
  if (req.body) {
    console.log('CSP Violation: ', req.body)
  } else {
    console.log('CSP Violation: No data received!')
  }

  res.status(204).end()
})

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

app.use(routerConfig);

module.exports = app;
