// TanStack Query hooks: the only place screens get or change server data.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/index.js'

export const keys = {
  me: ['me'],
  contacts: ['contacts'],
  places: ['places'],
  facilities: (lat, lng) => ['facilities', lat?.toFixed(3), lng?.toFixed(3)],
}

export function useMe(options) {
  return useQuery({ queryKey: keys.me, queryFn: api.me.get, staleTime: 60_000, ...options })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.me.patch,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: keys.me })
      const prev = qc.getQueryData(keys.me)
      if (prev) qc.setQueryData(keys.me, merge(prev, patch))
      return { prev }
    },
    onError: (_e, _p, ctx) => ctx?.prev && qc.setQueryData(keys.me, ctx.prev),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  })
}

function merge(a, b) {
  const out = { ...a }
  for (const k of Object.keys(b)) {
    out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' ? merge(a[k], b[k]) : b[k]
  }
  return out
}

export function useContacts() {
  return useQuery({ queryKey: keys.contacts, queryFn: api.contacts.list })
}

export function useSaveContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (c) => (c.id ? api.contacts.update(c.id, c) : api.contacts.create(c)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.contacts }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.contacts.remove,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.contacts })
      const prev = qc.getQueryData(keys.contacts)
      qc.setQueryData(keys.contacts, (l = []) => l.filter((c) => c.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(keys.contacts, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.contacts }),
  })
}

export function usePlaces() {
  return useQuery({ queryKey: keys.places, queryFn: api.places.list })
}

export function useAddPlace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.places.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.places }),
  })
}

export function useFacilities(coords) {
  return useQuery({
    queryKey: keys.facilities(coords?.lat, coords?.lng),
    queryFn: () => api.facilities.near(coords),
    enabled: !!coords,
    staleTime: 5 * 60_000,
  })
}

export function useReports() {
  return useQuery({ queryKey: ['reports'], queryFn: api.reports.list })
}

// Insights depend on the saved reports, so they refetch whenever the report list changes.
export function useReportInsights(enabled) {
  const reports = useReports()
  return useQuery({
    queryKey: ['report-insights', reports.data?.map((r) => r.id).join(',')],
    queryFn: api.reports.insights,
    enabled: enabled && !!reports.data?.length,
    staleTime: 5 * 60_000,
  })
}

export function useExtractReport() {
  return useMutation({ mutationFn: api.reports.extract })
}

export function useSaveReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.reports.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useDeleteReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.reports.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useLoadSampleReports() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.reports.loadSamples(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

// NAFDAC Greenbook (registered drugs)
export function useDrugSearch(q) {
  const term = q.trim()
  return useQuery({
    queryKey: ['drugs', term.toLowerCase()],
    queryFn: ({ signal }) => api.drugs.search(term, { signal }),
    enabled: term.length >= 2,
    staleTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useVerifyDrug() {
  return useMutation({ mutationFn: api.drugs.verify })
}

export function useAnalyseDiet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.diet.analyse,
    onSuccess: (result, meals) => qc.setQueryData(keys.me, (me) => (me ? { ...me, meals, dietResult: result } : me)),
  })
}
