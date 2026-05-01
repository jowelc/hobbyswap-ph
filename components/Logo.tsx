import Image from 'next/image';
import Link from 'next/link';

interface Props {
  size?: number;
  showText?: boolean;
  href?: string;
}

export default function Logo({ size = 36, showText = true, href = '/' }: Props) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group flex-shrink-0">
      <Image
        src="/logo-icon.png"
        alt="HobbySwap PH"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="hidden sm:block leading-none">
          <span className="text-white font-black text-base tracking-tight group-hover:text-blue-400 transition-colors">
            HobbySwap
          </span>
          <span className="text-blue-400 font-black text-base tracking-tight"> PH</span>
        </div>
      )}
    </Link>
  );
}
