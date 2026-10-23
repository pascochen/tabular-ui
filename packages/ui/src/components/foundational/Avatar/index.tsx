import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { useSyncExternalStore, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';

/**
 * Avatar — foundational.
 *
 * Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized. Kept:
 * `Avatar`, `AvatarImage`, `AvatarFallback`. Dropped: `AvatarBadge`,
 * `AvatarGroup` and `AvatarGroupCount`, which separate stacked avatars with a
 * `ring-2` — a box-shadow — and are not needed yet. Restore from the registry
 * with an outline-based separator if a stacked group lands.
 *
 * Sizes are primitive-scale: no avatar size tokens exist. `sm` (24px) sits in
 * a 28px row or beside a 32px control; `default` (32px) heads a menu or a
 * comment. The 1px edge is an inset `--color-border` hairline blended into
 * the image, so it reads as a light rim in both modes without changing the
 * avatar's footprint.
 */
function Avatar({ className, size = 'default', ...props }: AvatarPrimitive.Root.Props & { size?: 'sm' | 'default' }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'group/avatar relative flex shrink-0 select-none rounded-full', // --radius-full: §7.7 lists avatar
        size === 'sm' ? 'size-6' : 'size-8',
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:content-['']",
        'after:mix-blend-darken dark:after:mix-blend-lighten',
        className,
      )}
      {...props}
    />
  );
}

const reducedMotion = '(prefers-reduced-motion: reduce)';
const subscribeReducedMotion = (onChange: () => void) => {
  const mql = matchMedia(reducedMotion);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

/** True when the user asked for reduced motion. Live: flipping the OS setting re-renders. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(reducedMotion).matches,
    () => false,
  );
}

export type AvatarImageProps = AvatarPrimitive.Image.Props & {
  /**
   * An animated version of `src` — an animated SVG, GIF or WebP. Shown over
   * the still image only while `animate` is true, and never under
   * `prefers-reduced-motion: reduce`.
   */
  animatedSrc?: string;
  /** Whether to play `animatedSrc`. Default `false`: avatars are still unless asked. */
  animate?: boolean;
};

/**
 * The avatar's image. With `animatedSrc`, playing is a **swap**, not a pause:
 * an image in an `<img>` cannot be paused, so the still `src` is always
 * rendered and the animated file is mounted over it while `animate` is true.
 * Mounting it fresh is what makes each play start from the first frame.
 *
 * Why `<img>` and not inline SVG, which could be paused: an avatar is user
 * content. An SVG in an `<img>` cannot run script or load anything; inlined
 * into the DOM it can, and would need a sanitizer.
 *
 * The animated layer is decorative (`alt=""`, `aria-hidden`). The still image
 * carries `alt`, so the accessible name never depends on motion.
 */
function AvatarImage({ className, animatedSrc, animate = false, ...props }: AvatarImageProps) {
  const reduced = useReducedMotion();
  const playing = animatedSrc != null && animate && !reduced;
  return (
    <>
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn('aspect-square size-full rounded-full object-cover', className)}
        {...props}
      />
      {playing ? (
        <img
          data-slot="avatar-animated"
          src={animatedSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 aspect-square size-full rounded-full object-cover"
        />
      ) : null}
    </>
  );
}

/**
 * Shown until the image loads, and if it never does. Initials, neutral — an
 * avatar is identity, not state, so it takes no hue (§0 rule 1).
 */
function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-surface-raised',
        'font-medium uppercase text-text-secondary',
        'text-xs group-data-[size=sm]/avatar:text-2xs',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through. Derived from the parts themselves, so they cannot drift.
 */
export type AvatarProps = ComponentProps<typeof Avatar>;
export type AvatarFallbackProps = ComponentProps<typeof AvatarFallback>;

export { Avatar, AvatarFallback, AvatarImage };
