import assert from 'node:assert/strict'
import { test } from 'node:test'
import config from '../vite.config.js'

function pagesConfig(apiUrl, basePath = '/simts/') {
  const previous = { ...process.env }
  process.env.GITHUB_PAGES = 'true'
  process.env.PAGES_BASE_PATH = basePath
  if (apiUrl === undefined) {
    delete process.env.VITE_API_URL
  } else {
    process.env.VITE_API_URL = apiUrl
  }
  try {
    return config({ mode: 'production' })
  } finally {
    for (const key of ['GITHUB_PAGES', 'PAGES_BASE_PATH', 'VITE_API_URL']) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
}

test('Pages uses the repository base path and preserves local API proxy', () => {
  const result = pagesConfig('https://simts.onrender.com')
  assert.equal(result.base, '/simts/')
  assert.equal(result.server.proxy['/api'].target, 'http://localhost:8000')
})

test('Pages supports a user or organization site at the domain root', () => {
  assert.equal(pagesConfig('https://simts.onrender.com', '/').base, '/')
})

test('Pages rejects a missing, insecure or malformed backend URL', () => {
  for (const apiUrl of [
    undefined, '', '/api', 'not-a-url', 'http://localhost:8000',
    'https://user:password@example.com', 'https://example.com?key=value',
    'https://example.com#fragment',
  ]) {
    assert.throws(() => pagesConfig(apiUrl), /VITE_API_URL/)
  }
})
