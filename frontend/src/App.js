import React from "react";
import Routes from "./routes";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import { ThemeProvider, useCustomTheme } from "./context/Theme/ThemeContext";

// Import custom CSS after Material-UI components to ensure proper override
import "./assets/css/custom-paper-styles.css";
import "./assets/css/font-override.css";
import "./assets/css/dark-theme-fixes.css";
import "./assets/css/dark-mode-complete.css";
import "./assets/css/dark-mode-overrides.css";
import "./assets/css/message-input-dark.css";
import "./assets/css/messages-list-dark.css";
import "./assets/css/preserve-colors-dark.css";
import "./assets/css/input-fixes-dark.css";
import "./assets/css/toast-dark-theme.css";

const AppContent = () => {
	const { theme } = useCustomTheme();

	return (
		<MuiThemeProvider theme={theme}>
			<CssBaseline />
			<Routes />
		</MuiThemeProvider>
	);
};

const App = () => {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	);
};

export default App;