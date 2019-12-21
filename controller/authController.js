// const util = require('util');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendMail = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};
exports.signup = catchAsync(async(req, res, next) => {
    const user = await User.create(req.body);
    createSendToken(user, 201, res);

    next();
});

exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    // 2) Check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3) if everything is ok, send token to client
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async(req, res, next) => {
    // 1) Get the token and check if it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // console.log(token);

    if (!token) {
        next(
            new AppError('Your are not logged in! Please login to get access', 401)
        );
    }
    // 2) Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) check if user still exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        next(
            new AppError('The user belonging to the token does not long exit!', 401)
        );
    }
    // 4) check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again.', 401)
        );
    }

    // Grant access to protect route
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: 
    ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendMail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('There was an error sending the email. Try again later!'),
            500
        );
    }
});
exports.resetPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangedAt = Date.now();
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async(req, res, next) => {
    //1) Get user from the collection
    const user = await User.findById(req.user.id).select('+password');
    //2) posted password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(
            new AppError(
                'The provided password does not match the existing password',
                401
            )
        );
    }
    //3)if ok, Update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //4) Send user in, with new jwt
    createSendToken(user, 200, res);
});