import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServiceManager from "../ServiceManager";
import { serviceManager } from "../ApiService";

jest.mock("../ApiService");

describe("ServiceManager Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders initial empty service form row without remove button", () => {
    render(<ServiceManager />);

    expect(screen.getByText("Garage Services Manager")).toBeInTheDocument();
    expect(screen.getByText("Service #1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  test("adds a new service row when '+ Add Another Service' is clicked", async () => {
    render(<ServiceManager />);

    const addBtn = screen.getByRole("button", {
      name: /\+ add another service/i,
    });
    await userEvent.click(addBtn);

    expect(screen.getByText("Service #1")).toBeInTheDocument();
    expect(screen.getByText("Service #2")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  test("removes a service row when 'Remove' button is clicked", async () => {
    render(<ServiceManager />);

    const addBtn = screen.getByRole("button", {
      name: /\+ add another service/i,
    });
    await userEvent.click(addBtn);

    const nameInputs = screen.getAllByRole("textbox");
    await userEvent.type(nameInputs[0], "MOT Test");
    await userEvent.type(nameInputs[1], "Brake Check");

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[0]);

    expect(screen.queryByDisplayValue("MOT Test")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Brake Check")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  test("shows validation error message when submitting empty or invalid fields", async () => {
    render(<ServiceManager />);

    const submitBtn = screen.getByRole("button", { name: /save services/i });
    await userEvent.click(submitBtn);

    expect(
      screen.getByText(
        /please complete all required fields \(name and duration in minutes\)\./i,
      ),
    ).toBeInTheDocument();
    expect(serviceManager).not.toHaveBeenCalled();
  });

  test("submits form successfully and resets input fields", async () => {
    serviceManager.mockResolvedValueOnce({ status: "success" });

    render(<ServiceManager />);

    const nameInput = screen.getByRole("textbox");
    const durationInput = screen.getByRole("spinbutton");
    const submitBtn = screen.getByRole("button", { name: /save services/i });

    await userEvent.type(nameInput, "Full Service");
    await userEvent.type(durationInput, "120");
    await userEvent.click(submitBtn);

    expect(serviceManager).toHaveBeenCalledWith([
      { name: "Full Service", duration_minutes: "120" },
    ]);

    await waitFor(() => {
      expect(
        screen.getByText("Services saved successfully."),
      ).toBeInTheDocument();
    });

    expect(nameInput).toHaveValue("");
    expect(durationInput).toHaveValue(null);
  });

  test("displays API error message when serviceManager fails", async () => {
    serviceManager.mockResolvedValueOnce({
      status: "error",
      message: "Database connection failed.",
    });

    render(<ServiceManager />);

    const nameInput = screen.getByRole("textbox");
    const durationInput = screen.getByRole("spinbutton");
    const submitBtn = screen.getByRole("button", { name: /save services/i });

    await userEvent.type(nameInput, "Oil Change");
    await userEvent.type(durationInput, "30");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Database connection failed."),
      ).toBeInTheDocument();
    });
  });
});
