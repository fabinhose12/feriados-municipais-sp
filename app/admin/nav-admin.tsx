"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin", rotulo: "Pendências" },
  { href: "/admin/usuarios", rotulo: "Usuários" },
];

export function NavAdmin() {
  const caminho = usePathname();
  return (
    <nav className="adm-nav" aria-label="Administração">
      {ITENS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={caminho === item.href ? "adm-nav-ativo" : ""}
        >
          {item.rotulo}
        </Link>
      ))}
      <Link href="/" className="adm-nav-sair">
        ← Calendário
      </Link>
    </nav>
  );
}