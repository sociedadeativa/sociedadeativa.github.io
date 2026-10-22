import React, { useState } from "react";
import { X, Copy, Check, Download, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { ElectionDataSet } from "../data/electionData";

interface DataInspectorModalProps {
  dataset: ElectionDataSet;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDataset: (customDataset: ElectionDataSet) => void;
  onResetToDefault: () => void;
}

export const DataInspectorModal: React.FC<DataInspectorModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onUpdateDataset,
  onResetToDefault,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(dataset, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tse_apuracao_presidencial_2026.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartEdit = () => {
    setJsonText(jsonString);
    setIsEditing(true);
    setErrorMessage(null);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.candidates || !parsed.states || Object.keys(parsed.states).length === 0) {
        throw new Error("O arquivo JSON precisa conter as propriedades 'candidates' e 'states' com as 27 Unidades da Federação.");
      }
      onUpdateDataset(parsed as ElectionDataSet);
      setIsEditing(false);
      setErrorMessage(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Erro na validação do JSON: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.candidates || !parsed.states) {
          throw new Error("Formato não compatível com o esquema eleitoral oficial do TSE.");
        }
        onUpdateDataset(parsed as ElectionDataSet);
        onClose();
      } catch (err: any) {
        setErrorMessage(`Falha ao ler arquivo: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar modal de inspeção de dados"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Transparência & Dados Oficiais
          </span>
        </div>

        <h3 className="font-heading text-2xl font-black text-slate-900 mb-1.5">
          Estrutura Oficial de Dados do TSE (JSON)
        </h3>
        <p className="text-xs text-slate-600 mb-4 max-w-2xl leading-relaxed">
          Os dados eleitorais oficiais de 2026 estão desacoplados dos componentes de visualização gráfica. Você pode inspecionar, copiar, exportar ou injetar novos conjuntos de dados formatados pelo TSE.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Barra de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiado!" : "Copiar JSON"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo</span>
            </button>

            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar .json</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                aria-label="Importar arquivo JSON de dados eleitorais"
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Editar / Colar JSON
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveJson}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Salvar e Atualizar Mapa
                </button>
              </>
            )}

            <button
              onClick={onResetToDefault}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Restaurar base original de 2026"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Caixa de Código */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 h-96 overflow-y-auto">
          {isEditing ? (
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              aria-label="Editor de código JSON dos dados eleitorais"
              className="w-full h-full bg-transparent text-emerald-400 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <pre className="text-slate-300 whitespace-pre leading-relaxed">
              {jsonString}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
