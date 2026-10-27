export type Project = {
  id: 'sniff' | 'cctxpack' | 'rproxy'
  name: string
  description: string
  stack: string[]
  url: string
}

export const PROJECTS: readonly Project[] = [
  {
    id: 'sniff',
    name: 'sniff',
    description:
      'A fast, fd-like file finder for Windows written in C++20. It walks the tree with the native Win32 directory API, runs every entry through a composed filter chain and parallelises the walk with work stealing. 209 unit and integration tests, clean /W4 /WX build.',
    stack: ['C++20', 'Win32 API', 'CMake', 'GoogleTest'],
    url: 'https://github.com/Nmd-sketch/sniff',
  },
  {
    id: 'cctxpack',
    name: 'cctxpack',
    description:
      'Packs a repository, directory or file set into a single token-budgeted bundle for LLM context. Deterministic byte-for-byte output, Markdown / XML / JSON / plain formats, git-aware diffs and glob selection, with zero runtime network dependencies.',
    stack: ['C', 'CMake', 'cJSON', 'Git', 'GitHub Actions'],
    url: 'https://github.com/Nmd-sketch/cctxpack',
  },
  {
    id: 'rproxy',
    name: 'rproxy',
    description:
      'An HTTP/1.1 reverse proxy in C++20 built on Boost.Beast and Boost.Asio, with TLS on both legs and upstream certificate verification. Hop-by-hop header stripping, X-Forwarded-* handling and strict framing guards.',
    stack: ['C++20', 'Boost.Beast', 'Boost.Asio', 'OpenSSL', 'toml++', 'CMake'],
    url: 'https://github.com/Nmd-sketch/Rproxy',
  },
]
