import { render, screen } from '@testing-library/react-native';
import React from 'react';
import HomeScreen from '../../app/(tabs)/index';
import { useLocation } from "../../hooks/useLocation";

// MOCKS
jest.mock("../../hooks/useLocation", () => ({
  useLocation: jest.fn(),
}));

// EXPECTATIONS
test("renders the Refresh Location button", () => {
  (useLocation as jest.Mock).mockReturnValue({
    loading: false,
    errorMsg: null,
    location: { coords: { latitude: 41.8781, longitude: -87.6298 } },
    address: { city: "Chicago", region: "IL", country: "USA" },
    refetchLocation: jest.fn(),
  });

  render(<HomeScreen />);
  const button = screen.getByText("Refresh Location");
  expect(button).toBeTruthy();
});

test("shows loading spinner when loading is true", () => {
  (useLocation as jest.Mock).mockReturnValue({
    loading: true,
    errorMsg: null,
    location: null,
    address: null,
    refetchLocation: jest.fn(),
  });

  render(<HomeScreen />);
  expect(screen.getByText(/getting your location/i)).toBeTruthy();
});


test("shows error message when errorMsg is present", () => {
  (useLocation as jest.Mock).mockReturnValue({
    loading: false,
    errorMsg: "Permission to access location was denied",
    location: null,
    address: null,
    refetchLocation: jest.fn(),
  });

  render(<HomeScreen />);

  // the error message should appear
  expect(
    screen.getByText(/permission to access location was denied/i)
  ).toBeTruthy();

  // should NOT show the loading text
  expect(screen.queryByText(/getting your location/i)).toBeNull();

  // should NOT show the address or coordinates
  expect(screen.queryByText(/last fetched location/i)).toBeNull();

  // the Refresh button should still be visible
  expect(screen.getByText(/refresh location/i)).toBeTruthy();
});