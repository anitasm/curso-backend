const socket = io();

const productsList = document.getElementById("productsList");
const addProductForm = document.getElementById("addProductForm");
const errorBox = document.getElementById("errorBox");

const showError = (message) => {
  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");

  setTimeout(() => {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }, 3500);
};

const renderCard = (product) => {
  const imageMarkup = product.thumbnails?.[0]
    ? `<img src="${product.thumbnails[0]}" alt="${product.title}" class="product-image" />`
    : '<div class="product-image placeholder-image">Sin imagen</div>';

  return `
    <article class="product-card">
      ${imageMarkup}
      <div class="product-content">
        <h4>${product.title}</h4>
        <p class="description">${product.description}</p>
        <p class="price">$${product.price}</p>
        <div class="meta-row">
          <span>Stock: ${product.stock}</span>
          <span>${product.category}</span>
        </div>
        <p class="tiny-meta">Ref. ${product.code}</p>
        <button type="button" class="delete-btn" data-id="${product.id}">Eliminar</button>
      </div>
    </article>
  `;
};

const renderList = (products) => {
  if (!productsList) return;

  if (!products.length) {
    productsList.innerHTML = '<div class="alert-message">No hay productos cargados.</div>';
    return;
  }

  productsList.innerHTML = products.map(renderCard).join("");
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
        showError(payload.message || payload.error || "No se pudo crear el producto");
        return;
      }

      addProductForm.reset();
    } catch (_error) {
      showError("Error de red al crear producto");
    }
  });
}

if (productsList) {
  productsList.addEventListener("click", async (event) => {
    const button = event.target.closest(".delete-btn");
    if (!button) return;

    const { id } = button.dataset;

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json();
        showError(payload.message || payload.error || "No se pudo eliminar el producto");
      }
    } catch (_error) {
      showError("Error de red al eliminar producto");
    }
  });
}