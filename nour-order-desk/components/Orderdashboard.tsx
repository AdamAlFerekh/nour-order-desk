"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/orders";
import { normalizeLebaneseMobilePhone } from "@/lib/phone";
import { ApiError } from "@/lib/api-error";

const products = [
  { name: "Vanilla Candle", price: 8, note: "Soft, warm & comforting" },
  { name: "Cedar Candle", price: 10, note: "Earthy, woody & grounding" },
  { name: "Mini Gift Candle", price: 6, note: "A little moment of calm" },
];

const statusOptions: Order["status"][] = ["pending", "preparing", "delivered"];

function formatStatus(status: Order["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [productName, setProductName] = useState(products[0].name);
  const [quantity, setQuantity] = useState(1);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);
  const [statusError, setStatusError] = useState("");

  const [deletingOrderIds, setDeletingOrderIds] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [editCustomerName, setEditCustomerName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);

  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editPhoneError, setEditPhoneError] = useState("");

  const selectedProduct = products.find(
    (product) => product.name === productName,
  )!;

  const estimatedTotal = selectedProduct.price * quantity;

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const pendingCount = orders.filter(
    (order) => order.status === "pending",
  ).length;

  const preparingCount = orders.filter(
    (order) => order.status === "preparing",
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "delivered",
  ).length;

  async function fetchOrders(showLoading = true) {
    if (showLoading) {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/orders");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load orders.");
      }

      const data: Order[] = await response.json();
      setOrders(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading orders.",
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchOrders();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  function resetForm() {
    setCustomerName("");
    setPhone("");
    setProductName(products[0].name);
    setQuantity(1);
    setFormError("");
    setPhoneError("");
  }

  async function handleCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPhone = normalizeLebaneseMobilePhone(phone);

    if (!normalizedPhone) {
      setPhoneError(
        "Enter a valid Lebanese mobile number, such as 03 123 456.",
      );
      return;
    }

    setPhoneError("");
    setFormError("");

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          phone,
          productName,
          quantity,
          unitPrice: selectedProduct.price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || "Failed to create the order.",
          response.status,
        );
      }

      setIsFormOpen(false);
      resetForm();
      setSuccessMessage("Your new order has been created.");
      setDeleteError("");

      await fetchOrders(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        console.error("API status:", error.status);
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus(orderId: string, status: Order["status"]) {
    if (updatingOrderIds.includes(orderId)) return;

    setUpdatingOrderIds((current) => [...current, orderId]);
    setStatusError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || "Failed to update order status.",
          response.status,
        );
      }

      setSuccessMessage("Order status updated successfully.");
      await fetchOrders(false);
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the order.",
      );
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== orderId));
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (deletingOrderIds.includes(orderId)) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this order? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingOrderIds((current) => [...current, orderId]);
    setDeleteError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Failed to delete the order.";

        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // The error response might not contain JSON.
        }

        throw new ApiError(message, response.status);
      }

      const data: { message: string } = await response.json();

      setSuccessMessage(data.message);
      await fetchOrders(false);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the order.",
      );
    } finally {
      setDeletingOrderIds((current) => current.filter((id) => id !== orderId));
    }
  }

  function openEditModal(order: Order) {
    setEditingOrder(order);
    setEditCustomerName(order.customerName);
    setEditPhone(order.phone);
    setEditQuantity(order.quantity);

    setEditError("");
    setEditPhoneError("");
    setSuccessMessage("");
  }

  function closeEditModal() {
    if (isSavingEdit) return;

    setEditingOrder(null);
    setEditError("");
    setEditPhoneError("");
  }

  async function handleEditOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingOrder || isSavingEdit) return;

    const trimmedName = editCustomerName.trim();
    const normalizedPhone = normalizeLebaneseMobilePhone(editPhone);

    // Validate customer name
    if (!trimmedName) {
      setEditError("Customer name is required.");
      return;
    }

    // Validate phone number
    if (!normalizedPhone) {
      setEditPhoneError(
        "Enter a valid Lebanese mobile number, such as 03 123 456.",
      );
      return;
    }

    // Validate quantity
    if (!Number.isInteger(editQuantity) || editQuantity < 1) {
      setEditError("Quantity must be a positive whole number.");
      return;
    }

    setEditError("");
    setEditPhoneError("");
    setIsSavingEdit(true);

    try {
      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: trimmedName,
          phone: normalizedPhone,
          quantity: editQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || "Failed to update the order.",
          response.status,
        );
      }

      setEditingOrder(null);
      setSuccessMessage("Order updated successfully.");

      await fetchOrders(false);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the order.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#ded5c7] bg-[#fffefa] px-4 py-3 text-sm text-[#35291f] outline-none transition placeholder:text-[#a69a8a] focus:border-[#9a8056] focus:ring-2 focus:ring-[#b69a6c]/20";

  const buttonClass =
    "inline-flex items-center justify-center rounded-lg bg-[#49382b] px-5 py-3 text-sm font-medium text-[#fffaf0] transition hover:bg-[#604936] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a8056] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#35291f] selection:bg-[#d8c4a2] selection:text-[#35291f]">
      {/* Decorative top border */}
      <div className="h-1.5 bg-gradient-to-r from-[#8b714b] via-[#d7c39c] to-[#8b714b]" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-[#e4dbce] pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c8b28b] bg-[#eee7d9] text-3xl">
              🕯
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#92774d]">
                Hand-poured with care
              </p>
              <h1 className="mt-1 font-serif text-3xl tracking-tight text-[#35291f] sm:text-4xl">
                Nour Candle Studio
              </h1>
              <p className="mt-1 text-sm text-[#85796a]">
                Order management atelier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setPhoneError("");
              setSuccessMessage("");
              setDeleteError("");
              setIsFormOpen(true);
            }}
            className={buttonClass}
          >
            <span className="mr-2 text-lg">+</span>
            Create an order
          </button>
        </header>

        {/* Welcome banner */}
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-[#e1d4bd] bg-[#eee6d6] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-8 -top-14 h-52 w-52 rounded-full border border-[#cdbb9c]/60 sm:right-8 sm:top-[-4rem] sm:h-72 sm:w-72" />
          <div className="pointer-events-none absolute -right-1 -top-7 h-40 w-40 rounded-full border border-[#cdbb9c]/50 sm:right-16 sm:top-[-2rem] sm:h-56 sm:w-56" />

          <div className="relative max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#92774d]">
              The daily ritual
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-[#35291f] sm:text-4xl">
              Every order tells
              <br className="hidden sm:block" /> a story of its own.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#766957] sm:text-base">
              A quiet space to keep every candle order organized, from the first
              request to the final delivery.
            </p>
          </div>
        </section>

        {/* Summary cards */}
        <section
          aria-label="Order summary"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-[#e6ded2] bg-[#fffefa] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#827565]">Total orders</p>
              <span className="text-lg text-[#a48a5c]">✳</span>
            </div>
            <p className="mt-4 font-serif text-4xl text-[#35291f]">
              {orders.length.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-[#9a8d7c]">
              Orders in your collection
            </p>
          </div>

          <div className="rounded-xl border border-[#e6ded2] bg-[#fffefa] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#827565]">Awaiting attention</p>
              <span className="text-lg text-[#b08b51]">◷</span>
            </div>
            <p className="mt-4 font-serif text-4xl text-[#35291f]">
              {pendingCount.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-[#9a8d7c]">Orders still pending</p>
          </div>

          <div className="rounded-xl border border-[#e6ded2] bg-[#fffefa] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#827565]">In preparation</p>
              <span className="text-lg text-[#829078]">✧</span>
            </div>
            <p className="mt-4 font-serif text-4xl text-[#35291f]">
              {preparingCount.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-[#9a8d7c]">
              Candles being prepared
            </p>
          </div>

          <div className="rounded-xl border border-[#e6ded2] bg-[#fffefa] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#827565]">Delivered</p>
              <span className="text-lg text-[#829078]">✓</span>
            </div>
            <p className="mt-4 font-serif text-4xl text-[#35291f]">
              {deliveredCount.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-[#9a8d7c]">
              Successfully delivered orders
            </p>
          </div>
        </section>

        {/* Orders section */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-[#e6ded2] bg-[#fffefa]">
          <div className="flex flex-col gap-4 border-b border-[#eee7dc] px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a8056]">
                The order book
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[#35291f] sm:text-3xl">
                Your orders
              </h2>
              <p className="mt-2 text-sm text-[#8c8070]">
                Manage requests, track preparation, and keep deliveries on
                course.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#897c6b]">
              <span className="h-2 w-2 rounded-full bg-[#89977a]" />
              Live from your order API
            </div>
          </div>

          {/* Success and error feedback */}
          <div className="space-y-3 px-5 pt-4 sm:px-7 mb-5">
            {successMessage && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-[#d5e0ce] bg-[#f2f6ef] px-4 py-3 text-sm text-[#52674b]"
              >
                <span aria-hidden="true">✓</span>
                <p>{successMessage}</p>
              </div>
            )}

            {error && !isLoading && (
              <div
                role="alert"
                className="rounded-lg border border-[#e8cfc7] bg-[#fbf1ed] p-4 text-sm text-[#914b3c]"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchOrders()}
                  className="mt-3 rounded-md border border-[#cba99d] px-3 py-2 font-medium transition hover:bg-[#f6e6e0]"
                >
                  Try again
                </button>
              </div>
            )}

            {statusError && (
              <p
                role="alert"
                className="rounded-lg border border-[#e8cfc7] bg-[#fbf1ed] px-4 py-3 text-sm text-[#914b3c]"
              >
                {statusError}
              </p>
            )}

            {deleteError && (
              <p
                role="alert"
                className="rounded-lg border border-[#e8cfc7] bg-[#fbf1ed] px-4 py-3 text-sm text-[#914b3c]"
              >
                {deleteError}
              </p>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div
              role="status"
              className="flex flex-col items-center justify-center px-5 py-20 text-center"
            >
              <div className="text-3xl">🕯</div>
              <p className="mt-4 font-serif text-xl">Gathering your orders</p>
              <p className="mt-2 text-sm text-[#968978]">
                Just a little moment...
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center px-5 py-16 text-center sm:py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e2d4bd] bg-[#f5efe3] text-4xl">
                🕯
              </div>
              <h3 className="mt-6 font-serif text-2xl">A fresh beginning</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#8c8070]">
                Your order book is waiting. Create your first order to begin
                filling it with moments of warmth.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setPhoneError("");
                  setIsFormOpen(true);
                }}
                className={`${buttonClass} mt-6`}
              >
                + Create your first order
              </button>
            </div>
          )}

          {/* Orders table */}
          {!isLoading && !error && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-[#eee7dc] bg-[#faf7f0] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b7d6b]">
                    <th className="px-5 py-4 sm:px-7">Customer</th>
                    <th className="px-4 py-4">Candle</th>
                    <th className="px-4 py-4">Qty.</th>
                    <th className="px-4 py-4">Total</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 sm:px-7">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#f0e9df] transition last:border-0 hover:bg-[#fcfaf5]"
                    >
                      <td className="px-5 py-5 sm:px-7">
                        <p className="font-medium text-[#49382b]">
                          {order.customerName}
                        </p>
                        <p className="mt-1 text-xs text-[#968978]">
                          {order.phone}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <p className="text-sm text-[#49382b]">
                          {order.productName}
                        </p>
                      </td>

                      <td className="px-4 py-5 text-sm text-[#766957]">
                        {order.quantity}
                      </td>

                      <td className="px-4 py-5">
                        <span className="font-medium tabular-nums text-[#49382b]">
                          ${order.total.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                              order.status === "pending"
                                ? "bg-[#f7eedc] text-[#94703b]"
                                : order.status === "preparing"
                                  ? "bg-[#edf0e7] text-[#687653]"
                                  : "bg-[#e7eee8] text-[#4f7057]"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {formatStatus(order.status)}
                          </span>

                          <select
                            value={order.status}
                            disabled={updatingOrderIds.includes(order.id)}
                            onChange={(event) => {
                              void handleUpdateStatus(
                                order.id,
                                event.target.value as Order["status"],
                              );
                            }}
                            aria-label={`Status for ${order.customerName}'s order`}
                            className="max-w-36 rounded-md border border-[#e2d8c8] bg-[#fffefa] px-2 py-1.5 text-xs text-[#625442] outline-none focus:border-[#9a8056] focus:ring-2 focus:ring-[#b69a6c]/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>

                          {updatingOrderIds.includes(order.id) && (
                            <span className="text-xs text-[#968978]">
                              Saving...
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-5 sm:px-7">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(order)}
                            className="rounded-lg border border-[#d8c5a8] bg-[#f7f1e6] px-3 py-2 text-xs font-semibold text-[#76552f] transition hover:border-[#b99a70] hover:bg-[#eee3d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#92774d]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteOrder(order.id)}
                            disabled={deletingOrderIds.includes(order.id)}
                            className="rounded-lg border border-[#e5c9bd] px-3 py-2 text-xs font-medium text-[#a15e4c] transition hover:border-[#c99483] hover:bg-[#fbf0ec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a15e4c] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingOrderIds.includes(order.id)
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !error && orders.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#eee7dc] bg-[#faf7f0] px-5 py-4 text-xs text-[#8b7d6b] sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p>
                Showing {orders.length}{" "}
                {orders.length === 1 ? "order" : "orders"} in your order book
              </p>
              <p className="font-medium text-[#796344]">
                Order value: ${totalRevenue.toFixed(2)}
              </p>
            </div>
          )}
        </section>

        {/* Product collection */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a8056]">
              The collection
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#35291f] sm:text-3xl">
              Made for little moments
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {products.map((product, index) => (
              <div
                key={product.name}
                className="rounded-xl border border-[#e6ded2] bg-[#fffefa] p-5 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-6"
              >
                <div
                  className={`flex h-28 items-center justify-center rounded-lg ${
                    index === 0
                      ? "bg-[#f2e8d7]"
                      : index === 1
                        ? "bg-[#e9e6d9]"
                        : "bg-[#f3e9e2]"
                  }`}
                >
                  <div className="text-center">
                    <span className="text-4xl" aria-hidden="true">
                      {index === 0 ? "🕯" : index === 1 ? "🌿" : "🎁"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl text-[#49382b]">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#968978]">
                      {product.note}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[#8b714b]">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#e4dbce] py-7 text-center">
          <p className="font-serif text-lg text-[#49382b]">
            Nour Candle Studio
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#9a8d7c]">
            A little light, a little calm.
          </p>
        </footer>
      </div>

      {/* Create order modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#2c2119]/55 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-order-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#e2d4bd] bg-[#fffefa] shadow-2xl"
          >
            <div className="border-b border-[#eee5d8] bg-[#f4eee3] px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#92774d]">
                    A new beginning
                  </p>
                  <h2
                    id="new-order-title"
                    className="mt-2 font-serif text-3xl text-[#35291f]"
                  >
                    Create an order
                  </h2>
                  <p className="mt-2 text-sm text-[#827565]">
                    Enter the details to add a new candle order.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close new order form"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="rounded-full border border-[#ded2bf] px-3 py-1.5 text-xl text-[#766957] transition hover:bg-[#eae0cf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a8056] disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-5 p-6 sm:p-8">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-medium text-[#49382b]"
                >
                  Customer name
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  required
                  maxLength={200}
                  autoComplete="name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className={inputClass}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-[#49382b]"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                  onChange={(event) => {
                    setPhone(event.target.value);

                    if (normalizeLebaneseMobilePhone(event.target.value)) {
                      setPhoneError("");
                    }
                  }}
                  onBlur={() => {
                    if (!normalizeLebaneseMobilePhone(phone)) {
                      setPhoneError(
                        "Enter a valid Lebanese mobile number, such as 03 123 456.",
                      );
                    } else {
                      setPhoneError("");
                    }
                  }}
                  className={inputClass}
                  placeholder="03 123 456"
                />
                {phoneError && (
                  <p id="phone-error" className="mt-2 text-xs text-[#a15e4c]">
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="productName"
                  className="mb-2 block text-sm font-medium text-[#49382b]"
                >
                  Candle selection
                </label>
                <select
                  id="productName"
                  name="productName"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  className={inputClass}
                >
                  {products.map((product) => (
                    <option key={product.name} value={product.name}>
                      {product.name} — ${product.price.toFixed(2)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[#968978]">
                  {selectedProduct.note}
                </p>
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-medium text-[#49382b]"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value),
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="rounded-xl border border-[#e5d8c2] bg-[#f7f2e8] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#92774d]">
                      Order estimate
                    </p>
                    <p className="mt-1 text-xs text-[#827565]">
                      {quantity > 0 ? `${quantity} item(s)` : "Quantity"}
                      {" × "}${selectedProduct.price.toFixed(2)}
                    </p>
                  </div>

                  <p className="font-serif text-3xl text-[#49382b]">
                    $
                    {(Number.isFinite(estimatedTotal)
                      ? estimatedTotal
                      : 0
                    ).toFixed(2)}
                  </p>
                </div>

                <p className="mt-3 border-t border-[#e5d8c2] pt-3 text-xs leading-5 text-[#8b7d6b]">
                  The server calculates and saves the final order total.
                </p>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-[#e8cfc7] bg-[#fbf1ed] px-4 py-3 text-sm text-[#914b3c]"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#eee5d8] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-[#ded5c7] px-5 py-3 text-sm font-medium text-[#625442] transition hover:bg-[#f7f2e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a8056] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonClass}
                >
                  {isSubmitting ? "Creating order..." : "Create order"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {/* Edit order modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#2c2119]/55 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
            className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e2d4bd] bg-[#fffefa] shadow-2xl"
          >
            <div className="border-b border-[#eee5d8] bg-[#f4eee3] px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#92774d]">
                    Order details
                  </p>

                  <h2
                    id="edit-order-title"
                    className="mt-2 font-serif text-3xl text-[#35291f]"
                  >
                    Edit order
                  </h2>

                  <p className="mt-2 text-sm text-[#827565]">
                    Update the customer information or quantity.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close edit order form"
                  disabled={isSavingEdit}
                  onClick={closeEditModal}
                  className="rounded-full border border-[#ded2bf] px-3 py-1.5 text-xl text-[#766957] transition hover:bg-[#eae0cf] disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleEditOrder}
              className="max-h-[calc(100dvh-9rem)] space-y-6 overflow-y-auto p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Order ID - read only */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#49382b]">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={editingOrder.id}
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-[#f4f0e8]`}
                  />
                </div>

                {/* Product - read only */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#49382b]">
                    Candle
                  </label>
                  <input
                    type="text"
                    value={editingOrder.productName}
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-[#f4f0e8]`}
                  />
                </div>

                {/* Unit price - read only */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#49382b]">
                    Unit price
                  </label>
                  <input
                    type="text"
                    value={`$${editingOrder.unitPrice.toFixed(2)}`}
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-[#f4f0e8]`}
                  />
                </div>

                {/* Status - read only */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#49382b]">
                    Status
                  </label>
                  <input
                    type="text"
                    value={formatStatus(editingOrder.status)}
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-[#f4f0e8]`}
                  />
                </div>

                {/* Customer name - editable */}
                <div>
                  <label
                    htmlFor="edit-customer-name"
                    className="mb-2 block text-sm font-medium text-[#49382b]"
                  >
                    Customer name
                  </label>
                  <input
                    id="edit-customer-name"
                    type="text"
                    required
                    maxLength={200}
                    value={editCustomerName}
                    onChange={(event) =>
                      setEditCustomerName(event.target.value)
                    }
                    className={inputClass}
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Phone - editable */}
                <div>
                  <label
                    htmlFor="edit-phone"
                    className="mb-2 block text-sm font-medium text-[#49382b]"
                  >
                    Phone number
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    required
                    value={editPhone}
                    aria-invalid={Boolean(editPhoneError)}
                    onChange={(event) => {
                      setEditPhone(event.target.value);

                      if (normalizeLebaneseMobilePhone(event.target.value)) {
                        setEditPhoneError("");
                      }
                    }}
                    onBlur={() => {
                      if (!normalizeLebaneseMobilePhone(editPhone)) {
                        setEditPhoneError(
                          "Enter a valid Lebanese mobile number, such as 03 123 456.",
                        );
                      } else {
                        setEditPhoneError("");
                      }
                    }}
                    className={inputClass}
                    placeholder="03 123 456"
                  />

                  {editPhoneError && (
                    <p className="mt-2 text-xs text-[#a15e4c]">
                      {editPhoneError}
                    </p>
                  )}
                </div>

                {/* Quantity - editable */}
                <div>
                  <label
                    htmlFor="edit-quantity"
                    className="mb-2 block text-sm font-medium text-[#49382b]"
                  >
                    Quantity
                  </label>
                  <input
                    id="edit-quantity"
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={editQuantity}
                    onChange={(event) =>
                      setEditQuantity(
                        event.target.value === ""
                          ? 0
                          : Number(event.target.value),
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* Total - read only */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#49382b]">
                    Current total
                  </label>
                  <input
                    type="text"
                    value={`$${editingOrder.total.toFixed(2)}`}
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-[#f4f0e8]`}
                  />
                  <p className="mt-2 text-xs text-[#968978]">
                    The server recalculates the total when you save.
                  </p>
                </div>
              </div>

              {editError && (
                <p
                  role="alert"
                  className="rounded-lg border border-[#e8cfc7] bg-[#fbf1ed] px-4 py-3 text-sm text-[#914b3c]"
                >
                  {editError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#eee5d8] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={closeEditModal}
                  className="rounded-lg border border-[#ded5c7] px-5 py-3 text-sm font-medium text-[#625442] transition hover:bg-[#f7f2e8] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className={buttonClass}
                >
                  {isSavingEdit ? "Saving changes..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
