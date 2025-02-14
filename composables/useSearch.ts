import { useDebounce } from '@vueuse/core'
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { SearchResult } from '~/types/notebook'

export function useSearch() {
  const search: Ref<string | null> = ref(null)

  const debounced = useDebounce(search, 300)

  const {
    data: results,
    error,
    status,
    refresh,
    clear
  } = useFetch<SearchResult[]>('/api/search', {
    immediate: false,
    lazy: true,
    query: { q: debounced },
    watch: false,
    transform: (searchRes) => {
      return searchRes.map((res) => {
        return {
          ...res,
          snippet: stripMD(res.snippet)
        }
      })
    }
  })

  watch(debounced, () => {
    if (debounced.value && debounced.value?.length > 0) {
      refresh()
    } else {
      clear()
    }
  })

  const noResults = computed(() => status.value === 'success' && (results.value?.length === 0 || !results.value))

  const clearSearch = () => {
    search.value = null
    clear()
  }

  const stripMD = (markdown: string): string => {
    return (
      markdown
        // Decode HTML entities (e.g., &#x20; -> space)
        .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
        .replace(/&nbsp;/g, ' ') // Handle non-breaking spaces separately
        // Remove HTML tags
        .replace(/<[^>]+(>|$)/g, '')
        // Remove headings
        .replace(/^#{1,6}\s*/gm, '')
        // Remove bold & italic (**, __, *, _)
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove inline code (`code`)
        .replace(/`([^`]+)`/g, '$1')
        // Remove code blocks (triple backticks)
        .replace(/```[\s\S]*?```/g, '')
        // Remove blockquotes
        .replace(/^>\s?/gm, '')
        // Remove strikethroughs
        .replace(/~~(.*?)~~/g, '$1')
        // Remove links but keep text [text](url)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove images ![alt](url)
        .replace(/!\[.*?\]\(.*?\)/g, '')
        // Remove unordered lists (-, *, +)
        .replace(/^\s*[-*+]\s+/gm, '')
        // Remove ordered lists (numbers)
        .replace(/^\s*\d+\.\s+/gm, '')
        // Remove horizontal rules (---, ***)
        .replace(/^\s*(-{3,}|\*{3,})\s*$/gm, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
    )
  }

  return {
    search,
    clearSearch,
    stripMD,
    error,
    status,
    results,
    clear,
    noResults,
    debounced
  }
}
