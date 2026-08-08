import { Link } from 'react-router-dom';

import { useMagnetic } from '../motion/useMagnetic';

/** رابطٌ داخليٌّ ينجذب نحو المؤشّر. */
export function MagneticLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useMagnetic<HTMLAnchorElement>();
  return (
    <Link to={to} className={className} ref={ref}>
      <span data-magnetic-label>{children}</span>
    </Link>
  );
}

/** رابطٌ خارجيٌّ ينجذب نحو المؤشّر. */
export function MagneticAnchor({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useMagnetic<HTMLAnchorElement>();
  return (
    <a
      href={href}
      className={className}
      ref={ref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span data-magnetic-label>{children}</span>
    </a>
  );
}

/** زرٌّ ينجذب نحو المؤشّر. */
export function MagneticButton({
  className,
  onClick,
  disabled,
  children,
}: {
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const ref = useMagnetic<HTMLButtonElement>();
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled} ref={ref}>
      <span data-magnetic-label>{children}</span>
    </button>
  );
}
