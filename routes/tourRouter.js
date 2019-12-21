const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);
router.use('/:tourId/reviews', reviewRouter);
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/stats').get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTours
    );
router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );
// router
//     .route('/:tourId/reviews')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview
//     );
module.exports = router;