1. Client Problem

Nour sells scented candles, but her orders are scattered. She needs one dashboard to record orders, view customer requests, track order status, correct mistakes, and remove accidental entries.


2. Required Features

List orders with customer, product, quantity, total, and status.
View the full details of an order.
Create orders through a form.
Update order information and status.
Confirm before deleting an order.
Display total, pending, and delivered order counts.
Validate input on both the client and server.
Calculate totals on the server using integer cents to avoid floating-point money errors.
Use fictional customer information in demonstration evidence.

3. Api Endpoints

GET -> /api/orders -> List all orders -> 200
GET -> /api/orders/[id] -> list order by ID -> 200
POST -> /api/orders -> Create an order -> 201
PATCH -> /api/orders/[id] -> Update an order -> 200
DELETE -> /api/orders/[id] -> Delete an order -> 204

Invalid requests return 400 with a useful error message. Requests for nonexistent orders return 404.

4. Implementation Steps

Set up the project repository and assignment branch.
Create the required documentation structure.
Define the order type, validation rules, seed orders, and shared in-memory store.
Implement and verify all API endpoints.
Build the dashboard and connect its actions to the API.
Test successful and invalid requests using Postman or Thunder Client.
Capture the required API and mobile screenshots.
Complete the README, API, testing, and review documentation using verified results.

5. Constraints

Use in-memory server-side storage; data does not persist after a server restart.
Each order contains exactly one product line.
Supported statuses are pending, preparing, and delivered.
No database, authentication, payment processing, inventory management, or external integrations.
