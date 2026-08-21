import { describe, expect, it } from 'vitest'

import { dictionaries, en, zh } from '../src/client/locales.js'

describe('locales', () => {
  it('ships both shipped locales', () => {
    expect(Object.keys(dictionaries).sort()).toEqual(['en', 'zh'])
  })

  it('keeps the zh dictionary key-aligned with en', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('has no empty strings', () => {
    for (const dict of [en, zh]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value, `empty value for ${key}`).not.toBe('')
      }
    }
  })
})
