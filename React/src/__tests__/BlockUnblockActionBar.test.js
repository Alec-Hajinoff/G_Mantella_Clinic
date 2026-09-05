import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BlockUnblockActionBar from "../BlockUnblockActionBar";
import { blockUnblockActionBar } from "../ApiService";

jest.mock("../ApiService");

describe("BlockUnblockActionBar Component", () => {
  const mockOnActionCompleted = jest.fn();
  const mockOnClearSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  test("renders nothing when no slots are selected", () => {
    const { container } = render(
      <BlockUnblockActionBar
        selectedSlots={[]}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("renders correct UI and both buttons when selected slots contain mixed statuses", () => {
    const mockSlots = [
      { id: 1, status: "available" },
      { id: 2, status: "blocked" },
    ];

    render(
      <BlockUnblockActionBar
        selectedSlots={mockSlots}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    expect(screen.getByText("2 slots selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^block selected slots/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /unblock selected slots/i }),
    ).toBeInTheDocument();
  });

  test("renders only 'Block' button when all selected slots are available", () => {
    const mockSlots = [{ id: 1, status: "available" }];

    render(
      <BlockUnblockActionBar
        selectedSlots={mockSlots}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    expect(screen.getByText("1 slot selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /block selected slots/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /unblock selected slots/i }),
    ).not.toBeInTheDocument();
  });

  test("handles successful slot action, triggers dispatchEvent, and fires callback", async () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    blockUnblockActionBar.mockResolvedValueOnce({ status: "success" });

    const mockSlots = [{ id: 1, status: "available" }];

    render(
      <BlockUnblockActionBar
        selectedSlots={mockSlots}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    const blockBtn = screen.getByRole("button", {
      name: /block selected slots/i,
    });
    fireEvent.click(blockBtn);

    expect(blockUnblockActionBar).toHaveBeenCalledWith([1], "block");

    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "bookingUpdated" }),
      );
      expect(mockOnActionCompleted).toHaveBeenCalledTimes(1);
    });

    dispatchEventSpy.mockRestore();
  });

  test("displays alert on API response failure", async () => {
    const mockErrorMessage = "Failed to update slot status.";
    blockUnblockActionBar.mockResolvedValueOnce({
      status: "error",
      message: mockErrorMessage,
    });

    const mockSlots = [{ id: 2, status: "blocked" }];

    render(
      <BlockUnblockActionBar
        selectedSlots={mockSlots}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /unblock selected slots/i }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(mockErrorMessage);
      expect(mockOnActionCompleted).not.toHaveBeenCalled();
    });
  });

  test("displays alert on network or runtime error", async () => {
    blockUnblockActionBar.mockRejectedValueOnce(
      new Error("Network disconnect"),
    );

    const mockSlots = [{ id: 1, status: "available" }];

    render(
      <BlockUnblockActionBar
        selectedSlots={mockSlots}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /block selected slots/i }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Network disconnect");
    });
  });

  test("triggers onClearSelection when Cancel button is clicked", () => {
    const mockSlots = [{ id: 1, status: "available" }];

    render(
      <BlockUnblockActionBar
        selectedSlots={mockSlots}
        onActionCompleted={mockOnActionCompleted}
        onClearSelection={mockOnClearSelection}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
  });
});
