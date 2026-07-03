/**
 * @stubramp/ui — Ramp Design System barrel.
 *
 * Single public entrypoint for the component library. Import components by name:
 *
 *   import { Button, StatTile, Badge } from "@stubramp/ui";
 *
 * On-disk, components are grouped by category under `components/` and each lives
 * in its own folder alongside its story. This barrel is the only public surface;
 * add a re-export line here when adding a component.
 *
 * Styles, tokens, and the Vite plugin ship via their own export paths
 * (`@stubramp/ui/theme.css`, `@stubramp/ui/styles/*`, `@stubramp/ui/vite`).
 */

// forms
export * from "./components/forms/button";
export * from "./components/forms/input";
export * from "./components/forms/select";
export * from "./components/forms/checkbox";
export * from "./components/forms/switch";

// data-display
export * from "./components/data-display/card";
export * from "./components/data-display/stat-tile";
export * from "./components/data-display/avatar";
export * from "./components/data-display/badge";

// feedback
export * from "./components/feedback/modal";
export * from "./components/feedback/toast";

// navigation
export * from "./components/navigation/tabs";
export * from "./components/navigation/menu";

// brand
export * from "./components/brand/logo";

// business — domain-aware components shared across apps
export * from "./components/business/money";
export * from "./components/business/vendor-avatar";
export * from "./components/business/status-badge";
export * from "./components/business/segmented-toggle";
export * from "./components/business/allocation-bar";

// shared presentational helpers + status vocabulary (used by the business
// components and reusable directly by consuming apps)
export * from "./lib/money";
export * from "./lib/format";
export * from "./lib/bill-status";
