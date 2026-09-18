import { create } from "zustand";
import Constants from "expo-constants";
import type { QuantityTypeIdentifier } from "@kingstinct/react-native-healthkit";

export interface DailyHealthData {
  date: string; // ISO date
  steps: number;
  activeEnergyBurned: number;
}

interface HealthState {
  hasPermissions: boolean;
  dailyData: DailyHealthData[];
  isLoading: boolean;
  requestPermissions: () => Promise<boolean>;
  fetchWeeklyData: () => Promise<void>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  hasPermissions: false,
  dailyData: [],
  isLoading: false,


  requestPermissions: async () => {
    if (Constants.appOwnership === 'expo') {
      console.log("HealthKit is not available in Expo Go.");
      return false;
    }
    const HealthKit = require("@kingstinct/react-native-healthkit").default;
    try {
      const isAvailable = await HealthKit.isHealthDataAvailable();
      if (!isAvailable) {
        console.log("HealthKit not available");
        return false;
      }
      
      const success = await HealthKit.requestAuthorization({ toRead: [
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierActiveEnergyBurned'
      ] });
      
      set({ hasPermissions: success });
      return success;
    } catch (error) {
      console.error("HealthKit authorization error:", error);
      return false;
    }
  },


  fetchWeeklyData: async () => {
    if (!get().hasPermissions || Constants.appOwnership === 'expo') return;
    const HealthKit = require("@kingstinct/react-native-healthkit").default;

    set({ isLoading: true });
    try {
      // Fetch past 7 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();

      // Fetch steps
      const stepSamples = await HealthKit.queryQuantitySamples('HKQuantityTypeIdentifierStepCount', {
        from: startDate,
        to: endDate,
      } as any);

      // Fetch active energy
      const energySamples = await HealthKit.queryQuantitySamples('HKQuantityTypeIdentifierActiveEnergyBurned', {
        from: startDate,
        to: endDate,
      } as any);

      // Aggregate by day
      const dailyMap: Record<string, DailyHealthData> = {};
      
      // Initialize last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        dailyMap[iso] = { date: iso, steps: 0, activeEnergyBurned: 0 };
      }

      // Add steps
      stepSamples.forEach((sample: any) => {
        const dateStr = new Date(sample.startDate).toISOString().split('T')[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].steps += sample.quantity;
        }
      });

      // Add energy
      energySamples.forEach((sample: any) => {
        const dateStr = new Date(sample.startDate).toISOString().split('T')[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].activeEnergyBurned += sample.quantity;
        }
      });

      // Convert map to sorted array
      const sortedData = Object.keys(dailyMap)
        .sort()
        .map(k => dailyMap[k]);

      set({ dailyData: sortedData, isLoading: false });
    } catch (error) {
      console.error("HealthKit fetch error:", error);
      set({ isLoading: false });
    }
  }
}));
