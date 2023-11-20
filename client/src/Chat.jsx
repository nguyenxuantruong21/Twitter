import { useEffect, useState } from "react";
import socket from "./socket";
import axios from "axios";

const profile = JSON.parse(localStorage.getItem("profile"));
const usernames = [
  {
    name: "user1",
    // user_name
    user_name: "Truongdev1",
  },
  {
    name: "user2",
    // user_name
    user_name: "truongdev",
  },
];

export default function Chat() {
  const [value, setValue] = useState("");
  const [conversations, setConversations] = useState([]);
  const [receiver, setReceiver] = useState("");

  // get profile client 2
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
    // id client 1
    socket.auth = {
      _id: profile._id,
    };
    socket.connect();
    socket.on("receive_message", (data) => {
      const { payload } = data;
      setConversations((conversations) => [...conversations, payload]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // get conversation show in frontend
  useEffect(() => {
    if (receiver) {
      axios
        .get(`/conversations/receivers/${receiver}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          baseURL: import.meta.env.VITE_API_URL,
          params: {
            limit: 10,
            page: 1,
          },
        })
        .then((res) => {
          setConversations(res.data.data.conversation);
        });
    }
  }, [receiver]);

  const send = (e) => {
    e.preventDefault();
    setValue("");
    const conversation = {
      content: value,
      sender_id: profile._id,
      receiver_id: receiver,
    };
    socket.emit("send_message", {
      payload: conversation,
    });
    // add conversation and add id
    setConversations((conversations) => [
      ...conversations,
      { ...conversation, _id: new Date().getTime() },
    ]);
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {usernames.map((username) => (
          <div key={username.name}>
            <button onClick={() => getProfile(username.user_name)}>
              {username.name}
            </button>
          </div>
        ))}
      </div>
      <div className="chat">
        {conversations.map((conversation) => (
          <div key={conversation._id}>
            <div className="message-container">
              <div
                className={
                  "message " +
                  (conversation.sender_id === profile._id
                    ? "message-right"
                    : "")
                }
              >
                {conversation.content}
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
