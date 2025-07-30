import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_URL,
	withCredentials: true,
	timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to ensure credentials are always included
api.interceptors.request.use(
	(config) => {
		// Ensure credentials are included for all requests
		config.withCredentials = true;
		
		// Add some debugging for production
		if (import.meta.env.NODE_ENV === 'production') {
			console.debug('API Request:', {
				url: config.url,
				method: config.method,
				withCredentials: config.withCredentials,
				headers: config.headers
			});
		}
		
		return config;
	},
	(error) => {
		console.error('Request interceptor error:', error);
		return Promise.reject(error);
	}
);

// Add response interceptor for better error handling
api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Log authentication errors for debugging
		if (error.response?.status === 401 || error.response?.status === 403) {
			console.warn('Authentication error:', {
				status: error.response.status,
				url: error.config?.url,
				message: error.response?.data?.message || error.message
			});
		}
		
		return Promise.reject(error);
	}
);

export const openApi = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_URL
});

export default api;
