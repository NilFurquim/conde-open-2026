import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Renderiza um nome de jogador. Quando o nome é igual ao do jogador logado,
 * adiciona uma bolinha de destaque (dot) e — opcionalmente — colore o texto
 * com a cor primary, para que o usuário consiga "se encontrar" rapidamente
 * em qualquer listagem.
 *
 * Comportamento:
 *   • dot é exibida SEMPRE que o nome bate com o jogador logado
 *     (a menos que `noDot` seja passado).
 *   • A cor primary é aplicada por padrão. Em contextos onde a cor já
 *     comunica outro estado (ex.: vencedor em navy-900 bold), passe
 *     `keepColor` para manter o estilo do parent.
 */
const PlayerName: React.FC<{
  name: string;
  className?: string;
  /** Mantém a cor passada via className em vez de aplicar text-primary */
  keepColor?: boolean;
  /** Esconde a bolinha de destaque mesmo se for o jogador logado */
  noDot?: boolean;
  dotSize?: 'sm' | 'md';
  /** Classe opcional para sobrescrever cor do dot */
  dotClassName?: string;
}> = ({ name, className = '', keepColor, noDot, dotSize = 'sm', dotClassName = 'bg-primary' }) => {
  const { profile } = useAuth();
  const me = profile?.playerName;
  const isMe = !!me && name === me;

  const dotClass = dotSize === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <span
      className={`flex items-center gap-1.5 min-w-0 ${
        isMe && !keepColor ? 'text-primary' : ''
      } ${className}`}
    >
      {isMe && !noDot && (
        <span
          aria-hidden="true"
          className={`shrink-0 rounded-full ${dotClassName} ${dotClass}`}
        />
      )}
      <span className="truncate">{name}</span>
    </span>
  );
};

export default PlayerName;
