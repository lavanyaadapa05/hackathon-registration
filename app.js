const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/events");

// Schema for Team
const TeamSchema = new mongoose.Schema({
    teamName: String,
    leaderName: String,
    leaderEmail: String,
    projectIdea: String,
    members: [{ name: String, email: String, accepted: Boolean }]
});

const Team = mongoose.model("Team", TeamSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "amughdham@gmail.com",
        pass: "uaweajcromkupfnr"
    }
});

// 🟢 Register a new team
app.post("/register-team", async (req, res) => {
    const { leaderName, leaderEmail, teamName, projectIdea, members } = req.body;

    // Save team to database
    const newTeam = new Team({
        teamName,
        leaderName,
        leaderEmail,
        projectIdea,
        members: members.map(member => ({
            name: member.name,
            email: member.email,
            accepted: false
        }))
    });

    await newTeam.save();

    // Send email invitations
    for (const member of members) {
        const inviteLink = `http://localhost:5000/accept-invite?team=${newTeam._id}&email=${member.email}`;
        const mailOptions = {
            from: "22b01a0555@svecw.edu.in",
            to: member.email,
            subject: "Hackathon Team Invitation",
            text: `Hello ${member.name},\n\nYou have been invited to join the team "${teamName}" for the hackathon. Click below to accept:\n\n${inviteLink}`
        };
        transporter.sendMail(mailOptions);
    }

    res.json({ message: "Team registered successfully. Invitations sent!" });
});

// 🟢 Accept Invitation
app.get("/accept-invite", async (req, res) => {
    const { team, email } = req.query;

    const updatedTeam = await Team.findOneAndUpdate(
        { _id: team, "members.email": email },
        { $set: { "members.$.accepted": true } },
        { new: true }
    );

    if (!updatedTeam) {
        return res.status(400).json({ message: "Invalid team or email." });
    }

    res.json({ message: "You have successfully accepted the invitation!" });
});

// 🟢 Get Valid Teams (Admin Panel)
app.get("/valid-teams", async (req, res) => {
    const validTeams = await Team.find({ "members.accepted": true });
    res.json(validTeams);
});

// Start Server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});
