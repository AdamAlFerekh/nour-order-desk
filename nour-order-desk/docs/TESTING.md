
# Nour Candle Studio — Testing Documentation

## Testing Overview

The API is tested by sending HTTP requests to its endpoints and checking the response status, response body, and resulting order data.

Testing focuses on:

- Successful requests for all five API endpoints.
- Validation of required fields and invalid values.
- Correct handling of orders that do not exist.
- Correct calculation of order totals.
- Prevention of unauthorized changes to server-controlled fields.
- Ensuring invalid updates do not partially modify an order.

## Test Environment

- Framework: Next.js App Router
- Language: TypeScript
- Storage: In-memory server-side array
- Testing approach: Manual HTTP request testing (Thunder Client)


## Successful Endpoint Tests

| Test              |           Expected Result        | Observed Result |
| GET `/api/orders` | `200 OK` with an array of orders | Passed |
| GET `/api/orders/order-001` | `200 OK` with the matching order | Passed |
| POST `/api/orders` with valid data | `201 Created` with a new order | Passed |
| PATCH `/api/orders/order-002` with valid data | `200 OK` with the updated order | Passed |
| DELETE an existing order | `204 No Content` | Passed |
| DELETE a nonexistent order | `404 Not Found` | Passed |



## Validation and Edge-Case Tests

| Test | Expected Result | Observed Result |
|---|---|---|
| POST with quantity `0` | `400 Bad Request` | Passed |
| POST with a valid decimal price such as `8.25` | `201 Created`, with the correct total | Passed |
| POST with a price of `8.257` | `400 Bad Request` | Passed |
| POST with a price of `1.15` | Accepted as a valid two-decimal price | Passed |
| POST with client-supplied `id`, `total`, and `status` | Server generates the ID, calculates the total, and sets status to `pending` | Passed |
| PATCH with an invalid quantity and another valid field | `400 Bad Request`; no partial update | Passed |
| PATCH with an invalid or unsupported field | `400 Bad Request` | Passed |
| PATCH attempting to modify `id` or `total` directly | `400 Bad Request` | Passed |

### Notes

During testing, a valid price of `1.15` was initially rejected because of floating-point precision. The validation was adjusted to tolerate tiny floating-point inaccuracies, and the `1.15` and `8.257` cases were tested again successfully.
