"use client";
import {
  Box,
  Button,
  Flex,
  Select,
  SplitterPane,
  Table,
  TableTbody,
  TableThead,
  TextInput,
} from "@mantine/core";
import { ReactNode, useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api";

export default function UserListing() {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("sse");
  const [connection, setConnection] = useState("Connecting...");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("active");
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
      setConnection("Connected");
    } catch (error) {
      console.error(error);
      setConnection("Server unavailable");
    }
  }, []);
  useEffect(() => {
    fetchUsers();

    if (mode === "polling") {
      setConnection("Polling");

      const intervalId = setInterval(fetchUsers, 3000);

      return () => clearInterval(intervalId);
    }

    const eventSource = new EventSource(`${API_URL}/events`);

    eventSource.addEventListener("connected", () => {
      setConnection("SSE connected");
    });

    eventSource.addEventListener("user-created", (event) => {
      const newUser = JSON.parse(event.data);

      // Add or replace the user without duplicating it
      setUsers((previousUsers) => {
        const exists = previousUsers.some((user) => user.id === newUser.id);

        if (exists) {
          return previousUsers.map((user) =>
            user.id === newUser.id ? newUser : user,
          );
        }

        return [...previousUsers, newUser];
      });

      setMessage(`Live update received for ${newUser.name}`);
    });

    eventSource.onerror = () => {
      setConnection("SSE reconnecting...");
    };

    return () => eventSource.close();
  }, [mode, fetchUsers]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create user");
      }

      setMessage(
        `Created ${result.user.name}. Waiting for the list to update...`,
      );

      setName("");
      setEmail("");
      setStatus("active");

      // In polling mode, the next poll will fetch the new user.
      // In SSE mode, the server will broadcast the new user.
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">REAL-TIME DEMO</p>
          <h1>User Dashboard</h1>
          <p className="subtitle">Compare polling with Server-Sent Events.</p>
        </div>

        {/* <span className="connection">{connection}</span> */}
      </header>

      <section className="panel">
        <h2>Update strategy</h2>

        <div className="mode-switch">
          <Button
            mr="sm"
            className={mode === "polling" ? "selected" : ""}
            onClick={() => setMode("polling")}
          >
            Polling · 3 seconds
          </Button>

          <Button
            className={mode === "sse" ? "selected" : ""}
            onClick={() => setMode("sse")}
          >
            Server-Sent Events
          </Button>
        </div>

        <p className="hint">
          {mode === "polling"
            ? "The browser requests the user list every 3 seconds."
            : "The server pushes new-user events to this browser."}
        </p>
      </section>

      <section className="panel">
        <h2>Create a user</h2>

        <form onSubmit={handleSubmit} className="user-form">
          <Flex gap="xs">
            <TextInput
              w="20%"
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Aman Sharma"
              required
            />

            <TextInput
              w="20%"
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="aman@example.com"
              required
            />

            <Select
              label="Status"
              w="20%"
              value={status}
              data={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              onChange={(event) => setStatus(event.target.value)}
            />

            <Button type="submit" className="primary" mt="lg">
              Create user
            </Button>
          </Flex>
        </form>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="panel">
        <Flex className="list-header" bdrs="sm" p="md" mb="md" bg="gray.0">
          <h5>Users</h5>
          <Box ml="sm">{users.length} total</Box>
        </Flex>

        {users.length === 0 ? (
          <p className="hint">No users found or data is loading.</p>
        ) : (
          <div className="table-wrapper">
            <Table striped highlightOnHover>
              <TableThead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>ID</th>
                </tr>
              </TableThead>
              <TableTbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="user-id">{user.id}</td>
                  </tr>
                ))}
              </TableTbody>
            </Table>
          </div>
        )}
      </section>
    </main>
  );
}
