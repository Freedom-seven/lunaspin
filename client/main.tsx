import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root")!;
let root: Root = (container as any)._reactRoot || createRoot(container);
(container as any)._reactRoot = root;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
