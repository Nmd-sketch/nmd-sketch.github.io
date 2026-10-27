import { PROJECTS, type Project } from './projects'

export type SectionId = 'about' | 'work' | 'projects' | 'stack' | 'contact'

type Base = {
  id: SectionId
  label: string
  title: string
}

export type Section =
  | (Base & { kind: 'prose'; paragraphs: string[] })
  | (Base & {
    kind: 'entries'
    entries: { when: string; what: string; detail: string }[]
  })
  | (Base & {
    kind: 'projects'
    projects: readonly Project[]
  })
  | (Base & {
    kind: 'columns'
    groups: { name: string; items: string[] }[]
  })
  | (Base & {
    kind: 'rows'
    rows: { label: string; value: string }[]
  })

// Placeholder copy - edit freely, the window renders whatever is here.
export const SECTIONS: readonly Section[] = [
  {
    id: 'about',
    label: 'about',
    title: 'about',
    kind: 'prose',
    paragraphs: [
      'C and C++ developer. I work on systems software and tooling where memory layout, latency and throughput are part of the specification instead of a later optimization.',
      'Most of it rests on Boost - Asio for the network side, the containers and metaprogramming facilities everywhere else - plus profiling before opinions.',
      'I like programs that start fast, print what they are doing, and stay out of the way. This page included.',
    ],
  },
  {
    id: 'work',
    label: 'work',
    title: 'work',
    kind: 'entries',
    entries: [
      {
        when: '2024',
        what: 'Systems engineer',
        detail: 'C++20 services, allocator and cache tuning, build times measured in seconds. ' +
          'Profiling and latency work on a trading-adjacent stack',
      },
      {
        when: '2025',
        what: 'C++ developer',
        detail: 'Boost.Asio network services and optimization of a small graphics engine.',
      },
      {
        when: '2026',
        what: 'Tooling and CI',
        detail: 'CMake, cross-compilation and native build infrastructure for a mixed Windows/Linux codebase.',
      },
    ],
  },
  {
    id: 'projects',
    label: 'projects',
    title: 'projects',
    kind: 'projects',
    projects: PROJECTS,
  },
  {
    id: 'stack',
    label: 'stack',
    title: 'stack',
    kind: 'columns',
    groups: [
      { name: 'languages', items: ['C', 'C++ 17 / 20 / 23', 'CMake', 'Bash', 'TypeScript'] },
      { name: 'libraries', items: ['Boost (Asio, Container, Spirit)', 'STL', 'GLFW / OpenGL', 'WebAssembly'] },
      { name: 'tools', items: ['GCC / Clang', 'GDB / LLDB', 'perf / VTune', 'Git'] },
    ],
  },
  {
    id: 'contact',
    label: 'contact',
    title: 'contact',
    kind: 'rows',
    rows: [
      { label: 'email', value: 'loadingstandby@gmail.com' },
      { label: 'github', value: 'https://github.com/Nmd-sketch' },
      { label: 'where', value: 'remote' },
      { label: 'note', value: 'Thanks for reaching out!' },
    ],
  },
]
