import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, Calendar } from 'lucide-react';
import './Onboarding.css';

const SLIDES = [
  {
    icon: Camera,
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.08)',
    title: 'Snap anything',
    subtitle: 'Point your camera at receipts, contacts, notes, or events — Snappy classifies and organizes them instantly with AI.',
  },
  {
    icon: Sparkles,
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.08)',
    title: 'Your calm daily briefing',
    subtitle: 'Each morning, get a personalized overview of your day — calendar events, reminders, and gentle nudges, all in one place.',
  },
  {
    icon: Calendar,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.08)',
    title: 'Everything in its place',
    subtitle: 'Photos become calendar events, contacts, or saved documents. Voice notes turn into reminders. Nothing gets lost.',
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

  const goTo = useCallback((index) => {
    if (animating || index === current) return;
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
      <div className="onb__content">
        <div
          key={current}
          className={`onb__slide onb__slide--${direction}`}
        >
          <div
            className="onb__icon-wrap"
            style={{ background: slide.bg }}
          >
            <SlideIcon size={32} color={slide.color} strokeWidth={1.5} />
          </div>
          <h1 className="onb__title">{slide.title}</h1>
          <p className="onb__subtitle">{slide.subtitle}</p>
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
