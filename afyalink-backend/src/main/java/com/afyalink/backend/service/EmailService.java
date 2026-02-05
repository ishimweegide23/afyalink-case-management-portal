package com.afyalink.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ─────────────────────────────────────────────────────────────────
    // 2FA — Login OTP
    // ─────────────────────────────────────────────────────────────────
    public void sendTwoFactorLoginOtp(String toEmail, String otpCode, int expiryMinutes) {
        sendEmail(toEmail,
            "🔐 AfyaLink — Login Verification Code",
            buildLoginOtpHtml(otpCode, expiryMinutes));
    }

    // ─────────────────────────────────────────────────────────────────
    // 2FA — Setup / Enable OTP
    // ─────────────────────────────────────────────────────────────────
    public void sendTwoFactorSetupOtp(String toEmail, String otpCode, int expiryMinutes) {
        sendEmail(toEmail,
            "🔐 AfyaLink — Enable Two-Factor Authentication",
            buildSetupOtpHtml(otpCode, expiryMinutes));
    }

    // ─────────────────────────────────────────────────────────────────
    // Password Reset OTP
    // ─────────────────────────────────────────────────────────────────
    public void sendPasswordResetOtp(String toEmail, String otpCode, int expiryMinutes) {
        sendEmail(toEmail,
            "🔑 AfyaLink — Password Reset Code",
            buildPasswordResetHtml(otpCode, expiryMinutes));
    }

    // ─────────────────────────────────────────────────────────────────
    // Shared sender
    // ─────────────────────────────────────────────────────────────────
    private void sendEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "AfyaLink Portal");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email to " + toEmail + ": " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // HTML Templates
    // ─────────────────────────────────────────────────────────────────
    private String buildLoginOtpHtml(String otp, int expiry) {
        return wrap(
            "Login Verification",
            "We received a sign-in request for your AfyaLink account.",
            otp,
            expiry,
            "&#9888;&#65039; If you did not attempt to log in, please ignore this email and secure your account."
        );
    }

    private String buildSetupOtpHtml(String otp, int expiry) {
        return wrap(
            "Enable Two-Factor Authentication",
            "You requested to enable Two-Factor Authentication on your AfyaLink account.",
            otp,
            expiry,
            "If you did not make this request, please ignore this email."
        );
    }

    private String buildPasswordResetHtml(String otp, int expiry) {
        return wrap(
            "Password Reset",
            "We received a request to reset the password for your AfyaLink account.",
            otp,
            expiry,
            "&#9888;&#65039; If you did not request a password reset, please ignore this email. Your password will not change."
        );
    }

    /** Single shared template used by all three email types. */
    private String wrap(String title, String intro, String otp, int expiry, String warning) {
        return "<!DOCTYPE html>"
            + "<html lang=\"en\"><head><meta charset=\"UTF-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<style>"
            + "  *{box-sizing:border-box;margin:0;padding:0}"
            + "  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8}"
            + "  .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:18px;"
            + "        box-shadow:0 6px 30px rgba(0,0,0,.10);overflow:hidden}"
            + "  .header{background:linear-gradient(135deg,#0D9488,#0F766E);padding:28px 32px;text-align:center}"
            + "  .logo{font-size:28px;font-weight:800;color:#fff;letter-spacing:1px}"
            + "  .subtitle{color:rgba(255,255,255,.85);font-size:14px;margin-top:4px}"
            + "  .body{padding:36px 32px;text-align:center;color:#374151}"
            + "  .body p{font-size:15px;line-height:1.6;margin-bottom:12px}"
            + "  .otp-box{display:inline-block;background:#f0fdf4;border:2px dashed #0D9488;"
            + "           border-radius:14px;padding:18px 36px;margin:24px 0}"
            + "  .otp{font-size:42px;font-weight:800;letter-spacing:12px;color:#0D9488;font-family:monospace}"
            + "  .expiry{font-size:13px;color:#6b7280;margin-top:8px}"
            + "  .warn{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;"
            + "        padding:14px 18px;margin-top:24px;font-size:13px;color:#92400e;text-align:left}"
            + "  .footer{background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 32px;"
            + "          text-align:center;font-size:12px;color:#9ca3af}"
            + "</style></head>"
            + "<body><div class=\"wrap\">"
            + "  <div class=\"header\">"
            + "    <div class=\"logo\">&#128154; AfyaLink</div>"
            + "    <div class=\"subtitle\">" + title + "</div>"
            + "  </div>"
            + "  <div class=\"body\">"
            + "    <p>" + intro + "</p>"
            + "    <p>Use the code below to continue:</p>"
            + "    <div class=\"otp-box\">"
            + "      <div class=\"otp\">" + otp + "</div>"
            + "      <div class=\"expiry\">Expires in <strong>" + expiry + " minutes</strong></div>"
            + "    </div>"
            + "    <div class=\"warn\">" + warning + "</div>"
            + "  </div>"
            + "  <div class=\"footer\">"
            + "    AfyaLink Case Management Portal &bull; Kigali, Rwanda<br>"
            + "    &copy; 2026 AfyaLink. All rights reserved."
            + "  </div>"
            + "</div></body></html>";
    }
}
