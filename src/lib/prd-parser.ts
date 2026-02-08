// Extract MVP features from PRD markdown content

export function extractMvpFeatures(prdContent: string): string[] {
  const lines = prdContent.split("\n");
  const features: string[] = [];
  let inFeatureSection = false;
  let inMvpSubsection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect feature section (## 5. Feature Specification or similar)
    if (/^##\s+\d*\.?\s*feature/i.test(trimmed)) {
      inFeatureSection = true;
      inMvpSubsection = false;
      continue;
    }

    // Detect next top-level section — stop looking
    if (inFeatureSection && /^##\s+\d/.test(trimmed)) {
      break;
    }

    // Inside feature section, look for MVP subsection
    if (inFeatureSection && /mvp|minimum|core|priority.*high/i.test(trimmed)) {
      inMvpSubsection = true;
      continue;
    }

    // Detect "nice to have" or lower priority subsection — stop collecting
    if (
      inFeatureSection &&
      inMvpSubsection &&
      /nice.to.have|future|low.priority|stretch/i.test(trimmed)
    ) {
      inMvpSubsection = false;
      continue;
    }

    // Collect bullet items in the feature/mvp section
    if (inFeatureSection) {
      const bulletMatch = trimmed.match(/^[-*]\s+\*?\*?(.+?)\*?\*?\s*(?:[:\-–—]|$)/);
      if (bulletMatch) {
        const feature = bulletMatch[1].replace(/\*+/g, "").trim();
        if (feature.length > 3 && feature.length < 200) {
          features.push(feature);
        }
      }
    }
  }

  // If we found features in a specific MVP subsection, prefer those
  // Otherwise, return all features found in the feature section
  // Limit to top 7 for usability
  return features.slice(0, 7);
}
