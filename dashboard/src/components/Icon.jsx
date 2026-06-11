/* Set icone line 24×24 del design system — stroke currentColor 1.6 */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" {...P} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...P} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...P} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...P} /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.4.6L11.8 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" {...P} />,
  receipt: <><path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" {...P} /><path d="M9 8h6M9 12h6" {...P} /></>,
  network: <><circle cx="12" cy="5" r="2.2" {...P} /><circle cx="5" cy="18" r="2.2" {...P} /><circle cx="19" cy="18" r="2.2" {...P} /><path d="M12 7.2v4.3M10.4 13.4 6.6 16.2M13.6 13.4l3.8 2.8" {...P} /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" {...P} /><circle cx="16" cy="7" r="2.2" {...P} /><circle cx="8" cy="17" r="2.2" {...P} /></>,
  wallet: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5" {...P} /><path d="M3 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" {...P} /><path d="M21 11v3h-4a1.5 1.5 0 0 1 0-3h4Z" {...P} /></>,
  trend: <><path d="M4 15l4.5-4.5 3 3L20 6" {...P} /><path d="M20 11V6h-5" {...P} /></>,
  spark: <path d="M12 3l1.9 5.6L19.5 10l-4.6 3.4L16 19l-4-3.2L8 19l1.1-5.6L4.5 10l5.6-1.4L12 3Z" {...P} />,
  card: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...P} /><path d="M3 9.5h18M7 15h3" {...P} /></>,
  coin: <><ellipse cx="12" cy="7" rx="7" ry="3" {...P} /><path d="M5 7v6c0 1.7 3.1 3 7 3s7-1.3 7-3V7" {...P} /><path d="M5 11c0 1.7 3.1 3 7 3s7-1.3 7-3" {...P} /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" {...P} /><path d="M3.5 9.5h17M8 3v3M16 3v3" {...P} /></>,
  divide: <><path d="M5 12h14" {...P} /><circle cx="12" cy="7" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" /></>,
  alert: <><path d="M12 4.5 21 19.5H3L12 4.5Z" {...P} /><path d="M12 10v4" {...P} /><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" /></>,
  bars: <path d="M4 20V10M9.3 20V4M14.6 20v-8M20 20v-5" {...P} />,
  history: <><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v3h3" {...P} /><path d="M12 8v4l3 2" {...P} /></>,
  layers: <><path d="M12 3 3 8l9 5 9-5-9-5Z" {...P} /><path d="m3 13 9 5 9-5M3 8v.01" {...P} /></>,
  flow: <path d="M4 18c4 0 4-12 8-12s4 12 8 12" {...P} />,
  plus: <path d="M12 5v14M5 12h14" {...P} />,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" {...P} /><path d="M10 19a2 2 0 0 0 4 0" {...P} /></>,
  search: <><circle cx="11" cy="11" r="6.5" {...P} /><path d="m16 16 4 4" {...P} /></>,
  download: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" {...P} /><path d="M5 19h14" {...P} /></>,
  upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" {...P} /><path d="M5 19h14" {...P} /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" {...P} />,
  star: <path d="M12 4l2.2 5.1 5.5.5-4.2 3.6 1.3 5.4L12 16.5 7.2 18.6l1.3-5.4L4.3 9.6l5.5-.5L12 4Z" {...P} />,
  check: <path d="M5 12.5 10 17l9-10" {...P} />,
  clock: <><circle cx="12" cy="12" r="8" {...P} /><path d="M12 7.5V12l3 2" {...P} /></>,
  shield: <><path d="M12 3.5 19 6v5c0 4.5-3 7.6-7 9.5-4-1.9-7-5-7-9.5V6l7-2.5Z" {...P} /><path d="m9 12 2 2 4-4" {...P} /></>,
  pie: <><path d="M12 4a8 8 0 1 0 8 8h-8V4Z" {...P} /><path d="M14 4.5A8 8 0 0 1 19.5 10H14V4.5Z" {...P} /></>,
  dots: <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" {...P} />,
  target: <><circle cx="12" cy="12" r="8" {...P} /><circle cx="12" cy="12" r="4" {...P} /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" {...P} />,
  edit: <><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" {...P} /><path d="m14 7 3 3" {...P} /></>,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...P} /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" {...P} /></>,
};

export default function Icon({ name, size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {PATHS[name] || null}
    </svg>
  );
}
