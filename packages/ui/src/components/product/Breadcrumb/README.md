# Breadcrumb

Product. Composes `TruncatedText`. Where the page sits: its ancestors, each a link.

```tsx
<Breadcrumb>
  <BreadcrumbItem href="/kasane">Kasane Corporation</BreadcrumbItem>
  <BreadcrumbItem href="/kasane/close">Month-end close</BreadcrumbItem>
  <BreadcrumbPage>Tasks</BreadcrumbPage>
</Breadcrumb>
```

## Parts

| Part | Renders | Notes |
|---|---|---|
| `Breadcrumb` | `<nav aria-label="Breadcrumb">` around an `<ol>` | `--text-base` by default. `AppShellPageHeader` raises it to the title's size |
| `BreadcrumbItem` | `<li>` holding an `<a>`, then a slash | An ancestor. `render` swaps the `<a>` for a router's link |
| `BreadcrumbPage` | `<li aria-current="page">` | The current page, last. Not a link |

## Two homes

**The page header.** Pass ancestors only to `AppShellPageHeader`'s `breadcrumb`. The band's `<h1>` is the current page, so a `BreadcrumbPage` there would name it twice. The trail takes the title's size and tracking, and the last slash leads into the title. The title takes the trail's typeface: behind a trail the `<h1>` is sans, not the heading serif, so the line reads in one face (§8.3's one exception).

```tsx
<AppShellPageHeader
  title="Tasks"
  breadcrumb={
    <Breadcrumb>
      <BreadcrumbItem href="/close">Month-end close</BreadcrumbItem>
    </Breadcrumb>
  }
/>
```

**The top nav.** In `AppBar`'s `brand`, beside the sidebar toggle, end the trail with a `BreadcrumbPage`. `AppShell`'s README says when the ancestors show there.

## When a page takes one

A breadcrumb says the page belongs to its parent. Put it on the pages that would go if the parent went, and on no others. In the Kasane demo, New chat, Tasks and Sources belong to the project. Agents, channels and direct messages belong to the workspace and carry none. A parent the visitor has not seen named anywhere reads as a mistake, so the sidebar labels the same group with the same name.

## The parent recedes

An ancestor is `--color-text-secondary` at 400. The current page is `--color-text-primary` at 600, as an active nav item is (§8.5), so the page's own name is the strongest thing on the line. No hue: a trail is structure (§0 rule 1).

The slash is `--color-text-tertiary`. It is a mark, not text, and `aria-hidden`: assistive technology hears a list of links.

## Links, without the underline at rest

Every item in a trail is a link, so the underline waits for hover and keyboard focus (§1's exception for a list whose every row is a link).

The link is a real `<a>` styled as text, not `buttonVariants`. A ghost control's 8px padding and 1px border would push the first crumb 9px off the x the page's text starts on, and in the page header that x is the title's.

## Truncation

Each crumb can shrink, and a string that is cut off repeats in a tooltip below it (`TruncatedText`). The tooltip also opens when a link takes keyboard focus. The slashes never shrink. A crumb that is not a plain string renders as given and does not truncate.

## Not built

- A crumb that opens a menu, as the `AppShell` story's page switcher does. That story puts a `Menu` in its own `<li>` inside `Breadcrumb`.
- Collapsing the middle of a long trail into an ellipsis. No screen has more than three levels.
