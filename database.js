/*
 * All models will be defined here.
 */

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/users');  

var db = mongoose.connection;

/*
 * Users model used throughout the website.
 */
var Users = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true,
    index: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    index: true,
    required: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  validated: {
    type: Boolean,
    required: true,
  },
  validation_hash: {
    type: String,
    required: true,
  },
  reset_hash: {
    type: String,
    required: true,
  },
  reset_request_alive:{
    type: Boolean,
    required: true,
  }
});

var User = mongoose.model('User', Users);
exports.users = User;
