export const generateManifest = (data) => {
  const manifest = {
    siteUrl: data.siteUrl,
    finalUrl: data.finalUrl,
    title: data.metadata.title,
    metadata: data.metadata,
    html: {
      path: 'index.html',
      size: data.htmlSize
    },
    assets: {
      stylesheets: [],
      scripts: [],
      images: [],
      fonts: [],
      other: []
    }
  };

  for (const asset of data.assets) {
    let cat = 'other';
    if (asset.type === 'stylesheet') cat = 'stylesheets';
    else if (asset.type === 'script') cat = 'scripts';
    else if (asset.type === 'image') cat = 'images';
    else if (asset.type === 'font') cat = 'fonts';

    manifest.assets[cat].push(asset);
  }

  return manifest;
};
