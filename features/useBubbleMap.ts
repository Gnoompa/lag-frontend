"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { last, max, sortBy } from "lodash";

export type TNode = {
  radius?: any;
  index?: number;
  label?: string;
  value: number;
  image?: string;
  poppable?: boolean;
  relativeSize?: number;
  onPop?: () => void;
};

export interface ISettings {
  width?: number;
  height?: number;
  spacing?: number;
  style?: string;
}

export default function useBubbleMap(nodes: TNode[] | undefined, settings: ISettings = {}) {
  const simRef = useRef<any>();
  const svgRef = useRef<any>();
  const nodesRef = useRef<any>();
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, unknown, HTMLElement, any>>();

  useEffect(() => {
    nodesRef.current = nodes?.map((node, index) => ({
      ...node,
      index,
      radius: _getRelativeBubbleSize(nodes, node),
    }));

    nodes && render();
  }, [nodes]);

  const _getRelativeBubbleSize = (nodes: TNode[], node: TNode) => {
    return max([
      node.relativeSize
        ? window.innerWidth * node.relativeSize
        : node.value *
        (window.innerWidth /
          (3 * 2) /
          last(
            sortBy(
              nodes.filter(({ relativeSize }) => !relativeSize),
              "value"
            )
          )?.value!),
      10,
    ]);
  };

  const render = () => {
    const svg = getSvg();
    const nodeSelection = getNodeSelection(svg);
    const sim = getSimulation(nodesRef.current, nodeSelection);

    renderNodes();

    sim!.nodes(nodesRef.current);
    sim!.alpha(1).restart();

    svg.property("value", {
      // @ts-ignore
      nodes: nodesRef.current.map((d) => ({ id: d.index })),
    });

    svg.dispatch("input");
  };

  const getSvg = () => {
    if (svgRef.current) {
      return svgRef.current;
    }

    const [width, height] = [
      settings.width || window.innerWidth,
      settings.height || window.innerHeight,
    ];

    svgRef.current = (svgRef.current ? svgRef.current : d3.select("body")
      .append("svg"))
      .property("value", { nodes: [] })
      .attr("width", width)
      .attr("height", height)
      .attr("id", "_bubblemap")
      .attr("style", settings.style || "position: fixed; top: 0; left:0;")
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    return svgRef.current;
  };

  const getSimulation = (nodes: TNode[], node: any) => {
    if (simRef.current) {
      return simRef.current;
    }

    simRef.current = d3
      // @ts-ignore
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-15))
      .force(
        "collide",
        d3
          .forceCollide()
          // @ts-ignore
          .radius((d) => d.radius + 5)
          .iterations(3)
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", () =>
        nodeSelectionRef
          .current! // @ts-ignore
          .attr("x", (d) => (d.x || 0) - d.radius)
          // @ts-ignore
          .attr("y", (d) => (d.y || 0) - d.radius)
      );

    return simRef.current;
  };

  const getNodeSelection = (svg: any) => {
    return (
      nodeSelectionRef.current || (nodeSelectionRef.current = svg.append("g").selectAll("circle"))
    );
  };

  const renderNodes = () => {
    // @ts-ignore
    nodeSelectionRef.current = nodeSelectionRef
      .current!.data(nodesRef.current)
      .join(
        (enter) =>
          enter
            .append("image")
            // @ts-ignore
            .attr("href", (d) => d.image!)
            // @ts-ignore
            .style("width", (d) => d.radius * 2)
            .style("transform", "scale(0)")
            .attr("clip-path", "inset(0% round 9999px)")
            .attr("preserveAspectRatio", "xMidYMid slice")
            .call((enter) =>
              enter
                .transition()
                // @ts-ignore
                .delay((d, i) => (d.relativeSize ? 0 : i * 50))
                // @ts-ignore
                .style("transform", "scale(1)")
            )
            .on(
              "click",
              (d, a) =>
                // @ts-ignore
                a.poppable &&
                // @ts-ignore
                ((nodesRef.current = nodesRef.current.filter((node) => node.index !== a.index)),
                  // @ts-ignore
                  a.onPop?.(a),
                  render())
            ),
        (update) => update,
        (exit) => exit.transition().style("transform", "scale(.8)").style("opacity", 0).remove()
      )
      // @ts-ignore
      .attr("x", (d) => d.x || 0 - d.radius)
      // @ts-ignore
      .attr("y", (d) => d.y || 0 - d.radius);
  };

  const unmount = () => {
    // @ts-ignore
    global._bubblemap?.remove()
  }

  return {
    render,
    unmount
  };
}
