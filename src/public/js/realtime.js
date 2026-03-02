const socket = io();

const productsList = document.getElementById("productsList");
const addProductForm = document.getElementById("addProductForm");
const errorBox = document.getElementById("errorBox");

const showError = (message) => {
  if (!errorBox) return;
  errorBox.textContent = message;
  setTimeout(() => {
    errorBox.textContent = "";
  }, 3000);
};

const renderList = (products) => {
  if (!productsList) return;

  if (!products.length) {
    productsList.innerHTML = "<li>No hay productos cargados.</li>";
    return;
  }

  productsList.innerHTML = products
    .map(
      (product) => `
      <li>
        <strong>#${product.id} - ${product.title}</strong>
        <span> | ${product.description} | $${product.price} | stock: ${product.stock} | code: ${product.code}</span>
        <button type="button" class="delete-btn" data-id="${product.id}">Eliminar</button>
      </li>
    `
    )
    .join("");
};

socket.on("productsUpdated", (products) => {
  renderList(products);
});

socket.on("errorMessage", (message) => {
  showError(message);
});

if (addProductForm) {
  addProductForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(addProductForm);
    const thumbnailsRaw = formData.get("thumbnails") || "";

    const product = {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      code: String(formData.get("code") || "").trim(),
      price: Number(formData.get("price")),
      status: String(formData.get("status")) === "true",
      stock: Number(formData.get("stock")),
      category: String(formData.get("category") || "").trim(),
      thumbnails: thumbnailsRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    socket.emit("addProduct", product);
    addProductForm.reset();
  });
}

if (productsList) {
  productsList.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-btn");
    if (!button) return;

    const { id } = button.dataset;
    socket.emit("deleteProduct", id);
  });
}