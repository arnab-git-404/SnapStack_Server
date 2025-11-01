const User = require('../models/User');
const Couple = require('../models/Couple');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Send partner invitation
const sendPartnerInvite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerEmail, partnerName } = req.body;

    // Validation
    if (!partnerEmail || !partnerName) {
      return res.status(400).json({
        success: false,
        message: 'Partner email and name are required'
      });
    }

    // Check if user already has a partner
    const existingCouple = await Couple.findOne({
      $or: [
        { 'user1.userId': userId },
        { 'user2.userId': userId }
      ]
    });

    if (existingCouple && existingCouple.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'You already have an active partner connection'
      });
    }

    // Check if partner email is same as user's email
    if (partnerEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself as a partner'
      });
    }

    // Check if partner already has an account and is in a couple
    const partnerUser = await User.findOne({ email: partnerEmail.toLowerCase() });
    if (partnerUser && partnerUser.coupleId) {
      return res.status(400).json({
        success: false,
        message: 'This user is already in a partnership'
      });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');

    // Create or update couple record
    let couple;
    if (existingCouple && existingCouple.status === 'pending') {
      // Update existing pending invite
      couple = existingCouple;
      couple.user2.email = partnerEmail.toLowerCase();
      couple.user2.name = partnerName;
      couple.inviteToken = inviteTokenHash;
      couple.inviteExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      couple.updatedAt = Date.now();
    } else {
      // Create new couple
      couple = await Couple.create({
        user1: {
          userId: userId,
          name: req.user.name,
          email: req.user.email
        },
        user2: {
          email: partnerEmail.toLowerCase(),
          name: partnerName
        },
        status: 'pending',
        inviteToken: inviteTokenHash,
        inviteExpires: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      // Update user's coupleId
      await User.findByIdAndUpdate(userId, { coupleId: couple._id });
    }

    await couple.save();

    // Create invite URL
    const inviteUrl = `${process.env.FRONTEND_URL}/partner/accept-invite/${inviteToken}`;

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .invite-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 6px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 14px 35px; border-radius: 30px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💑 Partner Invitation</h1>
          </div>
          <div class="content">
            <h2>Hi ${partnerName}! 👋</h2>
            <p><strong>${req.user.name}</strong> has invited you to be their partner on SnapStack!</p>
            
            <div class="invite-box">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">🎉 You've been invited to join SnapStack as a partner!</p>
              <p style="margin: 10px 0 0 0; color: #1e3a8a;">Create a shared space to organize and enjoy your memories together.</p>
            </div>

            <p>Click the button below to accept the invitation and create your account:</p>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation →</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Or copy and paste this link:<br>
              <span style="color: #3b82f6; word-break: break-all;">${inviteUrl}</span>
            </p>

            <p style="color: #ef4444; font-weight: 600; margin-top: 25px;">⏰ This invitation expires in 7 days</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SnapStack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      email: partnerEmail,
      subject: `${req.user.name} invited you to be their partner on SnapStack!`,
      html: emailHtml
    });

    res.status(200).json({
      success: true,
      message: 'Partner invitation sent successfully',
      data: {
        coupleId: couple._id,
        partnerEmail,
        partnerName,
        inviteExpires: couple.inviteExpires
      }
    });

  } catch (error) {
    console.error('Send partner invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send partner invitation',
      error: error.message
    });
  }
};

// Get invite details
const getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token
    const inviteTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find couple with this token
    const couple = await Couple.findOne({
      inviteToken: inviteTokenHash,
      inviteExpires: { $gt: Date.now() },
      status: 'pending'
    }).populate('user1.userId', 'name email');

    if (!couple) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation link'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        inviterName: couple.user1.name,
        inviterEmail: couple.user1.email,
        partnerName: couple.user2.name,
        partnerEmail: couple.user2.email
      }
    });

  } catch (error) {
    console.error('Get invite details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invite details',
      error: error.message
    });
  }
};

// Accept partner invitation
const acceptPartnerInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Hash the token
    const inviteTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find couple with this token
    const couple = await Couple.findOne({
      inviteToken: inviteTokenHash,
      inviteExpires: { $gt: Date.now() },
      status: 'pending'
    });

    if (!couple) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation link'
      });
    }

    // Check if email matches the invited email
    if (email.toLowerCase() !== couple.user2.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match the invitation'
      });
    }

    // Check if user already exists
    let partnerUser = await User.findOne({ email: email.toLowerCase() });
    
    if (partnerUser) {
      // User exists, just link them
      if (partnerUser.coupleId && partnerUser.coupleId.toString() !== couple._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'This user is already in another partnership'
        });
      }
    } else {
      // Create new user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      partnerUser = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        coupleId: couple._id,
        isActivated: true
      });
    }

    // Get user1 (inviter)
    const user1 = await User.findById(couple.user1.userId);

    // Update couple
    couple.user2.userId = partnerUser._id;
    couple.user2.name = partnerUser.name;
    couple.user2.joinedAt = Date.now();
    couple.status = 'active';
    couple.inviteToken = undefined;
    couple.inviteExpires = undefined;
    await couple.save();

    // Update both users with partner info
    await User.findByIdAndUpdate(user1._id, {
      partnerId: partnerUser._id,
      partnerName: partnerUser.name,
      coupleId: couple._id
    });

    await User.findByIdAndUpdate(partnerUser._id, {
      partnerId: user1._id,
      partnerName: user1.name,
      coupleId: couple._id
    });

    // Send confirmation emails to both
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
          .content { padding: 40px 30px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Partnership Activated!</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <p style="margin: 0; color: #065f46; font-weight: 600;">✨ You're now connected as partners!</p>
            </div>
            <p>Start sharing your memories together on SnapStack!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: user1.email,
        subject: '🎉 Your partner has joined SnapStack!',
        html: confirmationHtml
      });

      await sendEmail({
        email: partnerUser.email,
        subject: '🎉 Welcome to SnapStack!',
        html: confirmationHtml
      });
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
    }

    // Generate tokens for the new partner
    const { generateToken, generateRefreshToken } = require('../utils/generateToken');
    const accessToken = generateToken({ id: partnerUser._id });
    const refreshToken = generateRefreshToken({ id: partnerUser._id });

    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Partnership activated successfully!',
      user: {
        id: partnerUser._id,
        name: partnerUser.name,
        email: partnerUser.email,
        partnerId: user1._id,
        partnerName: user1.name,
        coupleId: couple._id
      }
    });

  } catch (error) {
    console.error('Accept partner invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
};

// Get partner status
const getPartnerStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate('partnerId', 'name email');
    const couple = await Couple.findById(user.coupleId);

    if (!couple) {
      return res.status(200).json({
        success: true,
        data: {
          hasPartner: false,
          status: 'no_partner'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hasPartner: couple.status === 'active',
        status: couple.status,
        partner: user.partnerId ? {
          id: user.partnerId._id,
          name: user.partnerId.name,
          email: user.partnerId.email
        } : null,
        coupleId: couple._id,
        inviteExpires: couple.inviteExpires
      }
    });

  } catch (error) {
    console.error('Get partner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get partner status',
      error: error.message
    });
  }
};

// Cancel invitation
const cancelInvitation = async (req, res) => {
  try {
    const userId = req.user._id;

    const couple = await Couple.findOne({
      'user1.userId': userId,
      status: 'pending'
    });

    if (!couple) {
      return res.status(404).json({
        success: false,
        message: 'No pending invitation found'
      });
    }

    // Delete the couple record
    await Couple.findByIdAndDelete(couple._id);

    // Update user
    await User.findByIdAndUpdate(userId, {
      coupleId: null
    });

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
};

module.exports = {
  sendPartnerInvite,
  getInviteDetails,
  acceptPartnerInvite,
  getPartnerStatus,
  cancelInvitation
};