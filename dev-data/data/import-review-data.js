/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Review = require('../../models/reviewModels');

dotenv.config({ path: './config.env' });

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

const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async() => {
    try {
        await Review.create(reviews);
        console.log('data successfully loaded');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

const deleteData = async() => {
    try {
        await Review.deleteMany();
        console.log('data successfully deleted');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}