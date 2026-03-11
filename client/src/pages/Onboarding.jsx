import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, FolderOpen } from 'lucide-react';
import './Onboarding.css';

const SLIDES = [
  {
    icon: Camera,
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.08)',
    title: 'Snap it, sorted',
    subtitle: 'Take a photo of anything — a receipt, a flyer, a business card — and AI files it for you in seconds.',
    hint: 'Receipts, contacts, events, notes & more',
  },
  {
    icon: Sparkles,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    title: 'Start every day clear',
    subtitle: 'A quiet daily briefing that connects your calendar, reminders, and notes into one calm overview.',
    hint: 'Calendar + reminders + smart nudges',
  },
  {
    icon: FolderOpen,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.08)',
    title: 'Nothing gets lost',
    subtitle: 'Every snap is searchable in your library. Voice notes become reminders. Events land in your calendar.',
    hint: 'Library, voice capture & calendar sync',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('next');
  const [animating, setAnimating] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const touchStart = useRef(null);

  const goTo = useCallback((index) => {
    if (animating || index === current || index < 0 || index >= SLIDES.length) return;
    setDirection(index > current ? 'next' : 'prev');
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 400);
  }, [animating, current]);

  function handleNext() {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem('snappy_onboarded', 'true');
    navigate('/welcome', { replace: true });
  }

  function onTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) goTo(current + 1);
    else goTo(current - 1);
  }

  const slide = SLIDES[current];
  const SlideIcon = slide.icon;
  const isLast = current === SLIDES.length - 1;

  return (
    <div className={`onb ${entered ? 'onb--entered' : ''}`}>
      {/* Skip button */}
      <button className="onb__skip" onClick={finish}>
        Skip
      </button>

      {/* Slide content */}
      <div
        className="onb__content"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={current}
          className={`onb__slide onb__slide--${direction}`}
        >
          <div
            className="onb__icon-wrap"
            style={{ background: slide.bg }}
          >
            <SlideIcon size={28} color={slide.color} strokeWidth={1.5} />
          </div>
          <h1 className="onb__title">{slide.title}</h1>
          <p className="onb__subtitle">{slide.subtitle}</p>
          <span className="onb__hint">{slide.hint}</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="onb__footer">
        {/* Dots */}
        <div className="onb__dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`onb__dot ${i === current ? 'onb__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA button */}
        <button className="onb__cta" onClick={handleNext}>
          {isLast ? 'Get Started' : 'Continue'}
        </button>
      </div>

      {/* Background blobs */}
      <div className="onb__bg" aria-hidden="true">
        <div className="onb__blob onb__blob--1" />
        <div className="onb__blob onb__blob--2" />
      </div>
    </div>
  );
}
