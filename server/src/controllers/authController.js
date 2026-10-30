import crypto from 'crypto';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { sanitizeUser, sanitizeEmployee } from '../utils/sanitize.js';
import { authCookieOptions, clearCookieOptions } from '../utils/cookieOptions.js';
import { isEmailConfigured, sendPasswordResetEmail } from '../utils/mailer.js';
import { COOKIE_NAME, IS_PROD_LIKE } from '../config/env.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

//login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid email or password');
    if (user.status === 'pending') {
      throw new ApiError(401, 'Account not registered yet. Please register first.');
    }
    if (user.status !== 'active') {
      throw new ApiError(401, 'Account is inactive. Contact your administrator.');
    }

    const match = await user.comparePassword(password || '');
    if (!match) throw new ApiError(401, 'Invalid email or password');

    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, authCookieOptions());

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

//register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const allowOpenRegistration =
      process.env.ALLOW_OPEN_REGISTRATION === 'true' ||
      (process.env.ALLOW_OPEN_REGISTRATION !== 'false' && !IS_PROD_LIKE);

    if (!allowOpenRegistration) {
      throw new ApiError(403, 'Registration is invite-only. Contact your administrator to set up your account.');
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists. Please log in instead.');
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: 'employee',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. You can now log in.',
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ success: true, data: sanitizeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) throw new ApiError(404, 'Account not found');

    const { name, currentPassword, password } = req.body;

    if (name) user.name = name.trim();

    if (password) {
      if (!currentPassword) throw new ApiError(400, 'Current password is required');
      const match = await user.comparePassword(currentPassword);
      if (!match) throw new ApiError(400, 'Current password is incorrect');
      if (password.length < 6) throw new ApiError(400, 'New password must be at least 6 characters');
      user.password = password;
    }

    await user.save();

    const employee = await Employee.findOne({ user: user._id }).populate('user');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: sanitizeUser(user), employee: employee ? sanitizeEmployee(employee) : null },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select(
      '+passwordResetToken +passwordResetExpires'
    );

    const payload = {
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    if (user) {
      const rawToken = await user.createPasswordResetToken();
      const resetUrl = `${CLIENT_URL}/reset-password?token=${rawToken}`;

      if (isEmailConfigured()) {
        try {
          await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
            expiresInMinutes: 15,
          });
        } catch (err) {
          console.error('Failed to send password reset email:', err.message);
          throw new ApiError(503, 'Could not send the reset email. Please try again later.');
        }
      } else if (IS_PROD_LIKE) {
        throw new ApiError(503, 'Password reset is not available. Contact your administrator.');
      } else {
        payload.data = {
          resetToken: rawToken,
          resetUrl,
          expiresInMinutes: 15,
        };
      }
    }

    res.json({ success: true, ...payload });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) throw new ApiError(400, 'Reset token is required');
    if (!password || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }
    if (password !== confirmPassword) throw new ApiError(400, 'Passwords do not match');

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) throw new ApiError(400, 'Reset token is invalid or has expired');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.clearCookie(COOKIE_NAME, clearCookieOptions());

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
}
