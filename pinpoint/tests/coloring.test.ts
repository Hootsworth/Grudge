import test from 'node:test';
import assert from 'node:assert/strict';
import { assignProperMapColors, buildAdjacencyGraph } from '../generator/coloring.ts';
import type { CountryFeature } from '../generator/data.ts';

test('Greedy proper map coloring has no adjacent same-colour pair', async (t) => {
  await t.test('assigns distinct colors to all adjacent nodes in a synthetic cluster', () => {
    // 5 mutually touching synthetic countries (A touches B, C, D; B touches C, etc.)
    const syntheticCountries: CountryFeature[] = [
      { id: 'FRA', name: 'France', geometry: { type: 'Polygon', coordinates: [[[2, 48], [3, 48], [3, 49], [2, 49], [2, 48]]] }, properties: {} },
      { id: 'DEU', name: 'Germany', geometry: { type: 'Polygon', coordinates: [[[3, 48], [4, 48], [4, 49], [3, 49], [3, 48]]] }, properties: {} },
      { id: 'BEL', name: 'Belgium', geometry: { type: 'Polygon', coordinates: [[[2.5, 49], [3.5, 49], [3.5, 50], [2.5, 50], [2.5, 49]]] }, properties: {} },
      { id: 'CHE', name: 'Switzerland', geometry: { type: 'Polygon', coordinates: [[[2.5, 47], [3.5, 47], [3.5, 48], [2.5, 48], [2.5, 47]]] }, properties: {} },
    ];

    const graph = buildAdjacencyGraph(syntheticCountries);
    const colors = assignProperMapColors(syntheticCountries, graph);

    // Verify all countries were assigned a class c0..c5
    for (const c of syntheticCountries) {
      const col = colors.get(String(c.id));
      assert.ok(col, `Country ${c.id} must have a color`);
      assert.match(col, /^c[0-5]$/);
    }

    // Verify NO adjacent country shares the same color
    let edgeCount = 0;
    for (const [nodeA, neighbors] of graph.entries()) {
      const colorA = colors.get(nodeA);
      for (const nodeB of neighbors) {
        edgeCount++;
        const colorB = colors.get(nodeB);
        assert.notEqual(
          colorA,
          colorB,
          `Adjacency violation: Node ${nodeA} (${colorA}) and Node ${nodeB} (${colorB}) share color!`
        );
      }
    }

    assert.ok(edgeCount > 0, 'Adjacency graph must have detected bordering neighbors');
  });

  await t.test('strictly bounds palette to classes c0 through c5', () => {
    const syntheticCountries: CountryFeature[] = Array.from({ length: 8 }, (_, i) => ({
      id: `C_${i}`,
      name: `Country ${i}`,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [i * 0.5, 10],
            [(i + 1) * 0.5, 10],
            [(i + 1) * 0.5, 11],
            [i * 0.5, 11],
            [i * 0.5, 10],
          ],
        ],
      },
      properties: {},
    }));

    const colors = assignProperMapColors(syntheticCountries);
    for (const [id, color] of colors.entries()) {
      assert.ok(['c0', 'c1', 'c2', 'c3', 'c4', 'c5'].includes(color));
    }
  });
});
