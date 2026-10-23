import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { Input } from '../Input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-run pipeline</DialogTitle>
          <DialogDescription>
            This re-runs fct_gl_entries and every downstream model. 14 models, roughly 6 minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Re-run</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Destructive confirmation. The action is destructive; the dialog is not —
 * only the confirming button carries the hue.
 */
export const Destructive: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="danger">Delete model</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete fct_gl_entries?</DialogTitle>
          <DialogDescription>
            This cannot be undone. 3 downstream models depend on it and will fail on their next run.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button variant="danger">Delete</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * A form inside a dialog. The Input's border stays visible: DialogContent
 * redefines the border token for its subtree, the same fix popupSurface makes.
 */
export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Rename model</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename model</DialogTitle>
          <DialogDescription>Downstream references update automatically.</DialogDescription>
        </DialogHeader>
        <Input content="mono" defaultValue="fct_gl_entries" aria-label="Model name" />
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Rename</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * The dialog open on load, so the parts the other stories never show (panel,
 * backdrop, close button, a bordered field) are screenshotted and checked by
 * axe in both modes. Every other story renders only its trigger. Kept off the
 * Docs page, where an open modal would cover everything else.
 */
export const Open: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button variant="outline">Rename model</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename model</DialogTitle>
          <DialogDescription>Downstream references update automatically.</DialogDescription>
        </DialogHeader>
        <Input content="mono" defaultValue="fct_gl_entries" aria-label="Model name" />
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Rename</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
