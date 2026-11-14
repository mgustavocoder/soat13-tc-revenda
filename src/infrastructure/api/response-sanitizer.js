const stripResponseIds = (record) => {
  if (Array.isArray(record)) {
    return record.map(stripResponseIds)
  }

  if (record === null || record === undefined || typeof record !== 'object') {
    return record
  }

  const cleaned = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id' || key === 'veiculoId' || key === 'clienteId') continue
    cleaned[key] = stripResponseIds(value)
  }

  return cleaned
}

const stripResponseIdsFromCollection = (records = []) => {
  if (!Array.isArray(records)) {
    return records
  }

  return records.map(stripResponseIds)
}

export { stripResponseIds, stripResponseIdsFromCollection }
