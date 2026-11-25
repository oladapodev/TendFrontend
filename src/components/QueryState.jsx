import Icon from './Icon.jsx'

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="qs qs-loading" role="status">
      <span className="qs-spin" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBox({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div className="qs qs-error" role="alert">
      <Icon name="alert" size={22} />
      <div>
        <strong>{title}</strong>
        <p>{error?.message || 'Something went wrong.'}</p>
      </div>
      {onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  )
}

// Renders loading / error for a query, otherwise children(data).
export default function QueryState({ query, children, loadingLabel, errorTitle }) {
  if (query.isPending) return <Spinner label={loadingLabel} />
  if (query.isError) return <ErrorBox error={query.error} onRetry={() => query.refetch()} title={errorTitle} />
  return children(query.data)
}
