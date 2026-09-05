import { render, screen } from "@testing-library/react";
import RegisteredPage from "../RegisteredPage";

jest.mock("../UserLogin.js", () => {
  return function MockUserLogin() {
    return <div data-testid="user-login-component">User Login Mock</div>;
  };
});

describe("RegisteredPage Component", () => {
  test("renders email verification success message and section divider", () => {
    render(<RegisteredPage />);

    expect(
      screen.getByText(
        /thank you for verifying your email address! please log in using your credentials\./i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText(/registered user login:/i)).toBeInTheDocument();
  });

  test("renders child UserLogin component", () => {
    render(<RegisteredPage />);

    expect(screen.getByTestId("user-login-component")).toBeInTheDocument();
    expect(screen.getByText("User Login Mock")).toBeInTheDocument();
  });
});
