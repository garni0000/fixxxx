import { pgTable, uuid, text, timestamp, decimal, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", ["user", "admin"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["basic", "pro", "vip"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "expired", "pending"]);
export const pronoStatusEnum = pgEnum("prono_status", ["draft", "published", "archived"]);
export const pronoResultEnum = pgEnum("prono_result", ["won", "lost", "pending", "void"]);
export const pronoTypeEnum = pgEnum("prono_type", ["safe", "risk", "vip", "combined"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["payment", "refund", "commission", "payout"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "canceled"]);
export const accessTierEnum = pgEnum("access_tier", ["free", "basic", "pro", "vip"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  referralCode: text("referral_code").unique(),
  referredById: uuid("referred_by_id").references(() => profiles.id, { onDelete: "set null" }),
  balanceCommission: decimal("balance_commission", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  role: appRoleEnum("role").default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").default("active"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const pronos = pgTable("pronos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sport: text("sport").notNull(),
  competition: text("competition").notNull(),
  matchTime: timestamp("match_time", { withTimezone: true }).notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  tip: text("tip").notNull(),
  odd: decimal("odd", { precision: 5, scale: 2 }).notNull(),
  confidence: integer("confidence").notNull(),
  pronoType: pronoTypeEnum("prono_type").default("safe"),
  content: text("content"),
  analysis: text("analysis"),
  authorId: uuid("author_id"),
  status: pronoStatusEnum("status").default("draft"),
  result: pronoResultEnum("result").default("pending"),
  accessTier: accessTierEnum("access_tier").default("free"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  refereeId: uuid("referee_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).default("0"),
  commissionPaid: boolean("commission_paid").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("XOF"),
  status: transactionStatusEnum("status").default("pending"),
  provider: text("provider"),
  providerId: text("provider_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("XOF"),
  method: text("method").notNull(),
  status: text("status").default("pending"),
  plan: text("plan"),
  mobileNumber: text("mobile_number"),
  mobileProvider: text("mobile_provider"),
  cryptoAddress: text("crypto_address"),
  cryptoTxHash: text("crypto_tx_hash"),
  proofImageUrl: text("proof_image_url"),
  notes: text("notes"),
  processedBy: uuid("processed_by").references(() => profiles.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const combos = pgTable("combos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  couponImageUrl: text("coupon_image_url"),
  globalOdds: decimal("global_odds", { precision: 10, scale: 2 }),
  stake: decimal("stake", { precision: 10, scale: 2 }),
  potentialWin: decimal("potential_win", { precision: 10, scale: 2 }),
  status: text("status").default("draft"),
  accessTier: text("access_tier"),
  matchDate: timestamp("match_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const comboPronos = pgTable("combo_pronos", {
  id: uuid("id").primaryKey().defaultRandom(),
  comboId: uuid("combo_id").notNull().references(() => combos.id, { onDelete: "cascade" }),
  pronoId: text("prono_id").notNull().references(() => pronos.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").default(0),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  referredBy: one(profiles, {
    fields: [profiles.referredById],
    references: [profiles.id],
  }),
  userRoles: many(userRoles),
  subscriptions: many(subscriptions),
  referralsMade: many(referrals),
  transactions: many(transactions),
  payments: many(payments),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(profiles, {
    fields: [userRoles.userId],
    references: [profiles.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(profiles, {
    fields: [referrals.referrerId],
    references: [profiles.id],
  }),
  referee: one(profiles, {
    fields: [referrals.refereeId],
    references: [profiles.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(profiles, {
    fields: [transactions.userId],
    references: [profiles.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(profiles, {
    fields: [payments.userId],
    references: [profiles.id],
  }),
  processedByUser: one(profiles, {
    fields: [payments.processedBy],
    references: [profiles.id],
  }),
}));

export const combosRelations = relations(combos, ({ many }) => ({
  comboPronos: many(comboPronos),
}));

export const comboPornosRelations = relations(comboPronos, ({ one }) => ({
  combo: one(combos, {
    fields: [comboPronos.comboId],
    references: [combos.id],
  }),
  prono: one(pronos, {
    fields: [comboPronos.pronoId],
    references: [pronos.id],
  }),
}));
