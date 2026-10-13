import { BOOK } from "@/config/book";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-6 text-xs text-muted">
        <span>
          © {new Date().getFullYear()} {BOOK.title}
        </span>
      </div>
    </footer>
  );
}
