import { useState, ReactNode } from 'react'
import { IconChevron } from './Icons'

interface Props {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export default function Section({ title, icon, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`section ${open ? 'section--open' : 'section--closed'}`}>
      <button className="section-header" onClick={() => setOpen(!open)}>
        <div className="section-header-left">
          {icon && <span className="section-icon">{icon}</span>}
          <span className="section-label">{title}</span>
        </div>
        <IconChevron open={open} />
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  )
}
