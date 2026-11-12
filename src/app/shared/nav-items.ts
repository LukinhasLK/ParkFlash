export interface NavItem {
  label: string;
  rota: string;
  icone: string;
}

/** Menu completo — usado na sidebar do desktop e no "Mais" do mobile. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', rota: '/app/dashboard', icone: 'dashboard' },
  { label: 'Fichas', rota: '/app/fichas', icone: 'fichas' },
  { label: 'Relatórios', rota: '/app/relatorios', icone: 'relatorios' },
  { label: 'Manobristas', rota: '/app/manobristas', icone: 'manobristas' },
  { label: 'Divisão de Lucro', rota: '/app/divisao-lucro', icone: 'lucro' },
  { label: 'Despesas', rota: '/app/despesas', icone: 'despesas' },
  { label: 'Carros por Mês', rota: '/app/carros-por-mes', icone: 'carros' },
  { label: 'Unidades', rota: '/app/unidades', icone: 'unidades' },
  { label: 'Sócios', rota: '/app/socios', icone: 'socios' },
  { label: 'Usuários', rota: '/app/usuarios', icone: 'usuarios' },
];

/** Os quatro atalhos fixos da barra inferior; o quinto item é o "Mais". */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Início', rota: '/app/dashboard', icone: 'dashboard' },
  { label: 'Fichas', rota: '/app/fichas', icone: 'fichas' },
  { label: 'Lucro', rota: '/app/divisao-lucro', icone: 'lucro' },
  { label: 'Despesas', rota: '/app/despesas', icone: 'despesas' },
];

/** Itens que só aparecem na folha "Mais" do mobile. */
export const MAIS_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item) => !BOTTOM_NAV_ITEMS.some((b) => b.rota === item.rota)
);

/** Cor determinística do avatar a partir do nome. */
const CORES_AVATAR = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];

export function corDoAvatar(nome: string): string {
  const soma = [...nome].reduce((total, char) => total + char.charCodeAt(0), 0);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}
