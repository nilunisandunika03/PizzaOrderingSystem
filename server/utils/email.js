const nodemailer = require('nodemailer');

// Create a transporter
// For development, we'll try to use Ethereal, or just log to console if it fails
let transporter;

async function createTransporter() {
    // For a real app, you'd use SendGrid, Mailgun, or Gmail SMTP
    // Here we use Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
}

createTransporter().catch(console.error);

const sendEmail = async (to, subject, html) => {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[MOCK EMAIL BODY] ${html}`);

    if (!transporter) {
        await createTransporter();
    }

    try {
        const info = await transporter.sendMail({
            from: '"Secure App" <noreply@example.com>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Fallback: Just return true so flow continues in dev
        return true;
    }
};

module.exports = { sendEmail };
