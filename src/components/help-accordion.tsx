import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function HelpAccordion() {
  return (
    <Accordion type="single" collapsible className="grid gap-3">
      <AccordionItem value="flow">
        <AccordionTrigger>Quick Flow</AccordionTrigger>
        <AccordionContent>
          <div>1. Inputs: enter plan controls, contracts, accounts, and SPIFF progress.</div>
          <div>2. Results: review totals and payout schedule.</div>
          <div>3. Settings: adjust bands and rates only if you are a plan admin.</div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="controls">
        <AccordionTrigger>Plan Controls</AccordionTrigger>
        <AccordionContent>
          <div><b>Plan Year</b> drives all payout dates.</div>
          <div><b>Quota Achievement</b> floors at 70% and caps at 105%.</div>
          <div><b>KPI Gate</b> unlocks recurrent payouts.</div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="contracts">
        <AccordionTrigger>Contracts and Timing</AccordionTrigger>
        <AccordionContent>
          <div>Network GTA and Sourcing-Only use room-night bands; SD Account uses annualized revenue.</div>
          <div>Payout Model controls 70/30 vs 50/50 timing.</div>
          <div>Payout Scenario changes timing logic; use Timing Preview to validate each contract.</div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="recurrent">
        <AccordionTrigger>Covered Accounts and SPIFFs</AccordionTrigger>
        <AccordionContent>
          <div>Managed By determines the recurrent share used in the calculation.</div>
          <div>Projected pays 25% at Q3 and actual true-up pays in Q1 of the following year when KPI is met.</div>
          <div>SPIFFs track ABX plans, engagement strategy completion, workshops, and the all-3 top-up.</div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="admin">
        <AccordionTrigger>Results and Admin JSON</AccordionTrigger>
        <AccordionContent>
          <div>Use Results to manage payout statuses and export CSV.</div>
          <div>Use Settings JSON only for plan-admin edits to rates and bands.</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
