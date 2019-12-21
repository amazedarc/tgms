const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const errorController = require('./controller/errorController');

const app = express();
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRoutes');
// 1) Global  Middlewares
// Security HTTP Headers
app.use(helmet());
// Development Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this Ip address.Please try again after an hour!'
});
app.use('/api', limiter);
// body parser, reading data from body  into req.body
app.use(express.json({ limit: '10kb' }));
// clean data with data sanitization against NOSQL injection
app.use(mongoSanitize());
// clean data with data sanitization against XSS attacks
app.use(xss());
// prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsAverage',
            'ratingsQuantity',
            'maxGroupSize',
            'price',
            'diffficulty'
        ]
    })
);
//Serving static files
app.use(express.static(`{__dirname}/public`));
//Testing middleware
app.use((req, res, next) => {
    //console.log('Hello from the middleware');
    next();
});
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    next();
});

// 4) Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
    next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);
module.exports = app;