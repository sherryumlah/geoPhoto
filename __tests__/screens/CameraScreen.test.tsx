import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";
import CameraScreen from "../../app/(tabs)/camera";
import { useLocation } from "../../hooks/useLocation";

// we'll capture the latest onCameraReady from the mock so tests can invoke it
let latestOnCameraReady: (() => void) | null = null;

// ─────────────────────────────────────────────
// SHARED MOCKS
// ─────────────────────────────────────────────

// we need to control the camera ref + onCameraReady + permissions
const mockTakePicture = jest.fn();
const mockCameraRef = { takePictureAsync: mockTakePicture };

// single, consolidated mock for expo-camera
jest.mock("expo-camera", () => {
  const React = require("react");
  return {
    useCameraPermissions: jest.fn(),
    CameraView: jest.fn().mockImplementation((props: any) => {
      // attach our fake camera ref
      if (props?.ref) {
        props.ref.current = mockCameraRef;
      }
      // store onCameraReady for the test to call later
      latestOnCameraReady = props?.onCameraReady ?? null;
      return <React.Fragment>{props.children}</React.Fragment>;
    }),
  };
});

// media library mocks
const mockRequestPermissionsAsync = jest.fn();
const mockCreateAssetAsync = jest.fn();
const mockGetAlbumAsync = jest.fn();
const mockCreateAlbumAsync = jest.fn();
const mockAddAssetsToAlbumAsync = jest.fn();

jest.mock("expo-media-library", () => ({
  usePermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  requestPermissionsAsync: (...args: any[]) =>
    mockRequestPermissionsAsync(...args),
  createAssetAsync: (...args: any[]) => mockCreateAssetAsync(...args),
  getAlbumAsync: (...args: any[]) => mockGetAlbumAsync(...args),
  createAlbumAsync: (...args: any[]) => mockCreateAlbumAsync(...args),
  addAssetsToAlbumAsync: (...args: any[]) => mockAddAssetsToAlbumAsync(...args),
}));

// constants
jest.mock("expo-constants", () => ({
  appOwnership: "standalone",
  executionEnvironment: "standalone",
}));

// location hook
jest.mock("../../hooks/useLocation", () => ({
  useLocation: jest.fn(),
}));

// db + event bus
const mockInsertGeoPhoto = jest.fn();
const mockUpdateGeoPhotoNote = jest.fn();
const mockEmit = jest.fn();

jest.mock("../../lib/db/eventBus", () => ({
  emit: (...args: any[]) => mockEmit(...args),
}));

jest.mock("../../lib/db/geoPhotoRepo", () => ({
  insertGeoPhoto: (...args: any[]) => mockInsertGeoPhoto(...args),
  updateGeoPhotoNote: (...args: any[]) => mockUpdateGeoPhotoNote(...args),
}));

// icons — make them inert so they don't setState in tests
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props: any) => <React.Fragment>{props.name}</React.Fragment>,
  };
});

// aliases to the mocked modules
const { useCameraPermissions } = require("expo-camera") as {
  useCameraPermissions: jest.Mock;
};
const mockUseLocation = useLocation as jest.Mock;

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("CameraScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestOnCameraReady = null;

    mockTakePicture.mockReset();
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockCreateAssetAsync.mockResolvedValue({
      id: "asset123",
      uri: "file://photo.jpg",
    });
    // default: album exists
    mockGetAlbumAsync.mockResolvedValue({ id: "album123" });
    // default: DB insert success
    mockInsertGeoPhoto.mockResolvedValue(42);
  });

  // ───────────────
  // PERMISSION STATES
  // ───────────────

  test("shows a loading state when camera permission object not ready yet", () => {
    useCameraPermissions.mockReturnValue([null, jest.fn()]);
    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: null,
      location: null,
      address: null,
      refetchLocation: jest.fn(),
    });

    render(<CameraScreen />);

    expect(screen.getByText(/checking camera permissions/i)).toBeTruthy();
  });

  test("shows permission denied state when camera permission is not granted", () => {
    const requestPermission = jest.fn();
    useCameraPermissions.mockReturnValue([{ granted: false }, requestPermission]);

    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: null,
      location: null,
      address: null,
      refetchLocation: jest.fn(),
    });

    render(<CameraScreen />);

    expect(
      screen.getByText(/we need your permission to use the camera/i)
    ).toBeTruthy();

    const btn = screen.getByText(/grant permission/i);
    fireEvent.press(btn);
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  test("renders camera UI when permission is granted", async () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: null,
      location: {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
        },
      },
      address: {
        city: "Chicago",
        region: "IL",
        country: "USA",
      },
      refetchLocation: jest.fn(),
    });

    render(<CameraScreen />);

    // now manually fire the camera-ready callback
    if (latestOnCameraReady) {
      await act(async () => {
        latestOnCameraReady && latestOnCameraReady();
      });
    }

    await waitFor(() => {
      expect(screen.getByText(/chicago/i)).toBeTruthy();
    });

    expect(screen.getByText(/flip/i)).toBeTruthy();
  });

  test("shows location error banner when useLocation returns error", async () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: "Permission to access location was denied",
      location: null,
      address: null,
      refetchLocation: jest.fn(),
    });

    render(<CameraScreen />);

    if (latestOnCameraReady) {
      await act(async () => {
        latestOnCameraReady && latestOnCameraReady();
      });
    }

    await waitFor(() => {
      expect(
        screen.getByText(/no location: permission to access location was denied/i)
      ).toBeTruthy();
    });
  });

  // ───────────────
  // BEHAVIOR / ACTIONS
  // ───────────────

  test("toggleCameraFacing flips from back to front", async () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: null,
      location: null,
      address: null,
      refetchLocation: jest.fn(),
    });

    const { getByText } = render(<CameraScreen />);

    if (latestOnCameraReady) {
      await act(async () => {
        latestOnCameraReady && latestOnCameraReady();
      });
    }

    const flip = getByText(/flip/i);
    fireEvent.press(flip);

    const { CameraView } = require("expo-camera");
    const calls = (CameraView as jest.Mock).mock.calls;
    const lastCallProps = calls[calls.length - 1][0];
    expect(lastCallProps.facing).toBe("front");
  });

  test("does not try to take photo if we never press the shutter", async () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: null,
      location: null,
      address: null,
      refetchLocation: jest.fn(),
    });

    render(<CameraScreen />);

    if (latestOnCameraReady) {
      await act(async () => {
        latestOnCameraReady && latestOnCameraReady();
      });
    }

    expect(mockTakePicture).not.toHaveBeenCalled();
  });

  test("takes photo, saves to media library, inserts into DB, and opens note modal", async () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    mockUseLocation.mockReturnValue({
      loading: false,
      errorMsg: null,
      location: {
        coords: { latitude: 41.8781, longitude: -87.6298 },
      },
      address: {
        city: "Chicago",
        region: "IL",
        country: "USA",
      },
      refetchLocation: jest.fn(),
    });

    mockTakePicture.mockResolvedValue({
      uri: "file://photo.jpg",
    });

    const { getByTestId, queryByText } = render(<CameraScreen />);

    if (latestOnCameraReady) {
      await act(async () => {
        latestOnCameraReady && latestOnCameraReady();
      });
    }

    const shutter = await waitFor(() => getByTestId("shutter"));
    fireEvent.press(shutter);

    await waitFor(() => {
      expect(mockInsertGeoPhoto).toHaveBeenCalledTimes(1);
    });

    expect(queryByText(/add a journal note/i)).toBeTruthy();
    expect(mockEmit).toHaveBeenCalledWith("geoPhoto:created", { id: 42 });
  });
});
