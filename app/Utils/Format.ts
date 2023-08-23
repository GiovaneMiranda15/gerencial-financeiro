// Função para remover acentos e converter para letras maiúsculas
export const formatString = (value: any): string | null => {
    if (!value || typeof value !== "string") return null;
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

// Função para remover caracteres não numéricos
export const formatNumber = (value: any): string | null => {
    if (!value || typeof value !== "string") return null;
    return value.replace(/\D/g, "");
};