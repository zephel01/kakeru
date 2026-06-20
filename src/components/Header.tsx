import Link from "next/link";

const nav = [
  { href: "/", label: "ホーム" },
  { href: "/draft", label: "ドラフト" },
  { href: "/thumbnail", label: "サムネ" },
  { href: "/dashboard", label: "分析" },
];

export default function Header() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          Kakeru ✍️
        </Link>
        <nav className="flex gap-4 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-neutral-600 transition hover:text-brand dark:text-neutral-300"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
