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
    /** "All Status" — used by ActiveFilter and other status dropdowns */
    allStatus: string;
    /** "All Categories" — first option in a category dropdown */
    allCategories: string;
    /** "Filter by category" — accessible label for the category dropdown */
    filterByCategory: string;
    /** "All Units" — first option in a unit dropdown */
    allUnits: string;
    /** "Filter by unit" — accessible label for the unit dropdown */
    filterByUnit: string;
    /** "Price Range" — label for a min/max price filter */
    priceRange: string;
    /** "Min" placeholder shown in a numeric range input */
    minPlaceholder: string;
    /** "Max" placeholder shown in a numeric range input */
    maxPlaceholder: string;
    /** "All Payment Types" — first option in a payment type dropdown */
    allPaymentTypes: string;
    /** "Filter by payment type" — accessible label for the payment type dropdown */
    filterByPaymentType: string;
    /** "All Suppliers" — first option in a supplier dropdown */
    allSuppliers: string;
    /** "Filter by supplier" — accessible label for the supplier dropdown */
    filterBySupplier: string;
    /** "Filters" — label for the filter toggle button */
    filters: string;
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
    notifications: string;
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
    outOfStockItems: string;
    lowStockItems: string;
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
    downloadPdf: string;
    done: string;
    payment: string;
    checkoutConfirmTitle: string;
    margin: string;
    deliveryFee: string;
    stock: string;
    outOfStock: string;
    dueDate: string;
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
    lowStockOnly: string;
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
    voidPO: string;
    voidPOConfirm: string;
    reasonForVoiding: string;
    voidPlaceholder: string;
    confirmVoid: string;
    poVoidedSuccess: string;
    voidReason: string;
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
    dueDate: string;
    dueDateRequired: string;
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
    exportXlsx: string;
    exportCsv: string;
    date: string;
    transactions: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    discount: string;
    deliveryFee: string;
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
    dueDate: string;
    pastDue: string;
    dueSoon: string;
    dueTomorrow: string;
    noDueDate: string;
  };

  notifications: {
    creditDue: {
      salesTitle: string;
      /** Placeholders: {name}, {amount} */
      salesBody: string;
      purchaseTitle: string;
      /** Placeholders: {name}, {amount} */
      purchaseBody: string;
    };
    page: {
      title: string;
      /** Shown when there are no notifications yet */
      empty: string;
      markAllRead: string;
    };
  };

  /**
   * Translations for system-seeded account names in the `accounts` table.
   * Keyed by account code (e.g. "1001"). User-created accounts are not listed
   * here and will fall back to the DB name via `getAccountName()`.
   */
  accountNames: Record<string, string>;
}

/** All supported locale codes */
export type Locale = "en" | "id";

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
