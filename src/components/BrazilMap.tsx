import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  BRAZIL_STATES_GEO,
  BrazilStateGeo,
  MAP_VIEWBOX,
} from "../data/brazilGeo";
import {
  ElectionDataSet,
  Candidate,
  StateElectionResult,
  formatVotesBR,
  formatPercentBR,
} from "../data/electionData";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Layers,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Award,
} from "lucide-react";

interface BrazilMapProps {
  dataset: ElectionDataSet;
  selectedStateUf: string | null;
  onSelectState: (uf: string) => void;
  candidateFilter: string | null;
  onSelectCandidateFilter: (id: string | null) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  uf: string;
}

// Predefinições regionais da câmera
const REGION_PRESETS: Record<
  string,
  { label: string; zoom: number; panX: number; panY: number }
> = {
  all: { label: "Brasil Inteiro", zoom: 1, panX: 0, panY: 0 },
  Norte: { label: "Região Norte", zoom: 1.8, panX: 130, panY: 130 },
  Nordeste: { label: "Região Nordeste", zoom: 2.1, panX: -260, panY: 140 },
  "Centro-Oeste": { label: "Centro-Oeste", zoom: 2.0, panX: -20, panY: -40 },
  Sudeste: { label: "Região Sudeste", zoom: 2.3, panX: -190, panY: -220 },
  Sul: { label: "Região Sul", zoom: 2.4, panX: -90, panY: -420 },
};

// Estados pequenos com linhas conectoras no litoral/DF
const CALLOUT_CONFIGS: Record<
  string,
  { lineTo: [number, number]; labelPos: [number, number] }
> = {
  DF: { lineTo: [530, 438], labelPos: [535, 438] },
  RN: { lineTo: [735, 235], labelPos: [740, 235] },
  PB: { lineTo: [735, 265], labelPos: [740, 265] },
  PE: { lineTo: [725, 292], labelPos: [730, 292] },
  AL: { lineTo: [735, 320], labelPos: [740, 320] },
  SE: { lineTo: [725, 345], labelPos: [730, 345] },
  ES: { lineTo: [665, 510], labelPos: [670, 510] },
  RJ: { lineTo: [640, 575], labelPos: [645, 575] },
};

export const BrazilMap: React.FC<BrazilMapProps> = ({
  dataset,
  selectedStateUf,
  onSelectState,
  candidateFilter,
  onSelectCandidateFilter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingAreaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Estados de navegação, zoom e tela cheia
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRegion, setActiveRegion] = useState("all");
  const [isMobileLegendOpen, setIsMobileLegendOpen] = useState(false);

  // Sincronização de refs para acesso síncrono dentro dos listeners nativos
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);

  // Rastreamento avançado de toque e pinch-to-zoom nativo em dispositivos físicos
  const isPinchingRef = useRef(false);
  const pinchEndedAtRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const touchMovedDistRef = useRef(0);
  const touchDragStartRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef<{
    dist: number;
    zoom: number;
    pan: { x: number; y: number };
    midpoint: { x: number; y: number };
  } | null>(null);

  // Busca de estados
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Tooltip flutuante ao passar o mouse
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    uf: "",
  });

  const candidatesMap = useMemo(() => {
    return Object.fromEntries(dataset.candidates.map((c) => [c.id, c]));
  }, [dataset.candidates]);

  // Listener nativo com { passive: false } para garantir pinch-to-zoom real no Android e iOS
  useEffect(() => {
    const el = drawingAreaRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        touchMovedDistRef.current = 0;
        touchDragStartRef.current = {
          x: touch.clientX - panRef.current.x,
          y: touch.clientY - panRef.current.y,
        };
      } else if (e.touches.length === 2) {
        isPinchingRef.current = true;
        touchMovedDistRef.current = 999;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const rect = el.getBoundingClientRect();
        const centerOffsetX = midX - (rect.left + rect.width / 2);
        const centerOffsetY = midY - (rect.top + rect.height / 2);

        pinchStartRef.current = {
          dist: dist > 0 ? dist : 1,
          zoom: zoomRef.current,
          pan: { ...panRef.current },
          midpoint: { x: centerOffsetX, y: centerOffsetY },
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // 2 DEDOS: PINCH-TO-ZOOM PROPORCIONAL AO REDOR DO CENTRO DO GESTO
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault(); // Impede o zoom de página do navegador em telas touch reais!
        isPinchingRef.current = true;
        touchMovedDistRef.current = 999;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (currentDist <= 0) return;

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const rect = el.getBoundingClientRect();
        const centerOffsetX = midX - (rect.left + rect.width / 2);
        const centerOffsetY = midY - (rect.top + rect.height / 2);

        const {
          dist: startDist,
          zoom: startZoom,
          pan: startPan,
          midpoint: startMid,
        } = pinchStartRef.current;
        const scaleFactor = currentDist / startDist;
        const targetZoom = Math.min(Math.max(startZoom * scaleFactor, 0.85), 4.0);

        // Ajuste proporcional do pan ao redor do centro do gesto dos 2 dedos
        const newPanX =
          centerOffsetX - (startMid.x - startPan.x) * (targetZoom / startZoom);
        const newPanY =
          centerOffsetY - (startMid.y - startPan.y) * (targetZoom / startZoom);

        setZoom(Number(targetZoom.toFixed(3)));
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
        return;
      }

      // 1 DEDO: PAN / ARRASTE DO MAPA
      if (e.touches.length === 1 && !isPinchingRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        touchMovedDistRef.current = dist;

        if (dist > 8) {
          e.preventDefault(); // Pan suave no mapa
          setIsDragging(true);
          setPan({
            x: Math.round(touch.clientX - touchDragStartRef.current.x),
            y: Math.round(touch.clientY - touchDragStartRef.current.y),
          });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isPinchingRef.current) {
        pinchEndedAtRef.current = Date.now();
      }

      if (e.touches.length === 0) {
        isPinchingRef.current = false;
        pinchStartRef.current = null;
        setIsDragging(false);
      } else if (e.touches.length === 1) {
        // Transição suave ao levantar o 1º dedo sem saltos
        isPinchingRef.current = false;
        pinchStartRef.current = null;
        const touch = e.touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        touchMovedDistRef.current = 999;
        touchDragStartRef.current = {
          x: touch.clientX - panRef.current.x,
          y: touch.clientY - panRef.current.y,
        };
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  // Seleção segura de estados (impede disparo acidental durante pinch ou arraste)
  const handleStateClick = (uf: string) => {
    if (
      isPinchingRef.current ||
      Date.now() - pinchEndedAtRef.current < 450 ||
      touchMovedDistRef.current > 8
    ) {
      return;
    }
    onSelectState(uf);
  };

  // Controle de Tela Cheia
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Controles de zoom
  const handleZoomIn = () => {
    setZoom((z) => Math.min(3.8, Number((z * 1.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(0.85, Number((z / 1.25).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveRegion("all");
  };

  const handleRegionSelect = (regionKey: string) => {
    setActiveRegion(regionKey);
    const preset = REGION_PRESETS[regionKey];
    if (preset) {
      setZoom(preset.zoom);
      setPan({ x: preset.panX, y: preset.panY });
    }
  };

  // Arraste do mouse e toque (touch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Hover sobre estados
  const handleStateMouseEnter = (
    e: React.MouseEvent,
    geo: BrazilStateGeo
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      uf: geo.uf,
    });
  };

  const handleStateMouseMove = (e: React.MouseEvent) => {
    if (!tooltip.visible) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip((prev) => ({
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }));
  };

  const handleStateMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Seleção via busca
  const handleSelectSearchedState = (uf: string) => {
    onSelectState(uf);
    setSearchQuery("");
    setIsSearchOpen(false);

    const geo = BRAZIL_STATES_GEO.find((g) => g.uf === uf);
    if (geo) {
      const centerX = MAP_VIEWBOX.width / 2;
      const centerY = MAP_VIEWBOX.height / 2;
      const targetZoom = 2.0;
      setZoom(targetZoom);
      setPan({
        x: (centerX - geo.centroid[0]) * (targetZoom - 0.4),
        y: (centerY - geo.centroid[1]) * (targetZoom - 0.4),
      });
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return BRAZIL_STATES_GEO.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.uf.toLowerCase().includes(q) ||
        s.capital.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  // Cor do estado pelo vencedor (Flávio = Azul, Lula = Vermelho)
  const getStateColor = (uf: string): string => {
    const res = dataset.states[uf];
    if (!res) return "#E2E8F0";

    const winner = candidatesMap[res.winnerId];
    if (!winner) return "#94A3B8";

    return winner.color;
  };

  // Opacidade no filtro por candidato
  const getStateOpacity = (uf: string): number => {
    if (!candidateFilter) return 1;
    const res = dataset.states[uf];
    if (!res) return 0.3;
    return res.winnerId === candidateFilter ? 1 : 0.22;
  };

  // Dados para o tooltip
  const tooltipData: StateElectionResult | null = tooltip.uf
    ? dataset.states[tooltip.uf] || null
    : null;
  const tooltipWinner: Candidate | null = tooltipData
    ? candidatesMap[tooltipData.winnerId] || null
    : null;

  const tooltipFlavio = tooltipData?.candidates.find((c) => c.candidateId === "flavio");
  const tooltipLula = tooltipData?.candidates.find((c) => c.candidateId === "lula");
  const tooltipOutros = tooltipData?.candidates.find((c) => c.candidateId === "outros");

  return (
    <div
      ref={containerRef}
      id="mapa-interativo"
      className={`relative w-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden select-none transition-all ${
        isFullscreen
          ? "h-screen rounded-none z-50 fixed inset-0"
          : "h-[520px] sm:h-[680px] lg:h-[780px] [@media(orientation:landscape)_and_(max-height:500px)]:h-[86vh] [@media(orientation:landscape)_and_(max-height:500px)]:min-h-[290px] [@media(orientation:landscape)_and_(max-height:500px)]:max-h-[440px]"
      }`}
    >
      {/* Barra Superior do Mapa: Busca, Regiões e Botões de Ação */}
      <div className="absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Esquerda: Caixa de Busca e Seletor de Região */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto max-w-[calc(100%-170px)] sm:max-w-none">
          {/* Caixa de Busca com Autocomplete */}
          <div className="relative">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs px-2.5 sm:px-3 py-2 w-32 xs:w-44 sm:w-64 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-500 transition-all">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 mr-1.5 sm:mr-2" />
              <input
                type="text"
                placeholder="Buscar estado..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                aria-label="Buscar estado no mapa interativo"
                className="w-full text-xs bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium truncate"
              />
            </div>

            {/* Menu Suspenso de Resultados de Busca */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 overflow-hidden">
                {searchResults.map((st) => {
                  const stateRes = dataset.states[st.uf];
                  const winner = stateRes ? candidatesMap[stateRes.winnerId] : null;
                  return (
                    <button
                      key={st.uf}
                      onClick={() => handleSelectSearchedState(st.uf)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                          {st.uf}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {st.region}
                          </span>
                        </div>
                      </div>
                      {winner && (
                        <span
                          className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-2xs"
                          style={{ backgroundColor: winner.color }}
                        >
                          {winner.popularName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seletor Rápido de Região no Mobile */}
          <div className="flex lg:hidden items-center bg-white/95 backdrop-blur-md rounded-xl px-2 py-1.5 border border-slate-200 shadow-xs">
            <select
              value={activeRegion}
              onChange={(e) => handleRegionSelect(e.target.value)}
              aria-label="Filtrar por região do Brasil"
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Brasil</option>
              <option value="Norte">Norte</option>
              <option value="Nordeste">Nordeste</option>
              <option value="Centro-Oeste">Centro-Oeste</option>
              <option value="Sudeste">Sudeste</option>
              <option value="Sul">Sul</option>
            </select>
          </div>

          {/* Abas de Regiões Brasileiras (Telas Médias e Grandes) */}
          <div role="tablist" aria-label="Filtro de regiões do Brasil" className="hidden lg:flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-xs text-xs">
            {Object.entries(REGION_PRESETS).map(([key, item]) => {
              const isActive = activeRegion === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Aproximar mapa na região ${item.label}`}
                  onClick={() => handleRegionSelect(key)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center justify-center ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direita: Botões de Zoom e Tela Cheia (Mínimo 44px para padrão ergonômico de toque no mobile) */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs p-1 text-slate-700">
            <button
              onClick={handleZoomIn}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-700 hover:text-slate-950"
              title="Aproximar visualização (+)"
              aria-label="Aproximar mapa"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-700 hover:text-slate-950"
              title="Afastar visualização (-)"
              aria-label="Afastar mapa"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer ${
                zoom !== 1 || pan.x !== 0 || pan.y !== 0
                  ? "text-blue-700 font-bold bg-blue-50/80"
                  : "text-slate-700 hover:text-slate-950"
              }`}
              title="Redefinir visualização original"
              aria-label="Redefinir zoom do mapa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-700 hover:text-slate-950"
              title={isFullscreen ? "Sair da tela cheia" : "Modo tela cheia"}
              aria-label="Alternar tela cheia"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tela de Desenho SVG Interativa */}
      <div
        ref={drawingAreaRef}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center relative touch-none select-none"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-full mx-auto transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Grade suave de fundo */}
          <defs>
            <pattern
              id="grade-suave"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(15, 23, 42, 0.03)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width={MAP_VIEWBOX.width}
            height={MAP_VIEWBOX.height}
            fill="url(#grade-suave)"
          />

          {/* Renderização das 27 Unidades da Federação */}
          <g id="camada-estados-brasil">
            {BRAZIL_STATES_GEO.map((geo) => {
              const isSelected = selectedStateUf === geo.uf;
              const fill = getStateColor(geo.uf);
              const opacity = getStateOpacity(geo.uf);
              const stateResult = dataset.states[geo.uf];
              const winnerName = stateResult?.winnerId === "flavio" ? "Flávio Bolsonaro" : "Lula";
              const winnerPct = stateResult?.candidates[0]?.percentage || 0;

              return (
                <path
                  key={geo.uf}
                  d={geo.path}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2.6 : 1.1}
                  strokeLinejoin="round"
                  tabIndex={0}
                  role="button"
                  aria-label={`${geo.name} (${geo.uf}): 1º lugar ${winnerName} com ${winnerPct}%. Clique para ver apuração completa.`}
                  className={`brazil-state-path focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${
                    isSelected ? "is-selected" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStateClick(geo.uf);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleStateClick(geo.uf);
                    }
                  }}
                  onMouseEnter={(e) => handleStateMouseEnter(e, geo)}
                  onMouseMove={handleStateMouseMove}
                  onMouseLeave={handleStateMouseLeave}
                />
              );
            })}
          </g>

          {/* Rótulos de Siglas das UFs e Conectores Costeiros */}
          <g id="camada-rotulos-estados">
            {BRAZIL_STATES_GEO.map((geo) => {
              const callout = CALLOUT_CONFIGS[geo.uf];
              const isSelected = selectedStateUf === geo.uf;
              const opacity = getStateOpacity(geo.uf);

              if (callout) {
                return (
                  <g
                    key={`conector-${geo.uf}`}
                    opacity={opacity}
                    tabIndex={0}
                    role="button"
                    aria-label={`Selecionar estado ${geo.name} (${geo.uf})`}
                    className="cursor-pointer pointer-events-auto transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStateClick(geo.uf);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleStateClick(geo.uf);
                      }
                    }}
                  >
                    <line
                      x1={geo.centroid[0]}
                      y1={geo.centroid[1]}
                      x2={callout.lineTo[0]}
                      y2={callout.lineTo[1]}
                      stroke="#334155"
                      strokeWidth="0.9"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={geo.centroid[0]}
                      cy={geo.centroid[1]}
                      r="2.6"
                      fill="#0F172A"
                    />
                    {/* Área de toque expandida invisível para mobile */}
                    <rect
                      x={callout.labelPos[0] - 6}
                      y={callout.labelPos[1] - 12}
                      width="36"
                      height="28"
                      fill="transparent"
                    />
                    <rect
                      x={callout.labelPos[0] - 2}
                      y={callout.labelPos[1] - 8}
                      width="22"
                      height="16"
                      rx="3.5"
                      fill={isSelected ? "#0F172A" : "#FFFFFF"}
                      stroke={isSelected ? "#0F172A" : "#64748B"}
                      strokeWidth={isSelected ? "1.5" : "0.9"}
                    />
                    <text
                      x={callout.labelPos[0] + 9}
                      y={callout.labelPos[1] + 3.5}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                      fill={isSelected ? "#FFFFFF" : "#0F172A"}
                    >
                      {geo.uf}
                    </text>
                  </g>
                );
              }

              return (
                <text
                  key={`sigla-${geo.uf}`}
                  x={geo.centroid[0]}
                  y={geo.centroid[1]}
                  className="pointer-events-none"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={
                    geo.uf === "AM" || geo.uf === "PA" || geo.uf === "MT"
                      ? "12.5"
                      : "10.5"
                  }
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                  fill="#FFFFFF"
                  opacity={opacity}
                  style={{
                    filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.85))",
                  }}
                >
                  {geo.uf}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Tooltip Flutuante Completo em Português */}
      {tooltip.visible && tooltipData && tooltipWinner && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 w-76 max-w-[calc(100%-24px)] text-xs animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${Math.max(12, Math.min(tooltip.x + 16, (containerRef.current?.clientWidth || 300) - 315))}px`,
            top: `${Math.max(12, Math.min(tooltip.y + 16, (containerRef.current?.clientHeight || 300) - 360))}px`,
          }}
        >
          {/* Cabeçalho do Tooltip */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                  {tooltipData.uf}
                </span>
                <span className="font-heading font-extrabold text-sm text-slate-100">
                  {tooltipData.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Região {tooltipData.region} · Capital: {tooltipData.capital}
              </span>
            </div>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded text-white shadow-2xs shrink-0"
              style={{ backgroundColor: tooltipWinner.color }}
            >
              Venceu: {tooltipWinner.popularName}
            </span>
          </div>

          {/* Votos de Flávio Bolsonaro, Lula e Outros */}
          <div className="space-y-2 mb-3">
            {/* Flávio Bolsonaro */}
            {tooltipFlavio && (
              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-700 shrink-0" />
                    <span className="font-bold text-slate-100">
                      Flávio Bolsonaro (PL)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-blue-400">
                      {formatPercentBR(tooltipFlavio.percentage)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">
                      ({formatVotesBR(tooltipFlavio.votes)})
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${tooltipFlavio.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Lula */}
            {tooltipLula && (
              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                    <span className="font-bold text-slate-100">
                      Lula (PT)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-red-400">
                      {formatPercentBR(tooltipLula.percentage)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">
                      ({formatVotesBR(tooltipLula.votes)})
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all"
                    style={{ width: `${tooltipLula.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Outros candidatos */}
            {tooltipOutros && (
              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                    <span className="font-medium text-slate-300">
                      Outros Candidatos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-300">
                      {formatPercentBR(tooltipOutros.percentage)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">
                      ({formatVotesBR(tooltipOutros.votes)})
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-500 transition-all"
                    style={{ width: `${tooltipOutros.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dados Eleitorais do Estado */}
          <div className="pt-2 border-t border-slate-800 space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span>Votos Válidos:</span>
              <strong className="text-slate-100 font-bold">
                {formatVotesBR(tooltipData.validVotes)}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Votos em Branco:</span>
              <span>
                {formatVotesBR(tooltipData.blankVotes)} ({formatPercentBR(tooltipData.blankVotesPercentage)})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Votos Nulos:</span>
              <span>
                {formatVotesBR(tooltipData.nullVotes)} ({formatPercentBR(tooltipData.nullVotesPercentage)})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
              <span>Comparecimento:</span>
              <span className="text-emerald-400 font-bold">
                {formatVotesBR(tooltipData.turnout)} ({formatPercentBR(tooltipData.turnoutPercentage)})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Abstenção:</span>
              <span>
                {formatVotesBR(tooltipData.abstention)} ({formatPercentBR(tooltipData.abstentionPercentage)})
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-sans">
            <span>Clique para abrir o painel detalhado</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      )}

      {/* Botão compacto de alternância da legenda no Mobile quando recolhida */}
      {!isMobileLegendOpen && (
        <button
          onClick={() => setIsMobileLegendOpen(true)}
          className="sm:hidden absolute bottom-3 left-3 z-20 min-h-[44px] flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs font-bold text-slate-800 cursor-pointer active:bg-slate-100"
          aria-label="Abrir legenda e filtros por candidato"
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>Legenda & Filtros</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Legenda Dinâmica na Parte Inferior do Mapa (Sempre visível no desktop, expansível no mobile) */}
      <div
        className={`absolute bottom-3 left-3 right-3 sm:bottom-3.5 sm:left-3.5 sm:right-auto z-20 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-md transition-all ${
          isMobileLegendOpen ? "block" : "hidden sm:block"
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Vencedor no 1º Turno por Estado
          </span>
          <div className="flex items-center gap-2">
            {candidateFilter && (
              <button
                onClick={() => onSelectCandidateFilter(null)}
                aria-label="Remover filtro de candidato no mapa"
                className="text-[10px] text-blue-700 underline hover:text-blue-900 cursor-pointer font-bold min-h-[28px] inline-flex items-center"
              >
                Limpar filtro
              </button>
            )}
            <button
              onClick={() => setIsMobileLegendOpen(false)}
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-lg cursor-pointer"
              title="Recolher legenda"
              aria-label="Recolher legenda"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dataset.candidates
            .map((cand) => {
              const statesWon = Object.values(dataset.states).filter(
                (s) => s.winnerId === cand.id
              ).length;
              return { cand, statesWon };
            })
            .filter(({ statesWon }) => statesWon > 0)
            .map(({ cand, statesWon }) => {
              const isFilterActive = candidateFilter === cand.id;
              const countLabel =
                cand.id === "flavio"
                  ? "15 unidades da Federação"
                  : `${statesWon} ${statesWon === 1 ? "estado" : "estados"}`;

              return (
                <button
                  key={cand.id}
                  onClick={() =>
                    onSelectCandidateFilter(isFilterActive ? null : cand.id)
                  }
                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    isFilterActive
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "hover:bg-slate-100 text-slate-800 border border-slate-200/90 bg-white"
                  }`}
                  title={`Clique para destacar no mapa as unidades da Federação vencidas por ${cand.popularName}`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10"
                    style={{ backgroundColor: cand.color }}
                  />
                  <span className="font-bold">{cand.popularName}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isFilterActive ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    ({countLabel})
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
