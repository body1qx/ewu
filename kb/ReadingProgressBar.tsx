import { useState, useEffect } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-50">
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary-glow transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
