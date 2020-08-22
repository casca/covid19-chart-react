export default (traces, regions) => {
  const frames = [];
  const numFrames = traces[0].x.length;
  for (let i = 1; i <= numFrames; i++) {
    const frameLayout = { annotations: [] };
    traces.forEach((t, idx) => {
      frameLayout.annotations.push({
        x: Math.log10(t.x[i - 1]),
        y: Math.log10(t.y[i - 1]),
        xanchor: 'left',
        yanchor: 'middle',
        text: regions[idx],
        font: {
          size: 8,
        },
        showarrow: false,
      });
    });
    const lines = traces.map((t) => ({
      ...t,
      x: t.x.slice(0, i),
      y: t.y.slice(0, i),
    }));
    const dots = traces.map((t) => ({
      ...t,
      x: [t.x[i - 1]],
      y: [t.y[i - 1]],
      mode: 'markers',
      marker: {
        color: 'fuchsia',
        size: 3,
      },
    }));
    frames.push({
      data: [...lines, ...dots],
      name: `frame${i}`,
      layout: frameLayout,
    });
  }
  return frames;
};