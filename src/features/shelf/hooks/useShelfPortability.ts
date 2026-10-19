import React from "react";
import { CatalogService } from "../../../services/catalog.service";
import { toast } from "../../../store/toastStore";

export function useShelfPortability(onImportSuccess: () => void) {
  const exportShelf = async () => {
    try {
      const data = await CatalogService.exportarEstante();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shiori-estante-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        "Estante completa exportada com sucesso em formato JSON!",
        "Portabilidade Garantida"
      );
    } catch (err: any) {
      toast.error(err, "Falha ao Exportar Estante");
    }
  };

  const importShelf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.itens || !Array.isArray(parsed.itens)) {
        toast.error(
          "Formato de arquivo inválido. O arquivo deve conter uma lista de itens.",
          "Erro na Importação"
        );
        return;
      }

      const res = await CatalogService.importarEstante({
        itens: parsed.itens,
        sobrescrever: false,
      });

      toast.success(
        res.mensagem || `${res.totalImportados} obras importadas com sucesso!`,
        "Estante Restaurada"
      );
      onImportSuccess();
    } catch (err: any) {
      toast.error(err, "Falha ao Importar Estante");
    } finally {
      e.target.value = "";
    }
  };

  return {
    exportShelf,
    importShelf,
  };
}
