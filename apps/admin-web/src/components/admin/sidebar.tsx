'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  UserCheck,
  Store,
  Wallet,
  Ticket,
  MapPin,
  PackageCheck,
  LifeBuoy,
  Bike,
  Gift,
  Receipt,
  FileCheck,
  Car,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pedidos', label: 'Pedidos', icon: Package },
  { href: '/lavadores', label: 'Aprovação de Lavadores', icon: UserCheck },
  { href: '/documentos', label: 'Documentos', icon: FileCheck },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/servicos-auto', label: 'Serviços Auto', icon: Sparkles },
  { href: '/catalogo-veiculos', label: 'Catálogo de Veículos', icon: Car },
  { href: '/repasses', label: 'Repasses', icon: Wallet },
  { href: '/relatorios-financeiros', label: 'Relatórios Financeiros', icon: Receipt },
  { href: '/cupons', label: 'Cupons', icon: Ticket },
  { href: '/zonas', label: 'Zonas', icon: MapPin },
  { href: '/kit-inicial', label: 'Kit Inicial', icon: PackageCheck },
  { href: '/suporte', label: 'Suporte', icon: LifeBuoy },
  { href: '/aluguel-moto', label: 'Aluguel de Moto', icon: Bike },
  { href: '/fidelidade', label: 'Fidelidade', icon: Gift },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-6">
        <span className="font-semibold">GIUCAR Admin</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
