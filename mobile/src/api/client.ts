import axios from "axios";

const API_URL = "https://splitwise-shine-api.onrender.com/api";

const apiClient = axios.create({
  baseURL: API_URL,
});

export default apiClient;
