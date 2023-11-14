// eslint-disable-next-line no-unused-vars
import React from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Link } from "react-router-dom";
import "vidstack/styles/defaults.css";
import "vidstack/styles/community-skin/video.css";
import {
  MediaCommunitySkin,
  MediaOutlet,
  MediaPlayer,
  MediaPoster,
} from "@vidstack/react";

const getGoogleAuthUrl = () => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth`;
  const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI } = import.meta.env;
  const query = {
    client_id: VITE_GOOGLE_CLIENT_ID,
    redirect_uri: VITE_GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    prompt: "consent",
  };
  const queryString = new URLSearchParams(query).toString();
  return `${url}?${queryString}`;
};

const googleOAuthUrl = getGoogleAuthUrl();

export default function Home() {
  const profile = JSON.parse(localStorage.getItem("profile")) || {};
  const isAuthenticated = Boolean(localStorage.getItem("access_token"));
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.reload();
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Google Oauth 2.0</h1>
      <p className="read-the-dosc">
        {isAuthenticated ? (
          <div>
            <span>
              Hello my <strong>{profile.email}</strong>,
            </span>
            <button onClick={logout}>logout</button>
          </div>
        ) : (
          <span>
            <Link to={googleOAuthUrl}>Login with google</Link>
          </span>
        )}
      </p>
      <div>
        <video width={500} height={500} controls>
          <source
            src="http://localhost:4000/static/video-hls/ZF2GgnHJPnUBvPFNQtUXm"
            type="video/mp4"
          />
        </video>
        <h2>HLS Streaming</h2>
        <MediaPlayer
          title="Sprite Fight"
          src="http://localhost:4000/static/video-hls/Hn3LkTdCGyUbOeRIKgRL6/master.m3u8"
          // poster='https://image.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/thumbnail.webp?time=268&width=980'
          // thumbnails='https://media-files.vidstack.io/sprite-fight/thumbnails.vtt'
          aspectRatio={16 / 9}
          crossorigin=""
        >
          <MediaOutlet>
            <MediaPoster alt="Girl walks into sprite gnomes around her friend on a campfire in danger!" />
          </MediaOutlet>
          <MediaCommunitySkin />
        </MediaPlayer>
      </div>
    </>
  );
}
