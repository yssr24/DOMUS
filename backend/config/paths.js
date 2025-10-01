const path = require('path');

module.exports = {
  emailTemplate: path.join(__dirname, '../templates/verification.html'),
  logo: path.join(__dirname, '../assets/domus.png'),
  forgotPasswordTemplate: path.join(__dirname, '../templates/forgotpassword.html'),
  createdProjectTemplate: path.join(__dirname, '../templates/createdProject.html')
}