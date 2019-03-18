module.exports = {
  options: {
    commitMessage: 'release <%= version %> [ci skip]',
    npm: false,
    tagName: 'v<%= version %>'
  }
};
