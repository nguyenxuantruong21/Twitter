import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Chat from "./Chat";

// eslint-disable-next-line no-unused-vars
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login/oauth",
    element: <Login />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
]);

export default router;
