import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "https://splitwise-shine-api.onrender.com/api";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 45000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
