interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      {description && <p className="text-slate-600 mt-1">{description}</p>}
    </div>
  )
}
