

# Fix Build Errors + Add Extension Page + Seed Data

## 1. Fix chart.tsx TypeScript errors
The `ChartTooltipContent` component destructures `payload` and `label` from props typed as `React.ComponentProps<typeof RechartsPrimitive.Tooltip>`, but recharts' Tooltip props don't include those at the component level — they're injected at runtime. The `ChartLegendContent` has a similar issue with `Pick<LegendProps, "payload" | "verticalAlign">`.

**Fix**: Replace the tooltip content props type with an explicit interface that includes `active`, `payload`, `label`, `labelFormatter`, `formatter`, `color` etc. as optional fields with `any` types. Same for legend content — define payload as `any[]` instead of picking from LegendProps.

## 2. Test auth flow end-to-end
Navigate through `/auth` → sign up → onboarding → dashboard using browser tools to verify the full flow works.

## 3. Add Chrome Extension download page
- Create `src/pages/ExtensionDownload.tsx` — RTL Hebrew page with:
  - Hero section with extension description
  - Download button (fetch+blob approach for preview compatibility)
  - Step-by-step installation instructions (unzip, chrome://extensions, developer mode, load unpacked)
  - Supported browsers list (Chrome, Edge, Brave, Arc)
- Add `/extension` route to App.tsx (protected)
- Add nav link in DashboardLayout sidebar

## 4. Seed Automation Wiki data
- Use the database insert tool to add ~30 entries to `automation_wiki` covering:
  - n8n workflows (Gmail→Monday, Claude→Priority, LinkedIn enrichment)
  - Make scenarios (Fireberry→Priority, Airtable→Salesforce, HubSpot routing)
  - Zapier zaps (ClickUp alerts, Notion→Slack, Google Analytics)
  - Israeli platforms (Priority, Kaveret, Sensei, Fireberry, Koala)
  - AI tools (Claude agents, GPT workflows, Perplexity research, Gemini)

## Technical Details

### chart.tsx fix (lines 92-101)
Replace the complex generic type with a simple explicit interface:
```typescript
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: any[];
    label?: any;
    labelFormatter?: (value: any, payload: any[]) => React.ReactNode;
    formatter?: (value: any, name: any, item: any, index: number, payload: any) => React.ReactNode;
    color?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }
>
```

For `ChartLegendContent` (lines 230-236), replace `Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign">` with `{ payload?: any[]; verticalAlign?: "top" | "bottom" }`.

### Files to create
- `src/pages/ExtensionDownload.tsx`

### Files to modify
- `src/components/ui/chart.tsx` (type fixes)
- `src/App.tsx` (add route)
- `src/components/DashboardLayout.tsx` (add nav link)

