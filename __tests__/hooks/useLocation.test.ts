import { renderHook, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";
import { useLocation } from '../../hooks/useLocation';

// --- Mock expo-location ---
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: {
    High: 3,
  }
}));

test("returns location after permission granted", async () => {
  // permission granted
  (Location.requestForegroundPermissionsAsync as jest.Mock)
    .mockResolvedValue({ status: "granted" });

  // current GPS position
  (Location.getCurrentPositionAsync as jest.Mock)
    .mockResolvedValue({
      coords: { latitude: 41.8781, longitude: -87.6298 },
    });

  // human-readable address
  (Location.reverseGeocodeAsync as jest.Mock)
    .mockResolvedValue([
      { city: "Chicago", region: "IL", country: "USA" },
    ]);

  const { result } = renderHook(() => useLocation());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.location).not.toBeNull();
  expect(result.current.location?.coords.latitude).toBe(41.8781);
  expect(result.current.address).toEqual(
    expect.objectContaining({
      city: "Chicago",
    })
  );
});

test("sets errorMsg when permission denied", async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock)
    .mockResolvedValue({ status: "denied" });

  const { result } = renderHook(() => useLocation());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.location).toBeNull();
  expect(result.current.errorMsg).toMatch(/denied/i);
});

test("sets errorMsg when getCurrentPositionAsync throws", async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock)
    .mockResolvedValue({ status: "granted" });

  (Location.getCurrentPositionAsync as jest.Mock)
    .mockRejectedValue(new Error("GPS failure"));

  const { result } = renderHook(() => useLocation());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.errorMsg).toMatch(/GPS failure/);
});

test("does not set address when reverse geocode returns empty array", async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
    status: "granted",
  });

  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
    coords: {
      latitude: 41.8781,
      longitude: -87.6298,
    },
    timestamp: Date.now(),
  });

  (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);

  const { result } = renderHook(() => useLocation());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.address).toBeNull();
  expect(result.current.location).not.toBeNull();
});

test("falls back to default error message when error has no message", async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock)
    .mockResolvedValue({ status: "granted" });

  // reject with an empty object – no .message
  (Location.getCurrentPositionAsync as jest.Mock)
    .mockRejectedValue({});

  const { result } = renderHook(() => useLocation());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.errorMsg).toBe("Failed to get location");
});
