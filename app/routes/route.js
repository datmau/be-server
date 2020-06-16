const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/signup", userController.signup);

router.post("/login", userController.login);

router.get(
  "/employee/:employeeId/skills",
  userController.verifyLoggedUser,
  userController.getUserSkills
);

router.get(
  "/employees",
  userController.verifyLoggedUser,
  userController.authorizeRole("readAny", "skills"),
  userController.getEmployees
);

router.post(
  "/employees/:employeeId",
  userController.verifyLoggedUser,
  userController.updateSkills
)

router.get(
  "/employees/votes",
  userController.verifyLoggedUser,
  userController.authorizeRole("readAny", "skills"),
  userController.topEmployessByMonth
)

router.get(
  "/employees/registered",
  userController.verifyLoggedUser,
  userController.authorizeRole("readAny", "skills"),
  userController.registeredEmployees
)

module.exports = router;
