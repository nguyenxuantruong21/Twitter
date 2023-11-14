import { useEffect, useState } from "react";
import socket from "./socket";
import axios from "axios";

export default function Chat() {
  const profile = JSON.parse(localStorage.getItem("profile"));
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState("");
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

  const getProfile = (username) => {
    axios
      .get(`/users/${username}`, {
        baseURL: import.meta.env.VITE_API_URL,
      })
      .then((res) => {
        setReceiver(res.data.data._id);
        alert(`Now you can chat ${res.data.data.name}`);
      });
  };

  useEffect(() => {
    socket.auth = {
      _id: profile._id,
    };
    socket.connect();
    socket.on("receiver private message", (data) => {
      const content = data.content;
      setMessages((message) => [
        ...message,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setValue("");
    socket.emit("private message", {
      content: value,
      to: receiver,
    });
    setMessages((messages) => [
      ...messages,
      {
        content: value,
        isSender: true,
      },
    ]);
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {usernames.map((username) => (
          <div key={username.name}>
            <button
              key={username.name}
              onClick={() => getProfile(username.value)}
            >
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
                  message.isSender === true
                    ? "message-right message"
                    : "message"
                }
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={(e) => {
            setValue(e.target.value);
          }}
          value={value}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
