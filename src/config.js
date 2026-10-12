const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const apiConfigurada = import.meta.env.VITE_API_URL?.trim()
const linkMarkdown = apiConfigurada?.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/)
const apiBase = linkMarkdown?.[1] || apiConfigurada || (isLocal ? 'http://localhost:3000' : 'https://site-el-shadday.onrender.com')

export const API_URL = apiBase.replace(/\/+$/, '')
