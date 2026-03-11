import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Onboarding.css';

const SLIDES = [
  {
    title: 'Capture anything.',
    subtitle: 'Snap a photo or use your voice, Snappy figures out what it is for you.',
    image: '/onboarding-1.png',
  },
  {
    title: 'Snappy sorts it out.',
    subtitle: 'It recognizes what you captured and sends it to the right place — events, contacts, receipts, reminders, and more.',
    image: '/onboarding-2.png',
  },
  {
    title: 'See your day at a glance.',
    subtitle: 'Get a smart daily summary based on your calendar and reminders, all in one place.',
    image: '/onboarding-3.png',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('next');
  const [animating, setAnimating] = useState(false);
  const [entered, setEntered] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const goTo = useCallback((index) => {
    if (animating || index === current || index < 0 || index >= SLIDES.length) return;
    setDirection(index > current ? 'next' : 'prev');
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 450);
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
  const isLast = current === SLIDES.length - 1;

  return (
    <div className={`onb ${entered ? 'onb--entered' : ''}`}>
      {/* Header */}
      <div className="onb__header">
        <div className="onb__logo">
          <img src="/logo.svg" alt="" width="28" height="28" />
        </div>
        <span className="onb__brand">Snappy</span>
      </div>

      {/* Swipeable area */}
      <div
        className="onb__body"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Illustration hero */}
        <div key={`illust-${current}`} className="onb__hero">
          <img
            className="onb__hero-img"
            src={slide.image}
            alt={slide.title}
            draggable={false}
          />
        </div>

        {/* Copy */}
        <div key={`copy-${current}`} className="onb__copy">
          <h1 className="onb__title">{slide.title}</h1>
          <p className="onb__subtitle">{slide.subtitle}</p>
        </div>
      </div>

      {/* Footer */}
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

        {/* CTA */}
        <button className="onb__cta" onClick={handleNext}>
          <span>{isLast ? 'Get Started' : 'Next'}</span>
          {!isLast && <ArrowRight size={18} strokeWidth={2} />}
        </button>

        {/* Skip */}
        <button className="onb__skip" onClick={finish}>
          Skip
        </button>
      </div>
    </div>
  );
}
