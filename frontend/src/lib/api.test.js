import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createStorage = () => {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

describe('api client', () => {
  beforeEach(() => {
    const storage = createStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubEnv('VITE_API_URL', '')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('uses /api as default base URL', async () => {
    const { default: api } = await import('./api')
    expect(api.defaults.baseURL).toBe('/api')
  })

  it('adds Authorization header when token exists', async () => {
    localStorage.setItem('token', 'crm-token')

    const { default: api } = await import('./api')
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled
    const config = requestInterceptor({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer crm-token')
  })
})
