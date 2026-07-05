import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Authentication
 */
export const providerEnum = pgEnum("provider", [
    "LOCAL",
]);

/**
 * Transaction
 */
export const transactionTypeEnum = pgEnum("transaction_type", [
    "INCOME",
    "EXPENSE",
]);

/**
 * Account
 */
export const accountTypeEnum = pgEnum("account_type", [
    "CASH",
    "BANK",
    "UPI",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "E_WALLET",
]);

/**
 * Lent / Borrow
 */
export const loanStatusEnum = pgEnum("loan_status", [
    "PENDING",
    "COMPLETED",
]);

/**
 * Category
 */
export const categoryTypeEnum = pgEnum("category_type", [
    "INCOME",
    "EXPENSE",
]);

/**
 * Theme
 */
export const themeEnum = pgEnum("theme", [
    "LIGHT",
    "DARK",
    "SYSTEM",
]);

/**
 * Audit
 */
export const auditActionEnum = pgEnum("audit_action", [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
]);

export const auditEntityEnum = pgEnum("audit_entity", [
    "USER",
    "ACCOUNT",
    "CATEGORY",
    "TRANSACTION",
    "LENT",
    "BORROW",
    "REPAYMENT",
    "SETTING",
]);

export const debtTypeEnum = pgEnum("debt_type", [
    "LENT",
    "BORROW",
]);