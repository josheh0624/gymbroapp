import axios from "axios";
import { Platform } from "react-native";

const BASE_URL = Platform.select({
  ios: "http://localhost:3000",
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

export const api = axios.create({ baseURL: BASE_URL });
