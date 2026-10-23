import { useApp } from "./useApp";

// Mahalliy server JSON faylni, Netlify esa doimiy Blobs omborini o‘qiydi.
export default function useTopics() {
  const { topics, error } = useApp();
  return { topics, error, loading: topics === null && !error };
}
