import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index';
import { placeholderText } from '../../../fixtures/a11y-exceptions';

/**
 * Mode is driven by the toolbar Theme control. Dark is canonical.
 *
 * Stories render the popup on open — click a trigger to inspect the list.
 */
const meta = {
  title: 'Foundational/Select',
  component: Select,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// A real <label>, so the wrapped trigger takes its name from it. A bare span
// looks the same and leaves the trigger unnamed: in a real form, use the
// product `Field`, which wires id and aria-describedby as well.
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)', width: 260 }}>
    <span
      className="text-text-secondary"
      style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--text-sm--line-height)', fontWeight: 500 }}
    >
      {label}
    </span>
    {children}
  </label>
);

export const Default: Story = {
  render: () => (
    <Field label="Environment">
      <Select defaultValue="prod">
        <SelectTrigger>
          <SelectValue placeholder="Choose an environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dev">Development</SelectItem>
          <SelectItem value="staging">Staging</SelectItem>
          <SelectItem value="prod">Production</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
};

/** Placeholder uses --color-text-tertiary, the same as Input's. */
export const Placeholder: Story = {
  parameters: placeholderText,
  render: () => (
    <Field label="Environment">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose an environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dev">Development</SelectItem>
          <SelectItem value="prod">Production</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
};

/**
 * `content="mono"` for identifier lists. The face carries from trigger to
 * items, so the value does not change appearance when the list closes.
 */
export const MonoIdentifiers: Story = {
  render: () => (
    <Field label="Model">
      <Select defaultValue="fct_gl_entries" content="mono">
        <SelectTrigger>
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fct_gl_entries">fct_gl_entries</SelectItem>
          <SelectItem value="dim_accounts">dim_accounts</SelectItem>
          <SelectItem value="stg_sap__bkpf">stg_sap__bkpf</SelectItem>
          <SelectItem value="int_fx_rates_daily">int_fx_rates_daily</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
};

/** Groups, labels and a separator. Labels use the --text-2xs micro tier. */
export const Grouped: Story = {
  render: () => (
    <Field label="Source">
      <Select defaultValue="sap">
        <SelectTrigger>
          <SelectValue placeholder="Choose a source" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>ERP</SelectLabel>
            <SelectItem value="sap">SAP</SelectItem>
            <SelectItem value="netsuite">NetSuite</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Warehouse</SelectLabel>
            <SelectItem value="snowflake">Snowflake</SelectItem>
            <SelectItem value="bigquery">BigQuery</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Field key={size} label={`${size} · ${size === 'sm' ? 24 : size === 'default' ? 32 : 36}px`}>
          <Select defaultValue="prod">
            <SelectTrigger size={size}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      ))}
    </div>
  ),
};

/** Invalid pairs the border tint with a message, as Input does. */
export const States: Story = {
  parameters: placeholderText,
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Field label="Disabled">
        <Select defaultValue="prod" disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prod">Production</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)', width: 260 }}>
        <span
          id="select-invalid-label"
          className="text-text-secondary"
          style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--text-sm--line-height)', fontWeight: 500 }}
        >
          Invalid
        </span>
        <Select>
          <SelectTrigger aria-invalid aria-labelledby="select-invalid-label" aria-describedby="select-invalid-message">
            <SelectValue placeholder="Choose an environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prod">Production</SelectItem>
          </SelectContent>
        </Select>
        <span
          id="select-invalid-message"
          className="text-text-danger"
          style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
        >
          Choose an environment.
        </span>
      </div>
    </div>
  ),
};

/** Long option labels truncate rather than widening the trigger. */
export const Truncation: Story = {
  render: () => (
    <Field label="Model">
      <Select defaultValue="long" content="mono">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="long">fct_gl_entries_reconciliation_daily_partitioned_v2</SelectItem>
          <SelectItem value="short">dim_accounts</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
};

const currencies = [
  ['AED', 'UAE dirham'],
  ['ARS', 'Argentine peso'],
  ['AUD', 'Australian dollar'],
  ['BGN', 'Bulgarian lev'],
  ['BHD', 'Bahraini dinar'],
  ['BRL', 'Brazilian real'],
  ['CAD', 'Canadian dollar'],
  ['CHF', 'Swiss franc'],
  ['CLP', 'Chilean peso'],
  ['CNY', 'Chinese yuan'],
  ['COP', 'Colombian peso'],
  ['CRC', 'Costa Rican colón'],
  ['CZK', 'Czech koruna'],
  ['DKK', 'Danish krone'],
  ['DOP', 'Dominican peso'],
  ['EGP', 'Egyptian pound'],
  ['EUR', 'Euro'],
  ['GBP', 'Pound sterling'],
  ['GHS', 'Ghanaian cedi'],
  ['HKD', 'Hong Kong dollar'],
  ['HUF', 'Hungarian forint'],
  ['IDR', 'Indonesian rupiah'],
  ['ILS', 'Israeli new shekel'],
  ['INR', 'Indian rupee'],
  ['ISK', 'Icelandic króna'],
  ['JOD', 'Jordanian dinar'],
  ['JPY', 'Japanese yen'],
  ['KES', 'Kenyan shilling'],
  ['KRW', 'South Korean won'],
  ['KWD', 'Kuwaiti dinar'],
  ['LKR', 'Sri Lankan rupee'],
  ['MAD', 'Moroccan dirham'],
  ['MXN', 'Mexican peso'],
  ['MYR', 'Malaysian ringgit'],
  ['NGN', 'Nigerian naira'],
  ['NOK', 'Norwegian krone'],
  ['NZD', 'New Zealand dollar'],
  ['PEN', 'Peruvian sol'],
  ['PHP', 'Philippine peso'],
  ['PLN', 'Polish złoty'],
  ['QAR', 'Qatari riyal'],
  ['RON', 'Romanian leu'],
  ['SAR', 'Saudi riyal'],
  ['SEK', 'Swedish krona'],
  ['SGD', 'Singapore dollar'],
  ['THB', 'Thai baht'],
  ['TRY', 'Turkish lira'],
  ['TWD', 'New Taiwan dollar'],
  ['UAH', 'Ukrainian hryvnia'],
  ['USD', 'US dollar'],
  ['VND', 'Vietnamese đồng'],
  ['ZAR', 'South African rand'],
] as const;

/**
 * A list longer than the screen: 52 reporting currencies, 1,456px of rows.
 * The popup caps at the available height and scrolls, with a 24px scroll
 * arrow (--h-row-xs) at each end that has rows out of view. The value is
 * Kasane (Shanghai)'s currency, "Chinese yuan", tenth in the list, so the
 * popup opens on it with nine rows above (up arrow) and the rest running past
 * the bottom of the screen (down arrow), at every desktop viewport up to
 * 1200px tall. Hover an arrow to scroll.
 */
export const LongList: Story = {
  render: () => (
    <Field label="Reporting currency">
      <Select defaultValue="CNY">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map(([code, name]) => (
            <SelectItem key={code} value={code}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  ),
};
