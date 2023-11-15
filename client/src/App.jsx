import { RouterProvider } from "react-router-dom";
import "./App.css";
import router from "./router";
import { useEffect } from "react";
import axios from "axios";

function App() {
  useEffect(() => {
    const controller = new AbortController();
    console.log("this is err");
    axios
      .get("/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        baseURL: import.meta.env.VITE_API_URL,
        signal: controller.signal,
      })
      .then((res) => {
        console.log(res);
        localStorage.setItem("profile", JSON.stringify(res.data.data));
      });
    return () => {
      controller.abort();
    };
  }, []);
  return <RouterProvider router={router} />;
}

export default App;
