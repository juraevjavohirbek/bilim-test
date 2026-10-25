import schoolBackground from "../assets/school-background.png";

import { getSubjectTheme } from "../lib/subjectThemes";


// Bezaklar mavjud ikonlar kabi SVG: tiniq qoladi va tashqi saytdan yuklanmaydi.
export function SubjectArt({ theme, variant = 0 }) {
  const icons = [theme.icon, ...theme.extras];
  const primary = icons[variant % icons.length];
  const secondary = icons[(variant + 1) % icons.length];
  const tertiary = icons[(variant + 2) % icons.length];
  return <svg className="subject-backdrop-art" viewBox="0 0 480 620" fill="none" aria-hidden="true">
    <defs>
      <symbol id="school-book" viewBox="0 0 120 120">
        <path d="M60 32C43 19 23 21 9 27v70c18-6 34-5 51 6 17-11 33-12 51-6V27c-14-6-34-8-51 5Z" fill="#fff8df" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M60 33v68M21 43c10-3 18-1 27 4M21 56c10-3 18-1 27 4M21 69c10-3 18-1 27 4M73 47c10-5 18-7 26-4M73 60c10-5 18-7 26-4M73 73c10-5 18-7 26-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M83 27v29l7-6 7 5V25" fill="#e99a9c" />
      </symbol>
      <symbol id="school-pencil" viewBox="0 0 120 120">
        <g transform="rotate(28 60 60)"><path d="M45 25h30v65l-15 22-15-22Z" fill="#f6cd77" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><path d="M45 25V14a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v11" fill="#eaa0af" stroke="currentColor" strokeWidth="4" /><path d="m45 90 15 22 15-22" fill="#fff5da" stroke="currentColor" strokeWidth="3" /><path d="M60 35v48" stroke="currentColor" strokeWidth="3" /></g>
      </symbol>
      <symbol id="school-calculator" viewBox="0 0 120 120">
        <rect x="23" y="9" width="74" height="102" rx="14" fill="#d5c8f2" stroke="currentColor" strokeWidth="4" /><rect x="34" y="22" width="52" height="25" rx="5" fill="#fff9df" stroke="currentColor" strokeWidth="3" />
        {[42, 60, 78].map((x) => [63, 82, 99].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="currentColor" />))}
      </symbol>
      <symbol id="school-ruler" viewBox="0 0 120 120">
        <g transform="rotate(-30 60 60)"><rect x="9" y="39" width="102" height="42" rx="7" fill="#f8d789" stroke="currentColor" strokeWidth="4" />{[24, 38, 52, 66, 80, 94].map((x, i) => <path key={x} d={`M${x} 41v${i % 2 ? 13 : 22}`} stroke="currentColor" strokeWidth="3" />)}</g>
      </symbol>
      <symbol id="school-temple" viewBox="0 0 120 120">
        <path d="m9 42 51-29 51 29Z" fill="#f2c585" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><path d="M16 48h88M13 105h94M8 113h104" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        {[25, 51, 77].map((x) => <rect key={x} x={x} y="50" width="18" height="49" rx="3" fill="#fff1d1" stroke="currentColor" strokeWidth="3" />)}
        <circle cx="60" cy="32" r="5" fill="currentColor" />
      </symbol>
      <symbol id="school-scroll" viewBox="0 0 120 120">
        <path d="M24 20h72v80H24Z" fill="#fff0ca" stroke="currentColor" strokeWidth="4" /><path d="M24 20c-12 0-12-14 0-14h71c-10 0-10 14 0 14M95 100c12 0 12 14 0 14H24c10 0 10-14 0-14" fill="#f4ce8e" stroke="currentColor" strokeWidth="4" /><path d="M37 40h44M37 54h36M37 68h44M37 82h27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </symbol>
      <symbol id="school-globe" viewBox="0 0 120 120">
        <path d="M26 16A47 47 0 1 1 26 82M60 96v13M39 113h43" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><circle cx="59" cy="49" r="36" fill="#c2e4de" stroke="currentColor" strokeWidth="4" /><path d="m35 24 17 3 6 16-13 12 5 13-8 9-11-13-4-21ZM75 23l15 16-9 12-11-5-7-12ZM70 64l17-6 4 14-14 10Z" fill="#8fbd80" /><path d="M26 49h66M59 14c-19 22-19 48 0 70 19-22 19-48 0-70Z" stroke="currentColor" strokeWidth="2" />
      </symbol>
      <symbol id="school-compass" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" fill="#fff2cb" stroke="currentColor" strokeWidth="4" /><circle cx="60" cy="60" r="35" stroke="currentColor" strokeWidth="2" strokeDasharray="2 9" /><path d="m60 24 11 36-11 36-11-36Z" fill="#d99e93" stroke="currentColor" strokeWidth="3" /><path d="M60 25v70" stroke="currentColor" strokeWidth="2" />
      </symbol>
      <symbol id="school-leaf" viewBox="0 0 120 120">
        <path d="M20 98C-3 52 42 12 105 14c2 68-31 108-74 88" fill="#b9d9a3" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><path d="M15 113 88 31M44 81l-3-31M60 63l25 2M73 48l-1-18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </symbol>
      <symbol id="school-plant" viewBox="0 0 120 120">
        <path d="M60 83V27" stroke="currentColor" strokeWidth="4" /><path d="M59 56C24 59 17 39 18 25c29-2 43 8 41 31ZM61 40C60 17 80 9 101 13c-2 23-18 33-40 27ZM61 72c0-24 18-32 36-29 0 23-14 33-36 29Z" fill="#b7d59b" stroke="currentColor" strokeWidth="3" /><path d="m32 82 8 31h40l8-31Z" fill="#e7b296" stroke="currentColor" strokeWidth="4" /><rect x="28" y="78" width="64" height="10" rx="4" fill="#f5cdb0" stroke="currentColor" strokeWidth="3" />
      </symbol>
      <symbol id="school-computer" viewBox="0 0 120 120">
        <rect x="11" y="14" width="98" height="70" rx="10" fill="#c1d9e8" stroke="currentColor" strokeWidth="4" /><rect x="20" y="23" width="80" height="49" rx="4" fill="#fff8e3" /><path d="m45 36-14 12 14 12M76 36l14 12-14 12M65 32l-9 32M60 84v20M37 110h46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
      <symbol id="school-atom" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="9" fill="#e9b16f" /><g stroke="currentColor" strokeWidth="3"><ellipse cx="60" cy="60" rx="50" ry="19" /><ellipse cx="60" cy="60" rx="50" ry="19" transform="rotate(60 60 60)" /><ellipse cx="60" cy="60" rx="50" ry="19" transform="rotate(120 60 60)" /></g><circle cx="18" cy="50" r="6" fill="#b5cedf" /><circle cx="83" cy="19" r="6" fill="#d5b9e8" /><circle cx="81" cy="99" r="6" fill="#e6a4ab" />
      </symbol>
      <symbol id="school-flask" viewBox="0 0 120 120">
        <path d="M44 10h32M48 10v39l-30 48a10 10 0 0 0 8 15h68a10 10 0 0 0 8-15L72 49V10" fill="#eef9f0" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><path d="m38 73-16 26a6 6 0 0 0 5 9h66a6 6 0 0 0 5-9L82 73c-19 10-29-9-44 0Z" fill="#a0d4c1" /><circle cx="55" cy="92" r="5" fill="#fff8df" /><circle cx="75" cy="97" r="3" fill="#fff8df" /><circle cx="61" cy="67" r="4" fill="#b3d9ca" />
      </symbol>
    </defs>
    <ellipse cx="272" cy="383" rx="177" ry="188" fill="currentColor" opacity=".07" />
    <path d="M51 493c-37-72 7-126 44-151M369 178c42-8 69 25 65 60M101 160l23-19M403 505l20 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".22" />
    <g opacity=".8" transform="rotate(-9 270 380)"><use href={`#school-${primary}`} x="113" y="240" width="290" height="290" /></g>
    <g opacity=".55" transform="rotate(15 96 220)"><use href={`#school-${secondary}`} x="28" y="135" width="120" height="120" /></g>
    <g opacity=".55" transform="rotate(14 360 100)"><use href={`#school-${tertiary}`} x="292" y="37" width="120" height="120" /></g>
    {theme.marks.map((mark, index) => <text key={index} x={[185, 365, 80][index]} y={[108, 225, 569][index]} fill="currentColor" opacity=".5" fontFamily="Trebuchet MS, sans-serif" fontSize={[40, 27, 30][index]} fontWeight="700" transform={`rotate(${[-8, 9, -12][index]} ${[185, 365, 80][index]} ${[108, 225, 569][index]})`}>{mark}</text>)}
    {[[43, 92], [420, 309], [184, 582], [336, 555]].map(([x, y]) => <path key={x} d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`} stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".3" />)}
  </svg>;
}

export default function LearningBackdrop({ subject }) {
  const theme = subject ? getSubjectTheme(subject) : null;
  return <div className={`learning-backdrop ${theme ? "learning-backdrop-subject" : "learning-backdrop-catalog"}`}
    data-theme={theme?.key ?? "school"} aria-hidden="true"
    style={theme ? { "--subject-ink": theme.color, "--subject-paper": theme.paper } : { "--school-wallpaper": `url("${schoolBackground}")` }}>
    {theme && <><div className="subject-paper-pattern" /><SubjectArt theme={theme} /></>}
  </div>;
}
