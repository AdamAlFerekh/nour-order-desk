export function normalizeLebaneseMobilePhone(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  // Remove formatting characters, but not arbitrary symbols.
  const phone = value.trim().replace(/[\s()-]/g, "");

  let nationalNumber: string;

  if (phone.startsWith("+961")) {
    nationalNumber = phone.slice(4);
  } else if (phone.startsWith("00961")) {
    nationalNumber = phone.slice(5);
  } else if (phone.startsWith("0")) {
    nationalNumber = phone.slice(1);
  } else {
    nationalNumber = phone;
  }

  // Lebanese mobile numbers:
  // 3 + 6 digits, or 70/71/76/78/79/81 + 6 digits.
  const isValid = /^(?:3|70|71|76|78|79|81)\d{6}$/.test(nationalNumber);

  if (!isValid) {
    return null;
  }

  return `+961${nationalNumber}`;
}
