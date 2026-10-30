export type OrderStatus = "pending" | "preparing" | "delivered";

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: OrderStatus;
};

const orders: Order[] = [
  {
    id: "order-001",
    customerName: "Maya Haddad",
    phone: "DEMO-001",
    productName: "Vanilla Candle",
    quantity: 2,
    unitPrice: 8,
    total: 16,
    status: "pending",
  },
  {
    id: "order-002",
    customerName: "Karim Nassar",
    phone: "DEMO-002",
    productName: "Cedar Candle",
    quantity: 1,
    unitPrice: 10,
    total: 10,
    status: "preparing",
  },
  {
    id: "order-003",
    customerName: "Lina Saleh",
    phone: "DEMO-003",
    productName: "Mini Gift Candle",
    quantity: 3,
    unitPrice: 6,
    total: 18,
    status: "delivered",
  },
];

export function getOrders(): Order[] {
  return orders;
}

export function addOrder(order: Order): void {
  orders.push(order);
}

export function updateOrder(
  id: string,
  updates: Partial<Omit<Order, "id">>, ///Partial eno ma lezem eb3at kel l properties, Omit eno ma lezem eb3at l id aw in ignore it from orders.
): Order | undefined {
  const order = orders.find((order) => order.id === id);

  if (!order) {
    return undefined;
  }

  Object.assign(order, updates);

  return order;
}

export function deleteOrder(id: string): boolean {
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    return false;
  }

  orders.splice(index, 1);

  return true;
}
