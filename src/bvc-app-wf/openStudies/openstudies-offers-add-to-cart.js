// GUID → display name lookup (delivery types and campuses from sis-data-lookup.json)
const GUID_LOOKUP = {
    // Delivery Types
    "1AE082FF1070438CBAA776B245B6F75D": "Any-time Online",
    "C38BDD5C70E34955AD170B6C6A1EC5E8": "AudioVideo Based Instruction",
    "481341DF9A144AC8A315112B97377EC9": "Blended",
    "0102087B8DAB4E96B64F49185C0B1FF8": "Blended Asynchronous",
    "914480483DE14389ABD9EE4F1D28589E": "Blended Self-Paced",
    "C45FFE750A404E30A906FC3C6FDD99FC": "Blended Synchronous",
    "6BF78E16E03F462FAEE8F223086CFB35": "Blended Synchronous Asynchronous",
    "5969AC19010546B5B9834F6F8D2F3B29": "BVC Online",
    "2E7F9F03DDB84D6BB91FDC2D4464372A": "Challenge",
    "6F3515869E4C4C5599F470A7A58B13F0": "Combined Online",
    "C5BAA31D7BC0449890F790E897A92261": "Computer Assisted Instruction",
    "2B0F27FC3A764DBB941F2644DB71B7D6": "Correspondence Based Instruction",
    "E27E365D5A3341629CFDB4DB6DE64FCA": "Distributed Learning ecampus 2",
    "467A978F3823421BBDF788D21BC7B09C": "ECampus Alberta - online learning",
    "B146327974D348BD8306F957AE47CECD": "eCampusAlberta Online",
    "EE331EC390BC4D329910C5911DF970A7": "Face to Face Self-Paced",
    "939C8DACA6C1415EBC831B3F062D4250": "Face to Face Synchronous",
    "8317C7933CC449C2984E7F1CCD6FF5B8": "Flexclass",
    "F8EBCF8BF2D147AA9F76522DCBEDFA75": "Home Study",
    "9754E29DF0754139B125292A81550174": "Hyflex",
    "E9F804275D3C4B61A685F63DF5134F14": "In Class",
    "8AFAF1DADDEF4B71AC14DA272E952D0A": "Micro-Credential Assessment",
    "5D448378DA984E9986E737C02BEA8F46": "Mixed",
    "C570FE50B9824FD6906B571CDE435CF3": "Off-Site",
    "EC1C42ED10C54C1995A9F2CFEAC79CD9": "Online Asynchronous",
    "9FA504584ED84FABB0748D043A306BC3": "Online Self-Paced",
    "71159BEB070D42C981D9758B3108A0CD": "Online Synchronous",
    "F6250694BAD64615BCB91693A45D76C5": "Online Synchronous Asynchronous",
    "40817BFE87E1432EB3E68929DF8C9965": "Real-time Online",
    "60C2E33F37514B7E884D1BEFB7155785": "Teleconferencing / Videoconferencing",
    "63ADFB9EB3484A00BD66C043F43DEBE4": "Traditional and Self Paced",
    "05A8F1DF96624B67A7F9DC22C32B4A5F": "Work Experience",
    // Campuses
    "00D83EDBF5B642ADA6493FBFE3EC116A": "Airdrie",
    "481D28AD75CA4F12B5B10C078AA05F35": "Banff",
    "0B44F9AE85B9426F9A3876762BBA5B5A": "Calgary",
    "8005CA67F70B43C2BBB5004FF89FA4E1": "Calgary Downtown Campus",
    "A9B98CE5F1D5460F8812E36A93FDF320": "Cochrane",
    "82E8438804E84947BAAF251119943A6A": "Distance Learning",
    "5AA49765063A4B0BB623C0404A92406A": "High River",
    "2B4E485287444409AA1E828DA53BFC0C": "Okotoks",
    "D8ECBBFE90E944FA8526B7A90ED56FC5": "Online",
    "D532C4A03C6C42E99C3C5569D3B7F59F": "Regional",
    "05A9B93BC41A4F5CBE72FC9B97548AFF": "Rural",
    "A7B3BDCF1E404C32890EF853D2DCFDF2": "Strathmore",
    "FBE851B811DA49F0A8795BD188113BDB": "Three Gorges Medical College",
    "AF5967FBE4D446E3BA1212EFEE54B86C": "Three Hills",
    "1B561481FF05406A897B1FEB28F98004": "Yukon",
};

// Resolve a Sitecore GUID string like "{939C8DAC-A6C1-...}" to a display name
function resolveGuid(rawGuid) {
    if (!rawGuid) return "N/A";
    const key = rawGuid.replace(/[{}\-]/g, "").toUpperCase();
    return GUID_LOOKUP[key] || rawGuid;
}

// Minimal fetch call using mode: 'cors'
async function fetchCourseData(url) {
    try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        throw err;
    }}

function formatDate(dateString) {
    if (!dateString) return "";
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });}

function generateId() {
    return Math.random().toString(36).substr(2, 9);}

// Component Generators

// Renders the time block schedule lines from section.timeBlocks[]
function generateTimeBlockInfo(section) {
    if (!Array.isArray(section.timeBlocks) || !section.timeBlocks.length) return "";

    const seen = new Set();
    const unique = section.timeBlocks.filter(tb => {
        const key = tb.sisId || tb.schedule;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const blocksHtml = unique.map(tb => `
        <div><span class="producthours">${tb.schedule || ""}</span></div>`).join("");

    return `<div class="timeblock-info">
        <div class="detail-label">Schedule</div>
        <div class="timeblock-details">${blocksHtml}</div>
    </div>`;
}

function generateAccordionItem(section, courseName, credits) {
    const id = generateId();
    const startDate = formatDate(section.startDate);
    const endDate   = formatDate(section.endDate);

    // Domestic fee (used for cart price)
    const domesticAmount  = section.fees?.domestic?.amount  ?? 0;
    const domesticTax     = section.fees?.domestic?.tax     ?? 0;
    const price           = parseFloat(domesticAmount).toFixed(0);

    // International fee (display only)
    const intlAmount = section.fees?.international?.amount ?? null;
    const intlPrice  = intlAmount !== null ? parseFloat(intlAmount).toFixed(0) : null;

    const campusName      = resolveGuid(section.campus);
    const deliveryName    = resolveGuid(section.deliveryType);
    const timeBlockInfo   = generateTimeBlockInfo(section);
    const seatsLabel      = section.seatsAvailable ? "Available" : "Full";
    const sectionCredits  = section.credits || credits;

    const regInfo = (section.registrationStart)
        ? `<div class="detail-item">
               <div class="detail-label">Registration</div>
               <div class="detail-value">${formatDate(section.registrationStart)}${section.registrationEnd ? " &ndash; " + formatDate(section.registrationEnd) : ""}</div>
           </div>`
        : "";

    return `
        <div class="accordion-item-${id}">
            <button class="accordion-toggle" onclick="toggleAccordion('${id}')">
                <div class="date-range">
                    <span class="productdates">${startDate} &ndash; ${endDate}</span>
                    <span class="dropdown-icon">&#9660;</span>
                </div>
            </button>
            <div class="accordion-content" id="accordion-${id}">
                <div class="course-details">
                    <div class="detail-group">
                        <div class="detail-item">
                            <div class="detail-label">Location</div>
                            <div class="detail-value productlocation">${campusName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Hours</div>
                            <div class="detail-value">${section.hours}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Credits</div>
                            <div class="detail-value">${sectionCredits}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Seats</div>
                            <div class="detail-value seats-${section.seatsAvailable ? "open" : "full"}">${seatsLabel}</div>
                        </div>
                        ${regInfo}
                        ${timeBlockInfo}
                    </div>

                    <div class="price-section">
                        <div class="price-info">
                            <div class="price-display">
                                <span class="currency">$</span>
                                <span class="price">${price}</span>
                                <span class="currency-code">CAD</span>
                            </div>
                            <div class="student-type">Domestic Student</div>
                            ${domesticTax > 0 ? `<div class="tax-note">+ $${parseFloat(domesticTax).toFixed(2)} tax</div>` : ""}
                            ${intlPrice !== null ? `
                            <div class="price-display intl" style="margin-top:8px;">
                                <span class="currency">$</span>
                                <span class="price">${intlPrice}</span>
                                <span class="currency-code">CAD</span>
                            </div>
                            <div class="student-type">International Student</div>` : ""}
                        </div>
                        <div class="action-section">
                            <a href="#"
                                data-accordion-id="${id}"
                                data-product-name="${courseName}"
                                data-product-id="${section.sisId}"
                                data-product-credits="${sectionCredits}"
                                data-quantity="1"
                                data-product-price="${price}"
                                data-product-delivery="${deliveryName}"
                                class="c-button_cart addtocartbutton w-button"
                                tabindex="0">Add</a>
                            <p class="additional-fees">Additional fees apply</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function generateCourseOfferings(sections, courseName, courseCredits) {
    // Sort by startDate ascending
    const sorted = sections.slice().sort((a, b) => {
        const toDate = s => new Date(
            s.startDate.substring(0, 4),
            s.startDate.substring(4, 6) - 1,
            s.startDate.substring(6, 8)
        );
        return toDate(a) - toDate(b);
    });

    const grouped = groupSectionsByDeliveryType(sorted);
    return Object.entries(grouped).map(([deliveryType, secs]) => `
        <div class="course-offering">
            <h3 class="offering-title">${deliveryType}</h3>
            <div class="date-label">START / END DATE</div>
            ${secs.map(s => generateAccordionItem(s, courseName, s.credits || courseCredits)).join("")}
        </div>`).join("");
}

function groupSectionsByDeliveryType(sections) {
    return sections.reduce((grouped, section) => {
        const key = resolveGuid(section.deliveryType);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(section);
        return grouped;
    }, {});
}

function generateCourseComponent(data) {
    const name        = data.name        || "";
    const description = data.description || "";
    const credits     = Number(data.credits || 0);
    const sisId       = data.sisId       || "";
    const sections    = Array.isArray(data.sections) ? data.sections : [];

    const creditsHtml = credits > 0
        ? `<div class="c-course_credits">
               <div class="c-course_credits-box">
                   <div class="c-course_credits-txt">${credits}</div>
                   <div>Credits</div>
               </div>
           </div>`
        : "";

    const descHtml = description
        ? `<h2 class="c-course__col1">Course Description</h2>
           <div class="w-richtext"><p>${description}</p></div>`
        : "";

    const pdfHtml = sisId
        ? `<div class="course-pdf-section">
               <a class="course-pdf-link"
                  href="https://bvc-uat.vercel.app/pdf/course-${sisId}.pdf"
                  target="_blank" rel="noopener">
                   Download Course Outline (PDF)
               </a>
           </div>`
        : "";

    const enrollHtml = sections.length > 0
        ? `<div class="enrollment-section">
               <div class="enrollment-header">Enroll now</div>
               ${generateCourseOfferings(sections, name, credits)}
           </div>`
        : `<p class="no-sections">No sections currently available.</p>`;

    return `
        <div class="course-page-grid">
            <div class="course-info-col">
                ${descHtml}
                ${creditsHtml}
                ${pdfHtml}
            </div>
            <div class="course-offers-col">
                ${enrollHtml}
            </div>
        </div>`;
}

// Event Handlers
// function toggleAccordion(id) {
//     const content = document.getElementById(`accordion-${id}`);
//     const toggle = content.previousElementSibling;

//     if (content.classList.contains("open")) {
//         content.classList.remove("open");
//         toggle.classList.remove("active");
//     } else {
//         // Close all other accordions
//         document
//             .querySelectorAll(".accordion-content.open")
//             .forEach((openContent) => {
//                 openContent.classList.remove("open");
//                 openContent.previousElementSibling.classList.remove("active");
//             });

//         content.classList.add("open");
//         toggle.classList.add("active");
//     }}

// Accordion toggle function
function toggleAccordion(id) {
    const content = document.getElementById(`accordion-${id}`);
    const btn = content.previousElementSibling;
    if (content.classList.contains("open")) {
        content.classList.remove("open");
        btn.classList.remove("active");
    } else {
        document.querySelectorAll(".accordion-content.open").forEach((c) => {
            c.classList.remove("open");
            c.previousElementSibling.classList.remove("active");
        });
        content.classList.add("open");
        btn.classList.add("active");
    }}
window.toggleAccordion = toggleAccordion; // expose globally for inline onclick

const cartHTML = `
<div class="cart-overlay"></div>
<div class="sliding-cart">
    <span class="cart-close">&times;</span>
    <h2>Shopping Cart</h2>
    <div class="cart-items"></div>
    <div class="cart-total">
        Total: $<span class="total-amount">0.00</span>
    </div>
    <div class="cart-message"></div>
    <button class="checkout-button">Proceed to Checkout</button>
</div>
`;

// Session Manager to handle different browser sessions
const SessionManager = {
    mainSessionKey: 'cartSession',
    feeSessionKey: 'feeSession',

    // Initialize sessions
    init() {
        // Create main session if it doesn't exist
        if (!sessionStorage.getItem(this.mainSessionKey)) {
            sessionStorage.setItem(this.mainSessionKey, JSON.stringify({
                active: true,
                createdAt: new Date().toISOString()
            }));
        }
    },

    // Create a new fee session when fees are successfully processed
    createFeeSession(feeData) {
        const feeSession = {
            active: true,
            createdAt: new Date().toISOString(),
            feeData: feeData,
            relatedTo: this.mainSessionKey
        };

        sessionStorage.setItem(this.feeSessionKey, JSON.stringify(feeSession));
        console.log('Fee session created:', feeSession);
        return feeSession;
    },

    // Get current fee session
    getFeeSession() {
        const sessionData = sessionStorage.getItem(this.feeSessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    },

    // Check if fee session exists
    hasFeeSession() {
        return sessionStorage.getItem(this.feeSessionKey) !== null;
    },

    // Get main session
    getMainSession() {
        const sessionData = sessionStorage.getItem(this.mainSessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    },

    // Clear fee session
    clearFeeSession() {
        sessionStorage.removeItem(this.feeSessionKey);
    },

    // Clear all sessions
    clearAllSessions() {
        sessionStorage.removeItem(this.mainSessionKey);
        sessionStorage.removeItem(this.feeSessionKey);
    }};

const CartManager = {
    items: [],
    maxItems: 6,
    sessionKey: "cartItems",
    bvcCourseIdKey: "bvcCourseId",

    init() {
        this.loadFromSession();
        this.updateAddedButtonStates();
        this.updateCartCounter();
        this.updateBvcCourseId();
        sessionStorage.setItem('totalCredits', this.getTotalCredits().toString());
    },

    loadFromSession() {
        const savedCart = sessionStorage.getItem(this.sessionKey);
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
                console.log('Loaded cart from session:', this.items.length, 'items');
            } catch (error) {
                console.error('Error loading cart from session:', error);
                this.items = [];
            }
        }
    },

    saveToSession() {
        try {
            sessionStorage.setItem(this.sessionKey, JSON.stringify(this.items));
            this.updateBvcCourseId();
            sessionStorage.setItem('totalCredits', this.getTotalCredits().toString());
            console.log('Cart saved to session:', this.items.length, 'items');
        } catch (error) {
            console.error('Error saving cart to session:', error);
        }
    },

    updateBvcCourseId() {
        try {
            const courses = {
                coursesInCart: this.items.map((item) => Number(item.sku)),
                totalAmount: this.getTotal().toFixed(2),
                fees: this.items.reduce((acc, item) => {
                    if (item.fees) {
                        acc[item.sku] = {
                            feeData: item.fees,
                            summary: item.feeSummary
                        };
                    }
                    return acc;
                }, {})
            };

            sessionStorage.setItem(this.bvcCourseIdKey, JSON.stringify(courses));
        } catch (error) {
            console.error('Error updating bvcCourseId:', error);
        }
    },

    addItem(product) {
        // Check if we already have this item
        const existingItem = this.items.find((item) => item.sku === product.sku);
        if (existingItem) {
            console.log('Item already in cart:', product.sku);
            return false; // Item already in cart
        }

        // Check if we've reached the maximum
        if (this.items.length >= this.maxItems) {
            console.log('Cart is full, cannot add more items');
            return false; // Max items reached
        }

        // Add the new item
        this.items.push(product);
        console.log('Item added to cart:', product.sku, '- Total items:', this.items.length);
        
        // Clear fee session if we now have multiple items (fees need recalculation)
        if (this.items.length > 1 && SessionManager.hasFeeSession()) {
            SessionManager.clearFeeSession();
            console.log('Fee session cleared due to multiple items in cart');
        }
        
        this.saveToSession();
        this.updateCartCounter();
        return true;
    },

    removeItem(sku) {
        const initialLength = this.items.length;
        this.items = this.items.filter((item) => item.sku !== sku);
        
        if (this.items.length < initialLength) {
            console.log('Item removed from cart:', sku, '- Remaining items:', this.items.length);
            this.saveToSession();
            this.updateAddedButtonStates();
            this.updateCartCounter();

            // Clean up individual course fees storage
            const feesStorage = JSON.parse(sessionStorage.getItem('courseFees') || '{}');
            if (feesStorage[sku]) {
                delete feesStorage[sku];
                sessionStorage.setItem('courseFees', JSON.stringify(feesStorage));
            }
            
            return true;
        }
        
        return false;
    },

    getTotalCredits() {
        return this.items.reduce((sum, item) => sum + (parseInt(item.credits) || 0), 0);
    },

    getTotal() {
        let total = 0;
        this.items.forEach(item => {
            // Add base price
            total += (parseFloat(item.price) || 0) * (item.quantity || 1);
            
            // Add fees if available
            if (item.feeSummary && item.feeSummary.totalAmount) {
                total += parseFloat(item.feeSummary.totalAmount) || 0;
            }
        });
        return total;
    },

    isInCart(sku) {
        return this.items.some((item) => item.sku === sku);
    },

    isCartFull() {
        return this.items.length >= this.maxItems;
    },

    clear() {
        console.log('Clearing cart - had', this.items.length, 'items');
        this.items = [];
        this.saveToSession();
        this.updateAddedButtonStates();
        this.updateCartCounter();
        
        // Clear related storage
        sessionStorage.setItem('courseFees', JSON.stringify({}));
        if (SessionManager.hasFeeSession()) {
            SessionManager.clearFeeSession();
        }
    },

    updateAddedButtonStates() {
        // Reset all buttons first
        document.querySelectorAll(".addtocartbutton").forEach((button) => {
            const sku = button.getAttribute("data-product-id");
            if (this.isInCart(sku)) {
                button.disabled = true;
                button.classList.add("in-cart");
                button.title = "Already in cart";
            } else {
                button.disabled = false;
                button.classList.remove("in-cart");
                button.title = "";
            }
        });
    },

    updateCartCounter() {
        const cartCounter = document.getElementById("cartProducts");
        if (cartCounter) {
            cartCounter.textContent = this.items.length.toString();
            cartCounter.style.display = this.items.length > 0 ? "inline-block" : "none";
        }
    }};

const DOM = {
    cart: null,
    overlay: null,
    closeButton: null,
    cartItemsContainer: null,
    totalAmount: null,
    cartMessage: null,

    init() {
        this.cart = document.querySelector(".sliding-cart");
        this.overlay = document.querySelector(".cart-overlay");
        this.closeButton = document.querySelector(".cart-close");
        this.cartItemsContainer = document.querySelector(".cart-items");
        this.totalAmount = document.querySelector(".total-amount");
        this.cartMessage = document.querySelector(".cart-message");
    },};

const NotificationSystem = {
    activeNotifications: new Set(),

    show(message, type) {
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        console.log(message);

        const timeoutId = setTimeout(() => {
            notification.remove();
            this.activeNotifications.delete(timeoutId);
        }, 3000);

        this.activeNotifications.add(timeoutId);
        document.body.appendChild(notification);
    },

    clearAll() {
        this.activeNotifications.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        this.activeNotifications.clear();

        document
            .querySelectorAll(".notification")
            .forEach((notif) => notif.remove());
    },};

const UnavailabilityManager = {
    sessionKey: "unavailableCourses",

    init() {
        if (!sessionStorage.getItem(this.sessionKey)) {
            sessionStorage.setItem(this.sessionKey, JSON.stringify([]));
        }
        this.updateAllButtonStates();
    },

    markAsUnavailable(sku) {
        const unavailableCourses = this.getUnavailableCourses();
        if (!unavailableCourses.includes(sku)) {
            unavailableCourses.push(sku);
            sessionStorage.setItem(
                this.sessionKey,
                JSON.stringify(unavailableCourses)
            );
        }
        this.updateButtonState(sku);
    },

    isUnavailable(sku) {
        return this.getUnavailableCourses().includes(sku);
    },

    getUnavailableCourses() {
        return JSON.parse(sessionStorage.getItem(this.sessionKey) || "[]");
    },

    updateButtonState(sku) {
        const buttons = document.querySelectorAll(
            `.addtocartbutton[data-product-id="${sku}"]`
        );

        buttons.forEach((button) => {
            if (this.isUnavailable(sku)) {
                button.disabled = true;
                button.classList.add("unavailable");
                button.title = "This date is not available";
            }
        });
    },

    updateAllButtonStates() {
        const unavailableCourses = this.getUnavailableCourses();
        unavailableCourses.forEach((sku) => this.updateButtonState(sku));
    },};

function openCart() {
    DOM.cart.classList.add("open");
    DOM.overlay.classList.add("open");

    // Update message based on cart status
    if (CartManager.isCartFull()) {
        DOM.cartMessage.textContent =
            "Maximum number of products (6) has been reached.";
        DOM.cartMessage.classList.add("visible");
    } else {
        DOM.cartMessage.classList.remove("visible");
    }}

function closeCart() {
    DOM.cart.classList.remove("open");
    DOM.overlay.classList.remove("open");}

function updateCartDisplay() {
    const fragment = document.createDocumentFragment();

    CartManager.items.forEach((item) => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <button class="remove-item" data-sku="${item.sku}">Remove</button>
            <div class="cart-item-details">
                <div><strong>${item.productName || item.sku}</strong></div>
                <div class="cart-item-info"><span style="font-weight: 600;">Credits: </span> ${item.credits}</div>        
                <div class="cart-item-info"><span style="font-weight: 600;">Tuition:</span> $${
                  item.price
                } x ${item.quantity}</div>
                <div class="cart-item-info"><span style="font-weight: 600;">Delivery:</span> ${
                  item.productDelivery || "Standard"
                }</div>
                <div class="cart-item-info"><span style="font-weight: 600;">Dates:</span> ${
                  item.productdates || "Not specified"
                }</div>
                ${item.timeblocks && item.timeblocks.length > 0
                ? `<div class="cart-item-info"><span style="font-weight: 600;">Schedule:</span></div>
                ${item.timeblocks.map(block => 
                `<div class="cart-item-info" style="padding-left: 20px;">• ${block.day}: ${block.hours}</div>`
                ).join('')}`
                : `<div class="cart-item-info"><span style="font-weight: 600;">Days:</span> ${item.productdays || "Not specified"}</div>
                <div class="cart-item-info"><span style="font-weight: 600;">Hours:</span> ${item.producthours || "Not specified"}</div>`
                }
                <div class="cart-item-info"><span style="font-weight: 600;">Location:</span> ${
                  item.productlocation || "Not specified"
                }</div>
            </div>
        `;
        fragment.appendChild(div);
    });

    DOM.cartItemsContainer.innerHTML = "";
    DOM.cartItemsContainer.appendChild(fragment);

    // Get and parse the session fee data manually
        var sessionFeesRaw = sessionStorage.getItem('feeSession');
        var sessionFees = sessionFeesRaw ? JSON.parse(sessionFeesRaw) : null;
        var feeData = sessionFees && sessionFees.feeData && sessionFees.feeData.fees ? sessionFees.feeData.fees : [];
        var summary = sessionFees && sessionFees.feeData && sessionFees.feeData.summary ? sessionFees.feeData.summary : {
            totalAmount: 0,
            totalTax: 0,
            grandTotal: 0
        };

        if (feeData.length > 0) {
            var feeBox = document.createElement('div');
            feeBox.className = 'cart-shared-fees';

            var feeHTML = '<hr><div class="cart-item-info"><strong>Additional fees:</strong></div>';

            for (var i = 0; i < feeData.length; i++) {
                var fee = feeData[i];
                feeHTML += '<div class="cart-item-info fee-item">• ' + fee.description + ': $' + fee.amount.toFixed(2);
                if (fee.tax && fee.tax > 0) {
                    feeHTML += ' + $' + fee.tax.toFixed(2) + ' tax';
                }
                feeHTML += '</div>';
            }

            feeHTML += '<div class="cart-item-info"><strong>Total Fees:</strong> $' + summary.totalAmount.toFixed(2) + '</div>';
            // +'<div class="cart-item-info"><strong>Total Tax:</strong> $' + summary.totalTax.toFixed(2) + '</div>';

            feeBox.innerHTML = feeHTML;
            DOM.cartItemsContainer.appendChild(feeBox);
        }

        // Calculate totals
        var subtotal = 0;
        for (var j = 0; j < CartManager.items.length; j++) {
            subtotal += parseFloat(CartManager.items[j].price) * CartManager.items[j].quantity;
        }
        var grandTotal = subtotal + summary.totalAmount + summary.totalTax;

        var summaryBox = document.createElement('div');
        summaryBox.className = 'cart-summary';
        summaryBox.innerHTML = '' +
            '<hr />' +
            '<div class="cart-item-info"><strong>Subtotal:</strong> $' + subtotal.toFixed(2) + '</div>' +
            '<div class="cart-item-info"><strong>Additional Fees:</strong> $' + summary.totalAmount.toFixed(2) + '</div>' +
            '<div class="cart-item-info"><strong>Tax:</strong> $' + summary.totalTax.toFixed(2) + '</div>';
            // '<div class="cart-item-info"><strong style="font-size:1.1em;">Grand Total:</strong> $' + grandTotal.toFixed(2) + '</div>';

    // const total = CartManager.getTotal();
    DOM.cartItemsContainer.appendChild(summaryBox);
    DOM.totalAmount.textContent = grandTotal.toFixed(2);}

function getProductDetails(button) {
    const id = button.getAttribute("data-accordion-id");
    const sku = button.getAttribute("data-product-id");
    const quantity = parseInt(button.getAttribute("data-quantity") || "1");
    const productName = button.getAttribute("data-product-name") || "";
    const credits = button.getAttribute("data-product-credits") || "";
    const productDelivery = button.getAttribute("data-product-delivery") || "";
    
    // Safely get the price attribute with fallback
    const priceAttribute = button.getAttribute("data-product-price");
    const price = priceAttribute ? parseFloat(priceAttribute) : 0;
    
    if (!sku) {
        throw new Error("Product ID not found");
    }
    
    // Find additional details from accordion if available
    let productdays = "";
    let productdates = "";
    let productschedule = "";
    let producthours = "";
    let productlocation = "";
    let timeblocks = []; // New array to store multiple day/time blocks
    
    const accordionItem = document.querySelector(`.accordion-item-${id}`);
    
    if (accordionItem) {
        // Get All the days-time information
        const timeblockDetails = accordionItem.querySelector(".timeblock-details");
        
        if (timeblockDetails) {
            // Get all divs within timeblock-details
            const timeblockDivs = timeblockDetails.querySelectorAll("div");
            
            timeblockDivs.forEach(div => {
                const dayElement = div.querySelector(".productdays");
                const hourElement = div.querySelector(".producthours");
                
                if (dayElement && hourElement) {
                    timeblocks.push({
                        day: dayElement.innerText.trim(),
                        hours: hourElement.innerText.trim()
                    });
                }
            });
        }
        
        // Fallback to single values if timeblocks array is empty
        if (timeblocks.length === 0) {
            const daysElement = accordionItem.querySelector(".productdays");
            if (daysElement) productdays = daysElement.innerText;
            
            const hoursElement = accordionItem.querySelector(".producthours");
            if (hoursElement) producthours = hoursElement.innerText;
        } else {
            // Set the first timeblock as the default values for backward compatibility
            productdays = timeblocks[0].day;
            producthours = timeblocks[0].hours;
        }
        
        const datesElement = accordionItem.querySelector(".productdates");
        if (datesElement) productdates = datesElement.innerText;
        
        const scheduleElement = accordionItem.querySelector(".productschedule");
        if (scheduleElement) {
            const scheduleText = scheduleElement.innerText;
            productschedule = scheduleText === " to " ? "" : scheduleText;
        }
        
        const locationElement = accordionItem.querySelector(".productlocation");
        if (locationElement) productlocation = locationElement.innerText;
    }
    
    return {
        sku,
        quantity,
        price,
        productName,
        productDelivery,
        productdays,
        productdates,
        productschedule,
        producthours,
        productlocation,
        credits,
        timeblocks // New array containing all day/time combinations
    };
}

async function handleAddToCart(event) {
    event.preventDefault();
    const button = event.target;

    try {
        if (button.disabled) return;

        if (CartManager.isCartFull()) {
            NotificationSystem.show(
                "Maximum number of products (6) has been reached",
                "error"
            );
            openCart();
            return;
        }

        button.disabled = true;
        button.classList.add("loading");

        // Get or refresh token
        let token = tokenStorage.getToken();
        if (tokenStorage.isTokenExpired()) {
            token = await getMsToken();
            tokenStorage.setToken(token);
        }

        const productDetails = getProductDetails(button);

        // Check if product is already marked as unavailable
        if (UnavailabilityManager.isUnavailable(productDetails.sku)) {
            NotificationSystem.show("This date is not available", "error");
            button.classList.remove("loading");
            return;
        }

        // Step 1: Check course availability
        const { status, data } = await checkCourseAvailability(
            productDetails.sku,
            token
        );

        console.log("Availability Check:", data?.seatsAreAvailable);
        console.log("Status:", status);

        if (status === 200) {
            if (!data.seatsAreAvailable) {
                UnavailabilityManager.markAsUnavailable(productDetails.sku);
                NotificationSystem.show("No seats available for this date", "error");
                return;
            }

            // Step 2: Add item to cart
            const added = CartManager.addItem(productDetails);
            
            if (added) {
                button.classList.add("in-cart");
                button.title = "Already in cart";
                
                // Step 3: Get all SKUs currently in cart for fees calculation
                const allSkus = CartManager.items.map(item => item.sku);
                
                try {
                    // Step 4: Check fees for all items in cart
                    const feesResponse = await checkFees(allSkus, token);
                    
                    // Update cart display with new item and fees
                    updateCartDisplay();
                    openCart();
                    NotificationSystem.show("Item added to cart!", "success");

                    console.log('Course fees summary:', feesResponse.summary);
                    console.log('Fee session active:', SessionManager.hasFeeSession());

                } catch (feeError) {
                    console.error('Error checking fees:', feeError);
                    // Still show success for adding item, but note fee issue
                    updateCartDisplay();
                    openCart();
                    NotificationSystem.show("Item added to cart! (Fee calculation pending)", "warning");
                }

            } else {
                NotificationSystem.show("Item is already in your cart", "error");
            }

        } else if (status === 401) {
            tokenStorage.clearToken();
            throw new Error("Authentication failed");
        } else if (status === 404) {
            UnavailabilityManager.markAsUnavailable(productDetails.sku);
            NotificationSystem.show("This date is not available", "error");
        } else {
            throw new Error("Failed to check course availability");
        }

    } catch (error) {
        console.error('Error in handleAddToCart:', error);
        NotificationSystem.show(error.message, "error");
    } finally {
        button.classList.remove("loading");

        // Re-enable button only if item is not in cart and not unavailable
        if (
            !CartManager.isInCart(button.getAttribute("data-product-id")) &&
            !UnavailabilityManager.isUnavailable(
                button.getAttribute("data-product-id")
            )
        ) {
            button.disabled = false;
        }
    }}

// Replace the old removeFromCart with this:
async function removeFromCart(sku) {
    try {
        // Remove the item from cart
        CartManager.removeItem(sku);
        
        if (CartManager.items.length === 0) {
            // If cart is now empty: clear all sessions and storage
            SessionManager.clearAllSessions();
            sessionStorage.removeItem("cartItems");
            sessionStorage.removeItem("totalCredits");
            sessionStorage.removeItem("bvcCourseId");
            sessionStorage.removeItem("courseFees");
            
            updateCartDisplay();
            NotificationSystem.show("Your cart is now empty.", "success");
            DOM.cartMessage.classList.remove("visible");
            
        } else {
            // Cart still has items: recalculate fees for remaining items
            try {
                await refreshFeeSessionAndUpdateCart();
                NotificationSystem.show("Item removed from cart", "success");
            } catch (err) {
                console.error('Failed to update fees after removal:', err);
                NotificationSystem.show("Item removed, but could not update fees.", "warning");
                updateCartDisplay(); // Update display even if fees failed
            }
            
            // Update cart message visibility
            if (CartManager.isCartFull()) {
                DOM.cartMessage.classList.add("visible");
            } else {
                DOM.cartMessage.classList.remove("visible");
            }
        }
        
    } catch (error) {
        console.error('Error removing item from cart:', error);
        NotificationSystem.show("Failed to remove item from cart", "error");
    }}

// ✅ Wrapped fee re-checking into a helper
async function refreshFeeSessionAndUpdateCart() {
    const allSkus = CartManager.items.map(item => item.sku);
    
    if (allSkus.length === 0) {
        return;
    }
    
    let token = tokenStorage.getToken();
    if (tokenStorage.isTokenExpired()) {
        token = await getMsToken();
        tokenStorage.setToken(token);
    }
    
    if (!token) {
        throw new Error('No valid token available');
    }

    try {
        console.log('Refreshing fees for SKUs:', allSkus);
        const feesResponse = await checkFees(allSkus, token);
        
        // Ensure updated item-level fees are persisted
        CartManager.saveToSession();
        updateCartDisplay();
        
        console.log('Fees refreshed successfully:', feesResponse.summary);
        
    } catch (error) {
        console.error('Failed to refresh fees after cart change:', error);
        throw error;
    }}

async function checkFees(courseSKUs, token) {
    let skus = courseSKUs;

    // Validate input
    if (!Array.isArray(skus) || skus.length === 0) {
        const buttons = document.querySelectorAll('.addtocartbutton[data-product-id]');
        skus = Array.from(buttons)
            .map(btn => btn.getAttribute('data-product-id'))
            .filter(id => CartManager.isInCart(id));
    }

    if (skus.length === 0) {
        console.log('No SKUs to check fees for');
        return {
            status: 400,
            feeData: [],
            summary: { totalAmount: 0, totalTax: 0, grandTotal: 0, feeCount: 0 }
        };
    }

    const joinedSKUs = skus.join(',');
    const endpoint = `sitecorexm.api/fee/${joinedSKUs}/null`;

    try {
        console.log('Checking fees for SKUs:', joinedSKUs);
        
        const response = await fetch(`https://bvc-uat-api-proxy.vercel.app/api/bvcpayment?endpoint=${encodeURIComponent(endpoint)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Fee API returned status ${response.status}`);
        }

        const feeData = await response.json();
        console.log('Fee data received:', feeData);
        
        const totalAmount = feeData.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        const totalTax = feeData.reduce((sum, fee) => sum + (fee.tax || 0), 0);

        // Attach fees to each CartManager item
        CartManager.items.forEach(item => {
            const itemFees = feeData.filter(fee => fee.courseSku === item.sku);
            item.fees = itemFees;
            item.feeSummary = {
                totalAmount: itemFees.reduce((sum, fee) => sum + (fee.amount || 0), 0),
                totalTax: itemFees.reduce((sum, fee) => sum + (fee.tax || 0), 0),
                grandTotal: itemFees.reduce((sum, fee) => sum + (fee.amount || 0) + (fee.tax || 0), 0)
            };
        });

        // Persist updated items with fee information
        CartManager.saveToSession();

        const feeResult = {
            status: response.status,
            rawResponse: response,
            feeData: feeData,
            summary: {
                totalAmount,
                totalTax,
                grandTotal: totalAmount + totalTax,
                feeCount: feeData.length
            }
        };

        // Create/update fee session
        SessionManager.createFeeSession({
            courseIds: joinedSKUs,
            fees: feeData,
            summary: feeResult.summary,
            timestamp: new Date().toISOString()
        });

        console.log('Fee session created/updated successfully');
        return feeResult;

    } catch (error) {
        console.error('checkFees failed:', error);
        throw new Error(`Failed to check fees: ${error.message}`);
    }}

async function checkCourseAvailability(courseSKU, token) {
    const endpoint = `sitecorexm.api/courseofferings/${courseSKU}`;
    const proxyUrl = "https://nextjs-jamstack-dev.vercel.app/api/bvcpayment";
    try {
        const response = await fetch(
            `https://bvc-uat-api-proxy.vercel.app/api/bvcpayment?endpoint=${encodeURIComponent(
        endpoint
      )}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            return { status: response.status, data: null };
        }

        const result = await response.json(); // Only read body once
        return { status: response.status, data: result }; // Return both status + data
    } catch (error) {
        throw error;
    }

    // try {
    //     const response = await fetch('https://httpstat.us/404', {
    //         method: 'GET',
    //         headers: {
    //             'Authorization': `Bearer ${token}`,
    //             'Content-Type': 'application/json'
    //         }
    //     });
    //     return response;
    // } catch (error) {
    //     throw error;
    // }
}

function initialize() {
    console.log("Cart and UI initialized");
    // Add cart HTML to the document
    document.body.insertAdjacentHTML("beforeend", cartHTML);

    // Initialize all components
    DOM.init();
    UnavailabilityManager.init();
    CartManager.init();

    // Update the cart display with any stored items
    updateCartDisplay();

    // Set up event listeners
    DOM.closeButton.addEventListener("click", closeCart);
    DOM.overlay.addEventListener("click", closeCart);

    // 🔥 When remove-item is clicked, use the new async handler
    DOM.cartItemsContainer.addEventListener("click", (e) => {
        if (e.target.matches(".remove-item")) {
            const sku = e.target.dataset.sku;
            removeFromCart(sku);  // This is now async, but calling as normal is fine
        }
    });

    document.querySelector(".checkout-button").addEventListener("click", () => {
        if (CartManager.items.length > 0) {
            window.location.href = "../cart-checkout?type=os";
        } else {
            NotificationSystem.show("Your cart is empty", "error");
        }
    });

    const addToCartButtons = document.querySelectorAll(".addtocartbutton");
    addToCartButtons.forEach((button) => {
        button.addEventListener("click", handleAddToCart);
    });

    const openCartButton = document.querySelector(".opencartbutton");
    if (openCartButton) {
        openCartButton.addEventListener("click", openCart);
    }}

// Initialize component after DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    initialize();
    const container = document.getElementById("courseComponent");
    try {
        // Fetch course data and lookup table in parallel
        const [data] = await Promise.all([
            fetchCourseData(
                "https://bvc-uat.vercel.app/data/oScourses/course-{{wf {&quot;path&quot;:&quot;courseid&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}.json"
            ),
            fetch("https://bvc-uat.vercel.app/data/sis-data-lookup.json", { mode: "cors" })
                .then(r => r.ok ? r.json() : null)
                .then(lookup => {
                    if (!lookup) return;
                    // Merge delivery types into GUID_LOOKUP
                    const dt = lookup?.lookups?.deliveryTypes?.byId || {};
                    const cam = lookup?.lookups?.campuses?.byId || {};
                    [...Object.entries(dt), ...Object.entries(cam)].forEach(([id, entry]) => {
                        GUID_LOOKUP[id.toUpperCase()] = entry.displayName || entry.name;
                    });
                })
                .catch(() => {}) // non-fatal — fall back to hardcoded table
        ]);

        container.innerHTML = generateCourseComponent(data);

        container.querySelectorAll(".addtocartbutton").forEach((button) => {
            button.addEventListener("click", handleAddToCart);
        });

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Failed to load course data: ${err.message}</p>`;
    }
});