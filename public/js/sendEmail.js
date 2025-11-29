// Import the Nodemailer library
const nodemailer = require('nodemailer');

// Create a transporter object

function buttonTest(){
    alert("test");
};

function sendEmail(recipient){
    const transporter = nodemailer.createTransport({
  host: 'live.smtp.mailtrap.io',
  port: 587,
  secure: false, // use SSL
  auth: {
    user: '1a2b3c4d5e6f7g',
    pass: '1a2b3c4d5e6f7g',
  }
});
    // Configure the mailoptions object
    const mailOptions = {
    from: 'example@example.com',
    to: recipient,
    subject: 'please work',
    text: 'email test'
    };

    // Send the email
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log('Error:', error);
    } else {
        console.log('Email sent:', info.response);
    }
    });
}