// authController.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { body } = require("express-validator");
const User = require("../models/User");
const geoip = require('geoip-lite');
const sendEmail = require("../utils/sendEmail");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/generateToken");

const isProduction = process.env.NODE_ENV === 'production';

// Cookie options
const getCookieOptions = () => ({
  httpOnly: true, // Prevents JavaScript access
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? "none" : "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes for access token
  path: '/'
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  path: '/'
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: '/'
});

const register = async (req, res) => {

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const welcomeHtml = `
    <!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      background-color: #f0f2f5; 
      padding: 20px; 
    }
    .email-wrapper { 
      max-width: 650px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 15px; 
      overflow: hidden; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.1); 
    }
    .hero-section { 
      background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899); 
      padding: 50px 30px; 
      text-align: center; 
      position: relative; 
    }
    .hero-section::before { 
      content: ''; 
      position: absolute; 
      top: 0; 
      left: 0; 
      right: 0; 
      bottom: 0; 
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="white" opacity="0.1"/></svg>'); 
      opacity: 0.3; 
    }
    .app-logo { 
      font-size: 48px; 
      color: white; 
      font-weight: 800; 
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2); 
      position: relative; 
      z-index: 1; 
    }
    .hero-subtitle { 
      color: white; 
      font-size: 20px; 
      margin-top: 10px; 
      position: relative; 
      z-index: 1; 
      opacity: 0.95; 
    }
    .main-content { 
      padding: 45px 35px; 
    }
    .greeting { 
      font-size: 28px; 
      color: #1f2937; 
      margin-bottom: 20px; 
      font-weight: 600; 
    }
    .message-text { 
      color: #4b5563; 
      font-size: 16px; 
      line-height: 1.8; 
      margin-bottom: 15px; 
    }
    .info-card { 
      background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%); 
      border-left: 4px solid #3b82f6; 
      padding: 25px; 
      margin: 30px 0; 
      border-radius: 8px; 
    }
    .info-card h3 { 
      color: #1f2937; 
      font-size: 18px; 
      margin-bottom: 15px; 
    }
    .feature-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
      margin: 25px 0; 
    }
    .feature-card { 
      background: white; 
      border: 2px solid #e5e7eb; 
      border-radius: 12px; 
      padding: 20px; 
      text-align: center; 
      transition: transform 0.2s; 
    }
    .feature-emoji { 
      font-size: 36px; 
      margin-bottom: 10px; 
    }
    .feature-name { 
      font-weight: 600; 
      color: #1f2937; 
      font-size: 15px; 
      margin-bottom: 5px; 
    }
    .feature-desc { 
      color: #6b7280; 
      font-size: 13px; 
      line-height: 1.4; 
    }
    .cta-section { 
      text-align: center; 
      margin: 35px 0; 
      padding: 30px; 
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); 
      border-radius: 12px; 
    }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
      color: white; 
      padding: 16px 40px; 
      border-radius: 30px; 
      text-decoration: none; 
      font-weight: 600; 
      font-size: 16px; 
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); 
      transition: all 0.3s; 
    }
    .support-box { 
      background: #fef3c7; 
      border: 2px dashed #f59e0b; 
      padding: 20px; 
      border-radius: 10px; 
      margin: 25px 0; 
      text-align: center; 
    }
    .support-title { 
      color: #92400e; 
      font-weight: 600; 
      margin-bottom: 8px; 
    }
    .support-text { 
      color: #78350f; 
      font-size: 14px; 
    }
    .support-email { 
      color: #3b82f6; 
      text-decoration: none; 
      font-weight: 600; 
    }
    .footer { 
      background: #1f2937; 
      color: #9ca3af; 
      padding: 30px; 
      text-align: center; 
      font-size: 13px; 
    }
    .footer-links { 
      margin: 15px 0; 
    }
    .footer-links a { 
      color: #60a5fa; 
      text-decoration: none; 
      margin: 0 12px; 
    }
    .footer-brand { 
      color: white; 
      font-size: 16px; 
      font-weight: 600; 
      margin-bottom: 10px; 
    }
    .welcome-badge { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 8px 20px; 
      border-radius: 20px; 
      font-size: 13px; 
      font-weight: 600; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      margin-bottom: 20px; 
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="hero-section">
      <div class="app-logo">📸 SnapStack</div>
      <div class="hero-subtitle">Your Memories, Beautifully Organized</div>
    </div>

    <div class="main-content">
        
        <div style="text-align: center;">
        <span class="welcome-badge">🎉 Welcome</span>
      
      </div>

      <h1 class="greeting">Hey ${user.name}, Welcome to the Family!</h1>
      
      <p class="message-text">
        We're absolutely delighted to have you and <strong>${user.partnerName}</strong> join the SnapStack family! 
      </p>
      <p class="message-text">
        Your journey to organizing and preserving your precious memories starts right now. With SnapStack, every photo tells a story, and we're here to help you share yours.
      </p>

      <div class="info-card">
        <h3>🎯 Your Account is Ready!</h3>
        <p style="color: #6b7280; margin: 0;">You can now upload photos, create albums, and share memories with your loved ones. Everything is set up and waiting for you!</p>
      </div>

      <h3 style="color: #1f2937; margin: 25px 0 20px 0; text-align: center; font-size: 22px;">
        ✨ Explore Amazing Features
      </h3>

      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-emoji">☁️</div>
          <div class="feature-name">Cloud Storage</div>
          <div class="feature-desc">Secure unlimited photo storage in the cloud</div>
        </div>

        <div class="feature-card">
          <div class="feature-emoji">📁</div>
          <div class="feature-name">Smart Albums</div>
          <div class="feature-desc">Auto-organize photos into beautiful collections</div>
        </div>

        <div class="feature-card">
          <div class="feature-emoji">🔐</div>
          <div class="feature-name">Private & Secure</div>
          <div class="feature-desc">Bank-level encryption for your memories</div>
        </div>

        <div class="feature-card">
          <div class="feature-emoji">🚀</div>
          <div class="feature-name">Lightning Fast</div>
          <div class="feature-desc">Quick uploads and instant access anywhere</div>
        </div>
      </div>

      <div class="cta-section">
        <p style="color: #6b21a8; font-size: 18px; font-weight: 600; margin-bottom: 20px;">
          Ready to start your photo journey?
        </p>
        <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">
          Open My Dashboard →
        </a>
      </div>

      <div class="support-box">
        <div class="support-title">💡 Need Help Getting Started?</div>
        <div class="support-text">
          Our friendly support team is here 24/7 to assist you.<br>
          Drop us a line at <a href="mailto:support@snapstack.com" class="support-email">support@snapstack.com</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">SnapStack</div>
      <p style="margin: 10px 0;">Capture. Organize. Share. Preserve.</p>
      
      <div class="footer-links">
        <a href="#">Help Center</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>

      <p style="margin-top: 20px; font-size: 12px;">
        &copy; ${new Date().getFullYear()} SnapStack. All rights reserved.
      </p>
      <p style="font-size: 11px; margin-top: 5px;">
        Sent to ${user.email}
      </p>
    </div>
  </div>
</body>
</html>
  `;

    try {
    await sendEmail({
      email: user.email,
      subject: "Welcome to SnapStack - Let's Get Started! 🎉",
      html: welcomeHtml,
    });
    console.log("✅ Welcome email sent to:", user.email);
  } catch (error) {
    
    console.error("❌ Welcome email error:", error);
  }

  // Generate tokens
  const accessToken = generateToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Set cookies
  res.cookie("accessToken", accessToken, getCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    },
  });
};

const login = async (req, res) => {
  const { email, password, timezone } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Invalid Email",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid Password",
    });
  }

  // Get device and location info
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             'Unknown IP';
  
  // Get location from IP
  const geo = geoip.lookup(ip);
  let location = 'Unknown Location';
  let locationDetails = {};

    if (geo) {
    location = `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`;
    locationDetails = {
      city: geo.city || 'Unknown',
      region: geo.region || 'Unknown',
      country: geo.country || 'Unknown',
      timezone: geo.timezone || 'UTC',
      coordinates: geo.ll || [0, 0] // [latitude, longitude]
    };
  }

  // Parse device info
  const deviceInfo = parseUserAgent(userAgent);

  // console.log(`Login detected for user: ${user.email}`);
  console.log(`Device Info: ${JSON.stringify(deviceInfo)}`);

  
   // Use timezone from client or geo location
  const userTimezone = timezone || locationDetails.timezone || 'UTC';
  
  // Format time in user's timezone
  const loginDate = new Date();
  const loginTime = loginDate.toLocaleString('en-US', { 
    timeZone: userTimezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Get timezone abbreviation
  const timezoneShort = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    timeZoneName: 'short'
  }).formatToParts(loginDate).find(part => part.type === 'timeZoneName')?.value || userTimezone;


  const loginNotificationHtml = `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          background: #f5f5f5; 
        }
        .email-container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .header-icon { 
          font-size: 48px; 
          margin-bottom: 10px; 
        }
        .header-title { 
          font-size: 24px; 
          font-weight: 700; 
          margin: 0; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .alert-box { 
          background: #f0f9ff; 
          border-left: 4px solid #3b82f6; 
          padding: 20px; 
          margin-bottom: 30px; 
          border-radius: 6px; 
        }
        .alert-title { 
          color: #1e40af; 
          font-weight: 700; 
          font-size: 18px; 
          margin-bottom: 10px; 
        }
        .alert-text { 
          color: #1e3a8a; 
          font-size: 14px; 
          line-height: 1.6; 
        }
        .info-grid { 
          background: #f9fafb; 
          border-radius: 8px; 
          padding: 25px; 
          margin: 25px 0; 
        }
        .info-row { 
          display: flex; 
          padding: 12px 0; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .info-row:last-child { 
          border-bottom: none; 
        }
        .info-label { 
          font-weight: 600; 
          color: #374151; 
          width: 140px; 
          flex-shrink: 0; 
        }
        .info-value { 
          color: #6b7280; 
          flex: 1; 
          word-break: break-word; 
        }
        .timezone-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }
        .security-notice { 
          background: #fffbeb; 
          border: 2px solid #fbbf24; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 25px 0; 
        }
        .security-notice-title { 
          color: #92400e; 
          font-weight: 700; 
          margin-bottom: 10px; 
          font-size: 16px; 
        }
        .security-notice-text { 
          color: #78350f; 
          font-size: 14px; 
          line-height: 1.6; 
          margin-bottom: 15px; 
        }
        .action-button { 
          display: inline-block; 
          background: #dc2626; 
          color: white; 
          padding: 12px 30px; 
          border-radius: 6px; 
          text-decoration: none; 
          font-weight: 600; 
          margin-top: 10px; 
        }
        .footer { 
          background: #f9fafb; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb; 
        }
        .footer-text { 
          color: #6b7280; 
          font-size: 13px; 
          line-height: 1.6; 
          margin: 5px 0; 
        }
        .footer-brand { 
          color: #111827; 
          font-weight: 700; 
          margin-bottom: 10px; 
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-icon">🔐</div>
          <h1 class="header-title">New Login Detected</h1>
        </div>

        <div class="content">
          <div class="alert-box">
            <div class="alert-title">Security Alert</div>
            <div class="alert-text">
              Hello ${user.name},<br><br>
              We detected a new login to your SnapStack account. If this was you, you can ignore this email. 
              If you don't recognize this activity, please secure your account immediately.
            </div>
          </div>

          <h3 style="color: #111827; margin-bottom: 20px;">Login Details:</h3>

          <div class="info-grid">
            <div class="info-row">
              <div class="info-label">📅 Time:</div>
              <div class="info-value">
                ${loginTime}
                <span class="timezone-badge">${timezoneShort}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-label">📍 Location:</div>
              <div class="info-value">${location}</div>
            </div>

            <div class="info-row">
              <div class="info-label">🌐 IP Address:</div>
              <div class="info-value">${ip}</div>
            </div>

            <div class="info-row">
              <div class="info-label">${deviceInfo.icon} Device:</div>
              <div class="info-value">${deviceInfo.device}</div>
            </div>

            <div class="info-row">
              <div class="info-label">🖥️ Browser:</div>
              <div class="info-value">${deviceInfo.browser}</div>
            </div>

            <div class="info-row">
              <div class="info-label">💻 OS:</div>
              <div class="info-value">${deviceInfo.os}</div>
            </div>

            <div class="info-row">
              <div class="info-label">📧 Email:</div>
              <div class="info-value">${user.email}</div>
            </div>
          </div>

          <div class="security-notice">
            <div class="security-notice-title">⚠️ Wasn't You?</div>
            <div class="security-notice-text">
              If you did not perform this login, your account may have been compromised. 
              Please change your password immediately and review your account activity.
            </div>
            <a href="${process.env.FRONTEND_URL}/settings/security" class="action-button">
              Secure My Account
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 25px;">
            For your security, we recommend:
          </p>
          <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
            <li>Using a strong, unique password</li>
            <li>Enabling two-factor authentication</li>
            <li>Not sharing your login credentials</li>
            <li>Logging out from shared devices</li>
          </ul>
        </div>

        <div class="footer">
          <div class="footer-brand">📸 SnapStack</div>
          <div class="footer-text">
            This is an automated security notification.<br>
            If you have questions, contact us at 
            <a href="mailto:support@snapstack.com" style="color: #3b82f6; text-decoration: none;">
              support@snapstack.com
            </a>
          </div>
          <div class="footer-text" style="margin-top: 15px;">
            © ${new Date().getFullYear()} SnapStack. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
    `
    
  // Send login notification email (don't block the login)
  try {
    await sendEmail({
      email: user.email,
      subject: "🔐 New Login to Your SnapStack Account",
      html: loginNotificationHtml,
    });
    console.log("✅ Login notification sent to:", user.email);
  } catch (error) {
    console.error("❌ Login notification email error:", error);
    // Don't fail login if email fails
  }

  // Generate tokens
  const accessToken = generateToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Set cookies
  res.cookie("accessToken", accessToken, getCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      partnerName: user.partnerName,
      email: user.email,
      role: user.role,
      isActivated: user.isActivated,
    },
  });
};

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let icon = '📱';

  // Detect OS
  if (/Windows/i.test(userAgent)) {
    os = 'Windows';
    icon = '💻';
  } else if (/Mac OS/i.test(userAgent)) {
    os = 'macOS';
    icon = '🍎';
  } else if (/Linux/i.test(userAgent)) {
    os = 'Linux';
    icon = '🐧';
  } else if (/Android/i.test(userAgent)) {
    os = 'Android';
    icon = '📱';
  } else if (/iOS|iPhone|iPad/i.test(userAgent)) {
    os = 'iOS';
    icon = '📱';
  }

  // Detect Browser
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/Opera|OPR/i.test(userAgent)) {
    browser = 'Opera';
  }

  // Detect Device Type
  if (/Mobile/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/Tablet/i.test(userAgent)) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  return {
    device: `${device} - ${os}`,
    browser,
    os,
    icon
  };
}

const logout = async (req, res) => {
  res.clearCookie("accessToken", getClearCookieOptions());
  res.clearCookie("refreshToken", getClearCookieOptions());

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const verifyToken = async (req, res) => {

  const token = req.cookies.accessToken || req.cookies.refreshToken;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token not found",
    });
  }
  try {
    const { verifyToken } = require("../utils/generateToken");
    const decoded = verifyToken(token, false);
    res.status(200).json({
      success: true,
      message: "Token is valid",
      userId: decoded.userId || decoded.id,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid access token",
    });
  }
};

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  try {
    const { verifyToken } = require("../utils/generateToken");
    const decoded = verifyToken(refreshToken, true);

    // Generate new access token
    const newAccessToken = generateToken({ id: decoded.userId || decoded.id });

    res.cookie("accessToken", newAccessToken, getCookieOptions());

    res.json({
      success: true,
      message: "Token refreshed",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal the user exists or not for security
    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to user
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Email HTML template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
          <p><strong>This link will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Photo Gallery. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request - Photo Gallery",
      html,
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Email send error:", error);

    // Clear reset token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Email could not be sent. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from URL to compare with stored hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid token and not expired
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token.",
    });
  }

  // Set new password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  user.password = await bcrypt.hash(password, saltRounds);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Optionally send confirmation email
  const confirmHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Password Reset Successful</h2>
      <p>Hi ${user.name},</p>
      <p>Your password has been successfully reset.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Confirmation - Photo Gallery",
      html: confirmHtml,
    });
  } catch (error) {
    console.error("Confirmation email error:", error);
    // Don't fail the request if confirmation email fails
  }

  res.status(200).json({
    success: true,
    message:
      "Password reset successful. You can now login with your new password.",
  });
};

// Validation rules
const authValidation = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  login: [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  forgotPassword: [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail(),
  ],
  resetPassword: [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
};

module.exports = {
  register,
  login,
  logout,
  verifyToken,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  authValidation,
};
