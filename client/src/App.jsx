/* eslint-disable no-unused-vars */
import "./App.css";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { useEffect } from "react";
import axios from "axios";

function App() {
  const controller = new AbortController();
  useEffect(() => {
    axios
      .get("/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        baseURL: "http://localhost:4000",
        signal: controller.signal,
      })
      .then((res) => {
        localStorage.setItem("profile", JSON.stringify(res.data.data));
      });
    return () => {
      controller.abort();
    };
  });
  return <RouterProvider router={router} />;
}

export default App;
