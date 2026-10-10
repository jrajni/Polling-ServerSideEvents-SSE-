const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs/promises");

const usersData = require("./users.json");
const usersFilePath = path.join(__dirname, "users.json");

const app = express();

app.use(cors());
app.use(express.json());

const { randomUUID } = require("crypto");
const { broadcastUserCreated, clients } = require("./helper");

app.get("/", (req, res) => {
  res.send("working");
});

app.get("/api/users", async (req, res) => {
  try {
    const fileData = await fs.readFile(usersFilePath, "utf8");
    const usersData = JSON.parse(fileData);

    res.status(200).json(usersData.users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// POST API: create a user
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, status } = req.body;

    // Validate required fields
    if (!name || !email || !status) {
      return res.status(400).json({
        message: "Name, email and status are required",
      });
    }

    // Read the latest data from the JSON file
    const fileData = await fs.readFile(usersFilePath, "utf8");
    const usersData = JSON.parse(fileData);

    // Generate a new ID
    const newId = randomUUID();

    // Create the user
    const newUser = {
      id: newId,
      name,
      email,
      status,
    };

    // Add the user to the array
    usersData.users.push(newUser);

    // Save the updated array to the file
    await fs.writeFile(
      usersFilePath,
      JSON.stringify(usersData, null, 2),
      "utf8",
    );

    broadcastUserCreated(newUser);

    // Send the response to the client
    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  // Register this connected browser
  clients.add(res);

  // Tell the browser that SSE is connected
  res.write("event: connected\n");
  res.write('data: {"message":"Connected to SSE"}\n\n');

  // Remove disconnected browsers
  res.on("close", () => {
    clients.delete(res);
  });
});

app.listen(3000, (req, res) => {
  console.log("up and running");
});
