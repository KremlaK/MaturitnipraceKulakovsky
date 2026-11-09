# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Active vehicle owners & drivers:** People who care about their car, track real fuel consumption, maintain service history for resale value, and need reliable alerts before STK or oil changes expire.
2. **Shared drivers & family co-owners:** Partners or family members sharing a vehicle who need visibility into recent fuelings and expenses.
3. **Mechanics & service partners:** Trusted workshops granted access to log repairs, upload invoices, and update maintenance records directly into the car's digital book.

## Product Purpose

AutoApp provides an authoritative, friction-free digital logbook and operational garage for vehicles. It replaces messy paper receipts, glovebox notebooks, and bloated spreadsheet trackers with an intuitive web application that works reliably on mobile phones at the pump and on desktop computers for deep cost analysis and official PDF service book exports.

## Positioning

Unlike cluttered automotive social networks, generic budget apps, or bloated fleet software, AutoApp focuses purely on the essential lifecycle of personal and family vehicles: rapid 5-second fueling logs with calculated full-tank consumption, verifiable maintenance timelines with attached invoices, and crystal-clear service due alerts.

## Operating Context

1. **At the pump / in the garage (Mobile, ambient light, single-hand use):** The user stands outside next to the car, often in cold or direct sunlight. The interface must prioritize high-contrast typography, large touch targets, automatic prefilling of the previous odometer reading, and instant calculations without page reloads.
2. **At the desk (Desktop, high resolution, analytical):** The user reviews long-term expenditure trends, audits past repairs, inspects fuel efficiency curves across seasons, and exports printable PDF documentation for vehicle inspections or prospective buyers.

## Capabilities and Constraints

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Axios, React Router v7, Leaflet / OpenStreetMap.
- **Backend:** Express 5, Node.js, Prisma ORM, PostgreSQL, Cloudinary (receipt & photo storage), PDFKit (Czech typography DejaVuSans), ExcelJS.
- **Constraints:**
  - Responsive: Full fidelity from 360px mobile viewport up to 4K desktop screens.
  - Performance: Zero heavy decorative 3D assets or laggy animations; fast time-to-interactive.
  - Iconography: Authentic, stroke-consistent SVG vector icons (1.5px/2px stroke), strictly no emojis or emoji replacements for UI elements.
  - Typography: Clear typographic scale with tabular numbers (`tabular-nums`) for currency, mileage, volume, and dates.

## Product Principles

1. **Frictionless Capture:** Entering a fueling or service item must require the minimum possible keystrokes and zero cognitive friction.
2. **Operational Honesty:** Data is displayed with technical precision. No artificial gamification or fake gauges; real numbers, clear units, and factual trends.
3. **Ergonomic Division:** Mobile interface is thumb-anchored (bottom navigation and bottom sheets); desktop interface is a spacious, high-density analytical workstation.
4. **Permanent Legibility:** High contrast, zero unreadable low-contrast grey text, clean visual hierarchy.

