import React from "react";
import Routes from "./routes/index.jsx";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import { ThemeProvider, useCustomTheme } from "./context/Theme/ThemeContext";
import { TutorialProvider } from "./context/Tutorial/TutorialContext";

// Import unified theme CSS
import "./assets/css/unified-theme.css";
import "./assets/css/font-override.css";
import "./assets/css/tutorial-styles.css";

const AppContent = () => {
	const { theme } = useCustomTheme();

	return (
		<MuiThemeProvider theme={theme}>
			<CssBaseline />
			<TutorialProvider>
				<Routes />
			</TutorialProvider>
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