"use strict";
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { roles } = require("../roles");

exports.authorizeRole = (action, resource) => {
  return async (req, res, next) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
        return res.status(401).json({
          error: "You don't have enough permission to perform this action",
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

exports.verifyLoggedUser = async (req, res, next) => {
  try {
    const user = res.locals.loggedInUser;
    if (!user)
      return res.status(401).json({
        error: "You need to be logged in to access this route",
      });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function validatePassword(textPassword, hashedPassword) {
  if (!textPassword || !hashedPassword) {
    throw new Error("Both passwords are required for comparison");
  }
  const result = await bcrypt.compare(textPassword, hashedPassword);
  console.log(`Login attempt result: ${result}`);
  return result;
}

exports.signup = async (req, res, next) => {
  try {
    const { username, password, role, email } = req.body; // Añadido email
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "employee",
      createdAt: new Date(),
      isActive: true
    });
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    newUser.accessToken = accessToken;
    await newUser.save();
    res.json({
      data: newUser,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return next(new Error("Username does not exist!"));

    const isPasswordValid = await validatePassword(password, user.password);
    if (!isPasswordValid)
      return next(new Error("The provided password is not correct.!"));
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    await User.findByIdAndUpdate(user._id, { accessToken });
    res.status(200).json({
      data: { username: user.username, role: user.role },
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployees = async (req, res, next) => {
  try {
    const name = req.query.username;
    const employees = await User.find({ 
      username: { $ne: name },
      role: { $ne: "admin" }, // Cambio en master
      isActive: true // Cambio en la nueva rama
    }).select('-password -accessToken');
    res.status(200).json({
      data: employees,
      count: employees.length // Cambio adicional
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserSkills = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const user = await User.findById(employeeId);

    if (!user) return next(new Error("User does not exist!"));
    res.status(200).json({
      data: {
        _id: user._id,
        skills: user.skills,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSkills = async (req, res, next) => {
  try {
    const update = req.body;
    const employeeId = req.params.employeeId;
    await User.findByIdAndUpdate(employeeId, update);
    const user = await User.findById(employeeId);
    res.status(200).json({
      data: user,
      message: "User has been updated.",
    });
  } catch (error) {
    next(error);
  }
};

const getMapFromArray = (data, requestedMonth) => {
  if (data.length >= 0)
    data.reduce((acc, item, index) => {
      const date = item.messages[index];
      var check = moment(date.updatedAt, "YYYY/MM/DD");
      var month = check.format("M");
      if (month === requestedMonth) {
        acc[item.username] = { votes: 0 };
      }

      return acc;
    }, {});
};

function compare(firstItem, secondItem) {
  const firstValue = firstItem.votes;
  const secondValue = secondItem.votes;

  let comparison = 0;
  if (firstValue > secondValue) {
    comparison = 1;
  } else if (firstValue < secondValue) {
    comparison = -1;
  }
  return comparison;
}

exports.topEmployessByMonth = async (req, res, next) => {
  try {
    const requestedMonth = req.query.month;
    const name = req.query.username;
    if (!requestedMonth)
      return next(new Error("Provide a month or a valid month number"));
    const employees = await User.find({ username: { $ne: name } });

    for (let [key, value] of Object.entries(employees)) {
      getMapFromArray(value.skills, requestedMonth);
      console.log(`${key}: ${value}`);
    }
    const mappedEmployees = employees.map((acc, item) => {
      return getMapFromArray(item.skills, requestedMonth);
    });

    const sortedVotes = mappedVotes.sort(compare);

    res.status(200).json({
      data: sortedVotes,
    });
  } catch (error) {
    next(error);
  }
};

exports.registeredEmployees = async (req, res, next) =>{
  try {
    const employees = await User.find({ role: "employee" });
    res.status(200).json({
      data: {registeredEmployees: employees.length},
    });
  } catch (error) {
    next(error);
  }
};
