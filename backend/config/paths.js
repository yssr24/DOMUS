const path = require('path')

module.exports = {
  emailTemplate: path.join(__dirname, '../../frontend/src/components/support/verification.html'),
  logo: path.join(__dirname, '../../frontend/src/assets/domus.png'),
  forgotPasswordTemplate: path.join(__dirname, '../../frontend/src/components/support/forgotpassword.html'),
  createdProjectTemplate: path.join(__dirname, '../../frontend/src/components/support/client/createdProject.html')

}