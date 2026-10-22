import React from "react";
import { X, ShieldCheck, Scale, BookOpen, CheckCircle2 } from "lucide-react";
import { ElectionDataSet } from "../data/electionData";

interface MethodologyModalProps {
  dataset: ElectionDataSet;
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  dataset,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar modal de metodologia eleitoral"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-stone-700 mb-3">
          <ShieldCheck className="w-6 h-6 text-emerald-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Metodologia & Transparência Eleitoral
          </span>
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
          Eleição Presidencial 2026 — 1º Turno
        </h3>
        <p className="font-serif italic text-stone-600 text-sm mb-4">
          Lula vs. Flávio Bolsonaro — Dados Oficiais do TSE (04 de Outubro de 2026)
        </p>

        <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed max-h-[65vh] overflow-y-auto pr-2">
          {/* Section 1 */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-serif font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-stone-700" />
              1. Cálculo Constitucional sobre Votos Válidos
            </h4>
            <p>
              Em estrita consonância com o <strong>Art. 77, § 2º da Constituição Federal de 1988</strong> e as resoluções vigentes do Tribunal Superior Eleitoral (TSE), todas as porcentagens de votação nominal dos candidatos a Presidente da República apresentadas nesta visualização são calculadas <strong>exclusivamente sobre os votos válidos</strong> (119.297.583 votos nominais).
            </p>
            <p className="mt-2 text-stone-500 italic text-xs">
              “Será considerado eleito o candidato que obtiver a maioria absoluta de votos, não computados os em branco e os nulos.” (Art. 77, § 2º, CF/88)
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
            <h4 className="font-serif font-bold text-blue-950 text-sm mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              2. Candidatos que Avançaram ao Segundo Turno
            </h4>
            <p className="text-stone-700">
              Conforme os resultados oficiais do TSE apurados no 1º turno:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-stone-800 font-medium">
              <li>
                <strong>Flávio Bolsonaro (PL, nº 22):</strong> 56.104.268 votos — 47,03%
              </li>
              <li>
                <strong>Lula (PT, nº 13):</strong> 53.876.617 votos — 45,16%
              </li>
              <li>
                <strong>Demais Candidatos somados:</strong> 9.316.698 votos — 7,81%
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h4 className="font-serif font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-700" />
              3. Votos em Branco, Nulos e Comparecimento
            </h4>
            <p>
              Na totalização oficial de 100% das urnas eletrônicas brasileiras foram registrados:
            </p>
            <ul className="list-disc list-inside mt-1.5 space-y-1 text-xs text-stone-700">
              <li><strong>Votos em Branco:</strong> 2.300.781 (1,84% do comparecimento)</li>
              <li><strong>Votos Nulos:</strong> 3.674.149 (2,93% do comparecimento)</li>
              <li><strong>Total de Votos Válidos:</strong> 119.297.583 (95,23% do comparecimento)</li>
              <li><strong>Total de Comparecimento:</strong> 125.272.513 eleitores (80,07% do eleitorado)</li>
              <li><strong>Abstenção Nacional:</strong> 31.181.498 eleitores (19,93% do eleitorado)</li>
              <li><strong>Eleitorado Total:</strong> 156.454.011 eleitores aptos no TSE</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="p-4 bg-stone-100/80 rounded-xl text-stone-700">
            <h4 className="font-serif font-bold text-stone-900 text-sm mb-1">
              4. Fonte Primária dos Dados
            </h4>
            <p className="text-xs">
              <strong>Fonte Oficial:</strong> Tribunal Superior Eleitoral (TSE) — Totalização de Resultados Eleitorais de 2026.
              Eleição realizada em <strong>04 de outubro de 2026</strong>.
            </p>
            <p className="text-xs mt-2 text-stone-500">
              <strong>Publicação:</strong> Sociedade Ativa · Portal de Jornalismo de Dados e Informações Públicas do Brasil.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
