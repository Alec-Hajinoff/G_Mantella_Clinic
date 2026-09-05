import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MainRegLog from "../MainRegLog";

jest.mock("../Main.js", () => {
  return function DummyMain({ isAuthenticated, userRole, isLoading }) {
    return (
      <div data-testid="dummy-main">
        Main Component - Auth: {String(isAuthenticated)}, Role: {userRole},
        Loading: {String(isLoading)}
      </div>
    );
  };
});

describe("MainRegLog Component", () => {
  test("renders Main component and passes props through correctly", () => {
    render(
      <MainRegLog
        isAuthenticated={true}
        userRole="customer"
        isLoading={false}
      />,
    );

    const mainElement = screen.getByTestId("dummy-main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveTextContent(
      "Main Component - Auth: true, Role: customer, Loading: false",
    );
  });

  test("attaches document event listeners on mount and removes them on unmount", () => {
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <MainRegLog isAuthenticated={false} userRole="" isLoading={false} />,
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  test("handles document mousedown and touchstart events without crashing", () => {
    render(
      <MainRegLog isAuthenticated={false} userRole="" isLoading={false} />,
    );

    expect(() => {
      fireEvent.mouseDown(document.body);
      fireEvent.touchStart(document.body);
    }).not.toThrow();
  });
});
