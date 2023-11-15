import { useEffect, useState } from "react";
import socket from "./socket";
import axios from "axios";

const profile = JSON.parse(localStorage.getItem("profile"));
const usernames = [
  {
    name: "user1",
    value: "Truongdev1",
  },
  {
    name: "user2",
    value: "truongdev",
  },
];

export default function Chat() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState("");

  const getProfile = (username) => {
    axios
      .get(`/users/${username}`, {
        baseURL: import.meta.env.VITE_API_URL,
      })
      .then((res) => {
        setReceiver(res.data.data._id);
      });
  };

  useEffect(() => {
    socket.auth = {
      _id: profile._id,
    };
    socket.connect();
    socket.on("receive private message", (data) => {
      const content = data.content;
      setMessages((messages) => [
        ...messages,
        {
          content,
          isSender: false,
        },
      ]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const send = (e) => {
    e.preventDefault();
    setValue("");
    socket.emit("private message", {
      content: value,
      to: receiver,
    });
    setMessages((messages) => [
      ...messages,
      { content: value, isSender: true },
    ]);
  };
  return (
    <div>
      <h1>Chat</h1>
      <div>
        {usernames.map((username) => (
          <div key={username.name}>
            <button onClick={() => getProfile(username.value)}>
              {username.name}
            </button>
          </div>
        ))}
      </div>
      <div className="chat">
        {messages.map((message, index) => (
          <div key={index}>
            <div className="message-container">
              <div
                className={
                  "message " + (message.isSender ? "message-right" : "")
                }
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send}>
        <input
          type="text"
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
