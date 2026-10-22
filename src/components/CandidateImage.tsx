import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

interface CandidateImageProps {
  src?: string;
  alt: string;
  candidateName: string;
  ballotNumber?: number;
  partyColor?: string;
  className?: string;
  aspectRatio?: "square" | "portrait" | "circle";
  size?: "sm" | "md" | "lg" | "xl";
  showAttributionBadge?: boolean;
  attribution?: string;
  loading?: "lazy" | "eager";
}

/**
 * Resolve caminhos de imagens locais de forma resiliente tanto para dev server
 * quanto para GitHub Pages (/ e subcaminhos).
 */
function resolvePhotoPath(rawSrc?: string): string[] {
  if (!rawSrc) return [];
  if (rawSrc.startsWith("http://") || rawSrc.startsWith("https://") || rawSrc.startsWith("data:")) {
    return [rawSrc];
  }

  const clean = rawSrc.replace(/^\.?\//, ""); // remove leading ./ ou /
  const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";

  // Gera lista ordenada de tentativas para máxima resiliência
  const list: string[] = [];
  if (origin) {
    list.push(`${origin}/${clean}`);
  }
  // 1. Caminho absoluto raiz (funciona na raiz e no dev server)
  list.push(`/${clean}`);
  // 2. Caminho relativo com ../ para subdiretórios (/eleicoes/, /economia/, etc.)
  list.push(`../${clean}`);
  // 3. Caminho com BASE_URL se configurado
  if (base && base !== "." && base !== "./") {
    list.push(`${base}/${clean}`);
  }
  // 4. Caminho relativo local
  list.push(`./${clean}`);
  list.push(clean);
  // 5. Fallback canônico oficial para produção GitHub Pages
  list.push(`https://sociedadeativa.github.io/${clean}`);

  // Remove duplicatas mantendo ordem
  return Array.from(new Set(list));
}

/**
 * Componente oficial de exibição de fotografia autêntica de candidatos do TSE.
 * Diretrizes estritas:
 * - O número de urna NUNCA deve cobrir ou sobrepor o rosto do candidato.
 * - O container da imagem é estritamente dedicado ao retrato e separado da área de dados.
 * - Mantém dimensões e aspect ratio consistentes (aspect-[4/5] por padrão).
 * - Fallback neutro resiliente com iniciais institucionais caso a imagem não carregue.
 */
export const CandidateImage: React.FC<CandidateImageProps> = ({
  src,
  alt,
  candidateName,
  ballotNumber,
  partyColor = "#1D4ED8",
  className = "",
  aspectRatio = "portrait",
  size = "md",
  showAttributionBadge = false,
  attribution,
  loading = "lazy",
}) => {
  const candidateUrls = resolvePhotoPath(src);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentUrlIndex(0);
    setImageError(false);
    setIsLoaded(false);
  }, [src]);

  const handleImageError = () => {
    if (currentUrlIndex + 1 < candidateUrls.length) {
      // Tenta próximo caminho de fallback local
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      // Todos os caminhos falharam, ativa fallback neutro
      setImageError(true);
    }
  };

  // Iniciais do candidato para o fallback neutro
  const initials = candidateName
    .split(" ")
    .filter((p) => p.length > 0 && !["de", "da", "do", "dos", "das", "e"].includes(p.toLowerCase()))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[4/5]",
    circle: "aspect-square rounded-full",
  }[aspectRatio];

  const sizeClasses = {
    sm: "w-10 h-12 text-xs",
    md: "w-20 h-24 text-sm",
    lg: "w-32 h-40 text-base",
    xl: "w-full h-full text-lg",
  }[size];

  // Se houver erro ou não houver src, renderiza o fallback neutro
  if (!src || imageError || candidateUrls.length === 0) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-700 overflow-hidden select-none transition-all ${aspectClasses} ${sizeClasses} ${className}`}
        style={{
          borderTopColor: partyColor,
          borderTopWidth: "3px",
        }}
        title={`Fotografia oficial de ${candidateName}`}
        aria-label={`Identificador neutro de ${candidateName}`}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-mono font-black text-xs shadow-2xs mb-1"
          style={{ backgroundColor: partyColor }}
        >
          {initials || <User className="w-3.5 h-3.5" />}
        </div>
        <span className="font-heading font-black text-[11px] tracking-wider text-slate-800">
          {initials || "CAND"}
        </span>
        <span className="text-[9px] text-slate-500 font-mono mt-0.5">
          {ballotNumber ? `nº ${ballotNumber}` : "TSE"}
        </span>
      </div>
    );
  }

  const activeSrc = candidateUrls[currentUrlIndex];

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs group ${aspectClasses} ${className}`}
    >
      {/* Skeleton suave enquanto carrega */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
          <User className="w-5 h-5 opacity-40" />
        </div>
      )}

      {/* Retrato autêntico do candidato (sem qualquer sobreposição de número sobre o rosto) */}
      <img
        ref={(el) => {
          if (el && el.complete && el.naturalWidth > 0 && !isLoaded) {
            setIsLoaded(true);
          }
        }}
        src={activeSrc}
        alt={alt}
        decoding="async"
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover object-top transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-90"
        }`}
      />

      {/* Indicador de atribuição de imagem oficial no hover (discreto no rodapé da imagem) */}
      {showAttributionBadge && attribution && isLoaded && (
        <div
          className="absolute bottom-1 right-1 text-[8px] text-white/90 font-mono tracking-tight opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 px-1 py-0.5 rounded pointer-events-none"
          title={attribution}
        >
          Foto Oficial
        </div>
      )}
    </div>
  );
};
