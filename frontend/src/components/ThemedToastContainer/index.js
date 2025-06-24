import React from "react";
import { ToastContainer } from "react-toastify";
import { useCustomTheme } from "../../context/Theme/ThemeContext";

const ThemedToastContainer = () => {
  const { darkMode } = useCustomTheme();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={darkMode ? "dark" : "light"}
    />
  );
};

export default ThemedToastContainer;