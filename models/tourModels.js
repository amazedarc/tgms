const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModels');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour name is always required'],
        unique: true,
        maxlength: [40, 'A tour name must have less than 40 characters'],
        minlength: [10, 'A tour name  must not have less than 10 characters']
            // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'difficult', 'medium'],
            message: 'Difficulty is either: easy,medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Ratings must be below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour price is required']
    },
    priceDiscount: {
        type: Number,
        validate: {
            //CUSTOM VALIDATORS
            validator: function(val) {
                // THIS ONLY WORKS WHEN CREATING DOCUMENTS NOT UPDATE
                return val < this.price;
            },

            message: 'the Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },

    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    // guides: Array,
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    startDates: [Date]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// DOCUMENT MIDDLEWARE: RUNS FOR SAVE() AND CREATE()

tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });
    next();
});
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
});
// tourSchema.pre('save', async function(next) {
//     const guidePromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidePromises);
//     next();
// });

// tourSchema.pre('save', function(next) {
//     console.log('will save document');
//     next();
// });
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });

// AGREGARTION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    next();
});
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ tour: 1, user: 1 }, { unique: true });
// Virtual Populate
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;