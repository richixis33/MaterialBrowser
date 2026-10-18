// Material You (Material 3) Dynamic Color Extraction & Theming Engine
const ThemeEngine = (() => {

  // Preset Wallpapers (High fidelity SVG/CSS gradient abstracts)
  const PRESET_WALLPAPERS = [
    {
      id: 'cosmic-violet',
      name: 'Cosmic Violet',
      baseColor: '#7F52FF',
      gradient: 'radial-gradient(circle at 20% 20%, #4F378B 0%, #1D192B 60%, #0F0D16 100%)'
    },
    {
      id: 'aurora-emerald',
      name: 'Aurora Emerald',
      baseColor: '#00A876',
      gradient: 'radial-gradient(circle at 80% 20%, #00513B 0%, #0A241C 55%, #05120E 100%)'
    },
    {
      id: 'sunset-amber',
      name: 'Sunset Amber',
      baseColor: '#E65100',
      gradient: 'radial-gradient(circle at 30% 70%, #7A3300 0%, #2A1405 60%, #150A02 100%)'
    },
    {
      id: 'deep-ocean',
      name: 'Deep Ocean',
      baseColor: '#0066FF',
      gradient: 'radial-gradient(circle at 70% 80%, #003682 0%, #061B3B 55%, #030C1C 100%)'
    },
    {
      id: 'cyber-rose',
      name: 'Cyber Rose',
      baseColor: '#D81B60',
      gradient: 'radial-gradient(circle at 50% 30%, #68002E 0%, #260A17 60%, #14030B 100%)'
    }
  ];

  // Helper: Convert RGB to HSL
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  // Helper: Convert HEX to HSL
  function hexToHsl(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return rgbToHsl(r, g, b);
  }

  // Extract Dominant Hue & Saturation from Image
  function extractDominantColor(imgElement) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 48;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(imgElement, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        const colorBuckets = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Skip transparency

          const hsl = rgbToHsl(r, g, b);

          // Filter out near black, near white, and washed out grays
          if (hsl.l < 10 || hsl.l > 92 || hsl.s < 12) continue;

          // Quantize hue into 24 bins
          const hueBin = Math.floor(hsl.h / 15) * 15;
          if (!colorBuckets[hueBin]) {
            colorBuckets[hueBin] = { count: 0, r: 0, g: 0, b: 0, sSum: 0 };
          }
          colorBuckets[hueBin].count++;
          colorBuckets[hueBin].r += r;
          colorBuckets[hueBin].g += g;
          colorBuckets[hueBin].b += b;
          colorBuckets[hueBin].sSum += hsl.s;

          totalR += r; totalG += g; totalB += b; count++;
        }

        // Find bucket with highest score (weight = count * average saturation)
        let bestBin = null;
        let highestScore = -1;

        Object.keys(colorBuckets).forEach(bin => {
          const b = colorBuckets[bin];
          const avgS = b.sSum / b.count;
          const score = b.count * (avgS * 1.5);
          if (score > highestScore) {
            highestScore = score;
            bestBin = b;
          }
        });

        if (bestBin && bestBin.count > 0) {
          const r = Math.round(bestBin.r / bestBin.count);
          const g = Math.round(bestBin.g / bestBin.count);
          const b = Math.round(bestBin.b / bestBin.count);
          resolve(rgbToHsl(r, g, b));
        } else if (count > 0) {
          resolve(rgbToHsl(Math.round(totalR / count), Math.round(totalG / count), Math.round(totalB / count)));
        } else {
          // Fallback to vibrant Material purple
          resolve({ h: 265, s: 75, l: 60 });
        }
      } catch (err) {
        console.warn('Color extraction failed, using fallback:', err);
        resolve({ h: 265, s: 75, l: 60 });
      }
    });
  }

  // Generate Material 3 Tonal Palette from HSL
  function generateM3Palette(hsl, isDark = true) {
    const h = hsl.h;
    const s = Math.max(35, Math.min(hsl.s, 90)); // Normalize saturation

    if (isDark) {
      return {
        primary: `hsl(${h}, ${Math.round(s * 0.95)}%, 78%)`,
        onPrimary: `hsl(${h}, ${s}%, 18%)`,
        primaryContainer: `hsl(${h}, ${Math.round(s * 0.75)}%, 30%)`,
        onPrimaryContainer: `hsl(${h}, ${s}%, 90%)`,

        surface: `hsl(${h}, ${Math.round(s * 0.22)}%, 8%)`,
        surfaceDim: `hsl(${h}, ${Math.round(s * 0.22)}%, 7%)`,
        surfaceContainerLowest: `hsl(${h}, ${Math.round(s * 0.22)}%, 5%)`,
        surfaceContainerLow: `hsl(${h}, ${Math.round(s * 0.20)}%, 11%)`,
        surfaceContainer: `hsl(${h}, ${Math.round(s * 0.20)}%, 14%)`,
        surfaceContainerHigh: `hsl(${h}, ${Math.round(s * 0.20)}%, 18%)`,
        surfaceContainerHighest: `hsl(${h}, ${Math.round(s * 0.22)}%, 23%)`,

        onSurface: `hsl(${h}, ${Math.round(s * 0.15)}%, 92%)`,
        onSurfaceVariant: `hsl(${h}, ${Math.round(s * 0.18)}%, 78%)`,
        outline: `hsl(${h}, ${Math.round(s * 0.18)}%, 52%)`,
        outlineVariant: `hsl(${h}, ${Math.round(s * 0.18)}%, 28%)`,
        glow: `hsla(${h}, ${s}%, 70%, 0.35)`
      };
    } else {
      return {
        primary: `hsl(${h}, ${Math.round(s * 0.95)}%, 38%)`,
        onPrimary: `#FFFFFF`,
        primaryContainer: `hsl(${h}, ${Math.round(s * 0.75)}%, 88%)`,
        onPrimaryContainer: `hsl(${h}, ${s}%, 15%)`,

        surface: `hsl(${h}, ${Math.round(s * 0.22)}%, 98%)`,
        surfaceDim: `hsl(${h}, ${Math.round(s * 0.22)}%, 90%)`,
        surfaceContainerLowest: `#FFFFFF`,
        surfaceContainerLow: `hsl(${h}, ${Math.round(s * 0.20)}%, 95%)`,
        surfaceContainer: `hsl(${h}, ${Math.round(s * 0.20)}%, 92%)`,
        surfaceContainerHigh: `hsl(${h}, ${Math.round(s * 0.20)}%, 88%)`,
        surfaceContainerHighest: `hsl(${h}, ${Math.round(s * 0.22)}%, 84%)`,

        onSurface: `hsl(${h}, ${Math.round(s * 0.15)}%, 12%)`,
        onSurfaceVariant: `hsl(${h}, ${Math.round(s * 0.18)}%, 30%)`,
        outline: `hsl(${h}, ${Math.round(s * 0.18)}%, 50%)`,
        outlineVariant: `hsl(${h}, ${Math.round(s * 0.18)}%, 80%)`,
        glow: `hsla(${h}, ${s}%, 40%, 0.25)`
      };
    }
  }

  // Apply Palette to DOM CSS Variables
  function applyPalette(palette) {
    const root = document.documentElement;
    root.style.setProperty('--md-primary', palette.primary);
    root.style.setProperty('--md-on-primary', palette.onPrimary);
    root.style.setProperty('--md-primary-container', palette.primaryContainer);
    root.style.setProperty('--md-on-primary-container', palette.onPrimaryContainer);

    root.style.setProperty('--md-surface', palette.surface);
    root.style.setProperty('--md-surface-dim', palette.surfaceDim);
    root.style.setProperty('--md-surface-container-lowest', palette.surfaceContainerLowest);
    root.style.setProperty('--md-surface-container-low', palette.surfaceContainerLow);
    root.style.setProperty('--md-surface-container', palette.surfaceContainer);
    root.style.setProperty('--md-surface-container-high', palette.surfaceContainerHigh);
    root.style.setProperty('--md-surface-container-highest', palette.surfaceContainerHighest);

    root.style.setProperty('--md-on-surface', palette.onSurface);
    root.style.setProperty('--md-on-surface-variant', palette.onSurfaceVariant);
    root.style.setProperty('--md-outline', palette.outline);
    root.style.setProperty('--md-outline-variant', palette.outlineVariant);
    root.style.setProperty('--md-glow', palette.glow);
  }

  return {
    PRESET_WALLPAPERS,
    hexToHsl,
    extractDominantColor,
    generateM3Palette,
    applyPalette
  };
})();
