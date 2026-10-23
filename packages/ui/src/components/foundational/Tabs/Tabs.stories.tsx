import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartLineIcon, CheckCircleIcon, ListBulletsIcon, TreeStructureIcon } from '@phosphor-icons/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-text-secondary" style={{ fontSize: 'var(--text-base)', paddingTop: 'var(--gap-field)' }}>
    {children}
  </div>
);

/** Default: the line variant, with the 2px indicator §7.8 reserves. */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="runs" style={{ width: 480 }}>
      <TabsList>
        <TabsTrigger value="runs">Runs</TabsTrigger>
        <TabsTrigger value="lineage">Lineage</TabsTrigger>
        <TabsTrigger value="tests">Tests</TabsTrigger>
      </TabsList>
      <TabsContent value="runs">
        <Panel>184 runs in the last 7 days.</Panel>
      </TabsContent>
      <TabsContent value="lineage">
        <Panel>14 downstream models.</Panel>
      </TabsContent>
      <TabsContent value="tests">
        <Panel>2 failing, 31 passing.</Panel>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * With icons. TabsTrigger sets the weight from §11.2's state table: the
 * selected tab's icon is `fill`, the others `bold` (≤16px floor).
 */
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="runs" style={{ width: 480 }}>
      <TabsList>
        <TabsTrigger value="runs">
          <ListBulletsIcon aria-hidden="true" />
          Runs
        </TabsTrigger>
        <TabsTrigger value="lineage">
          <TreeStructureIcon aria-hidden="true" />
          Lineage
        </TabsTrigger>
        <TabsTrigger value="metrics">
          <ChartLineIcon aria-hidden="true" />
          Metrics
        </TabsTrigger>
      </TabsList>
      <TabsContent value="runs">
        <Panel>184 runs in the last 7 days.</Panel>
      </TabsContent>
      <TabsContent value="lineage">
        <Panel>14 downstream models.</Panel>
      </TabsContent>
      <TabsContent value="metrics">
        <Panel>Row counts and durations.</Panel>
      </TabsContent>
    </Tabs>
  ),
};

/** Segmented, for switching view modes rather than navigating. */
export const Segmented: Story = {
  render: () => (
    <Tabs defaultValue="table" style={{ width: 480 }}>
      <TabsList variant="segmented">
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="table">
        <Panel>Rows and columns.</Panel>
      </TabsContent>
      <TabsContent value="chart">
        <Panel>A line per series.</Panel>
      </TabsContent>
      <TabsContent value="json">
        <Panel>Raw payload.</Panel>
      </TabsContent>
    </Tabs>
  ),
};

/** Vertical orientation — the indicator moves to the inline edge. */
export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="runs" orientation="vertical" style={{ width: 480 }}>
      <TabsList>
        <TabsTrigger value="runs">Runs</TabsTrigger>
        <TabsTrigger value="lineage">Lineage</TabsTrigger>
        <TabsTrigger value="tests">Tests</TabsTrigger>
      </TabsList>
      <TabsContent value="runs">
        <Panel>184 runs in the last 7 days.</Panel>
      </TabsContent>
      <TabsContent value="lineage">
        <Panel>14 downstream models.</Panel>
      </TabsContent>
      <TabsContent value="tests">
        <Panel>2 failing, 31 passing.</Panel>
      </TabsContent>
    </Tabs>
  ),
};

/** A disabled tab. Its icon draws `light` (§11.2), beside the selected `fill` and the other `bold`. */
export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="runs" style={{ width: 480 }}>
      <TabsList>
        <TabsTrigger value="runs">
          <ListBulletsIcon aria-hidden="true" />
          Runs
        </TabsTrigger>
        <TabsTrigger value="lineage" disabled>
          <TreeStructureIcon aria-hidden="true" />
          Lineage
        </TabsTrigger>
        <TabsTrigger value="tests">
          <CheckCircleIcon aria-hidden="true" />
          Tests
        </TabsTrigger>
      </TabsList>
      <TabsContent value="runs">
        <Panel>184 runs in the last 7 days.</Panel>
      </TabsContent>
      <TabsContent value="tests">
        <Panel>2 failing, 31 passing.</Panel>
      </TabsContent>
    </Tabs>
  ),
};
