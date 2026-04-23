/**
 * Canonical translation dictionary shape.
 * All locale files must satisfy this type.
 */
export interface Translations {
  /** Locale identifier shown in the language switcher */
  localeName: string;

  common: {
    cancel: string;
    save: string;
    create: string;
    update: string;
    back: string;
    clear: string;
    loading: string;
    processing: string;
    saving: string;
    creating: string;
    noDataFound: string;
    exportPdf: string;
    exportXlsx: string;
    exportCsv: string;
    cash: string;
    transfer: string;
    credit: string;
    name: string;
    phone: string;
    address: string;
    status: string;
    actions: string;
    active: string;
    inactive: string;
    notes: string;
    from: string;
    to: string;
    total: string;
    amount: string;
    date: string;
    view: string;
    /** "Search..." */
    searchPlaceholder: string;
    /** "Created by" label on record detail pages */
    createdBy: string;
    /** "Voided by" label on voided sale detail pages */
    voidedBy: string;
    /** "By" label — used inline next to audit entries */
    by: string;
  };

  error: {
    somethingWentWrong: string;
    unexpectedError: string;
    tryAgain: string;
  };

  /** User-facing messages for common database constraint errors. */
  dbErrors: {
    /** Postgres 23505 — duplicate SKU */
    duplicateSku: string;
    /** Postgres 23505 — duplicate name field */
    duplicateName: string;
    /** Postgres 23505 — any other unique violation */
    duplicateValue: string;
    /** Postgres 23503 — foreign key violation */
    foreignKeyViolation: string;
    /** Postgres 23502 — not-null violation */
    notNullViolation: string;
    /** Postgres 23514 — check constraint violation */
    checkViolation: string;
    /** Fallback for any other database error */
    generic: string;
  };

  pagination: {
    label: string;
    previousPage: string;
    previousPageDisabled: string;
    nextPage: string;
    nextPageDisabled: string;
    /** prefix: "Page " */
    page: string;
    rowsPerPage: string;
  };

  filter: {
    search: string;
    from: string;
    to: string;
    filterByStatus: string;
    clear: string;
  };

  login: {
    signIn: string;
    useGoogle: string;
    signInFailed: string;
    redirecting: string;
    continueWithGoogle: string;
    switchToDark: string;
    switchToLight: string;
  };

  nav: {
    overview: string;
    transactions: string;
    catalog: string;
    analytics: string;
    system: string;
    dashboard: string;
    pos: string;
    sales: string;
    purchases: string;
    credit: string;
    products: string;
    categories: string;
    inventory: string;
    campaigns: string;
    suppliers: string;
    resellers: string;
    reports: string;
    settings: string;
    expandSidebar: string;
    collapseSidebar: string;
    language: string;
  };

  dashboard: {
    title: string;
    /** "Welcome back," — the user name is appended in JSX */
    welcomeBack: string;
    openPos: string;
    todaySales: string;
    transactionsToday: string;
    grossProfitToday: string;
    totalStockItems: string;
    last7Days: string;
    date: string;
    transactions: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    noSalesData: string;
    outstandingCredit: string;
    viewAll: string;
    arCustomers: string;
    apSuppliers: string;
    lowStockAlert: string;
    /** "remaining" — prepended by quantity in JSX */
    remaining: string;
  };

  pos: {
    title: string;
    searchProducts: string;
    noProductsFound: string;
    /** "Cart" — item count appended in JSX */
    cart: string;
    cartEmpty: string;
    customer: string;
    none: string;
    bulk: string;
    promo: string;
    discount: string;
    campaignSavings: string;
    cartCampaign: string;
    subtotal: string;
    total: string;
    confirm: string;
    remaining: string;
    selectResellerForCredit: string;
    receipt: string;
    closeReceipt: string;
    thankYou: string;
    print: string;
    done: string;
    payment: string;
    checkoutConfirmTitle: string;
    margin: string;
    deliveryFee: string;
  };

  sales: {
    title: string;
    newSale: string;
    allStatus: string;
    completed: string;
    voided: string;
    searchInvoice: string;
    invoice: string;
    payment: string;
    total: string;
    cogs: string;
    profit: string;
    status: string;
    date: string;
    actions: string;
    noSalesFound: string;
    view: string;
    voidSale: string;
    voidConfirm: string;
    reasonForVoiding: string;
    voidPlaceholder: string;
    confirmVoid: string;
    saleVoidedSuccess: string;
    /** "Customer (Reseller)" label on the detail page */
    customer: string;
    grossProfit: string;
    voidReason: string;
    /** "Items" label: count appended in JSX */
    items: string;
    product: string;
    price: string;
    qty: string;
    subtotal: string;
    campaignSavings: string;
    cartCampaign: string;
    discount: string;
    /** Partial-return translations */
    processReturn: string;
    returnConfirmNote: string;
    returnHistory: string;
    refundMethod: string;
    totalRefund: string;
    refundAmount: string;
    returnQty: string;
    maxReturn: string;
    returnNotes: string;
    returnNotesPlaceholder: string;
    confirmReturn: string;
    returnCreatedSuccess: string;
  };

  products: {
    title: string;
    addProduct: string;
    searchPlaceholder: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    price: string;
    bulkPrice: string;
    margin: string;
    status: string;
    actions: string;
    active: string;
    inactive: string;
    noProductsFound: string;
    editProduct: string;
    newProduct: string;
    categoryName: string;
    categoryPlaceholder: string;
    manageCategories: string;
    unitPcs: string;
    unitKg: string;
    unitPack: string;
    unitBox: string;
    unitLiter: string;
    sellingPrice: string;
    bulkPriceOptional: string;
    bulkPricePlaceholder: string;
    bulkMinQty: string;
    bulkMinQtyPlaceholder: string;
    productImage: string;
    created: string;
    updated: string;
    noCostData: string;
    priceHistory: string;
    noPriceHistory: string;
    unitsConversions: string;
    unitName: string;
    unitNamePlaceholder: string;
    conversionToBase: string;
    conversionPlaceholder: string;
    isBaseUnit: string;
    addUnit: string;
    deleteUnit: string;
    unitAdded: string;
    unitDeleted: string;
    noUnitsYet: string;
    baseLabel: string;
  };

  inventory: {
    title: string;
    newAdjustment: string;
    viewAdjustmentHistory: string;
    searchPlaceholder: string;
    product: string;
    stockOnHand: string;
    stockValue: string;
    batches: string;
    noInventoryFound: string;
    newAdjustmentTitle: string;
    adjustments: string;
    reason: string;
    damaged: string;
    expired: string;
    recount: string;
    initialStock: string;
    other: string;
    notesOptional: string;
    additionalNotes: string;
    items: string;
    addItem: string;
    selectProduct: string;
    qtyChange: string;
    qtyPlaceholder: string;
    costPrice: string;
    expiry: string;
    removeItem: string;
    noItemsAdded: string;
    createAdjustment: string;
    addAtLeastOne: string;
    adjustmentCreated: string;
    batch: string;
    source: string;
    qtyIn: string;
    remaining: string;
    value: string;
    added: string;
    expiredLabel: string;
    noBatches: string;
    adjustmentHistory: string;
    number: string;
    notes: string;
    noAdjustmentsYet: string;
  };

  purchases: {
    title: string;
    newPO: string;
    allStatus: string;
    draft: string;
    received: string;
    cancelled: string;
    searchPO: string;
    poNumber: string;
    supplier: string;
    payment: string;
    total: string;
    status: string;
    date: string;
    actions: string;
    noPOFound: string;
    view: string;
    newPOTitle: string;
    noSupplier: string;
    paymentMethod: string;
    creditTempo: string;
    notesOptional: string;
    additionalNotes: string;
    items: string;
    addItem: string;
    selectProduct: string;
    quantity: string;
    costPrice: string;
    expiry: string;
    removeItem: string;
    noItemsAdded: string;
    createPO: string;
    addAtLeastOne: string;
    poCreated: string;
    /** "Created" label on detail page */
    created: string;
    notes: string;
    product: string;
    subtotal: string;
    receive: string;
    cancelPO: string;
    poReceived: string;
    poCancelled: string;
  };

  reports: {
    title: string;
    balanceSheet: string;
    balanceSheetDesc: string;
    profitLoss: string;
    profitLossDesc: string;
    salesSummary: string;
    salesSummaryDesc: string;
    from: string;
    to: string;
    clear: string;
    exportPdf: string;
    date: string;
    transactions: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    margin: string;
    noSalesData: string;
    total: string;
    startDate: string;
    endDate: string;
    generate: string;
    loading: string;
    totalRevenue: string;
    expenses: string;
    totalExpenses: string;
    netProfit: string;
    searchPlaceholder: string;
    filterByCategory: string;
    allCategories: string;
    product: string;
    category: string;
    stockOnHand: string;
    stockValue: string;
    noStockData: string;
    assets: string;
    liabilities: string;
    equity: string;
    liabilitiesEquity: string;
    month: string;
    year: string;
    monthly: string;
    yearly: string;
  };

  settings: {
    title: string;
    storeSettings: string;
    storeName: string;
    storeNamePlaceholder: string;
    storeIcon: string;
    saveSettings: string;
    storeSettingsUpdated: string;
    categories: string;
    newCategory: string;
    noCategoriesYet: string;
    editCategory: string;
    categoryName: string;
    categoryPlaceholder: string;
    categoryUpdated: string;
    categoryCreated: string;
    suppliers: string;
    addSupplier: string;
    editSupplier: string;
    noSuppliersYet: string;
    supplierCreated: string;
    supplierUpdated: string;
    resellers: string;
    addReseller: string;
    noResellersYet: string;
    editReseller: string;
    newReseller: string;
    resellerUpdated: string;
    resellerCreated: string;
    userAccess: string;
    user: string;
    signedUp: string;
    role: string;
    noAccess: string;
    ownerRole: string;
    cashierRole: string;
    you: string;
    noUsersFound: string;
    userAccessNote: string;
    roleSetTo: string;
    accessRevoked: string;
    campaigns: string;
    newCampaign: string;
    noCampaignsYet: string;
    live: string;
    scheduled: string;
    disabled: string;
    always: string;
    minCartTotal: string;
    editCampaign: string;
    campaignName: string;
    campaignNamePlaceholder: string;
    discountType: string;
    percentage: string;
    fixedAmount: string;
    discountValue: string;
    startDate: string;
    endDate: string;
    triggerRule: string;
    triggerAlways: string;
    triggerMinCart: string;
    minimumCartTotal: string;
    productsOptional: string;
    campaignUpdated: string;
    campaignCreated: string;
    salesHistory: string;
    invoice: string;
    amount: string;
    payment: string;
    status: string;
    date: string;
    actions: string;
    noSalesYet: string;
    voidSale: string;
    voidConfirmFull: string;
    reasonForVoiding: string;
    voidPlaceholder: string;
    void: string;
    saleVoided: string;
    language: string;
    english: string;
    indonesian: string;
  };

  credit: {
    title: string;
    accountsReceivable: string;
    accountsPayable: string;
    arSection: string;
    apSection: string;
    noOutstandingCredit: string;
    noOutstandingPO: string;
    invoice: string;
    reseller: string;
    date: string;
    total: string;
    collected: string;
    outstanding: string;
    view: string;
    poNumber: string;
    supplier: string;
    paid: string;
    collectPayment: string;
    noCollections: string;
    method: string;
    notes: string;
    collectCustomerPayment: string;
    paymentMethod: string;
    notesOptional: string;
    referenceMemo: string;
    paymentCollected: string;
    recordPayment: string;
    noPOPayments: string;
    recordSupplierPayment: string;
    paymentRecorded: string;
  };

  /**
   * Translations for system-seeded account names in the `accounts` table.
   * Keyed by account code (e.g. "1001"). User-created accounts are not listed
   * here and will fall back to the DB name via `getAccountName()`.
   */
  accountNames: Record<string, string>;
}

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

/** English translations */
export const en: Translations = {
  localeName: "English",

  common: {
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    update: "Update",
    back: "Back",
    clear: "Clear",
    loading: "Loading...",
    processing: "Processing...",
    saving: "Saving...",
    creating: "Creating...",
    noDataFound: "No data found",
    exportPdf: "Export PDF",
    exportXlsx: "XLSX",
    exportCsv: "CSV",
    cash: "Cash",
    transfer: "Transfer",
    credit: "Credit",
    name: "Name",
    phone: "Phone",
    address: "Address",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    notes: "Notes",
    from: "From",
    to: "To",
    total: "Total",
    amount: "Amount",
    date: "Date",
    view: "View",
    searchPlaceholder: "Search...",
    createdBy: "Created by",
    voidedBy: "Voided by",
    by: "by",
  },

  error: {
    somethingWentWrong: "Something went wrong",
    unexpectedError: "An unexpected error occurred. Please try again.",
    tryAgain: "Try again",
  },

  dbErrors: {
    duplicateSku:
      "A product with this SKU already exists. Please use a different SKU.",
    duplicateName:
      "A record with this name already exists. Please use a different name.",
    duplicateValue: "This value already exists. Please use a different one.",
    foreignKeyViolation:
      "This record is linked to other data and cannot be removed.",
    notNullViolation:
      "A required field is missing. Please fill in all required fields.",
    checkViolation: "The provided value is not allowed.",
    generic: "Something went wrong. Please try again.",
  },

  pagination: {
    label: "Pagination",
    previousPage: "Previous page",
    previousPageDisabled: "Previous page (disabled)",
    nextPage: "Next page",
    nextPageDisabled: "Next page (disabled)",
    page: "Page",
    rowsPerPage: "Rows per page",
  },

  filter: {
    search: "Search...",
    from: "From",
    to: "To",
    filterByStatus: "Filter by status",
    clear: "Clear",
  },

  login: {
    signIn: "Sign in",
    useGoogle: "Use your Google account to continue",
    signInFailed: "Sign-in failed. Please try again.",
    redirecting: "Redirecting...",
    continueWithGoogle: "Continue with Google",
    switchToDark: "Switch to dark mode",
    switchToLight: "Switch to light mode",
  },

  nav: {
    overview: "Overview",
    transactions: "Transactions",
    catalog: "Catalog",
    analytics: "Analytics",
    system: "System",
    dashboard: "Dashboard",
    pos: "POS",
    sales: "Sales",
    purchases: "Purchases",
    credit: "Credit",
    products: "Products",
    categories: "Categories",
    inventory: "Inventory",
    campaigns: "Campaigns",
    suppliers: "Suppliers",
    resellers: "Resellers",
    reports: "Reports",
    settings: "Settings",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    language: "Language",
  },

  dashboard: {
    title: "Dashboard",
    welcomeBack: "Welcome back,",
    openPos: "Open POS",
    todaySales: "Today's Sales",
    transactionsToday: "Transactions Today",
    grossProfitToday: "Gross Profit Today",
    totalStockItems: "Total Stock Items",
    last7Days: "Last 7 Days Sales Summary",
    date: "Date",
    transactions: "Transactions",
    revenue: "Revenue",
    cogs: "COGS",
    grossProfit: "Gross Profit",
    noSalesData: "No sales data yet",
    outstandingCredit: "Outstanding Credit",
    viewAll: "View all →",
    arCustomers: "AR — Customers owe you",
    apSuppliers: "AP — You owe suppliers",
    lowStockAlert: "Low Stock Alert",
    remaining: "remaining",
  },

  pos: {
    title: "Point of Sale",
    searchProducts: "Search products by name, SKU, or category...",
    noProductsFound: "No products found",
    cart: "Cart",
    cartEmpty: "Cart is empty",
    customer: "Customer (Reseller)",
    none: "— None —",
    bulk: "BULK",
    promo: "PROMO",
    discount: "Discount",
    campaignSavings: "Campaign savings",
    cartCampaign: "Cart campaign",
    subtotal: "Subtotal",
    total: "Total",
    confirm: "Confirm",
    remaining: "Remaining",
    selectResellerForCredit: "Select a reseller to sell on credit",
    receipt: "Receipt",
    closeReceipt: "Close receipt",
    thankYou: "Thank you for your purchase!",
    print: "Print",
    done: "Done",
    payment: "Payment",
    checkoutConfirmTitle: "Confirm Checkout",
    margin: "Margin",
    deliveryFee: "Delivery Fee",
  },

  sales: {
    title: "Sales",
    newSale: "New Sale",
    allStatus: "All Status",
    completed: "Completed",
    voided: "Voided",
    searchInvoice: "Search invoice...",
    invoice: "Invoice",
    payment: "Payment",
    total: "Total",
    cogs: "COGS",
    profit: "Profit",
    status: "Status",
    date: "Date",
    actions: "Actions",
    noSalesFound: "No sales found",
    view: "View",
    voidSale: "Void Sale",
    voidConfirm:
      "This will reverse the sale and restore inventory. This action cannot be undone.",
    reasonForVoiding: "Reason for voiding",
    voidPlaceholder: "e.g. Customer cancelled, wrong items",
    confirmVoid: "Confirm Void",
    saleVoidedSuccess: "Sale voided successfully",
    customer: "Customer (Reseller)",
    grossProfit: "Gross Profit",
    voidReason: "Void Reason",
    items: "Items",
    product: "Product",
    price: "Price",
    qty: "Qty",
    subtotal: "Subtotal",
    campaignSavings: "Campaign savings",
    cartCampaign: "Cart campaign",
    discount: "Discount",
    processReturn: "Process Return",
    returnConfirmNote:
      "Enter the quantity to return for each item. Inventory will be restored and a refund will be issued.",
    returnHistory: "Return History",
    refundMethod: "Refund Method",
    totalRefund: "Total Refund",
    refundAmount: "Refund",
    returnQty: "Return Qty",
    maxReturn: "Returnable",
    returnNotes: "Notes (optional)",
    returnNotesPlaceholder: "e.g. Customer changed their mind",
    confirmReturn: "Confirm Return",
    returnCreatedSuccess: "Return processed successfully",
  },

  products: {
    title: "Products",
    addProduct: "Add Product",
    searchPlaceholder: "Search by name or SKU...",
    sku: "SKU",
    name: "Name",
    category: "Category",
    unit: "Unit",
    price: "Price",
    bulkPrice: "Bulk Price",
    margin: "Margin",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    noProductsFound: "No products found",
    editProduct: "Edit Product",
    newProduct: "New Product",
    categoryName: "Category Name",
    categoryPlaceholder: "e.g. Beverages",
    manageCategories: "Manage →",
    unitPcs: "Pieces (pcs)",
    unitKg: "Kilogram (kg)",
    unitPack: "Pack",
    unitBox: "Box",
    unitLiter: "Liter",
    sellingPrice: "Selling Price",
    bulkPriceOptional: "Bulk Price (optional)",
    bulkPricePlaceholder: "e.g. 18000",
    bulkMinQty: "Bulk Min Qty",
    bulkMinQtyPlaceholder: "e.g. 10",
    productImage: "Product Image",
    created: "Product created",
    updated: "Product updated",
    noCostData: "No cost data",
    priceHistory: "Price History",
    noPriceHistory: "No price history yet",
    unitsConversions: "Units & Conversions",
    unitName: "Unit Name",
    unitNamePlaceholder: "e.g. carton, pack",
    conversionToBase: "Qty per base unit",
    conversionPlaceholder: "e.g. 20",
    isBaseUnit: "Base unit",
    addUnit: "Add Unit",
    deleteUnit: "Delete unit",
    unitAdded: "Unit added",
    unitDeleted: "Unit deleted",
    noUnitsYet: "No units defined yet",
    baseLabel: "Base",
  },

  inventory: {
    title: "Inventory",
    newAdjustment: "New Adjustment",
    viewAdjustmentHistory: "View Adjustment History",
    searchPlaceholder: "Search by name or SKU...",
    product: "Product",
    stockOnHand: "Stock on Hand",
    stockValue: "Stock Value",
    batches: "Batches",
    noInventoryFound: "No inventory data found",
    newAdjustmentTitle: "New Inventory Adjustment",
    adjustments: "Adjustments",
    reason: "Reason",
    damaged: "Damaged",
    expired: "Expired",
    recount: "Recount",
    initialStock: "Initial Stock",
    other: "Other",
    notesOptional: "Notes (optional)",
    additionalNotes: "Additional notes...",
    items: "Items",
    addItem: "Add Item",
    selectProduct: "Select product...",
    qtyChange: "Qty change (+/-)",
    qtyPlaceholder: "e.g. -5 or 3",
    costPrice: "Cost price",
    expiry: "Expiry",
    removeItem: "Remove item",
    noItemsAdded: 'No items added. Click "Add Item" to start.',
    createAdjustment: "Create Adjustment",
    addAtLeastOne: "Add at least one item",
    adjustmentCreated: "Adjustment created",
    batch: "Batch",
    source: "Source",
    qtyIn: "Qty In",
    remaining: "Remaining",
    value: "Value",
    added: "Added",
    expiredLabel: "expired",
    noBatches: "No inventory batches for this product",
    adjustmentHistory: "Inventory Adjustments",
    number: "Number",
    notes: "Notes",
    noAdjustmentsYet: "No adjustments yet",
  },

  purchases: {
    title: "Purchase Orders",
    newPO: "New PO",
    allStatus: "All Status",
    draft: "Draft",
    received: "Received",
    cancelled: "Cancelled",
    searchPO: "Search PO number...",
    poNumber: "PO Number",
    supplier: "Supplier",
    payment: "Payment",
    total: "Total",
    status: "Status",
    date: "Date",
    actions: "Actions",
    noPOFound: "No purchase orders found",
    view: "View",
    newPOTitle: "New Purchase Order",
    noSupplier: "No supplier",
    paymentMethod: "Payment Method",
    creditTempo: "Credit (Tempo)",
    notesOptional: "Notes (optional)",
    additionalNotes: "Additional notes...",
    items: "Items",
    addItem: "Add Item",
    selectProduct: "Select product...",
    quantity: "Quantity",
    costPrice: "Cost Price",
    expiry: "Expiry",
    removeItem: "Remove item",
    noItemsAdded: 'No items added. Click "Add Item" to start.',
    createPO: "Create PO",
    addAtLeastOne: "Add at least one item",
    poCreated: "Purchase order created",
    created: "Created",
    notes: "Notes",
    product: "Product",
    subtotal: "Subtotal",
    receive: "Receive",
    cancelPO: "Cancel PO",
    poReceived: "Purchase order received",
    poCancelled: "Purchase order cancelled",
  },

  reports: {
    title: "Reports",
    balanceSheet: "Balance Sheet",
    balanceSheetDesc: "View assets, liabilities, and equity",
    profitLoss: "Profit & Loss",
    profitLossDesc: "Revenue and expenses over a period",
    salesSummary: "Sales Summary",
    salesSummaryDesc: "Daily sales, COGS, and gross profit",
    from: "From",
    to: "To",
    clear: "Clear",
    exportPdf: "Export PDF",
    date: "Date",
    transactions: "Transactions",
    revenue: "Revenue",
    cogs: "COGS",
    grossProfit: "Gross Profit",
    margin: "Margin",
    noSalesData: "No sales data for this period",
    total: "Total",
    startDate: "Start Date",
    endDate: "End Date",
    generate: "Generate",
    loading: "Loading...",
    totalRevenue: "Total Revenue",
    expenses: "Expenses",
    totalExpenses: "Total Expenses",
    netProfit: "Net Profit",
    searchPlaceholder: "Search by name or SKU...",
    filterByCategory: "Filter by category",
    allCategories: "All Categories",
    product: "Product",
    category: "Category",
    stockOnHand: "Stock on Hand",
    stockValue: "Stock Value",
    noStockData: "No stock data found",
    assets: "Assets",
    liabilities: "Liabilities",
    equity: "Equity",
    liabilitiesEquity: "Liabilities + Equity",
    month: "Month",
    year: "Year",
    monthly: "Monthly",
    yearly: "Yearly",
  },

  settings: {
    title: "Settings",
    storeSettings: "Store Settings",
    storeName: "Store Name",
    storeNamePlaceholder: "e.g. Toko Sejahtera",
    storeIcon: "Store Icon",
    saveSettings: "Save Settings",
    storeSettingsUpdated: "Store settings updated!",
    categories: "Categories",
    newCategory: "New Category",
    noCategoriesYet: "No categories yet",
    editCategory: "Edit Category",
    categoryName: "Category Name",
    categoryPlaceholder: "e.g. Beverages",
    categoryUpdated: "Category updated",
    categoryCreated: "Category created",
    suppliers: "Suppliers",
    addSupplier: "Add Supplier",
    editSupplier: "Edit Supplier",
    noSuppliersYet: "No suppliers yet",
    supplierCreated: "Supplier created",
    supplierUpdated: "Supplier updated",
    resellers: "Resellers",
    addReseller: "Add Reseller",
    noResellersYet: "No resellers yet",
    editReseller: "Edit Reseller",
    newReseller: "New Reseller",
    resellerUpdated: "Reseller updated",
    resellerCreated: "Reseller created",
    userAccess: "User Access",
    user: "User",
    signedUp: "Signed up",
    role: "Role",
    noAccess: "— No Access —",
    ownerRole: "Owner",
    cashierRole: "Cashier",
    you: "(you)",
    noUsersFound: "No users found",
    userAccessNote:
      "Only users who have signed in via Google appear here. Set a role to grant access; remove it to revoke.",
    roleSetTo: "Role set to",
    accessRevoked: "Access revoked",
    campaigns: "Campaigns",
    newCampaign: "New Campaign",
    noCampaignsYet: "No campaigns yet",
    live: "Live",
    scheduled: "Scheduled",
    disabled: "Disabled",
    always: "Always",
    minCartTotal: "Min cart total",
    editCampaign: "Edit Campaign",
    campaignName: "Campaign Name",
    campaignNamePlaceholder: "Weekend Sale",
    discountType: "Discount Type",
    percentage: "Percentage (%)",
    fixedAmount: "Fixed Amount (IDR)",
    discountValue: "Discount Value",
    startDate: "Start Date",
    endDate: "End Date",
    triggerRule: "Trigger Rule",
    triggerAlways: "Always — applies whenever product is in cart",
    triggerMinCart: "Min cart total — order discount when subtotal ≥ threshold",
    minimumCartTotal: "Minimum Cart Total (IDR)",
    productsOptional: "Products (leave empty for all products)",
    campaignUpdated: "Campaign updated",
    campaignCreated: "Campaign created",
    salesHistory: "Sales History",
    invoice: "Invoice",
    amount: "Amount",
    payment: "Payment",
    status: "Status",
    date: "Date",
    actions: "Actions",
    noSalesYet: "No sales yet",
    voidSale: "Void Sale",
    voidConfirmFull:
      "This will reverse the sale, restore inventory, and create a reversal journal entry. This action cannot be undone.",
    reasonForVoiding: "Reason for voiding",
    voidPlaceholder: "e.g. Customer cancelled, wrong items",
    void: "Void",
    saleVoided: "Sale voided",
    language: "Language",
    english: "English",
    indonesian: "Indonesian",
  },

  credit: {
    title: "Credit Overview",
    accountsReceivable: "Accounts Receivable",
    accountsPayable: "Accounts Payable",
    arSection: "Accounts Receivable — Customer Credit Sales",
    apSection: "Accounts Payable — Supplier Credit POs",
    noOutstandingCredit: "No outstanding credit sales.",
    noOutstandingPO: "No outstanding credit purchase orders.",
    invoice: "Invoice",
    reseller: "Reseller",
    date: "Date",
    total: "Total",
    collected: "Collected",
    outstanding: "Outstanding",
    view: "View",
    poNumber: "PO Number",
    supplier: "Supplier",
    paid: "Paid",
    collectPayment: "Collect Payment",
    noCollections: "No collections recorded yet.",
    method: "Method",
    notes: "Notes",
    collectCustomerPayment: "Collect Customer Payment",
    paymentMethod: "Payment Method",
    notesOptional: "Notes (optional)",
    referenceMemo: "Reference number, memo...",
    paymentCollected: "Payment collected",
    recordPayment: "Record Payment",
    noPOPayments: "No payments recorded yet.",
    recordSupplierPayment: "Record Supplier Payment",
    paymentRecorded: "Payment recorded",
  },

  // System-seeded chart of accounts (keyed by account code)
  accountNames: {
    "1001": "Cash",
    "1002": "Bank / Transfer",
    "1003": "Accounts Receivable",
    "1100": "Inventory",
    "2001": "Accounts Payable",
    "3001": "Owner Equity",
    "4001": "Sales Revenue",
    "5001": "Cost of Goods Sold",
    "5002": "Inventory Adjustment Expense",
    "5003": "Delivery Expense",
  },
};

// ---------------------------------------------------------------------------
// Indonesian
// ---------------------------------------------------------------------------

/** Indonesian (Bahasa Indonesia) translations */
export const id: Translations = {
  localeName: "Indonesia",

  common: {
    cancel: "Batal",
    save: "Simpan",
    create: "Buat",
    update: "Perbarui",
    back: "Kembali",
    clear: "Hapus",
    loading: "Memuat...",
    processing: "Memproses...",
    saving: "Menyimpan...",
    creating: "Membuat...",
    noDataFound: "Data tidak ditemukan",
    exportPdf: "Ekspor PDF",
    exportXlsx: "XLSX",
    exportCsv: "CSV",
    cash: "Tunai",
    transfer: "Transfer",
    credit: "Kredit",
    name: "Nama",
    phone: "Telepon",
    address: "Alamat",
    status: "Status",
    actions: "Aksi",
    active: "Aktif",
    inactive: "Tidak Aktif",
    notes: "Catatan",
    from: "Dari",
    to: "Sampai",
    total: "Total",
    amount: "Jumlah",
    date: "Tanggal",
    view: "Lihat",
    searchPlaceholder: "Cari...",
    createdBy: "Dibuat oleh",
    voidedBy: "Dibatalkan oleh",
    by: "oleh",
  },

  error: {
    somethingWentWrong: "Terjadi kesalahan",
    unexpectedError: "Kesalahan tak terduga. Silakan coba lagi.",
    tryAgain: "Coba lagi",
  },

  dbErrors: {
    duplicateSku: "Produk dengan SKU ini sudah ada. Gunakan SKU yang berbeda.",
    duplicateName: "Data dengan nama ini sudah ada. Gunakan nama yang berbeda.",
    duplicateValue: "Nilai ini sudah ada. Gunakan nilai yang berbeda.",
    foreignKeyViolation:
      "Data ini terkait dengan data lain dan tidak dapat dihapus.",
    notNullViolation:
      "Ada kolom wajib yang belum diisi. Lengkapi semua kolom yang diperlukan.",
    checkViolation: "Nilai yang dimasukkan tidak diperbolehkan.",
    generic: "Terjadi kesalahan. Silakan coba lagi.",
  },

  pagination: {
    label: "Halaman",
    previousPage: "Halaman sebelumnya",
    previousPageDisabled: "Halaman sebelumnya (nonaktif)",
    nextPage: "Halaman berikutnya",
    nextPageDisabled: "Halaman berikutnya (nonaktif)",
    page: "Halaman",
    rowsPerPage: "Baris per halaman",
  },

  filter: {
    search: "Cari...",
    from: "Dari",
    to: "Sampai",
    filterByStatus: "Filter berdasarkan status",
    clear: "Hapus",
  },

  login: {
    signIn: "Masuk",
    useGoogle: "Gunakan akun Google Anda untuk melanjutkan",
    signInFailed: "Masuk gagal. Silakan coba lagi.",
    redirecting: "Mengalihkan...",
    continueWithGoogle: "Lanjutkan dengan Google",
    switchToDark: "Ganti ke mode gelap",
    switchToLight: "Ganti ke mode terang",
  },

  nav: {
    overview: "Ikhtisar",
    transactions: "Transaksi",
    catalog: "Katalog",
    analytics: "Analitik",
    system: "Sistem",
    dashboard: "Dasbor",
    pos: "POS",
    sales: "Penjualan",
    purchases: "Pembelian",
    credit: "Kredit",
    products: "Produk",
    categories: "Kategori",
    inventory: "Inventaris",
    campaigns: "Kampanye",
    suppliers: "Pemasok",
    resellers: "Reseller",
    reports: "Laporan",
    settings: "Pengaturan",
    expandSidebar: "Perluas sidebar",
    collapseSidebar: "Ciutkan sidebar",
    language: "Bahasa",
  },

  dashboard: {
    title: "Dasbor",
    welcomeBack: "Selamat datang kembali,",
    openPos: "Buka POS",
    todaySales: "Penjualan Hari Ini",
    transactionsToday: "Transaksi Hari Ini",
    grossProfitToday: "Laba Kotor Hari Ini",
    totalStockItems: "Total Item Stok",
    last7Days: "Ringkasan Penjualan 7 Hari Terakhir",
    date: "Tanggal",
    transactions: "Transaksi",
    revenue: "Pendapatan",
    cogs: "HPP",
    grossProfit: "Laba Kotor",
    noSalesData: "Belum ada data penjualan",
    outstandingCredit: "Kredit Belum Lunas",
    viewAll: "Lihat semua →",
    arCustomers: "AR — Pelanggan berhutang kepada Anda",
    apSuppliers: "AP — Anda berhutang kepada pemasok",
    lowStockAlert: "Peringatan Stok Rendah",
    remaining: "tersisa",
  },

  pos: {
    title: "Point of Sale",
    searchProducts: "Cari produk berdasarkan nama, SKU, atau kategori...",
    noProductsFound: "Produk tidak ditemukan",
    cart: "Keranjang",
    cartEmpty: "Keranjang kosong",
    customer: "Pelanggan (Reseller)",
    none: "— Tidak Ada —",
    bulk: "GROSIR",
    promo: "PROMO",
    discount: "Diskon",
    campaignSavings: "Hemat kampanye",
    cartCampaign: "Kampanye keranjang",
    subtotal: "Subtotal",
    total: "Total",
    confirm: "Konfirmasi",
    remaining: "Sisa",
    selectResellerForCredit: "Pilih reseller untuk jual secara kredit",
    receipt: "Struk",
    closeReceipt: "Tutup struk",
    thankYou: "Terima kasih atas pembelian Anda!",
    print: "Cetak",
    done: "Selesai",
    payment: "Pembayaran",
    checkoutConfirmTitle: "Konfirmasi Pembayaran",
    margin: "Margin",
    deliveryFee: "Ongkos Kirim",
  },

  sales: {
    title: "Penjualan",
    newSale: "Penjualan Baru",
    allStatus: "Semua Status",
    completed: "Selesai",
    voided: "Dibatalkan",
    searchInvoice: "Cari invoice...",
    invoice: "Invoice",
    payment: "Pembayaran",
    total: "Total",
    cogs: "HPP",
    profit: "Laba",
    status: "Status",
    date: "Tanggal",
    actions: "Aksi",
    noSalesFound: "Penjualan tidak ditemukan",
    view: "Lihat",
    voidSale: "Batalkan Penjualan",
    voidConfirm:
      "Ini akan membalikkan penjualan dan memulihkan inventaris. Tindakan ini tidak dapat dibatalkan.",
    reasonForVoiding: "Alasan pembatalan",
    voidPlaceholder: "mis. Pelanggan membatalkan, barang salah",
    confirmVoid: "Konfirmasi Pembatalan",
    saleVoidedSuccess: "Penjualan berhasil dibatalkan",
    customer: "Pelanggan (Reseller)",
    grossProfit: "Laba Kotor",
    voidReason: "Alasan Pembatalan",
    items: "Item",
    product: "Produk",
    price: "Harga",
    qty: "Qty",
    subtotal: "Subtotal",
    campaignSavings: "Hemat kampanye",
    cartCampaign: "Kampanye keranjang",
    discount: "Diskon",
    processReturn: "Proses Retur",
    returnConfirmNote:
      "Masukkan jumlah yang ingin diretur untuk setiap item. Stok akan dipulihkan dan pengembalian dana akan diproses.",
    returnHistory: "Riwayat Retur",
    refundMethod: "Metode Pengembalian",
    totalRefund: "Total Pengembalian",
    refundAmount: "Pengembalian",
    returnQty: "Qty Retur",
    maxReturn: "Bisa Diretur",
    returnNotes: "Catatan (opsional)",
    returnNotesPlaceholder: "mis. Pelanggan berubah pikiran",
    confirmReturn: "Konfirmasi Retur",
    returnCreatedSuccess: "Retur berhasil diproses",
  },

  products: {
    title: "Produk",
    addProduct: "Tambah Produk",
    searchPlaceholder: "Cari berdasarkan nama atau SKU...",
    sku: "SKU",
    name: "Nama",
    category: "Kategori",
    unit: "Satuan",
    price: "Harga",
    bulkPrice: "Harga Grosir",
    margin: "Margin",
    status: "Status",
    actions: "Aksi",
    active: "Aktif",
    inactive: "Tidak Aktif",
    noProductsFound: "Produk tidak ditemukan",
    editProduct: "Edit Produk",
    newProduct: "Produk Baru",
    categoryName: "Nama Kategori",
    categoryPlaceholder: "mis. Minuman",
    manageCategories: "Kelola →",
    unitPcs: "Buah (pcs)",
    unitKg: "Kilogram (kg)",
    unitPack: "Pak",
    unitBox: "Kotak",
    unitLiter: "Liter",
    sellingPrice: "Harga Jual",
    bulkPriceOptional: "Harga Grosir (opsional)",
    bulkPricePlaceholder: "mis. 18000",
    bulkMinQty: "Qty Min Grosir",
    bulkMinQtyPlaceholder: "mis. 10",
    productImage: "Gambar Produk",
    created: "Produk dibuat",
    updated: "Produk diperbarui",
    noCostData: "Tidak ada data biaya",
    priceHistory: "Riwayat Harga",
    noPriceHistory: "Belum ada riwayat harga",
    unitsConversions: "Satuan & Konversi",
    unitName: "Nama Satuan",
    unitNamePlaceholder: "mis. karton, pak",
    conversionToBase: "Qty per satuan dasar",
    conversionPlaceholder: "mis. 20",
    isBaseUnit: "Satuan dasar",
    addUnit: "Tambah Satuan",
    deleteUnit: "Hapus satuan",
    unitAdded: "Satuan ditambahkan",
    unitDeleted: "Satuan dihapus",
    noUnitsYet: "Belum ada satuan",
    baseLabel: "Dasar",
  },

  inventory: {
    title: "Inventaris",
    newAdjustment: "Penyesuaian Baru",
    viewAdjustmentHistory: "Lihat Riwayat Penyesuaian",
    searchPlaceholder: "Cari berdasarkan nama atau SKU...",
    product: "Produk",
    stockOnHand: "Stok Tersedia",
    stockValue: "Nilai Stok",
    batches: "Batch",
    noInventoryFound: "Data inventaris tidak ditemukan",
    newAdjustmentTitle: "Penyesuaian Inventaris Baru",
    adjustments: "Penyesuaian",
    reason: "Alasan",
    damaged: "Rusak",
    expired: "Kadaluarsa",
    recount: "Penghitungan Ulang",
    initialStock: "Stok Awal",
    other: "Lainnya",
    notesOptional: "Catatan (opsional)",
    additionalNotes: "Catatan tambahan...",
    items: "Item",
    addItem: "Tambah Item",
    selectProduct: "Pilih produk...",
    qtyChange: "Perubahan qty (+/-)",
    qtyPlaceholder: "mis. -5 atau 3",
    costPrice: "Harga pokok",
    expiry: "Kadaluarsa",
    removeItem: "Hapus item",
    noItemsAdded: 'Belum ada item. Klik "Tambah Item" untuk mulai.',
    createAdjustment: "Buat Penyesuaian",
    addAtLeastOne: "Tambahkan minimal satu item",
    adjustmentCreated: "Penyesuaian dibuat",
    batch: "Batch",
    source: "Sumber",
    qtyIn: "Qty Masuk",
    remaining: "Tersisa",
    value: "Nilai",
    added: "Ditambahkan",
    expiredLabel: "kadaluarsa",
    noBatches: "Tidak ada batch inventaris untuk produk ini",
    adjustmentHistory: "Penyesuaian Inventaris",
    number: "Nomor",
    notes: "Catatan",
    noAdjustmentsYet: "Belum ada penyesuaian",
  },

  purchases: {
    title: "Pesanan Pembelian",
    newPO: "PO Baru",
    allStatus: "Semua Status",
    draft: "Draf",
    received: "Diterima",
    cancelled: "Dibatalkan",
    searchPO: "Cari nomor PO...",
    poNumber: "Nomor PO",
    supplier: "Pemasok",
    payment: "Pembayaran",
    total: "Total",
    status: "Status",
    date: "Tanggal",
    actions: "Aksi",
    noPOFound: "Pesanan pembelian tidak ditemukan",
    view: "Lihat",
    newPOTitle: "Pesanan Pembelian Baru",
    noSupplier: "Tanpa pemasok",
    paymentMethod: "Metode Pembayaran",
    creditTempo: "Kredit (Tempo)",
    notesOptional: "Catatan (opsional)",
    additionalNotes: "Catatan tambahan...",
    items: "Item",
    addItem: "Tambah Item",
    selectProduct: "Pilih produk...",
    quantity: "Kuantitas",
    costPrice: "Harga Pokok",
    expiry: "Kadaluarsa",
    removeItem: "Hapus item",
    noItemsAdded: 'Belum ada item. Klik "Tambah Item" untuk mulai.',
    createPO: "Buat PO",
    addAtLeastOne: "Tambahkan minimal satu item",
    poCreated: "Pesanan pembelian dibuat",
    created: "Dibuat",
    notes: "Catatan",
    product: "Produk",
    subtotal: "Subtotal",
    receive: "Terima",
    cancelPO: "Batalkan PO",
    poReceived: "Pesanan pembelian diterima",
    poCancelled: "Pesanan pembelian dibatalkan",
  },

  reports: {
    title: "Laporan",
    balanceSheet: "Neraca",
    balanceSheetDesc: "Lihat aset, liabilitas, dan ekuitas",
    profitLoss: "Laba Rugi",
    profitLossDesc: "Pendapatan dan pengeluaran dalam suatu periode",
    salesSummary: "Ringkasan Penjualan",
    salesSummaryDesc: "Penjualan harian, HPP, dan laba kotor",
    from: "Dari",
    to: "Sampai",
    clear: "Hapus",
    exportPdf: "Ekspor PDF",
    date: "Tanggal",
    transactions: "Transaksi",
    revenue: "Pendapatan",
    cogs: "HPP",
    grossProfit: "Laba Kotor",
    margin: "Margin",
    noSalesData: "Tidak ada data penjualan untuk periode ini",
    total: "Total",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Akhir",
    generate: "Buat",
    loading: "Memuat...",
    totalRevenue: "Total Pendapatan",
    expenses: "Pengeluaran",
    totalExpenses: "Total Pengeluaran",
    netProfit: "Laba Bersih",
    searchPlaceholder: "Cari berdasarkan nama atau SKU...",
    filterByCategory: "Filter berdasarkan kategori",
    allCategories: "Semua Kategori",
    product: "Produk",
    category: "Kategori",
    stockOnHand: "Stok Tersedia",
    stockValue: "Nilai Stok",
    noStockData: "Data stok tidak ditemukan",
    assets: "Aset",
    liabilities: "Liabilitas",
    equity: "Ekuitas",
    liabilitiesEquity: "Liabilitas + Ekuitas",
    month: "Bulan",
    year: "Tahun",
    monthly: "Bulanan",
    yearly: "Tahunan",
  },

  settings: {
    title: "Pengaturan",
    storeSettings: "Pengaturan Toko",
    storeName: "Nama Toko",
    storeNamePlaceholder: "mis. Toko Sejahtera",
    storeIcon: "Ikon Toko",
    saveSettings: "Simpan Pengaturan",
    storeSettingsUpdated: "Pengaturan toko diperbarui!",
    categories: "Kategori",
    newCategory: "Kategori Baru",
    noCategoriesYet: "Belum ada kategori",
    editCategory: "Edit Kategori",
    categoryName: "Nama Kategori",
    categoryPlaceholder: "mis. Minuman",
    categoryUpdated: "Kategori diperbarui",
    categoryCreated: "Kategori dibuat",
    suppliers: "Pemasok",
    addSupplier: "Tambah Pemasok",
    editSupplier: "Edit Pemasok",
    noSuppliersYet: "Belum ada pemasok",
    supplierCreated: "Pemasok dibuat",
    supplierUpdated: "Pemasok diperbarui",
    resellers: "Reseller",
    addReseller: "Tambah Reseller",
    noResellersYet: "Belum ada reseller",
    editReseller: "Edit Reseller",
    newReseller: "Reseller Baru",
    resellerUpdated: "Reseller diperbarui",
    resellerCreated: "Reseller dibuat",
    userAccess: "Akses Pengguna",
    user: "Pengguna",
    signedUp: "Terdaftar",
    role: "Peran",
    noAccess: "— Tanpa Akses —",
    ownerRole: "Pemilik",
    cashierRole: "Kasir",
    you: "(Anda)",
    noUsersFound: "Pengguna tidak ditemukan",
    userAccessNote:
      "Hanya pengguna yang telah masuk melalui Google yang muncul di sini. Tetapkan peran untuk memberikan akses; hapus untuk mencabut.",
    roleSetTo: "Peran disetel ke",
    accessRevoked: "Akses dicabut",
    campaigns: "Kampanye",
    newCampaign: "Kampanye Baru",
    noCampaignsYet: "Belum ada kampanye",
    live: "Aktif",
    scheduled: "Terjadwal",
    disabled: "Dinonaktifkan",
    always: "Selalu",
    minCartTotal: "Min total keranjang",
    editCampaign: "Edit Kampanye",
    campaignName: "Nama Kampanye",
    campaignNamePlaceholder: "Diskon Akhir Pekan",
    discountType: "Jenis Diskon",
    percentage: "Persentase (%)",
    fixedAmount: "Jumlah Tetap (IDR)",
    discountValue: "Nilai Diskon",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Akhir",
    triggerRule: "Aturan Pemicu",
    triggerAlways: "Selalu — berlaku setiap kali produk ada di keranjang",
    triggerMinCart:
      "Min total keranjang — diskon pesanan jika subtotal ≥ ambang batas",
    minimumCartTotal: "Total Keranjang Minimum (IDR)",
    productsOptional: "Produk (kosongkan untuk semua produk)",
    campaignUpdated: "Kampanye diperbarui",
    campaignCreated: "Kampanye dibuat",
    salesHistory: "Riwayat Penjualan",
    invoice: "Invoice",
    amount: "Jumlah",
    payment: "Pembayaran",
    status: "Status",
    date: "Tanggal",
    actions: "Aksi",
    noSalesYet: "Belum ada penjualan",
    voidSale: "Batalkan Penjualan",
    voidConfirmFull:
      "Ini akan membalikkan penjualan, memulihkan inventaris, dan membuat entri jurnal pembalikan. Tindakan ini tidak dapat dibatalkan.",
    reasonForVoiding: "Alasan pembatalan",
    voidPlaceholder: "mis. Pelanggan membatalkan, barang salah",
    void: "Batalkan",
    saleVoided: "Penjualan dibatalkan",
    language: "Bahasa",
    english: "Inggris",
    indonesian: "Indonesia",
  },

  credit: {
    title: "Ikhtisar Kredit",
    accountsReceivable: "Piutang Usaha",
    accountsPayable: "Utang Usaha",
    arSection: "Piutang Usaha — Penjualan Kredit Pelanggan",
    apSection: "Utang Usaha — PO Kredit Pemasok",
    noOutstandingCredit: "Tidak ada penjualan kredit yang belum lunas.",
    noOutstandingPO: "Tidak ada pesanan pembelian kredit yang belum lunas.",
    invoice: "Invoice",
    reseller: "Reseller",
    date: "Tanggal",
    total: "Total",
    collected: "Terkumpul",
    outstanding: "Belum Lunas",
    view: "Lihat",
    poNumber: "Nomor PO",
    supplier: "Pemasok",
    paid: "Dibayar",
    collectPayment: "Tagih Pembayaran",
    noCollections: "Belum ada penagihan yang dicatat.",
    method: "Metode",
    notes: "Catatan",
    collectCustomerPayment: "Tagih Pembayaran Pelanggan",
    paymentMethod: "Metode Pembayaran",
    notesOptional: "Catatan (opsional)",
    referenceMemo: "Nomor referensi, memo...",
    paymentCollected: "Pembayaran berhasil ditagih",
    recordPayment: "Catat Pembayaran",
    noPOPayments: "Belum ada pembayaran yang dicatat.",
    recordSupplierPayment: "Catat Pembayaran Pemasok",
    paymentRecorded: "Pembayaran dicatat",
  },

  // System-seeded chart of accounts (keyed by account code)
  accountNames: {
    "1001": "Tunai",
    "1002": "Bank / Transfer",
    "1003": "Piutang Usaha",
    "1100": "Inventaris",
    "2001": "Utang Usaha",
    "3001": "Ekuitas Pemilik",
    "4001": "Pendapatan Penjualan",
    "5001": "Harga Pokok Penjualan",
    "5002": "Beban Penyesuaian Inventaris",
    "5003": "Beban Pengiriman",
  },
};

/** All supported locale codes */
export type Locale = "en" | "id";

/** Map of locale → translation dictionary */
export const localeMap: Record<Locale, Translations> = { en, id };

/**
 * Returns the translated account name for a given account code.
 * Falls back to the DB name when the code is not in the map (e.g. user-created accounts).
 */
export function getAccountName(
  code: string,
  dbName: string,
  t: Translations,
): string {
  return t.accountNames[code] ?? dbName;
}
