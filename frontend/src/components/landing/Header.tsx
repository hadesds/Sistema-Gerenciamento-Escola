"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#calendario",      label: "Calendário" },
  { href: "#perfis",          label: "Para quem é" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur border-b border-gray-border">
      {/* Barra principal */}
      <div className="flex items-center justify-between px-8 h-[6.8rem]">

        {/* Logo */}
        <Link href="#" className="flex items-center gap-4 no-underline">
          <Image
            src="/LOGO.png"
            alt="Logo Cara"
            width={200}
            height={200}
            className="h-[5rem] w-auto object-contain"
          />
          <span className="font-sora font-bold text-[1.8rem] text-dark leading-tight">
            Sistema de{" "}
            <span className="text-primary">Gerenciamento Escolar</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className="no-underline text-gray-muted font-semibold text-[1.4rem] transition-colors hover:text-primary">
              {l.label}
            </Link>
          ))}
          <Link href="#login"
            className="bg-primary text-white px-[1.4rem] py-[0.6rem] rounded-full font-bold text-[1.4rem] shadow-[0_0.4rem_1.2rem_rgba(245,166,35,0.35)] transition-all hover:bg-primary-dark hover:-translate-y-[0.1rem]">
            Entrar
          </Link>
        </nav>

        {/* Hamburger */}
        <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menu"
          className="md:hidden flex flex-col justify-center gap-[0.5rem] w-[4rem] h-[4rem] bg-transparent border-none cursor-pointer">
          <span className={`block w-[2.4rem] h-[0.2rem] bg-dark rounded-full transition-all duration-300 ${open ? "rotate-45 translate-y-[0.7rem]" : ""}`} />
          <span className={`block w-[2.4rem] h-[0.2rem] bg-dark rounded-full transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-[2.4rem] h-[0.2rem] bg-dark rounded-full transition-all duration-300 ${open ? "-rotate-45 -translate-y-[0.7rem]" : ""}`} />
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden flex flex-col gap-1 px-8 pb-8 border-t border-gray-border bg-white">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="no-underline text-gray-muted font-semibold text-[1.6rem] py-4 border-b border-gray-border last:border-0">
              {l.label}
            </Link>
          ))}
          <Link href="#login" onClick={() => setOpen(false)}
            className="mt-3 bg-primary text-white text-center px-[1.4rem] py-4 rounded-full font-bold text-[1.6rem]">
            Entrar
          </Link>
        </div>
      )}
    </header>
  );
}
