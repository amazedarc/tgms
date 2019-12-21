const express = require('express');

const router = express.Router();
const userController = require('./../controller/userController');
const authController = require('./../controller/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// Protect these router again unauthorized users
router.use(authController.restrictTo('admin', 'lead-guide'));
router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUsers);
router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;