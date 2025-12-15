import React from 'react';
import { Player, JUNG_FUNCTIONS, BoardTile, GameMode, MBTI_GROUPS } from '../types';

interface Props {
  players: Player[];
  currentPlayerId: string;
  boardLayout: BoardTile[];
  validMoves: number[]; 
  onTileClick: (index: number) => void;
  gameMode: GameMode;
  visibilityRadius: number; // passed from sightRange
}

// Increased size to 60 for Hex
const HEX_SIZE = 60; 
// Increased to 110 for better visibility in MBTI mode
const SQUARE_SIZE = 110;

const hexPoints = (x: number, y: number, size: number) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = (Math.PI / 180) * angle_deg;
    points.push(`${x + size * Math.cos(angle_rad)},${y + size * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
};

const axialToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = HEX_SIZE * (3 / 2 * r);
    return { x: x + 600, y: y + 450 }; // Center in 1200x900 viewBox
};

// Grid coords to pixel for MBTI 16 mode
// Grid is 7x7 (q=0..6, r=0..6). Center is (3,3).
const gridToPixel = (q: number, r: number) => {
    // Center (3,3) maps to (600, 450)
    const px = (q - 3) * SQUARE_SIZE + 600;
    const py = (r - 3) * SQUARE_SIZE + 450; 
    return { x: px, y: py };
}

const GameBoard: React.FC<Props> = ({ players, currentPlayerId, boardLayout, validMoves, onTileClick, gameMode, visibilityRadius }) => {
  
  // Render JUNGIAN (Hex) Map - No Fog logic requested for Jung mode
  const renderHexMap = () => {
    return boardLayout.map((tile) => {
        const { x, y } = axialToPixel(tile.q, tile.r);
        const funcData = JUNG_FUNCTIONS.find(f => f.id === tile.functionId);
        
        const isCenter = tile.q === 0 && tile.r === 0;
        // Light mode: Slate-300 for center, slate-200 for normal. Dark mode: Slate-700 / Slate-800
        let baseColor = funcData ? funcData.color : (isCenter ? '#94a3b8' : '#64748b');
        
        const playersHere = players.filter(p => p.position === tile.index);
        const isValidMove = validMoves.includes(tile.index);
        const isTarget = isValidMove;

        return (
            <g 
                key={tile.index} 
                className={`transition-all duration-300 ${isValidMove ? 'cursor-pointer' : ''}`}
                onClick={() => isValidMove && onTileClick(tile.index)}
            >
                <polygon 
                    points={hexPoints(x, y, HEX_SIZE - 2)} 
                    // Light mode fill vs Dark mode fill
                    className="fill-slate-200 stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-700"
                    style={{
                        fill: isCenter ? (document.documentElement.classList.contains('dark') ? '#334155' : '#cbd5e1') : undefined,
                    }}
                    stroke={isTarget ? '#2dd4bf' : baseColor}
                    strokeWidth={isTarget ? 6 : (isCenter ? 3 : 2)}
                    strokeOpacity={isTarget ? 1 : 0.7}
                />
                
                <polygon 
                    points={hexPoints(x, y, HEX_SIZE - 8)} 
                    fill={baseColor}
                    fillOpacity={isTarget ? 0.6 : 0.2}
                />

                <text 
                    x={x} 
                    y={y + 8} 
                    textAnchor="middle" 
                    // Text color switch
                    className="fill-slate-600 dark:fill-slate-300"
                    style={{ 
                        fill: isTarget ? '#ffffff' : baseColor,
                        pointerEvents: 'none', 
                        userSelect: 'none'
                    }}
                    fontWeight="bold" 
                    fontSize={isCenter ? "24" : "18"} 
                >
                    {tile.functionId}
                </text>
                
                {renderPlayers(playersHere, x, y, currentPlayerId, false)}
            </g>
        );
    });
  };

  // Render MBTI 16 (Square Grid) Map - With Strict Fog of War
  const renderSquareMap = () => {
      const currentPlayer = players.find(p => p.id === currentPlayerId);
      const currentTile = boardLayout.find(t => t.index === currentPlayer?.position);
      
      return boardLayout.map((tile) => {
          const { x, y } = gridToPixel(tile.q, tile.r);
          
          // Visibility Logic
          let isVisible = false;
          let distance = 999;
          
          if (currentTile) {
              distance = Math.abs(tile.q - currentTile.q) + Math.abs(tile.r - currentTile.r);
              isVisible = distance <= visibilityRadius;
          }
          
          const isCenter = tile.zone === 'Hub';
          const playersHere = players.filter(p => p.position === tile.index);
          const isValidMove = validMoves.includes(tile.index);
          
          // Get Zone Base Color (Default gray)
          let zoneBaseColor = '#64748b';
          if (tile.zone === 'NT') zoneBaseColor = MBTI_GROUPS['分析家 (NT)'].hexColor;
          else if (tile.zone === 'NF') zoneBaseColor = MBTI_GROUPS['外交家 (NF)'].hexColor;
          else if (tile.zone === 'SJ') zoneBaseColor = MBTI_GROUPS['守护者 (SJ)'].hexColor;
          else if (tile.zone === 'SP') zoneBaseColor = MBTI_GROUPS['探险家 (SP)'].hexColor;
          else if (isCenter) zoneBaseColor = '#f59e0b';

          // Visual Properties
          let strokeColor = zoneBaseColor;
          let strokeOpacity = 1;
          
          if (isVisible) {
              // Lit State
              if (isCenter) {
                  strokeColor = '#f59e0b'; // Amber for center
              } else {
                  strokeColor = zoneBaseColor;
              }
          } else {
              // Fog State
              strokeColor = zoneBaseColor;
              strokeOpacity = 0.4; // Dim outline
          }

          const rectSize = SQUARE_SIZE - 6; 

          return (
             <g 
                key={tile.index}
                className={`transition-all duration-500 ${isValidMove ? 'cursor-pointer' : ''}`}
                onClick={() => isValidMove && onTileClick(tile.index)}
             >
                 {/* Main Square */}
                 <rect
                    x={x - rectSize/2}
                    y={y - rectSize/2}
                    width={rectSize}
                    height={rectSize}
                    rx={isCenter ? 30 : 12}
                    // Light mode: white fill + shadow. Dark mode: slate-900 fill.
                    className={`
                        ${isVisible ? (isCenter ? 'fill-amber-50 dark:fill-amber-900/30' : 'fill-white dark:fill-slate-800') : 'fill-slate-100 dark:fill-slate-900'} 
                        transition-colors duration-500
                    `}
                    fillOpacity={isVisible ? 0.9 : 0.2}
                    stroke={isValidMove ? '#2dd4bf' : strokeColor}
                    strokeWidth={isValidMove ? 4 : (isVisible ? 2 : 1)}
                    strokeOpacity={isValidMove ? 1 : strokeOpacity}
                    style={{
                        filter: isVisible ? `drop-shadow(0 4px 6px ${strokeColor}40)` : 'none',
                    }}
                 />
                 
                 {/* Inner Accent - Only if Visible */}
                 {isVisible && !isCenter && (
                     <rect
                        x={x - rectSize/2 + 4}
                        y={y - rectSize/2 + 4}
                        width={rectSize - 8}
                        height={rectSize - 8}
                        rx={8}
                        fill={strokeColor}
                        fillOpacity={0.05}
                        stroke="none"
                     />
                 )}

                 {/* Content - STRICTLY HIDDEN IN FOG */}
                 {isVisible && (
                     <g className="animate-in fade-in zoom-in duration-500">
                        {tile.functionId === 'Hub' ? (
                             <>
                                <text x={x} y={y - 5} textAnchor="middle" className="fill-slate-900 dark:fill-white" fontWeight="bold" fontSize="18" style={{ pointerEvents: 'none', userSelect: 'none' }}>海洋</text>
                                <text x={x} y={y + 18} textAnchor="middle" className="fill-slate-900 dark:fill-white" fontWeight="bold" fontSize="18" style={{ pointerEvents: 'none', userSelect: 'none' }}>之心</text>
                             </>
                         ) : (
                            <>
                                <text x={x} y={y - 5} textAnchor="middle" fill={isValidMove ? '#2dd4bf' : strokeColor} fontWeight="bold" fontSize="18" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                    {tile.functionId}
                                </text>
                                {tile.characterName && (
                                    <text x={x} y={y + 18} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="12" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                        {tile.characterName}
                                    </text>
                                )}
                            </>
                         )}
                     </g>
                 )}
                 
                 {/* Players are ALWAYS visible */}
                 {renderPlayers(playersHere, x, y, currentPlayerId, true)}
             </g>
          )
      });
  };

  const isTarget = (idx: number) => validMoves.includes(idx);

  const renderPlayers = (playersHere: Player[], x: number, y: number, currentId: string, isGridMode: boolean) => {
      if (playersHere.length === 0) return null;
      return (
        <g transform={`translate(${x}, ${y})`}>
            {playersHere.map((p, i) => {
                const count = playersHere.length;
                
                // Distancing Logic:
                const dist = isGridMode ? 35 : 32;
                
                // Angle Logic:
                const angleStep = (2 * Math.PI) / (count || 1);
                const startOffset = Math.PI / 2; 
                
                const angle = startOffset + (i * angleStep);
                
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                
                // Radius for the player circle itself
                const radius = isGridMode ? 10 : 12;

                return (
                    <g key={p.id} className="transition-all duration-500">
                         {/* Player Aura Light Source */}
                        <circle cx={px} cy={py} r={isGridMode ? 25 : 30} fill={p.color} fillOpacity="0.2" className="animate-pulse" style={{filter: 'blur(8px)'}} />
                        
                        <defs>
                            <clipPath id={`clip-${p.id}`}>
                                <circle cx={px} cy={py} r={radius} />
                            </clipPath>
                        </defs>
                        <circle 
                            cx={px} 
                            cy={py} 
                            r={radius + 1} 
                            fill={p.color} 
                            stroke="white" 
                            strokeWidth="2"
                            className="shadow-md"
                        />
                        {p.avatar && p.avatar.startsWith('data:') ? (
                            <image
                                x={px - radius}
                                y={py - radius}
                                width={radius * 2}
                                height={radius * 2}
                                href={p.avatar}
                                clipPath={`url(#clip-${p.id})`}
                                preserveAspectRatio="xMidYMid slice"
                            />
                        ) : (
                             <text x={px} y={py + radius/2 - 1} textAnchor="middle" fill="white" fontSize={radius - 2} fontWeight="bold">
                                {p.name[0].toUpperCase()}
                            </text>
                        )}
                        
                        {p.id === currentId && (
                                <circle cx={px} cy={py} r={radius + 6} stroke={p.color} strokeWidth="3" fill="none" className="animate-ping" opacity="0.8" />
                        )}
                    </g>
                );
            })}
        </g>
      );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden relative shadow-inner flex items-center justify-center cursor-move transition-colors duration-300">
       <div className="absolute top-4 left-4 text-slate-500 dark:text-slate-500 text-xs font-mono z-10 bg-slate-100/80 dark:bg-slate-900/80 px-2 py-1 rounded">
          {gameMode === GameMode.MBTI_16 ? 'MBTI 十六型田字格 (33格) - 迷雾海域' : '彩虹船 (Rainbow Ark)'}
       </div>
       
       <svg viewBox="0 0 1200 900" className="w-full h-full animate-fade-in touch-pan-x touch-pan-y select-none">
          {gameMode === GameMode.JUNG_8 ? renderHexMap() : renderSquareMap()}
       </svg>
    </div>
  );
};

export default GameBoard;