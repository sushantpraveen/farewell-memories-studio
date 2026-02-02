import React, { useEffect, useState } from 'react';

const hexagonSvgModules = import.meta.glob<string>('./hexagon/*.svg', { as: 'raw' });

interface HexagonSvgViewerProps {
  path: string;
}

export const HexagonSvgViewer: React.FC<HexagonSvgViewerProps> = ({ path }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resolve path - glob keys may be ./hexagon/15.svg or include full path
    const key = path in hexagonSvgModules
      ? path
      : Object.keys(hexagonSvgModules).find((k) => k.endsWith(path) || k.includes(path));
    const loader = key ? hexagonSvgModules[key as keyof typeof hexagonSvgModules] : undefined;
    if (typeof loader !== 'function') {
      setError('Template not found');
      setLoading(false);
      return;
    }
    (loader as () => Promise<string>)()
      .then((svg) => {
        setContent(svg);
        setError(null);
      })
      .catch((err) => {
        setError('Failed to load');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full aspect-[595/936] max-h-[560px] min-h-[280px] bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex items-center justify-center w-full aspect-[595/936] max-h-[560px] min-h-[280px] bg-muted/30 rounded-xl">
        <p className="text-sm text-destructive">{error || 'No content'}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[280px] [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-h-[min(80vh,560px)] [&_svg]:min-h-[280px] rounded-lg overflow-hidden border border-gray-200 bg-white">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default HexagonSvgViewer;
