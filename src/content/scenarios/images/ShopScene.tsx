import React from 'react';

export function ShopScene({ alt, className }: { alt: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 300"
      width="100%"
      height="100%"
      role="img"
      aria-label={alt}
      className={className}
    >
      {/* Bakgrunn og gulv */}
      <rect width="400" height="300" fill="var(--surface-2)" />
      <rect y="230" width="400" height="70" fill="var(--line)" />

      {/* Tilbudsskilt i taket */}
      <rect
        x="50"
        y="25"
        width="80"
        height="30"
        rx="3"
        fill="var(--hint-soft)"
        stroke="var(--hint)"
        strokeWidth="2"
      />
      <text
        x="90"
        y="45"
        fontSize="12"
        fontWeight="bold"
        fill="var(--hint)"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        TILBUD
      </text>
      <line x1="90" y1="0" x2="90" y2="25" stroke="var(--ink)" strokeWidth="1.5" />

      {/* Butikkhylle på venstre side */}
      <rect
        x="25"
        y="70"
        width="130"
        height="160"
        fill="var(--surface)"
        stroke="var(--line-strong)"
        strokeWidth="2"
        rx="2"
      />
      <line x1="25" y1="120" x2="155" y2="120" stroke="var(--ink)" strokeWidth="2" />
      <line x1="25" y1="170" x2="155" y2="170" stroke="var(--ink)" strokeWidth="2" />
      <rect x="35" y="85" width="16" height="32" rx="2" fill="var(--primary)" />
      <rect x="55" y="85" width="16" height="32" rx="2" fill="var(--primary)" />
      <rect x="75" y="85" width="16" height="32" rx="2" fill="var(--error)" />
      <rect x="95" y="85" width="16" height="32" rx="2" fill="var(--success)" />
      <rect x="35" y="138" width="30" height="25" rx="5" fill="var(--hint)" />
      <rect x="72" y="138" width="30" height="25" rx="5" fill="var(--hint)" />
      <rect x="110" y="138" width="30" height="25" rx="5" fill="var(--hint)" />
      <circle cx="45" cy="195" r="10" fill="var(--error)" />
      <circle cx="70" cy="195" r="10" fill="var(--success)" />
      <circle cx="95" cy="195" r="10" fill="var(--hint)" />
      <circle cx="120" cy="195" r="10" fill="var(--error)" />

      {/* Kassedisk på høyre side */}
      <rect x="220" y="145" width="155" height="85" rx="4" fill="var(--primary)" />
      <rect x="220" y="145" width="155" height="15" fill="var(--ink)" />
      <rect x="235" y="132" width="14" height="13" rx="2" fill="var(--error)" />
      <rect x="255" y="125" width="12" height="20" rx="2" fill="var(--surface)" />

      {/* Kasseapparat / betalingsterminal */}
      <rect
        x="315"
        y="95"
        width="45"
        height="40"
        rx="3"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <rect x="322" y="103" width="31" height="18" fill="var(--primary-soft)" />
      <rect x="330" y="135" width="15" height="10" fill="var(--ink)" />

      {/* Handlekurv på gulvet */}
      <polygon
        points="165,225 210,225 204,258 171,258"
        fill="var(--error-soft)"
        stroke="var(--error)"
        strokeWidth="2"
      />
      <path d="M 172 225 Q 187 205 203 225" fill="none" stroke="var(--error)" strokeWidth="2" />
      <circle cx="187" cy="235" r="8" fill="var(--success)" />
    </svg>
  );
}
