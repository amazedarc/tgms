const Review = require('./../models/reviewModels');
const factory = require('./../controller/handlerFactory');

exports.checkBody = (req, res, next) => {
    if (!req.body.review || !req.body.rating) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing review and rating'
        });
    }
    next();
};
exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);
exports.setTourUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.removeReview = factory.deleteOne(Review);