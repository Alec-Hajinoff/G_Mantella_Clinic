import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  passwordResetLink,
  passwordResetToken,
  updatePassword,
  checkSession,
  businessHoursManager,
  bookingCalendar,
  selectedAppointmentSlot,
  serviceManager,
  bookingDetailsForm,
  customerBookingsList,
  customerCancelBooking,
  customerProfileGet,
  customerProfilePost,
  customerDeleteAccount,
  adminBookingsList,
  adminCancelBooking,
  adminBookingCalendar,
  blockUnblockActionBar,
  availabilityHorizonExtender,
  adminProductEntry,
  productCatalogueGet,
  productCataloguePost,
  checkoutSessionCreate,
} from "../ApiService";

describe("ApiService Module", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Authentication Services", () => {
    it("registerUser posts form data successfully", async () => {
      const mockResponse = { status: "success", message: "User registered" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await registerUser({ email: "test@example.com" });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/form_capture.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: "test@example.com" }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("registerUser throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Failure"));

      await expect(registerUser({})).rejects.toThrow("An error occurred.");
    });

    it("loginUser sends credentials and returns response", async () => {
      const mockResponse = { status: "success", authenticated: true };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await loginUser({
        email: "test@example.com",
        password: "pwd",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/login_capture.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: "test@example.com", password: "pwd" }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("loginUser throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Failure"));

      await expect(loginUser({})).rejects.toThrow("An error occurred.");
    });

    it("logoutUser completes when response is ok", async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      await expect(logoutUser()).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/logout_component.php",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
    });

    it("logoutUser throws error on non-ok response", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });

      await expect(logoutUser()).rejects.toThrow(
        "An error occurred during logout.",
      );
    });

    it("logoutUser throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Error"));

      await expect(logoutUser()).rejects.toThrow(
        "An error occurred during logout.",
      );
    });

    it("checkSession returns authentication state", async () => {
      const mockResponse = { authenticated: true, role: "admin" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await checkSession();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/check_session.php",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("checkSession catches network error and returns default false state", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Error"));

      const result = await checkSession();

      expect(result).toEqual({ authenticated: false });
    });
  });

  describe("Email and Password Reset Services", () => {
    it("verifyEmail posts verification token successfully", async () => {
      const mockResponse = { status: "success", message: "Email verified" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await verifyEmail("token123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/verify_email.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token: "token123" }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("verifyEmail throws error on failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Verification failed"));

      await expect(verifyEmail("token123")).rejects.toThrow(
        "An error occurred during email verification.",
      );
    });

    it("passwordResetLink posts email address successfully", async () => {
      const mockResponse = { success: true, message: "Reset link sent" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await passwordResetLink("test@example.com");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/password_reset_link.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: "test@example.com" }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("passwordResetLink returns fallback success state on network error", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Server error"));

      const result = await passwordResetLink("test@example.com");

      expect(result).toEqual({ success: true });
    });

    it("passwordResetToken validates reset token successfully", async () => {
      const mockResponse = { valid: true, message: "Token valid" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await passwordResetToken("token123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/password_reset_token.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token: "token123" }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("passwordResetToken returns invalid state on network error", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Connection error"));

      const result = await passwordResetToken("invalid_token");

      expect(result).toEqual({
        valid: false,
        message: "An error occurred while verifying the token.",
      });
    });

    it("updatePassword updates user credentials successfully", async () => {
      const mockResponse = { success: true, message: "Password updated" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await updatePassword("token123", "newPassword123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/update_password.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token: "token123",
            password: "newPassword123",
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("updatePassword returns failure response on network error", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Update failed"));

      const result = await updatePassword("token123", "newPassword123");

      expect(result).toEqual({
        success: false,
        message: "An error occurred while updating the password.",
      });
    });
  });

  describe("Business & Service Management Services", () => {
    it("businessHoursManager posts business hours data successfully", async () => {
      const mockHoursData = { monday: { open: "08:00", close: "17:00" } };
      const mockResponse = { status: "success", message: "Hours saved" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await businessHoursManager(mockHoursData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/business_hours_manager.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ business_hours: mockHoursData }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("businessHoursManager throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Error"));

      await expect(businessHoursManager({})).rejects.toThrow(
        "An error occurred while saving business hours.",
      );
    });

    it("serviceManager posts service configuration data successfully", async () => {
      const mockServices = [{ id: 1, name: "Full Service", price: 150 }];
      const mockResponse = { status: "success", message: "Services updated" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await serviceManager(mockServices);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/service_manager.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ services: mockServices }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("serviceManager throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Error"));

      await expect(serviceManager([])).rejects.toThrow(
        "An error occurred while saving services.",
      );
    });

    it("bookingDetailsForm fetches available service list", async () => {
      const mockResponse = {
        status: "success",
        services: ["MOT", "Interim Service"],
      };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await bookingDetailsForm();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/booking_details_form.php",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("bookingDetailsForm throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Fetch failed"));

      await expect(bookingDetailsForm()).rejects.toThrow(
        "An error occurred while fetching services.",
      );
    });
  });

  describe("Customer Booking & Profile Services", () => {
    it("bookingCalendar fetches availability slots with query parameters", async () => {
      const mockSlots = { status: "success", slots: [] };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockSlots),
      });

      const result = await bookingCalendar("2026-09-01", "2026-09-07");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/booking_calendar.php?start_date=2026-09-01&end_date=2026-09-07",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toEqual(mockSlots);
    });

    it("bookingCalendar throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Failure"));

      await expect(bookingCalendar("2026-09-01", "2026-09-07")).rejects.toThrow(
        "An error occurred while loading the calendar.",
      );
    });

    it("selectedAppointmentSlot submits booking details successfully", async () => {
      const mockPayload = { slot_id: 10, service_id: 2 };
      const mockResponse = { status: "success", message: "Booking confirmed" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await selectedAppointmentSlot(mockPayload);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/selected_appointment_slot.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(mockPayload),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("selectedAppointmentSlot throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Error"));

      await expect(selectedAppointmentSlot({})).rejects.toThrow(
        "An error occurred while confirming your booking.",
      );
    });

    it("customerBookingsList fetches active bookings", async () => {
      const mockBookings = [{ id: 1, date: "2026-09-05" }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockBookings),
      });

      const result = await customerBookingsList();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/customer_bookings_list.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
      );
      expect(result).toEqual(mockBookings);
    });

    it("customerBookingsList throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(customerBookingsList()).rejects.toThrow(
        "An error occurred while fetching your bookings.",
      );
    });

    it("customerCancelBooking posts appointment ID for cancellation", async () => {
      const mockResponse = { status: "success", message: "Booking cancelled" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await customerCancelBooking(101);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/customer_cancel_booking.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ appointment_id: 101 }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("customerCancelBooking throws error on failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Cancel failed"));

      await expect(customerCancelBooking(101)).rejects.toThrow(
        "An error occurred while cancelling your booking.",
      );
    });

    it("customerProfileGet fetches user profile details", async () => {
      const mockProfile = { first_name: "John", surname: "Doe" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockProfile),
      });

      const result = await customerProfileGet();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/customer_profile_get.php",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toEqual(mockProfile);
    });

    it("customerProfileGet throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Fetch failed"));

      await expect(customerProfileGet()).rejects.toThrow(
        "An error occurred while loading your profile.",
      );
    });

    it("customerProfilePost updates profile details successfully", async () => {
      const mockData = { first_name: "Jane", phone: "07123456789" };
      const mockResponse = { status: "success" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await customerProfilePost(mockData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/customer_profile_post.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(mockData),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("customerProfilePost throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Post failed"));

      await expect(customerProfilePost({})).rejects.toThrow(
        "An error occurred while saving profile details.",
      );
    });

    it("customerDeleteAccount triggers profile soft-delete", async () => {
      const mockResponse = { status: "success", message: "Account deleted" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await customerDeleteAccount();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/customer_delete_account.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("customerDeleteAccount throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Delete failed"));

      await expect(customerDeleteAccount()).rejects.toThrow(
        "An error occurred while deleting your account.",
      );
    });
  });

  describe("Admin Management Services", () => {
    it("adminBookingsList fetches all garage bookings", async () => {
      const mockData = { upcoming: [], past: [] };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockData),
      });

      const result = await adminBookingsList();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/admin_bookings_list.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
      );
      expect(result).toEqual(mockData);
    });

    it("adminBookingsList throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Fetch failed"));

      await expect(adminBookingsList()).rejects.toThrow(
        "An error occurred while fetching garage bookings.",
      );
    });

    it("adminCancelBooking sends cancellation request", async () => {
      const mockResponse = {
        status: "success",
        message: "Booking cancelled by admin",
      };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await adminCancelBooking(50);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/admin_cancel_booking.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ appointment_id: 50 }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("adminCancelBooking throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Cancel failed"));

      await expect(adminCancelBooking(50)).rejects.toThrow(
        "An error occurred while cancelling the booking.",
      );
    });

    it("adminBookingCalendar fetches slots for admin range", async () => {
      const mockCalendarData = [{ date: "2026-09-01", slots: [] }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockCalendarData),
      });

      const result = await adminBookingCalendar("2026-09-01", "2026-09-30");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/admin_booking_calendar.php?start_date=2026-09-01&end_date=2026-09-30",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toEqual(mockCalendarData);
    });

    it("adminBookingCalendar throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Calendar error"));

      await expect(
        adminBookingCalendar("2026-09-01", "2026-09-30"),
      ).rejects.toThrow("An error occurred while loading the admin calendar.");
    });

    it("blockUnblockActionBar posts slot IDs and action", async () => {
      const mockResponse = { status: "success", message: "Slots updated" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await blockUnblockActionBar([1, 2, 3], "block");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/block_unblock_action_bar.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slot_ids: [1, 2, 3], action: "block" }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("blockUnblockActionBar throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Block failure"));

      await expect(blockUnblockActionBar([1], "block")).rejects.toThrow(
        "An error occurred while updating availability slots.",
      );
    });

    it("availabilityHorizonExtender sends horizon extension request", async () => {
      const mockResponse = { status: "success", message: "Horizon extended" };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await availabilityHorizonExtender();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/availability_horizon_extender.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("availabilityHorizonExtender throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Extension failed"));

      await expect(availabilityHorizonExtender()).rejects.toThrow(
        "An error occurred while extending availability slots.",
      );
    });

    it("adminProductEntry posts FormData directly without manual Content-Type header", async () => {
      const mockFormData = new FormData();
      mockFormData.append("name", "Engine Oil");
      const mockResponse = { status: "success", message: "Product added" };

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await adminProductEntry(mockFormData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/admin_product_entry.php",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: mockFormData,
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("adminProductEntry throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Product creation failed"));

      await expect(adminProductEntry(new FormData())).rejects.toThrow(
        "An error occurred while creating the product.",
      );
    });
  });

  describe("Product Catalogue & Checkout Services", () => {
    it("productCatalogueGet fetches list of items for sale", async () => {
      const mockCatalogue = [{ id: 1, name: "Brake Fluid", price: 12.99 }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockCatalogue),
      });

      const result = await productCatalogueGet();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/product_catalogue_get.php",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toEqual(mockCatalogue);
    });

    it("productCatalogueGet throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Catalogue load failed"));

      await expect(productCatalogueGet()).rejects.toThrow(
        "An error occurred while loading the product catalogue.",
      );
    });

    it("productCataloguePost initiates Stripe checkout session", async () => {
      const mockSession = {
        id: "cs_test_123",
        url: "https://checkout.stripe.com/123",
      };
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockSession),
      });

      const result = await productCataloguePost("price_123", 2);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/product_catalogue_post.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ stripe_price_id: "price_123", quantity: 2 }),
        }),
      );
      expect(result).toEqual(mockSession);
    });

    it("productCataloguePost throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Checkout failed"));

      await expect(productCataloguePost("price_123", 1)).rejects.toThrow(
        "An error occurred while initiating payment.",
      );
    });

    it("checkoutSessionCreate handles multi-item payload", async () => {
      const mockPayload = { items: [{ price: "price_1", quantity: 1 }] };
      const mockSession = { id: "cs_test_456" };

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockSession),
      });

      const result = await checkoutSessionCreate(mockPayload);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8001/Loveday_Auto/PHP/product_catalogue_post.php",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(mockPayload),
        }),
      );
      expect(result).toEqual(mockSession);
    });

    it("checkoutSessionCreate throws error on network failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Checkout failed"));

      await expect(checkoutSessionCreate({})).rejects.toThrow(
        "An error occurred while initiating payment.",
      );
    });
  });
});
