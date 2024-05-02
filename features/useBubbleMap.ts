"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export type TNode = {
  radius?: any;
  index?: number;
  label?: string;
  value: number;
  image?: string;
  poppable?: boolean
};

export interface ISettings {
  width?: string;
  height?: string;
  spacing?: string;
  style?: string;
}

export default function useBubbleMap(nodes: TNode[] | undefined, settings: ISettings = {}) {
  const [simulation, setSimulation] = useState<d3.Simulation<TNode, undefined>>();
  const [svg, setSvg] = useState<d3.Selection<d3.BaseType, unknown, HTMLElement, any>>();
  const [nodeSelection, setNodeSelection] =
    useState<d3.Selection<SVGGElement, unknown, HTMLElement, any>>();

  const simRef = useRef<any>();
  const svgRef = useRef<any>();
  const nodesRef = useRef<any>();
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, unknown, HTMLElement, any>>();

  useEffect(() => {
    nodesRef.current = nodes?.map((node, index) => ({ ...node, index, radius: 30 }));

    // @ts-ignore
    nodes && render(nodesRef.current);
  }, [nodes]);

  useEffect(() => {
    setInterval(() => (nodesRef.current?.push({ radius: 21, poppable: true, index: nodesRef.current.length, image: `/bubble${~~((Math.random()) * 3) + 1}.png` }), render()), 2000)
  }, [])

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

    svgRef.current = d3
      .select("body")
      .append("svg")
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
      // .force("charge", d3.forceManyBody().strength(-15))
      // .force(
      //   "collide",
      //   d3
      //     .forceCollide()
      //     .strength(0.5)
      //     // @ts-ignore
      //     .radius((d) => d.radius! + 6)
      //     .iterations(1)
      // )
      .force("charge", d3.forceManyBody().strength(-60))
      .force(
        "collide",
        d3
          .forceCollide()
          // @ts-ignore
          .radius((d) => d.radius + 6)
          .iterations(3)
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", () => nodeSelectionRef.current!
        // @ts-ignore
        .attr("x", (d) => d.x || 0 - d.radius)
        // @ts-ignore
        .attr("y", (d) => d.y || 0 - d.radius)
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
            .attr("href", (d) => d.image!)
            .attr("width", 0)
            .attr("clip-path", "inset(0% round 9999px)")
            .attr("preserveAspectRatio", "xMidYMid slice")
            .call((enter) =>
              enter
                .transition()
                .delay((d, i) => i * 50)
                .attr("width", (d) => d.radius * 2)
            )
            .on(
              "click",
              (d, a) =>
                a.poppable &&
                (nodesRef.current = nodesRef.current.filter((node) => node.index !== a.index), render())
            ),
        (update) => update,
        (exit) => exit.transition().style("transform", "scale(.8)").style("opacity", 0).remove()
      )
      // @ts-ignore
      .attr("x", (d) => d.x || 0 - d.radius)
      // @ts-ignore
      .attr("y", (d) => d.y || 0 - d.radius);
  };

  return {
    render,
  };
}
