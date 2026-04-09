import logoSvg from '../assets/tanzendes-t.svg'

export default function TektonikLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={logoSvg}
      alt="TEK TO NIK"
      width={size}
      height={size * (590 / 510)}
      style={{ objectFit: 'contain' }}
    />
  )
}
