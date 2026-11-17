import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppShellPageHeader } from '../AppShell';
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from './index';

/**
 * Mode is driven by the toolbar Theme control ([data-theme] on the root).
 * Entirely neutral: a trail is structure, and takes no hue in either mode.
 */
const meta = {
  title: 'Product/Shell/Breadcrumb',
  // The ID predates the group: tests, screenshots and links use it.
  id: 'product-breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="text-text-body">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A whole trail, as the top nav holds it: two ancestors, then the current page. */
export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Kasane Corporation</BreadcrumbItem>
      <BreadcrumbItem href="#">Month-end close</BreadcrumbItem>
      <BreadcrumbPage>Tasks</BreadcrumbPage>
    </Breadcrumb>
  ),
};

/**
 * In the page header: ancestors only, at the title's size. The band's `<h1>`
 * is the current page, so there is no `BreadcrumbPage`, and the title is the
 * one 600 on the line. The title is sans here, as the trail is: one typeface
 * on the line.
 */
export const InPageHeader: Story = {
  render: () => (
    <AppShellPageHeader
      title="Tasks"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbItem href="#">Month-end close</BreadcrumbItem>
        </Breadcrumb>
      }
      actions={<span className="text-sm text-text-secondary tabular-nums">4 open</span>}
    />
  ),
};

/** One ancestor and the page, the shortest trail worth drawing. */
export const OneAncestor: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Month-end close</BreadcrumbItem>
      <BreadcrumbPage>Sources</BreadcrumbPage>
    </Breadcrumb>
  ),
};

/**
 * Too narrow for the trail: every crumb gives up width, each ends in an
 * ellipsis, and the slashes keep theirs. Hover a cut-off name, or focus a
 * link with the keyboard, to read it in full.
 */
export const Truncated: Story = {
  render: () => (
    <div className="w-80">
      <Breadcrumb>
        <BreadcrumbItem href="#">Kasane Corporation and consolidated subsidiaries</BreadcrumbItem>
        <BreadcrumbItem href="#">Month-end close, September 2026</BreadcrumbItem>
        <BreadcrumbPage>Intercompany reconciliation</BreadcrumbPage>
      </Breadcrumb>
    </div>
  ),
};
