import { useMutation } from "@tanstack/react-query";
import { getApiLabData } from "./api";

// Fora do queries.js de propósito: ele vai no bundle de entrada, e o useMutation (~3 kB)
// só é usado aqui. Neste arquivo ele carrega junto com a página do API Lab, sob demanda.
export const useApiLab = (onSuccess) =>
  useMutation({
    mutationFn: getApiLabData,
    onSuccess,
    retry: false,
    gcTime: 0,
  });
