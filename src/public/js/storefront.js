const CART_STORAGE_KEY = "rina_cart_id";

const alertBox = document.getElementById("storeAlert");

const showStoreAlert = (message, isError = false) => {
  if (!alertBox) return;

  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  alertBox.classList.toggle("alert-success", !isError);
  alertBox.classList.toggle("alert-error", isError);

  window.clearTimeout(showStoreAlert.timeoutId);
  showStoreAlert.timeoutId = window.setTimeout(() => {
    alertBox.textContent = "";
    alertBox.classList.add("hidden");
    alertBox.classList.remove("alert-success", "alert-error");
  }, 2500);
};

const getStoredCartId = () => window.localStorage.getItem(CART_STORAGE_KEY);

const storeCartId = (cartId) => {
  window.localStorage.setItem(CART_STORAGE_KEY, cartId);

  const cartLink = document.querySelector("[data-cart-link]");
  if (cartLink) {
    cartLink.href = `/carts/${cartId}`;
  }
};

const ensureCart = async () => {
  const existingCartId = getStoredCartId();
  if (existingCartId) return existingCartId;

  const response = await fetch("/api/carts", { method: "POST" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "No se pudo crear el carrito");
  }

  const cartId = payload.payload.id || payload.payload._id;
  storeCartId(cartId);
  return cartId;
};

const addProductToCart = async (productId) => {
  const cartId = await ensureCart();
  const response = await fetch(`/api/carts/${cartId}/product/${productId}`, {
    method: "POST",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "No se pudo agregar el producto al carrito");
  }

  storeCartId(cartId);
  showStoreAlert("Producto agregado al carrito");
};

const initializeCartLink = () => {
  const cartId = getStoredCartId();
  const cartLink = document.querySelector("[data-cart-link]");

  if (cartId && cartLink) {
    cartLink.href = `/carts/${cartId}`;
  }
};

initializeCartLink();

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".add-to-cart-btn");
  if (!button) return;

  const { productId } = button.dataset;
  if (!productId) return;

  button.disabled = true;

  try {
    await addProductToCart(productId);
  } catch (error) {
    showStoreAlert(error.message, true);
  } finally {
    button.disabled = false;
  }
});