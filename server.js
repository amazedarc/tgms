/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
// console.log(process.env);

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful'));

const port = process.env.PORT;

const server = app.listen(port, () => {
    console.log(`App running on ${port}`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});