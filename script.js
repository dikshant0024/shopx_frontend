const productStorageKey = "aquabasket-owner-products";
const cartStorageKey = "aquabasket-cart";
const userStorageKey = "aquabasket-users";
let activeProductId = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function readOwnerProducts() {
  try {
    return JSON.parse(localStorage.getItem(productStorageKey)) || [];
  } catch (error) {
    return [];
  }
}

function writeOwnerProducts(products) {
  localStorage.setItem(productStorageKey, JSON.stringify(products));
}

function getProducts() {
  const ownerProducts = readOwnerProducts();
  return [...defaultProducts, ...ownerProducts];
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
  } catch (error) {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function productGradient(category) {
  if (category === "stationery") {
    return "linear-gradient(135deg, #daf7ff, #8fe3ff)";
  }

  if (category === "photo frames") {
    return "linear-gradient(135deg, #dfffe7, #9cf7c0)";
  }

  return "linear-gradient(135deg, #fff3cc, #ffd67a)";
}

function getDiscount(category) {
  if (category === "stationery") {
    return 20;
  }

  if (category === "photo frames") {
    return 25;
  }

  return 15;
}

function getProductById(productId) {
  return getProducts().find((item) => item.id === productId);
}

function getRelatedProducts(productId, limit = 6) {
  const currentProduct = getProductById(productId);

  if (!currentProduct) {
    return [];
  }

  return getProducts()
    .filter((product) => product.id !== productId && product.category === currentProduct.category)
    .slice(0, limit);
}

function renderProducts(filter = "all", query = "") {
  const grid = document.getElementById("productGrid");
  const resultsText = document.getElementById("resultsText");

  if (!grid) {
    return;
  }

  const products = getProducts().filter((product) => {
    const categoryMatch = filter === "all" || product.category === filter;
    const queryMatch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.tag.toLowerCase().includes(query);

    return categoryMatch && queryMatch;
  });

  resultsText.textContent =
    products.length > 0
      ? `${products.length} item${products.length > 1 ? "s" : ""}`
      : "No matching products found";

  grid.innerHTML = products
    .map(
      (product) => {
        const discount = getDiscount(product.category);
        const oldPrice = Math.round(product.price / (1 - discount / 100));

        return `
        <article class="product-card">
          <div class="product-image" style="background:${productGradient(product.category)}">
            <span class="product-badge">${discount}% off</span>
            <span>${escapeHtml(product.image)}</span>
          </div>
          <div class="product-body">
            <p class="product-category">${escapeHtml(product.category)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-subtext">Free delivery</p>
            <div class="price-row">
              <strong>Rs ${product.price}</strong>
              <span class="strike">Rs ${oldPrice}</span>
            </div>
            <p class="product-tag">${escapeHtml(product.tag)}</p>
            <div class="product-actions">
              <button class="ghost-btn small view-product-btn" data-product-id="${product.id}" type="button">View</button>
              <button class="secondary-btn small add-cart-btn" data-product-id="${product.id}" type="button">Add</button>
              <button class="primary-btn small buy-now-btn" data-product-id="${product.id}" type="button">Buy Now</button>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");

  document.querySelectorAll(".add-cart-btn").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.productId));
  });

  document.querySelectorAll(".view-product-btn").forEach((button) => {
    button.addEventListener("click", () => openProductModal(button.dataset.productId));
  });

  document.querySelectorAll(".buy-now-btn").forEach((button) => {
    button.addEventListener("click", () => buyNow(button.dataset.productId));
  });
}

function addToCart(productId) {
  const product = getProducts().find((item) => item.id === productId);

  if (!product) {
    return;
  }

  const cart = readCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  writeCart(cart);
  updateCartUi();
}

function buyNow(productId) {
  addToCart(productId);
  const cartDrawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  closeProductModal();
  cartDrawer?.classList.add("open");
  backdrop?.classList.remove("hidden");
}

function renderRelatedProducts(productId) {
  const relatedProducts = document.getElementById("relatedProducts");

  if (!relatedProducts) {
    return;
  }

  const items = getRelatedProducts(productId);

  relatedProducts.innerHTML =
    items.length === 0
      ? '<p class="empty-state related-empty">More related products will appear here as you add more items.</p>'
      : items
          .map((product) => {
            const discount = getDiscount(product.category);
            return `
              <article class="related-card">
                <button class="related-card-btn" data-related-id="${product.id}" type="button">
                  <div class="related-image" style="background:${productGradient(product.category)}">
                    <span>${escapeHtml(product.image)}</span>
                  </div>
                  <div class="related-copy">
                    <p class="product-category">${escapeHtml(product.category)}</p>
                    <h4>${escapeHtml(product.name)}</h4>
                    <p class="product-tag">${escapeHtml(product.tag)}</p>
                    <div class="price-row">
                      <strong>Rs ${product.price}</strong>
                      <span class="modal-discount">${discount}% off</span>
                    </div>
                  </div>
                </button>
              </article>
            `;
          })
          .join("");

  document.querySelectorAll("[data-related-id]").forEach((button) => {
    button.addEventListener("click", () => openProductModal(button.dataset.relatedId));
  });
}

function openProductModal(productId) {
  const product = getProductById(productId);
  const modal = document.getElementById("productModal");
  const backdrop = document.getElementById("productModalBackdrop");

  if (!product || !modal || !backdrop) {
    return;
  }

  activeProductId = productId;
  const discount = getDiscount(product.category);
  const oldPrice = Math.round(product.price / (1 - discount / 100));

  document.getElementById("modalProductImage").style.background = productGradient(product.category);
  document.getElementById("modalProductImage").innerHTML = `<span>${escapeHtml(product.image)}</span>`;
  document.getElementById("modalProductCategory").textContent = product.category;
  document.getElementById("modalProductName").textContent = product.name;
  document.getElementById("modalProductTag").textContent = product.tag;
  document.getElementById("modalProductPrice").textContent = `Rs ${product.price}`;
  document.getElementById("modalProductOldPrice").textContent = `Rs ${oldPrice}`;
  document.getElementById("modalProductDiscount").textContent = `${discount}% off`;

  renderRelatedProducts(productId);
  modal.classList.remove("hidden");
  backdrop.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeProductModal() {
  document.getElementById("productModal")?.classList.add("hidden");
  document.getElementById("productModalBackdrop")?.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function removeFromCart(productId) {
  const cart = readCart().filter((item) => item.id !== productId);
  writeCart(cart);
  updateCartUi();
}

function filterAndSync(filter) {
  const searchInput = document.getElementById("searchInput");
  const query = (searchInput?.value || "").trim().toLowerCase();
  document.querySelectorAll(".category-chip").forEach((item) => {
    item.classList.toggle("active", item.dataset.filter === filter);
  });
  renderProducts(filter, query);
}

function updateCartUi() {
  const cart = readCart();
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }

  if (!cartItems || !cartTotal) {
    return;
  }

  cartItems.innerHTML =
    cart.length === 0
      ? '<p class="empty-state">Your cart is empty right now.</p>'
      : cart
          .map(
            (item) => `
              <article class="cart-item">
                <div>
                  <h4>${escapeHtml(item.name)}</h4>
                  <p>${item.qty} x Rs ${item.price}</p>
                </div>
                <button class="icon-btn remove-btn" data-remove-id="${item.id}" type="button">Remove</button>
              </article>
            `
          )
          .join("");

  cartTotal.textContent = `Rs ${cart.reduce((sum, item) => sum + item.price * item.qty, 0)}`;

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(button.dataset.removeId));
  });
}

function setupFilters() {
  const categoryButtons = document.querySelectorAll(".category-chip");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const shortcutButtons = document.querySelectorAll("[data-shortcut-filter]");
  let activeFilter = "all";

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterAndSync(activeFilter);
    });
  });

  searchBtn?.addEventListener("click", () => {
    renderProducts(activeFilter, (searchInput?.value || "").trim().toLowerCase());
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      renderProducts(activeFilter, searchInput.value.trim().toLowerCase());
    }
  });

  shortcutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.shortcutFilter;
      filterAndSync(activeFilter);
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupOwnerForm() {
  const ownerForm = document.getElementById("ownerForm");
  const resetButton = document.getElementById("resetProducts");

  ownerForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const newProduct = {
      id: `owner-${Date.now()}`,
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value,
      price: Number(document.getElementById("productPrice").value),
      tag: document.getElementById("productTag").value.trim(),
      image: document.getElementById("productImage").value.trim()
    };

    const ownerProducts = readOwnerProducts();
    ownerProducts.push(newProduct);
    writeOwnerProducts(ownerProducts);
    ownerForm.reset();
    renderProducts();
  });

  resetButton?.addEventListener("click", () => {
    localStorage.removeItem(productStorageKey);
    renderProducts();
  });
}

function setupDrawer() {
  const cartButton = document.getElementById("cartButton");
  const mobileCartButton = document.getElementById("mobileCartButton");
  const closeCart = document.getElementById("closeCart");
  const cartDrawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const openOwnerPanel = document.getElementById("openOwnerPanel");
  const ownerSection = document.getElementById("owner");

  function openDrawer() {
    cartDrawer?.classList.add("open");
    backdrop?.classList.remove("hidden");
  }

  function closeDrawer() {
    cartDrawer?.classList.remove("open");
    backdrop?.classList.add("hidden");
  }

  cartButton?.addEventListener("click", openDrawer);
  mobileCartButton?.addEventListener("click", openDrawer);
  closeCart?.addEventListener("click", closeDrawer);
  backdrop?.addEventListener("click", closeDrawer);

  openOwnerPanel?.addEventListener("click", () => {
    ownerSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setupProductModal() {
  const closeButton = document.getElementById("closeProductModal");
  const backdrop = document.getElementById("productModalBackdrop");
  const modalAddToCart = document.getElementById("modalAddToCart");
  const modalBuyNow = document.getElementById("modalBuyNow");

  closeButton?.addEventListener("click", closeProductModal);
  backdrop?.addEventListener("click", closeProductModal);

  modalAddToCart?.addEventListener("click", () => {
    if (!activeProductId) {
      return;
    }

    addToCart(activeProductId);
  });

  modalBuyNow?.addEventListener("click", () => {
    if (!activeProductId) {
      return;
    }

    buyNow(activeProductId);
  });
}

function setupAuth() {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  signupForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const users = JSON.parse(localStorage.getItem(userStorageKey) || "[]");
    const newUser = {
      name: document.getElementById("signupName").value.trim(),
      email: document.getElementById("signupEmail").value.trim(),
      password: document.getElementById("signupPassword").value
    };

    users.push(newUser);
    localStorage.setItem(userStorageKey, JSON.stringify(users));
    document.getElementById("signupMessage").textContent =
      "Account created successfully. You can login now.";
    signupForm.reset();
  });

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const users = JSON.parse(localStorage.getItem(userStorageKey) || "[]");
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const matchedUser = users.find((user) => user.email === email && user.password === password);

    document.getElementById("loginMessage").textContent = matchedUser
      ? `Welcome back, ${matchedUser.name || "shopper"}`
      : "No matching account found. Please sign up first.";

    if (matchedUser) {
      loginForm.reset();
    }
  });
}

function initHomePage() {
  renderProducts();
  updateCartUi();
  setupFilters();
  setupOwnerForm();
  setupDrawer();
  setupProductModal();
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") {
    initHomePage();
  }

  if (page === "auth") {
    setupAuth();
  }
});

function goToStationery() {
  window.location.href = "stationery.html";
}