export default function Status({ children, tone = 'neutral' }) {
  return <div className={`status status-${tone}`}>{children}</div>
}
