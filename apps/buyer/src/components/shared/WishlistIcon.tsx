import React from 'react';

interface WishlistIconProps extends React.SVGProps<SVGSVGElement> {
  isFilled?: boolean;
  useImage?: boolean;
}

/** Brand purple, matching the saved ribbon on the product page. */
const SAVED_COLOUR = '#7B2FBE';

/**
 * The unsaved ribbon's colour.
 *
 * A variable rather than a literal because this colour is applied as an inline
 * style, and an inline style cannot be reached by a `dark:` utility class — so
 * the icon stayed pure black on dark cards, where it is effectively invisible.
 * `.dark` sets this variable in globals.css; the fallback keeps light mode
 * byte-identical at every call site.
 */
const UNSAVED_COLOUR = 'var(--wishlist-ink, #000)';

export default function WishlistIcon({ isFilled, useImage, className, style, ...props }: WishlistIconProps) {
  const { preserveAspectRatio, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...rest } = props as any;
  const src = isFilled ? '/icons/navbar/activesave_trimmed.png' : '/icons/navbar/save_trimmed.png';

  // The artwork is a PNG, so it has to be recoloured from the outside. This
  // used to be a stack of filters (invert/sepia/saturate/hue-rotate/...), which
  // only ever approximates a target colour — it was landing on magenta instead
  // of the brand purple. A mask takes its alpha from the image and its colour
  // from the background, so the value below is the exact colour rendered.
  return (
    <span
      role="img"
      aria-label="Wishlist"
      className={`${className || ''} inline-block`}
      style={{
        backgroundColor: isFilled ? SAVED_COLOUR : UNSAVED_COLOUR,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        ...style,
      }}
      {...rest}
    />
  );
}
