import { deleteOrder, getOrders, updateOrder, type Order } from "@/lib/orders";
import { normalizeLebaneseMobilePhone } from "@/lib/phone";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const order = getOrders().find((order) => order.id === id);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order, { status: 200 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const existingOrder = getOrders().find((order) => order.id === id);

  if (!existingOrder) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const data = body as Record<string, unknown>;
  const allowedFields = [
    "customerName",
    "phone",
    "productName",
    "quantity",
    "unitPrice",
    "status",
  ];

  const suppliedFields = Object.keys(data);

  if (suppliedFields.length === 0) {
    return Response.json(
      { error: "Provide at least one field to update." },
      { status: 400 },
    );
  }

  const forbiddenFields = suppliedFields.filter(
    (field) => field === "id" || field === "total",
  );

  if (forbiddenFields.length > 0) {
    return Response.json(
      { error: "The id and total fields cannot be updated directly." },
      { status: 400 },
    );
  }

  const invalidFields = suppliedFields.filter(
    (field) => !allowedFields.includes(field),
  );

  if (invalidFields.length > 0) {
    return Response.json(
      { error: `Unsupported field(s): ${invalidFields.join(", ")}` },
      { status: 400 },
    );
  }

  const updates: Partial<Omit<Order, "id" | "total">> = {};

  if ("customerName" in data) {
    if (typeof data.customerName !== "string" || !data.customerName.trim()) {
      return Response.json(
        { error: "Customer name is required." },
        { status: 400 },
      );
    }

    updates.customerName = data.customerName.trim();
  }

  if ("phone" in data) {
    const normalizedPhone = normalizeLebaneseMobilePhone(data.phone);

    if (!normalizedPhone) {
      return Response.json(
        {
          error:
            "Enter a valid Lebanese mobile number, such as 03 123 456 or +961 71 123 456.",
        },
        { status: 400 },
      );
    }

    updates.phone = normalizedPhone;
  }

  if ("productName" in data) {
    if (typeof data.productName !== "string" || !data.productName.trim()) {
      return Response.json(
        { error: "Product name is required." },
        { status: 400 },
      );
    }

    updates.productName = data.productName.trim();
  }

  if ("quantity" in data) {
    if (
      typeof data.quantity !== "number" ||
      !Number.isInteger(data.quantity) ||
      data.quantity < 1
    ) {
      return Response.json(
        { error: "Quantity must be a positive integer." },
        { status: 400 },
      );
    }

    updates.quantity = data.quantity;
  }

  if ("unitPrice" in data) {
    if (
      typeof data.unitPrice !== "number" ||
      !Number.isFinite(data.unitPrice) ||
      data.unitPrice < 0 ||
      Math.round(data.unitPrice * 100) !== data.unitPrice * 100
    ) {
      return Response.json(
        {
          error:
            "Unit price must be non-negative and have at most two decimal places.",
        },
        { status: 400 },
      );
    }

    updates.unitPrice = data.unitPrice;
  }

  if ("status" in data) {
    if (
      data.status !== "pending" &&
      data.status !== "preparing" &&
      data.status !== "delivered"
    ) {
      return Response.json(
        { error: "Status must be pending, preparing, or delivered." },
        { status: 400 },
      );
    }

    updates.status = data.status;
  }

  const quantity = updates.quantity ?? existingOrder.quantity;
  const unitPrice = updates.unitPrice ?? existingOrder.unitPrice;

  const total = (Math.round(unitPrice * 100) * quantity) / 100;

  const updatedOrder = updateOrder(id, {
    ...updates,
    total,
  });

  if (!updatedOrder) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(updatedOrder, { status: 200 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const deleted = deleteOrder(id);

  if (!deleted) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json(
    { message: "Order deleted successfully." },
    { status: 200 },
  );
}
