/** Normaliza placeholders antigos ("2º G3") para o padrão completo ("2º Grupo 3"). */
export function formatKoDisplayName(name: string): string {
  return name.replace(/^(\d+)º\s*G(\d+)$/i, (_, rank: string, num: string) => `${rank}º Grupo ${num}`);
}
