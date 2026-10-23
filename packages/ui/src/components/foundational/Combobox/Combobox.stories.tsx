import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
} from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Combobox',
  component: Combobox,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const MODELS = [
  'fct_gl_entries',
  'fct_ap_aging',
  'fct_ar_aging',
  'dim_accounts',
  'dim_cost_centers',
  'dim_calendar',
  'stg_sap__bkpf',
  'stg_sap__bseg',
  'int_fx_rates_daily',
];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)', width: 320 }}>
    <span
      className="text-text-secondary"
      style={{
        fontSize: 'var(--text-sm)',
        lineHeight: 'var(--text-sm--line-height)',
        fontWeight: 500,
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

/** The reason Combobox exists: filtering a list long enough that scanning is work. */
export const Default: Story = {
  render: function DefaultStory() {
    const [query, setQuery] = useState('');
    const items = useMemo(() => MODELS.filter((m) => m.toLowerCase().includes(query.toLowerCase())), [query]);
    return (
      <Field label="Model">
        <Combobox items={items} onInputValueChange={setQuery}>
          <ComboboxInput placeholder="Search models…" content="mono" />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>No models match “{query}”.</ComboboxEmpty>
              {items.map((item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    );
  },
};

/**
 * Grouped, with a clear affordance instead of the caret. Labels and
 * separators take it past the 18rem cap, so this is also the story for the
 * scroll cue: the bottom edge fades until the list reaches its end.
 */
export const Grouped: Story = {
  render: function GroupedStory() {
    const [query, setQuery] = useState('');
    const match = (m: string) => m.toLowerCase().includes(query.toLowerCase());
    const facts = MODELS.filter((m) => m.startsWith('fct_')).filter(match);
    const dims = MODELS.filter((m) => m.startsWith('dim_')).filter(match);
    const staging = MODELS.filter((m) => m.startsWith('stg_') || m.startsWith('int_')).filter(match);
    return (
      <Field label="Model">
        <Combobox items={[...facts, ...dims, ...staging]} onInputValueChange={setQuery}>
          <ComboboxInput placeholder="Search models…" content="mono" showClear />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>No models match “{query}”.</ComboboxEmpty>
              {facts.length ? (
                <ComboboxGroup>
                  <ComboboxLabel>Facts</ComboboxLabel>
                  {facts.map((m) => (
                    <ComboboxItem key={m} value={m}>
                      {m}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              ) : null}
              {dims.length ? (
                <>
                  <ComboboxSeparator />
                  <ComboboxGroup>
                    <ComboboxLabel>Dimensions</ComboboxLabel>
                    {dims.map((m) => (
                      <ComboboxItem key={m} value={m}>
                        {m}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                </>
              ) : null}
              {staging.length ? (
                <>
                  <ComboboxSeparator />
                  <ComboboxGroup>
                    <ComboboxLabel>Staging</ComboboxLabel>
                    {staging.map((m) => (
                      <ComboboxItem key={m} value={m}>
                        {m}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                </>
              ) : null}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    );
  },
};

/**
 * Multi-select — the case Select deliberately does not cover. Chips reuse
 * chipVariants, so they are not a second kind of chip.
 */
export const MultiSelect: Story = {
  render: function MultiSelectStory() {
    const [query, setQuery] = useState('');
    const items = useMemo(() => MODELS.filter((m) => m.toLowerCase().includes(query.toLowerCase())), [query]);
    return (
      <Field label="Models">
        <Combobox items={items} multiple onInputValueChange={setQuery} defaultValue={['fct_gl_entries']}>
          <ComboboxChips>
            <ComboboxValue>
              {(value: string[]) => value.map((v) => <ComboboxChip key={v}>{v}</ComboboxChip>)}
            </ComboboxValue>
            <ComboboxChipsInput placeholder="Add a model…" />
          </ComboboxChips>
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>No models match “{query}”.</ComboboxEmpty>
              {items.map((item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    );
  },
};

/** Sizes, matching Input and Select. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Field key={size} label={`${size} · ${size === 'sm' ? 24 : size === 'default' ? 32 : 36}px`}>
          <Combobox items={MODELS}>
            <ComboboxInput placeholder="Search models…" content="mono" size={size} />
            <ComboboxContent>
              <ComboboxList>
                {MODELS.map((item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      ))}
    </div>
  ),
};
