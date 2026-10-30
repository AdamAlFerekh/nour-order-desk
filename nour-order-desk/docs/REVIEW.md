# Nour Candle Studio — Implementation Review

## 1. Implementation Summary

The project provides a REST-style API for managing customer orders using Next.js Route Handlers and TypeScript.

The API supports:

- Retrieving all orders.
- Retrieving an individual order by ID.
- Creating new orders.
- Updating existing orders.
- Deleting existing orders.

The implementation includes input validation, appropriate HTTP response statuses, error responses for invalid requests and missing orders, and server-side calculation of order totals.

## 2. Strengths

- Request data is validated before it is used to create or update orders.
- Order IDs are generated on the server.
- Order totals are calculated on the server rather than trusted from the client.
- New orders receive the initial status `pending`.
- Invalid PATCH requests are validated before the stored order is modified.
- HTTP status codes communicate success and failure appropriately.
- Decimal-price validation accounts for floating-point precision.

## 3. Limitations

- Orders are stored in memory, so data is not persistent across server restarts.
- The API has been verified through manual HTTP requests; automated test coverage has not yet been established.
- The API currently accepts any non-empty product name and any valid non-negative unit price instead of enforcing the predefined candle catalog and its suggested prices.

## 4. Potential Improvements

- Add automated tests for successful requests, invalid input, and missing orders.
- Introduce persistent database storage when the application requires durable data.
- Decide whether product names and prices should be restricted to the official product catalog.
- Improve centralized validation and error handling as the API grows.


# Assignment Review — Nour Candle Studio

## 1. Trace one Add Order action from the form to the Route Handler and back

When I submit the Add Order form, the frontend validates the input and sends a `POST` request to `/api/orders` using `fetch()`. The Route Handler validates the request, calculates the order total, creates the order, and returns an HTTP response. The frontend checks whether the response was successful, handles any errors, displays the result, and refreshes the order list.

## 2. Where is the total calculated, and why is that decision important?

The total is calculated on the server in the orders Route Handler. This is important because the server should not trust a total submitted by the client. Calculating it on the server ensures that the total is based on the product price and quantity. Using integer cents also avoids common floating-point money calculation errors.

## 3. Show one invalid request. Why did it fail, and did stored data remain unchanged?

**Invalid request:** `POST /api/orders` with a missing or invalid required field.

**Expected result:** The Route Handler should reject the request with `400 Bad Request` and an explanatory error message. The order should not be added to the in-memory store.

**Test evidence:** [Record the actual request, response status, and result of checking the order list in Thunder Client.]

## 4. What is the difference between PATCH and replacing an entire object?

`PATCH` updates only the specified fields of an existing order. For example, sending `{ "status": "delivered" }` changes the status without requiring the customer name, product, quantity, or other fields to be sent again. Replacing the entire object would require the complete replacement data and could overwrite fields that were not included.

## 5. What happens to your orders after a server restart?

Orders are stored in server-side in-memory storage. They are not saved to a database or permanent storage, so restarting the server resets the store and restores the seed orders.

## 6. Which AI suggestion did you correct or verify, and what evidence helped you decide?

I used AI to help implement and understand custom API errors with an `ApiError` class that extends JavaScript's `Error`. I checked how it was used in the frontend and verified that the application continued to work. This helped me understand how the frontend can preserve an API error's message and HTTP status when handling unsuccessful responses.


