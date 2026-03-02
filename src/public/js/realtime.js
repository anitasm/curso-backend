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
        ${product.thumbnails?.[0] ? `<img src="${product.thumbnails[0]}" alt="${product.title}" class="product-img" />` : ""}
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
  addProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(addProductForm);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        showError(payload.error || "No se pudo crear el producto");
        return;
      }

      addProductForm.reset();
    } catch (error) {
      showError("Error de red al crear producto");
    }
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
