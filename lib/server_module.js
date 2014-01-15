/**
 * This module will include all the server specific modules. So when we bundle
 * the client side code using browserify, we can easily ignore these modules.
 *
 */

var util = require('./util.js');

if (!util.env.is_server) {
  return null;
}

exports.mmm = require('mmmagic'); //for image type detection
