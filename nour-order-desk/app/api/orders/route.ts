import { addOrder, getOrders, type Order } from "@/lib/orders";
import { normalizeLebaneseMobilePhone } from "@/lib/phone";

export async function GET() {
  const orders = getOrders();

  return Response.json(orders, { status: 200 });
}

export async function POST(request: Request) {
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

  const { customerName, productName, quantity, unitPrice } = data;

  if (typeof customerName !== "string" || !customerName.trim()) {
    return Response.json(
      { error: "Customer name is required." },
      { status: 400 },
    );
  }

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

  if (typeof productName !== "string" || !productName.trim()) {
    return Response.json(
      { error: "Product name is required." },
      { status: 400 },
    );
  }

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return Response.json(
      { error: "Quantity must be a positive integer." },
      { status: 400 },
    );
  }

  if (
    typeof unitPrice !== "number" ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    Math.abs(unitPrice * 100 - Math.round(unitPrice * 100)) > 1e-8
  ) {
    return Response.json(
      {
        error:
          "Unit price must be non-negative and have at most two decimal places.",
      },
      { status: 400 },
    );
  }

  const order: Order = {
    id: crypto.randomUUID(),
    customerName: customerName.trim(),
    phone: normalizedPhone,
    productName: productName.trim(),
    quantity,
    unitPrice,
    total: (Math.round(unitPrice * 100) * quantity) / 100,
    status: "pending",
  };

  addOrder(order);

  return Response.json(order, { status: 201 });
}
