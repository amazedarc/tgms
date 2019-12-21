const express = require('express');
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');

const router = express.Router({ mergeParams: true });
router.use(authController.protect);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );
router.use(authController.restrictTo('user', 'admin'));
router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(reviewController.updateReview)
    .delete(reviewController.removeReview);
module.exports = router;