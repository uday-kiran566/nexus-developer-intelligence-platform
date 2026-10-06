const express = require("express");

const {
    createTeam,
    getTeams,
    addTeamMember,
    removeTeamMember,
    deleteTeam,
    getTeamMembers
} = require("../controllers/teamController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createTeam);

router.get(
    "/organization/:organizationId",
    authenticate,
    getTeams
);

router.post(
    "/:teamId/members",
    authenticate,
    addTeamMember
);

router.get(
    "/:teamId/members",
    authenticate,
    getTeamMembers
);

router.delete(
    "/:teamId/members/:memberId",
    authenticate,
    removeTeamMember
);

router.delete("/:teamId", authenticate, deleteTeam);

module.exports = router;