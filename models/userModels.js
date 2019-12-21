const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user name is always required']
    },
    email: {
        type: String,
        required: [true, 'A user email is always required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid Email']
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'guide', 'lead-guide', 'user'],
            message: 'The user role must be either user,guide,lead-guide or admin'
        },
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        minlength: 8,
        // This only work on save
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'passwords are not the same'
        }
    },
    photo: String,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    //Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    //Delete password comfirm fields
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// instance function

userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    // False means not changed
    return false;
};
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;