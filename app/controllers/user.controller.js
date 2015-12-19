(function() {
  'use strict';

  var models = require('./../models'),
    config = require('./../../config/pass'),
    jwt = require('jsonwebtoken'),

    /**
     * Models instancies
     * @type {[Objects]}
     */
    User = models.User,
    Role = models.Role;

  module.exports = {

    /**
     * [logout method]
     * @param  {[http request]} req [request session]
     * @param  {[http response]} res [response on request]
     * @return {[json]}     [Json response]
     */
    logout: function(req, res) {
      req.session.destroy(function(err) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(200).json({
            success: true,
            message: 'You are logged out'
          });
        }
      });
    },
    /**
     * [login method]
     * @param  {[http request]} req [http request body]
     * @param  {[http response]} res [http response on request]
     * @return {[JSON]}     [response status]
     */
    login: function(req, res) {
      User.findOne({
        userName: req.body.userName
      }, function(err, user) {
        if (err) {
          res.status(500).send(err);
        }
        if (!user) {
          res.status(406).send({
            success: false,
            message: 'Invalid user'
          });
        } else if (user) {
          var isValid = user.comparePassword(req.body.password);
          if (!isValid) {
            res.status(406).json({
              success: false,
              message: 'Invalid password'
            });
          } else {
            var token = jwt.sign(user, config.secret, {
              expiresIn: 1440 // expires in 24 hrs
            });
            res.status(200).json({
              token: token,
              success: true,
              message: 'Login successful'
            });
          }
        }
      });
    },
    /**
     * [createUser method]
     * @param  {[http request]} req [http request body]
     * @param  {[http response]} res [http response on request]
     * @return {[JSON]}     [response status]
     */
    createUser: function(req, res) {
      var userData = req.body;
      if (!userData.role) {
        res.status(406).json({
          success: false,
          message: 'Please, provide your role'
        });
      } else if (!(userData.firstName && userData.lastName)) {
        res.status(406).json({
          success: false,
          message: 'Please, provide your firstName and lastName'
        });
      } else if ((userData.password).length < 8 || undefined) {
        res.status(406).send({
          success: false,
          message: 'Password must not be less than 8 characters'
        });
      } else if (!userData.email || !userData.userName) {
        res.status(406).send({
          success: false,
          message: 'Please enter your userName and email'
        });
      } else {
        Role.findOne({
          title: userData.role
        }, function(err, roles) {
          if (!roles) {
            res.status(406).send({
              success: false,
              message: 'Invalid role'
            });
          } else {
            User.findOne({
              userName: userData.userName
            }, function(err, users) {
              if (users) {
                res.status(409).send({
                  success: false,
                  message: 'UserName already exist'
                });
              } else {
                var userDetail = {
                  name: {
                    firstName: userData.firstName,
                    lastName: userData.lastName
                  },
                  userName: userData.userName,
                  email: userData.email,
                  password: userData.password,
                  role: userData.role
                };
                var newUser = new User(userDetail);
                newUser.save(function(err) {
                  if (err) {
                    res.status(500).send(err);
                  } else {
                    res.status(200).json({
                      success: true,
                      message: 'User created successfully'
                    });
                  }
                });
              }
            });
          }
        });
      }
    },
    /**
     * [getAllUsers method]
     * @param  {[http request]} req [http request on API]
     * @param  {[http response]} res [http response on resquest]
     * @return {[JSON]}     [response status and/or json response]
     */
    getAllUsers: function(req, res) {
      User.find({}, function(err, users) {
        if (err) {
          res.status(500).send(err);
        } else if (!users) {
          res.status(404).send({
            success: false,
            message: 'No user found'
          });
        } else {
          res.status(200).json(users);
        }
      });
    },
    /**
     * [getUser method]
     * @param  {[http request]} req [http request params]
     * @param  {[http response]} res [http response on request]
     * @return {[JSON]}     [json response and/or status]
     */
    getUser: function(req, res) {
      User.findById(req.params.id, function(err, user) {
        if (err) {
          res.status(500).send(err);
        } else if (!user) {
          res.status(404).send({
            success: false,
            message: 'No user found by that Id'
          });
        } else {
          res.status(200).json(user);
        }
      });
    },
    /**
     * [updateUser method]
     * @param  {[http request]} req [http request params and body]
     * @param  {[http response]} res [http response on request]
     * @return {[JSON]}     [json response and/or status]
     */
    updateUser: function(req, res) {
      var userData = req.body;
      var userDetail = {
        name: {
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        userName: userData.userName,
        email: userData.email,
        password: userData.password,
        role: userData.role
      };
      Role.findOne({
        title: userDetail.role
      }, function(err, role) {
        // check that role is provide and role is not role admin
        if (!role || role.title === config.admin) {
          res.status(406).json({
            success: false,
            message: 'Please provide your role'
          });
        } else {
          User.findByIdAndUpdate(req.params.id, userDetail,
            function(err, user) {
            if (err) {
              res.status(500).send(err);
            } else if (!user) {
              res.status(404).json({
                success: false,
                message: 'User not available'
              });
            } else {
              res.status(200).json({
                success: true,
                message: 'User details updated'
              });
            }
          });
        }
      });
    },
    /**
     * [deleteUser method]
     * @param  {[http request]} req [http request params]
     * @param  {[http response]} res [http response on request]
     * @return {[JSON]}     [response status]
     */
    deleteUser: function(req, res) {
      User.findByIdAndRemove(req.params.id, function(err, user) {
        if (err) {
          res.status(500).send(err);
        } else if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not available'
          });
        } else {
          res.status(200).json({
            success: true,
            message: 'User deleted successfully'
          });
        }
      });
    }
  };
})();