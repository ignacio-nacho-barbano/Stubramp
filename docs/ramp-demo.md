# Ramp Product Demo — Documented Flow

**Source:** ramp.com/explore-product  
**Tour length:** 10 steps  
**Focus area:** Card & Expense Management

---

## Step 1 of 10 — Card & Expense (Intro)

**Screen:** Home / Overview dashboard

> "With Ramp, you control spend before it happens. Issue cards with custom rules by merchant, category, amount, and more."

The demo opens on Ramp's home dashboard for a demo user (David Wallace). Key metrics visible:

- Current card balance: **$405K**
- Total spending (90d): **$1.9M**
- Pending approvals: 8 bills ($642K total), 4 reimbursements
- Card panel on the right shows an active Ramp Visa card with spend category limits (Software, Marketing Travel, General Expenses)

---

## Step 2 of 10 — Issue a Card

**Screen:** Home dashboard → Issue panel

> "Begin by issuing cards with custom rules by merchant, category, amount, and more."

The tooltip highlights the **Issue** button and card panel on the right side of the dashboard. Cards can be created directly from this panel.

---

## Step 3 of 10 — Card Templates

**Screen:** Issue panel (right drawer)

> "Select from existing templates for quick issuance or create new cards for one off purchasing."

The Issue drawer opens showing pre-built card templates:

| Template           | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| General Expenses   | Spend using physical card in-person and online                            |
| Virtual Card       | Unique virtual card number, ideal for online payments                     |
| Product or Service | Secure virtual card locked to a single vendor (e.g. Heroku, Facebook Ads) |
| Physical Card      | Spend funds with a physical card                                          |
| Bill Payment       | Upload an invoice to be processed and paid by finance                     |
| Client Visits      | Funds for client visit expenses                                           |
| Wellness Benefit   | Funds for wellness benefit expenses                                       |

---

## Step 4 of 10 — Card Configuration

**Screen:** Card creation form — Marketing Travel

> "Enter basic card details and configure approval rules, submission steps, and accounting codes to streamline approvals, submissions, and bookkeeping."

Example card being configured:

- **Card name:** Marketing Travel
- **Purpose:** Funds for client-facing Marketing travel
- **Amount:** $35,000.00 USD quarterly
- **Submission policy:** General Expenses
- **Owner:** Sales team (15 employees)
- **Note:** "Marketing Travel" will be issued to 15 employees

---

## Step 5 of 10 — Spending Controls & Restrictions

**Screen:** Card creation form → Policy & controls section

> "Control card spend by category, merchant, and amount for precise budget enforcement. Transactions that violate rules are automatically declined to prevent overspend."

The Policy & controls section lets admins set fine-grained rules:

- **Allowed categories (9):** Airlines, Car Rental, Fuel and Gas, Lodging, Restaurants, Taxi and Rideshare, Travel Misc
- **Blocked merchants:** Amazon, DoorDash
- **Start date:** Apr 1, 2026
- Optional: lock date, max expense amount per transaction

---

## Step 6 of 10 — Real-Time Card Tracking

**Screen:** Marketing Travel card detail view

> "Once issued, fund activity can be tracked in real time. From card details, requirements, and transaction information across how your team is using it. Easy to update and make changes as needed."

Live card status for the Marketing Travel card:

- **Spent:** $34,004.61 USD (97% of limit)
- **Remaining:** $995.39 USD
- **Limit:** $35,000.00 USD quarterly — resets in 5 days
- **Cardholder:** David Wallace (card ending 2187)
- **Alert:** "You've spent 97% of your funds. Request a temporary increase."

---

## Step 7 of 10 — Automated Expense Reports

**Screen:** Expense detail — $712.65 at Uluh

> "Ramp automates expense reports by collecting receipts and auto-populating details. It reviews transactions in real time against policy to speed approvals and can auto-approve in-policy charges."

Example in-policy transaction auto-approved by AI:

- **Amount:** $712.65 at Uluh
- **Submitted by:** Angela Martin · Mar 21, 2026
- **AI verdict:** ✅ Approval recommended
- **AI reasoning:** "The client lunch for 6 attendees cost $712.65, comfortably under the $900 domestic limit set by the $150-per-person domestic cap"
- **Details:** General Expenses card, Memo: "Client dinner", Receipt: Auto-verified, 6 attendees at $118.77/person

---

## Step 8 of 10 — Policy Flagging & Smart Reviews

**Screen:** Expense detail — $1,048.25 at Delta Airlines

> "Ramp flags out-of-policy spend and explains why, so teams can act quickly. It automates 85% of reviews and surfaces the 15% needing attention — approvers handle only exceptions."

Example out-of-policy transaction flagged by AI:

- **Amount:** $1,048.25 at Delta Airlines
- **Submitted by:** Paola Noun · Mar 23, 2026
- **AI verdict:** ❌ Rejection recommended
- **AI reasoning:**
  - Business class upgrades are not allowed for non-execs
  - Expenses never allowed: first-class airfare / seat auctions / lounge memberships / TSA Pre-Check
- **Details:** General Expenses (3912), Memo: "Flight back to NY", Receipt: Auto-verified (SFO→JFK, Business Class, Boeing 757)

---

## Step 9 of 10 — Policy Reference

**Screen:** Policy Reference panel (2 pages)

> "Reference company policy in a click. Ramp analyzes transactions, compares them to policy, and automatically enforces rules so you don't have to."

Employees and approvers can view the full company travel policy inline. Example policy content:

**Air Travel Standards**

- Economy for flights under 6 hours
- Premium Economy for 6–9 hours; Business for flights over 9 hours or red-eye with next-day client meeting
- First class/business class is never allowed for employees
- Book at least 14 days ahead unless a customer dictates otherwise
- _Hidden note (exception):_ C-suite may select business class on any flight over 4 hours

**Rail Standards**

- Business-class rail (e.g., Amtrak Acela) permitted
- First-class rail requires VP or medical approval

**Lodging Standards**

- New York City (2025): $400 per night or less
- Standard room at a preferred hotel or ≤ 20% above GSA rate
- Airbnb (stays ≥ 3 nights) allowed if ≥ 10% cheaper and a waiver is signed
- In-room movies, minibar, and spa services are personal costs

---

## Step 10 of 10 — End Screen

**Screen:** Home dashboard (blurred) with completion modal

> "On average, Ramp customers save 5% on their annual spending."

The tour concludes with two CTAs:

- **Accounting Automation** — explore the next product area
- **Get Started** — begin the sign-up process

---

## Summary

The Ramp demo covers the core Card & Expense workflow in 10 steps:

1. **Intro** — Ramp overview and value prop (control spend before it happens)
2. **Issue** — Entry point to card creation
3. **Templates** — Pre-built card types for fast issuance
4. **Configure** — Set amount, owner, submission policy per card
5. **Controls** — Block merchants/categories, enforce limits automatically
6. **Track** — Real-time spend visibility per card
7. **Auto-approve** — AI reviews in-policy expenses and auto-approves
8. **Flag** — AI flags policy violations with plain-language explanations
9. **Policy** — Inline policy reference linked to enforcement
10. **Save** — Average 5% savings for Ramp customers
