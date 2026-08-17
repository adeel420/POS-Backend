const {
  Verification_Email_Template,
  Welcome_Email_Template,
  Account_Approved_Template,
  Account_Rejected_Template,
} = require("../emailTemplate");
const transporter = require("./config");

const sendVerificationCode = async (email, verificationCode) => {
  try {
    const response = await transporter.sendMail({
      from: '"POSHub"',
      to: email,
      subject: "Verify your Email",
      text: "Verify your Email",
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationCode,
      ),
    });
    console.log("Email Sent Successfully", response);
  } catch (err) {
    console.log(err);
  }
};

const welcomeCode = async (email, name) => {
  try {
    const response = await transporter.sendMail({
      from: '"POSHub "',
      to: email,
      subject: "Welcome to POSHub",
      text: `Welcome, ${name}!`,
      html: Welcome_Email_Template.replace("{name}", name),
    });
    console.log("Email Sent Successfully", response);
  } catch (err) {
    console.error("Error sending welcome email:", err);
  }
};

const sendAccountApproved = async (email, name) => {
  try {
    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login`;
    const response = await transporter.sendMail({
      from: '"POSHub"',
      to: email,
      subject: "Your Account Has Been Approved!",
      text: `Hello ${name}, your account has been approved. You can now login.`,
      html: Account_Approved_Template
        .replace(/{name}/g, name)
        .replace("{loginUrl}", loginUrl),
    });
    console.log("Approval Email Sent Successfully", response);
  } catch (err) {
    console.error("Error sending approval email:", err);
  }
};

const sendAccountRejected = async (email, name, reason) => {
  try {
    const response = await transporter.sendMail({
      from: '"POSHub"',
      to: email,
      subject: "Your Account Has Been Rejected",
      text: `Hello ${name}, your account has been rejected. Reason: ${reason || "Contact support"}`,
      html: Account_Rejected_Template
        .replace(/{name}/g, name)
        .replace("{reason}", reason || "Contact support"),
    });
    console.log("Rejection Email Sent Successfully", response);
  } catch (err) {
    console.error("Error sending rejection email:", err);
  }
};

module.exports = { sendVerificationCode, welcomeCode, sendAccountApproved, sendAccountRejected };
