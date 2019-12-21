const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        require: [true, 'A review is always required'],
        maxlength: [200, 'A review must have less than 200 characters'],
        minlength: [50, 'A review must not have less than 100 characters']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Ratings must be below 5.0']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour']
    }],
    user: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to a user']
    }]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([{
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.post('save', function() {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
});
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    // console.log(this.r);
    next();
});
reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;