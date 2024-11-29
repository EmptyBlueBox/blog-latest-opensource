type Options = {
  includeImageAlt?: boolean
  includeHtml?: boolean
}

export default function toString(value: unknown, options?: Options): string {
  const { includeImageAlt = true, includeHtml = true } = options || {}
  return serialize(value, includeImageAlt, includeHtml)
}

function serialize(value: unknown, includeImageAlt: boolean, includeHtml: boolean): string {
  if (isNode(value)) {
    if ('value' in value) {
      return value.type === 'html' && !includeHtml ? '' : value.value
    }

    if (includeImageAlt && 'alt' in value && value.alt) {
      return value.alt
    }

    if ('children' in value) {
      return serializeAll(value.children, includeImageAlt, includeHtml)
    }
  }

  if (Array.isArray(value)) {
    return serializeAll(value, includeImageAlt, includeHtml)
  }

  return ''
}

function serializeAll(values: unknown[], includeImageAlt: boolean, includeHtml: boolean): string {
  return values.map((value) => serialize(value, includeImageAlt, includeHtml)).join('')
}

function isNode(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object')
}