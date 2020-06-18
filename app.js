const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "fb5v3iiahro5",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "NvSJ-nUY0L8P3dpOAjVrCYPWGnxPXRyFj8_1Vj2I3PY"
});
  
// variables

const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay')
const cartItems = document.querySelector('.cart-items')
const cartTotal = document.querySelector('.cart-total')
const cartContent = document.querySelector('.cart-content')
const productsDOM = document.querySelector('.products-center')

// cart
let cart = [];
let buttonsDOM = [];

// getting the products
class Products{
    async getProducts() {
        try {
            let contentful = await client.getEntries({
                content_type: 'shoppingCartVanillajs'
            });
            // let result = await fetch('products.json');    
            let products = contentful.items;
            products = products.map(item => {
                const { title, price } = item.fields;
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image };
            })
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

// display products
class UI{
    displayProducts(products) {
        let result = '';
        products.forEach(product => {
            result += `
            <!-- single product -->
                <article class="product">
                    <div class="img-container">
                        <img src=${product.image} alt="product" class='product-img'>
                        <button class='bag-btn' data-id=${product.id}>
                            <i class="fas fa-shopping-cart"></i>
                            add to cart
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>${'$'+product.price}</h4>
                </article>
            <!-- end of single product -->
            `;
        });
        productsDOM.innerHTML = result;
    }
    getBagButtons() {
        const btns = [...document.querySelectorAll('.bag-btn')];
        buttonsDOM = btns;
        btns.forEach(btn => {
            let id = btn.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                btn.innerText = 'In Cart';
                btn.disabled = true;
            } else {
                btn.addEventListener('click', (event) => {
                    event.target.innerText = 'In Cart';
                    event.target.disabled = true;
                    // get product from products
                    let cartItem = { ...Storage.getProduct(id), amount: 1 };
                    // add product to the cart
                    cart = [...cart, cartItem];
                    // save cart in local storage
                    Storage.saveCart(cart);
                    // set cart values
                    this.setCartValues(cart);
                    // display cart item
                    this.displayCartItem(cartItem);
                    // show the cart
                    this.showCart();
                })
            }
        })
    }
    setCartValues(cart) {
        let priceTotal = 0;
        let itemsTotalCount = 0;
        cart.forEach(item => {
            priceTotal += item.price * item.amount;
            itemsTotalCount += item.amount;
        });
        cartTotal.innerText = parseFloat(priceTotal.toFixed(2));
        cartItems.innerText = itemsTotalCount;
    }
    displayCartItem(item) {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <img src=${item.image} alt="product">
            <div>
                <h4>${item.title}</h4>
                <h5>${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
        `;
        cartContent.appendChild(div);
    }
    showCart() {
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }
    hideCart() {
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart)
    }
    populateCart(cart) {
        cart.forEach(item => this.displayCartItem(item));
    }
    cartLogic() {
        // clear cart button
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });

        // cart functionality
        cartContent.addEventListener('click', event => {
            let item = event.target;
            if (event.target.classList.contains('remove-item')) {
                let id = item.dataset.id;
                this.removeItem(id);
                cartContent.removeChild(item.parentElement.parentElement);
            } else if (event.target.classList.contains('fa-chevron-up')) {
                let id = item.dataset.id;
                let tempItem = cart.find(cartItem => cartItem.id === id);
                tempItem.amount++;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                item.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains('fa-chevron-down')) {
                let id = item.dataset.id;
                let tempItem = cart.find(cartItem => cartItem.id === id);
                tempItem.amount--;
                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    item.previousElementSibling.innerText = tempItem.amount;
                } else {
                    this.removeItem(id);
                    cartContent.removeChild(item.parentElement.parentElement);
                }
            }
        });
    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
    }
    removeItem(id) {
        cart = cart.filter(item => item.id != id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `
        <i class="fas fa-shopping-cart"></i>add to cart`
    }
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

// local storage
class Storage{
    static saveProducts(products) {
        localStorage.setItem('products', JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
    // setup app
    // ui.setupAPP();
    
    // get all products
    // products.getProducts().then(products => {
    //     ui.displayProducts(products);
    //     Storage.saveProducts(products);
    // }).then(() => {
    //     ui.getBagButtons();
    //     ui.cartLogic();
    // });

})