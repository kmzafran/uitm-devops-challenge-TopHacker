const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { prisma } = require('../config/database');

class OtpService {
  static generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async createOtp(userId, type = 'LOGIN') {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return await prisma.otp.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });
  }

  static async sendOtpEmail(email, code) {
    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP Code - RentVerse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>RentVerse - OTP Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <br>
          <p>Best regards,<br>RentVerse Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendOtpSms(phone, code) {
    // TODO: Implement SMS sending (e.g., using Twilio)
    // For now, just log it
    console.log(`SMS OTP for ${phone}: ${code}`);
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await client.messages.create({
    //   body: `Your RentVerse OTP is: ${code}`,
    //   from: process.env.TWILIO_PHONE,
    //   to: phone,
    // });
  }

  static async verifyOtp(userId, code, type = 'LOGIN') {
    const otp = await prisma.otp.findFirst({
      where: {
        userId,
        code,
        type,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!otp) return false;

    // Mark as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  static async sendOtp(userId, method = 'EMAIL') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    if (!user) throw new Error('User not found');

    const otp = await this.createOtp(userId, 'LOGIN');

    if (method === 'EMAIL') {
      await this.sendOtpEmail(user.email, otp.code);
    } else if (method === 'SMS') {
      if (!user.phone) throw new Error('Phone number not available');
      await this.sendOtpSms(user.phone, otp.code);
    }

    return otp;
  }
}

module.exports = OtpService;
