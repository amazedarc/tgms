const AppError = require('./../utils/appError');
const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);
const filterObj = (obj, ...allowedField) => {
    const newObjet = {};
    Object.keys(obj).forEach(el => {
        if (allowedField.includes(el)) newObjet[el] = obj[el];
    });
    return newObjet;
};
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
exports.updateMe = catchAsync(async(req, res, next) => {
    // 1) Display error if user post password info
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for updating password. Please use /updateMyPassword',
                400
            )
        );
    }

    // 3) Filter Fileds that do not need to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    // 2) Update user documents
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});
exports.deleteMe = catchAsync(async(req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUsers = factory.createOne(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);