"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export type TBubbleMapItems = {
  label: string;
  value: number;
  image: string;
}[];

export interface ITransform {
  x?: number;
  y?: number;
  smoothingFactor?: number;
}

export default function useBubbleMap(items: TBubbleMapItems | undefined, transform?: ITransform) {
  const smoothingFactor = 0.01;
  const width = global.innerWidth;
  const height = global.innerHeight;
  const sizeDivisor = 2.5;
  const nodePadding = 3;
  const MIN_BUBBLE_RAD = 50

  const [mapItems, setMapItems] = useState<[]>();
  const [simulation, setSimulation] = useState<{}>();
  const [node, setNode] = useState<{}>();
  const [htmlSvgElement, setHtmlSvgElement] = useState<SVGElement>();

  const transformForceY = useRef(transform?.y);
  const transformInterval = useRef<any>();

  useEffect(() => {
    node &&
      transform &&
      !transformInterval.current &&
      (transformInterval.current = setInterval(() => smoothTransformation(transform), 10));
  }, [node, transform]);

  useEffect(() => {
    // @ts-ignore
    global.bubblemap && global.bubblemap.remove();
  }, []);

  useEffect(() => {
    items && initMap(items);
  }, [items]);

  const smoothTransformation = (transform: ITransform) => {
    // @ts-ignore
    if (Math.abs(transformForceY.current || 0) >= Math.abs((transform.y || 0) * node.size())) {
      clearInterval(transformInterval.current);

      transformInterval.current = undefined;

      return;
    }

    // @ts-ignores
    node?.attr("y", (d) => d.y - d.radius + (transformForceY.current || 0) * ((d.index + 1) / 1.5));

    transform.y !== undefined &&
      (transformForceY.current =
        (transformForceY.current || 0) + (transform?.y || 0) * smoothingFactor);
  };

  const initMap = (items: TBubbleMapItems) => {
    // @ts-ignore
    if (global.bubblemap) {
      return;
    }

    var svg = d3
      .select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("style", "position: fixed; top: 0;")
      .attr("id", "bubblemap");

    // @ts-ignore
    setHtmlSvgElement(global.bubblemap);

    var simulation = d3
      .forceSimulation()
      .force(
        "forceX",
        d3
          .forceX()
          .strength(0.1)
          .x(width * 0.5)
      )
      .force(
        "forceY",
        d3
          .forceY()
          .strength(0.1)
          .y(height * 0.5)
      )
      .force(
        "center",
        d3
          .forceCenter()
          .x(width * 0.5)
          .y(height * 0.25)
      )
      .force("charge", d3.forceManyBody().strength(-15));

    // sort the nodes so that the bigger ones are at the back
    var graph = items
      .map(types)
      .sort(function (a: { size: number }, b: { size: number }) {
        return b.size - a.size;
      });

    //update the simulation based on the data
    simulation
      .nodes(graph)
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.5)
          .radius(function (d) {
            //@ts-ignore
            return d.radius + nodePadding;
          })
          .iterations(1)
      )
      .on("tick", () => {
        node
          .attr("x", function (d) {
            // @ts-ignore
            return d.x - d.radius;
          })
          .attr("y", function (d) {
            // @ts-ignore
            return d.y - d.radius + (transformForceY.current || 0) * ((d.index + 1) / 1.5);
          });
      });

    setSimulation(simulation);

    var node = svg
      .append("g")
      .attr("class", "node")
      .selectAll("image")
      .data(graph)
      .enter()
      .append("image")
      // @ts-ignore
      .attr("xlink:href", (d) => d.image)
      .attr("width", function (d) {
        // @ts-ignore
        return d.radius * 2;
      })
      .attr("height", function (d) {
        // @ts-ignore
        return d.radius * 2;
      })
      .attr("x", function (d) {
        // @ts-ignore
        return d.x;
      })
      .attr("y", function (d) {
        // @ts-ignore
        return d.y;
      })
      .attr("clip-path", "inset(0% round 9999px)")
      .attr("preserveAspectRatio", "xMidYMid slice")
      // @ts-ignore
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    setNode(node);

    // @ts-ignore
    function dragstarted(e, d) {
      // @ts-ignore
      if (!e.active) simulation.alphaTarget(0.03).restart();
      d.x = e.x;
      d.y = e.y;
    }

    // @ts-ignore
    function dragged(e, d) {
      // @ts-ignore
      d.x = e.x;
      // @ts-ignore
      d.y = e.y;
    }
    // @ts-ignore
    function dragended(d, e) {
      // @ts-ignore
      if (!e.active) simulation.alphaTarget(0.03);
      d.fx = null;
      d.fy = null;
    }
  };

  // @ts-ignore
  function types(d) {
    d.gdp = +d.value;
    d.size = +d.value / sizeDivisor;
    d.size < MIN_BUBBLE_RAD ? (d.radius = MIN_BUBBLE_RAD) : (d.radius = d.size);
    return d;
  }

  // @ts-ignore
  function updateNodeSize(d, value: number) {
    d.size = value / sizeDivisor, d.radius = d.size < MIN_BUBBLE_RAD ? MIN_BUBBLE_RAD : d.size;
  }

  // const transformMapItems = (node: {}, transform: ITransform) => {
  //     console.log(node, transform)
  //     // @ts-ignore
  //     transform.y !== undefined && node
  //         // @ts-ignore
  //         .attr("y", function (d) {
  //             // @ts-ignore
  //             return d.y - d.radius - transform.y;
  //         });
  // }

  return {
    htmlSvgElement,
    updateNodeSize,
    node,
    simulation,
    initMap
  };
}
